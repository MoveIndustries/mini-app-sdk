/**
 * Movement SDK Client
 * Main SDK interface for mini apps with security enhancements
 */

import type {
  MovementSDK,
  TransactionPayload,
  SignMessagePayload,
  MultiAgentTransactionPayload,
  FeePayerTransactionPayload,
  BatchTransactionPayload,
  ScriptComposerPayload,
  BatchTransactionResult,
} from './types';
import { createSecurityManager, type SecurityConfig } from './security';

// Secure SDK wrapper
class SecureMovementSDK {
  private sdk: MovementSDK;
  private security: ReturnType<typeof createSecurityManager>;

  constructor(sdk: MovementSDK, config?: SecurityConfig) {
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

  async connect() {
    // Rate limiting
    if (!this.security.checkRateLimit('connect')) {
      this.security.logSecurityEvent({
        type: 'rate_limit',
        details: 'Connection rate limit exceeded',
      });
      throw new Error('Too many connection attempts. Please try again later.');
    }

    return await this.sdk.connect();
  }

  async getAccount() {
    return await this.sdk.getAccount();
  }

  async getBalance() {
    return await this.sdk.getBalance();
  }

  async sendTransaction(payload: TransactionPayload) {
    // Rate limiting
    if (!this.security.checkRateLimit('sendTransaction')) {
      this.security.logSecurityEvent({
        type: 'rate_limit',
        details: 'Transaction rate limit exceeded',
      });
      throw new Error('Too many transaction requests. Please try again later.');
    }

    // Validate transaction
    const validation = this.security.validateTransaction(payload);
    if (!validation.valid) {
      this.security.logSecurityEvent({
        type: 'invalid_transaction',
        details: validation.error || 'Unknown validation error',
        metadata: payload,
      });
      throw new Error(validation.error);
    }

    return await this.sdk.sendTransaction(payload);
  }

  async signMessage(payload: SignMessagePayload) {
    // Rate limiting
    if (!this.security.checkRateLimit('signMessage')) {
      this.security.logSecurityEvent({
        type: 'rate_limit',
        details: 'Message signing rate limit exceeded',
      });
      throw new Error('Too many signing requests. Please try again later.');
    }

    // Generate nonce if not provided
    if (!payload.nonce) {
      payload.nonce = this.security.generateNonce();
    } else {
      // Validate nonce to prevent replay attacks
      if (!this.security.validateNonce(payload.nonce)) {
        this.security.logSecurityEvent({
          type: 'replay_attack',
          details: 'Invalid or reused nonce detected',
          metadata: { nonce: payload.nonce },
        });
        throw new Error('Invalid nonce - possible replay attack');
      }
    }

    // Sanitize message
    const sanitizedMessage = this.security.sanitizeMessage(payload.message);

    return await this.sdk.signMessage({
      ...payload,
      message: sanitizedMessage,
    });
  }

  async sendMultiAgentTransaction(payload: MultiAgentTransactionPayload) {
    // Rate limiting
    if (!this.security.checkRateLimit('sendMultiAgentTransaction')) {
      throw new Error('Too many multi-agent transaction requests. Please try again later.');
    }

    // Validate base transaction
    const validation = this.security.validateTransaction(payload);
    if (!validation.valid) {
      this.security.logSecurityEvent({
        type: 'invalid_transaction',
        details: validation.error || 'Multi-agent transaction validation failed',
        metadata: payload,
      });
      throw new Error(validation.error);
    }

    // Validate secondary signers
    if (!payload.secondarySigners || payload.secondarySigners.length === 0) {
      throw new Error('Multi-agent transaction requires at least one secondary signer');
    }

    for (const signer of payload.secondarySigners) {
      if (!this.security.isValidAddress(signer)) {
        throw new Error(`Invalid secondary signer address: ${signer}`);
      }
    }

    return await this.sdk.sendMultiAgentTransaction!(payload);
  }

  async sendFeePayerTransaction(payload: FeePayerTransactionPayload) {
    // Rate limiting
    if (!this.security.checkRateLimit('sendFeePayerTransaction')) {
      throw new Error('Too many fee payer transaction requests. Please try again later.');
    }

    // Validate base transaction
    const validation = this.security.validateTransaction(payload);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Validate fee payer address
    if (!this.security.isValidAddress(payload.feePayer)) {
      throw new Error(`Invalid fee payer address: ${payload.feePayer}`);
    }

    return await this.sdk.sendFeePayerTransaction!(payload);
  }

  async sendBatchTransactions(payload: BatchTransactionPayload) {
    // Rate limiting
    if (!this.security.checkRateLimit('sendBatchTransactions')) {
      throw new Error('Too many batch transaction requests. Please try again later.');
    }

    // Validate all transactions in batch
    for (const tx of payload.transactions) {
      const validation = this.security.validateTransaction(tx);
      if (!validation.valid) {
        throw new Error(`Batch transaction validation failed: ${validation.error}`);
      }
    }

    return await this.sdk.sendBatchTransactions!(payload);
  }

  async sendScriptTransaction(payload: ScriptComposerPayload) {
    // Rate limiting
    if (!this.security.checkRateLimit('sendScriptTransaction')) {
      throw new Error('Too many script transaction requests. Please try again later.');
    }

    // Validate script payload
    if (!payload.script || payload.script.length === 0) {
      throw new Error('Script payload cannot be empty');
    }

    return await this.sdk.sendScriptTransaction!(payload);
  }

  async getContext() {
    return await this.sdk.getContext();
  }

  async waitForTransaction(hash: string) {
    return await this.sdk.waitForTransaction(hash);
  }

  onTransactionUpdate(hash: string, callback: any) {
    return this.sdk.onTransactionUpdate?.(hash, callback);
  }

  // Pass through optional methods
  async haptic(options: any) {
    return this.sdk.haptic?.(options);
  }

  async notify(options: any) {
    return this.sdk.notify?.(options);
  }

  openUrl(url: string, target?: 'external' | 'in-app') {
    return this.sdk.openUrl?.(url, target);
  }

  close() {
    return this.sdk.close?.();
  }
}

export function getMovementSDK(config?: SecurityConfig): MovementSDK | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!window.movementSDK) {
    return null;
  }

  // Wrap SDK with security layer
  return new SecureMovementSDK(window.movementSDK, config) as any as MovementSDK;
}

export function isInMovementApp(): boolean {
  return typeof window !== 'undefined' && !!window.movementSDK;
}

export function waitForSDK(timeout = 5000, config?: SecurityConfig): Promise<MovementSDK> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined - not running in browser'));
      return;
    }

    if (window.movementSDK) {
      const secureSDK = new SecureMovementSDK(window.movementSDK, config);
      resolve(secureSDK as any as MovementSDK);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.movementSDK) {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        const secureSDK = new SecureMovementSDK(window.movementSDK, config);
        resolve(secureSDK as any as MovementSDK);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Movement SDK not found - app must run inside Movement Everything wallet'));
    }, timeout);
  });
}

export { SecureMovementSDK };
