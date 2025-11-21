// src/security.ts
var SecurityManager = class {
  constructor(config = {}) {
    this.rateLimitMap = /* @__PURE__ */ new Map();
    this.nonceSet = /* @__PURE__ */ new Set();
    this.config = {
      maxTransactionAmount: "1000000000000",
      // 10,000 MOVE in octas
      allowedOrigins: [],
      rateLimitWindow: 6e4,
      // 1 minute
      maxRequestsPerWindow: 30,
      enableCSP: true,
      strictMode: true,
      ...config
    };
    if (this.config.enableCSP && typeof document !== "undefined") {
      this.setupCSP();
    }
  }
  /**
   * Validate origin of request
   */
  validateOrigin(origin) {
    if (this.config.allowedOrigins.length === 0) {
      return true;
    }
    return this.config.allowedOrigins.some((allowed) => {
      if (allowed === "*") return true;
      if (allowed.includes("*")) {
        const regex = new RegExp("^" + allowed.replace(/\*/g, ".*") + "$");
        return regex.test(origin);
      }
      return origin === allowed;
    });
  }
  /**
   * Rate limiting check
   */
  checkRateLimit(identifier) {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);
    if (!entry || now >= entry.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }
    if (entry.count >= this.config.maxRequestsPerWindow) {
      return false;
    }
    entry.count++;
    return true;
  }
  /**
   * Validate transaction payload
   */
  validateTransaction(payload) {
    if (!payload.function || typeof payload.function !== "string") {
      return { valid: false, error: "Invalid or missing transaction function" };
    }
    if (!Array.isArray(payload.arguments)) {
      return { valid: false, error: "Transaction arguments must be an array" };
    }
    if (!Array.isArray(payload.type_arguments)) {
      return { valid: false, error: "Transaction type_arguments must be an array" };
    }
    const functionPattern = /^0x[a-fA-F0-9]+::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!functionPattern.test(payload.function)) {
      return { valid: false, error: "Invalid transaction function format" };
    }
    if (payload.function.includes("::transfer")) {
      const amountIndex = payload.arguments.length - 1;
      const amount = payload.arguments[amountIndex];
      if (typeof amount === "string" && BigInt(amount) > BigInt(this.config.maxTransactionAmount)) {
        return {
          valid: false,
          error: `Transaction amount exceeds maximum allowed (${this.config.maxTransactionAmount})`
        };
      }
    }
    for (const arg of payload.arguments) {
      if (typeof arg === "string" && arg.startsWith("0x")) {
        if (!this.isValidAddress(arg)) {
          return { valid: false, error: `Invalid address format: ${arg}` };
        }
      }
    }
    return { valid: true };
  }
  /**
   * Validate Aptos address format
   */
  isValidAddress(address) {
    if (!address.startsWith("0x")) return false;
    const hex = address.slice(2);
    if (hex.length > 64) return false;
    if (!/^[a-fA-F0-9]+$/.test(hex)) return false;
    return true;
  }
  /**
   * Sanitize message for signing
   */
  sanitizeMessage(message) {
    let sanitized = message.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
    const maxLength = 1e4;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
  }
  /**
   * Generate and validate nonce for message signing
   */
  generateNonce() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }
  validateNonce(nonce) {
    if (this.nonceSet.has(nonce)) {
      return false;
    }
    const [timestamp] = nonce.split("-");
    const age = Date.now() - parseInt(timestamp);
    if (age > 3e5) {
      return false;
    }
    this.nonceSet.add(nonce);
    if (this.nonceSet.size > 1e3) {
      const now = Date.now();
      for (const oldNonce of this.nonceSet) {
        const [ts] = oldNonce.split("-");
        if (now - parseInt(ts) > 3e5) {
          this.nonceSet.delete(oldNonce);
        }
      }
    }
    return true;
  }
  /**
   * Setup Content Security Policy
   */
  setupCSP() {
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.movementlabs.xyz https://*.aptoslabs.com",
      "frame-ancestors 'self'"
    ].join("; ");
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }
    document.head.appendChild(meta);
  }
  /**
   * Log security events (for monitoring)
   */
  logSecurityEvent(event) {
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...event
    };
    if (this.config.strictMode) {
      console.warn("[Security]", logEntry);
    }
  }
};
var createSecurityManager = (config) => new SecurityManager(config);

// src/sdk.ts
var SecureMovementSDK = class {
  constructor(sdk, config) {
    this.sdk = sdk;
    this.security = createSecurityManager(config);
  }
  get isConnected() {
    return this.sdk.isConnected;
  }
  get address() {
    return this.sdk.address;
  }
  get network() {
    return this.sdk.network;
  }
  isInstalled() {
    return this.sdk.isInstalled();
  }
  async ready() {
    return await this.sdk.ready();
  }
  async connect() {
    if (!this.security.checkRateLimit("connect")) {
      this.security.logSecurityEvent({
        type: "rate_limit",
        details: "Connection rate limit exceeded"
      });
      throw new Error("Too many connection attempts. Please try again later.");
    }
    return await this.sdk.connect();
  }
  async getAccount() {
    return await this.sdk.getAccount();
  }
  async getBalance() {
    return await this.sdk.getBalance();
  }
  async scanQRCode() {
    if (!this.security.checkRateLimit("scanQRCode")) {
      this.security.logSecurityEvent({
        type: "rate_limit",
        details: "QR scanning rate limit exceeded"
      });
      throw new Error("Too many QR scan requests. Please try again later.");
    }
    return await this.sdk.scanQRCode();
  }
  async sendTransaction(payload) {
    if (!this.security.checkRateLimit("sendTransaction")) {
      this.security.logSecurityEvent({
        type: "rate_limit",
        details: "Transaction rate limit exceeded"
      });
      throw new Error("Too many transaction requests. Please try again later.");
    }
    const validation = this.security.validateTransaction(payload);
    if (!validation.valid) {
      this.security.logSecurityEvent({
        type: "invalid_transaction",
        details: validation.error || "Unknown validation error",
        metadata: payload
      });
      throw new Error(validation.error);
    }
    return await this.sdk.sendTransaction(payload);
  }
  async signMessage(payload) {
    if (!this.security.checkRateLimit("signMessage")) {
      this.security.logSecurityEvent({
        type: "rate_limit",
        details: "Message signing rate limit exceeded"
      });
      throw new Error("Too many signing requests. Please try again later.");
    }
    if (!payload.nonce) {
      payload.nonce = this.security.generateNonce();
    } else {
      if (!this.security.validateNonce(payload.nonce)) {
        this.security.logSecurityEvent({
          type: "replay_attack",
          details: "Invalid or reused nonce detected",
          metadata: { nonce: payload.nonce }
        });
        throw new Error("Invalid nonce - possible replay attack");
      }
    }
    const sanitizedMessage = this.security.sanitizeMessage(payload.message);
    return await this.sdk.signMessage({
      ...payload,
      message: sanitizedMessage
    });
  }
  async sendMultiAgentTransaction(payload) {
    if (!this.security.checkRateLimit("sendMultiAgentTransaction")) {
      throw new Error("Too many multi-agent transaction requests. Please try again later.");
    }
    const validation = this.security.validateTransaction(payload);
    if (!validation.valid) {
      this.security.logSecurityEvent({
        type: "invalid_transaction",
        details: validation.error || "Multi-agent transaction validation failed",
        metadata: payload
      });
      throw new Error(validation.error);
    }
    if (!payload.secondarySigners || payload.secondarySigners.length === 0) {
      throw new Error("Multi-agent transaction requires at least one secondary signer");
    }
    for (const signer of payload.secondarySigners) {
      if (!this.security.isValidAddress(signer)) {
        throw new Error(`Invalid secondary signer address: ${signer}`);
      }
    }
    return await this.sdk.sendMultiAgentTransaction(payload);
  }
  async sendFeePayerTransaction(payload) {
    if (!this.security.checkRateLimit("sendFeePayerTransaction")) {
      throw new Error("Too many fee payer transaction requests. Please try again later.");
    }
    const validation = this.security.validateTransaction(payload);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    if (!this.security.isValidAddress(payload.feePayer)) {
      throw new Error(`Invalid fee payer address: ${payload.feePayer}`);
    }
    return await this.sdk.sendFeePayerTransaction(payload);
  }
  async sendBatchTransactions(payload) {
    if (!this.security.checkRateLimit("sendBatchTransactions")) {
      throw new Error("Too many batch transaction requests. Please try again later.");
    }
    for (const tx of payload.transactions) {
      const validation = this.security.validateTransaction(tx);
      if (!validation.valid) {
        throw new Error(`Batch transaction validation failed: ${validation.error}`);
      }
    }
    return await this.sdk.sendBatchTransactions(payload);
  }
  async sendScriptTransaction(payload) {
    if (!this.security.checkRateLimit("sendScriptTransaction")) {
      throw new Error("Too many script transaction requests. Please try again later.");
    }
    if (!payload.script || payload.script.length === 0) {
      throw new Error("Script payload cannot be empty");
    }
    return await this.sdk.sendScriptTransaction(payload);
  }
  async getContext() {
    return await this.sdk.getContext();
  }
  async waitForTransaction(hash) {
    return await this.sdk.waitForTransaction(hash);
  }
  onTransactionUpdate(hash, callback) {
    return this.sdk.onTransactionUpdate?.(hash, callback);
  }
  // Pass through optional methods
  async haptic(options) {
    return this.sdk.haptic?.(options);
  }
  async notify(options) {
    return this.sdk.notify?.(options);
  }
  openUrl(url, target) {
    return this.sdk.openUrl?.(url, target);
  }
  close() {
    return this.sdk.close?.();
  }
  // Expose storage object with all methods including getAll
  get storage() {
    return this.sdk.storage;
  }
};
function getMovementSDK(config) {
  if (typeof window === "undefined") {
    return null;
  }
  if (!window.movementSDK) {
    return null;
  }
  return new SecureMovementSDK(window.movementSDK, config);
}
function isInMovementApp() {
  return typeof window !== "undefined" && window.movementSDK?.isInstalled?.() === true;
}
async function waitForSDK(timeout = 5e3, config) {
  if (typeof window === "undefined") {
    throw new Error("Window is not defined - not running in browser");
  }
  if (!window.movementSDK?.isInstalled?.()) {
    throw new Error("Movement SDK not found - app must run inside Movement Everything wallet");
  }
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("SDK initialization timeout")), timeout);
  });
  try {
    await Promise.race([
      window.movementSDK.ready(),
      timeoutPromise
    ]);
    const secureSDK = new SecureMovementSDK(window.movementSDK, config);
    return secureSDK;
  } catch (error) {
    throw new Error("Failed to initialize Movement SDK: " + error.message);
  }
}

// src/hooks.ts
import { useEffect, useState, useCallback } from "react";
function useMovementSDK() {
  const [sdk, setSDK] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      setError(new Error("Window is not defined"));
      return;
    }
    if (!window.movementSDK?.isInstalled?.()) {
      setIsLoading(false);
      setError(new Error("Movement SDK not available - please open in Movement wallet"));
      return;
    }
    const initSDK = async () => {
      try {
        if (window.movementSDK) {
          await window.movementSDK.ready();
          setSDK(window.movementSDK);
          setIsConnected(window.movementSDK.isConnected);
          setAddress(window.movementSDK.address || null);
          setIsLoading(false);
        }
      } catch (err) {
        setError(err);
        setIsLoading(false);
      }
    };
    initSDK();
  }, []);
  const connect = useCallback(async () => {
    if (!sdk) {
      throw new Error("SDK not available");
    }
    try {
      const account = await sdk.connect();
      setIsConnected(true);
      setAddress(account.address);
      setError(null);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [sdk]);
  const sendTransaction = useCallback(async (payload) => {
    if (!sdk || !isConnected) {
      throw new Error("SDK not connected");
    }
    try {
      const result = await sdk.sendTransaction(payload);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [sdk, isConnected]);
  return {
    sdk,
    isConnected,
    address,
    isLoading,
    error,
    connect,
    sendTransaction
  };
}
function useMovementAccount() {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchAccount = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }
      if (!window.movementSDK?.isInstalled?.()) {
        setIsLoading(false);
        setError(new Error("Movement SDK not available - please open in Movement wallet"));
        return;
      }
      try {
        await window.movementSDK.ready();
        if (window.movementSDK.isConnected) {
          const acc = await window.movementSDK.getAccount();
          setAccount(acc);
          setIsConnected(true);
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccount();
  }, []);
  return {
    account,
    isConnected,
    isLoading,
    error
  };
}
function useMovementTheme() {
  const [theme, setTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchTheme = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }
      if (!window.movementSDK?.isInstalled?.()) {
        setIsLoading(false);
        setError(new Error("Movement SDK not available - please open in Movement wallet"));
        return;
      }
      try {
        await window.movementSDK.ready();
        if (window.movementSDK.getTheme) {
          const themeInfo = await window.movementSDK.getTheme();
          setTheme(themeInfo);
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTheme();
  }, []);
  return {
    theme,
    isLoading,
    error
  };
}
export {
  SecureMovementSDK,
  createSecurityManager,
  getMovementSDK,
  isInMovementApp,
  useMovementAccount,
  useMovementSDK,
  useMovementTheme,
  waitForSDK
};
