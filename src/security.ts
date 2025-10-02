/**
 * Security utilities for Movement SDK
 * Provides validation, sanitization, and attack prevention
 */

// Security configuration
export interface SecurityConfig {
  maxTransactionAmount?: string; // in octas
  allowedOrigins?: string[];
  rateLimitWindow?: number; // milliseconds
  maxRequestsPerWindow?: number;
  enableCSP?: boolean;
  strictMode?: boolean;
}

// Rate limiting state
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class SecurityManager {
  private config: Required<SecurityConfig>;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private nonceSet = new Set<string>();

  constructor(config: SecurityConfig = {}) {
    this.config = {
      maxTransactionAmount: '1000000000000', // 10,000 MOVE in octas
      allowedOrigins: [],
      rateLimitWindow: 60000, // 1 minute
      maxRequestsPerWindow: 30,
      enableCSP: true,
      strictMode: true,
      ...config,
    };

    if (this.config.enableCSP && typeof document !== 'undefined') {
      this.setupCSP();
    }
  }

  /**
   * Validate origin of request
   */
  validateOrigin(origin: string): boolean {
    if (this.config.allowedOrigins.length === 0) {
      return true; // No restrictions if list is empty
    }

    return this.config.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.includes('*')) {
        const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
        return regex.test(origin);
      }
      return origin === allowed;
    });
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now >= entry.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
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
  validateTransaction(payload: any): { valid: boolean; error?: string } {
    // Check required fields
    if (!payload.function || typeof payload.function !== 'string') {
      return { valid: false, error: 'Invalid or missing transaction function' };
    }

    if (!Array.isArray(payload.arguments)) {
      return { valid: false, error: 'Transaction arguments must be an array' };
    }

    if (!Array.isArray(payload.type_arguments)) {
      return { valid: false, error: 'Transaction type_arguments must be an array' };
    }

    // Validate function format (should be address::module::function)
    const functionPattern = /^0x[a-fA-F0-9]+::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!functionPattern.test(payload.function)) {
      return { valid: false, error: 'Invalid transaction function format' };
    }

    // Check for transfer functions and validate amount
    if (payload.function.includes('::transfer')) {
      const amountIndex = payload.arguments.length - 1;
      const amount = payload.arguments[amountIndex];

      if (typeof amount === 'string' && BigInt(amount) > BigInt(this.config.maxTransactionAmount)) {
        return {
          valid: false,
          error: `Transaction amount exceeds maximum allowed (${this.config.maxTransactionAmount})`
        };
      }
    }

    // Validate addresses in arguments
    for (const arg of payload.arguments) {
      if (typeof arg === 'string' && arg.startsWith('0x')) {
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
  isValidAddress(address: string): boolean {
    if (!address.startsWith('0x')) return false;

    const hex = address.slice(2);
    if (hex.length > 64) return false;
    if (!/^[a-fA-F0-9]+$/.test(hex)) return false;

    return true;
  }

  /**
   * Sanitize message for signing
   */
  sanitizeMessage(message: string): string {
    // Remove any null bytes or control characters
    let sanitized = message.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Limit message length
    const maxLength = 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Generate and validate nonce for message signing
   */
  generateNonce(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  validateNonce(nonce: string): boolean {
    if (this.nonceSet.has(nonce)) {
      return false; // Replay attack detected
    }

    // Check nonce age (5 minutes max)
    const [timestamp] = nonce.split('-');
    const age = Date.now() - parseInt(timestamp);
    if (age > 300000) {
      return false; // Nonce too old
    }

    this.nonceSet.add(nonce);

    // Clean old nonces
    if (this.nonceSet.size > 1000) {
      const now = Date.now();
      for (const oldNonce of this.nonceSet) {
        const [ts] = oldNonce.split('-');
        if (now - parseInt(ts) > 300000) {
          this.nonceSet.delete(oldNonce);
        }
      }
    }

    return true;
  }

  /**
   * Setup Content Security Policy
   */
  private setupCSP(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.movementlabs.xyz https://*.aptoslabs.com",
      "frame-ancestors 'self'",
    ].join('; ');

    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }

    document.head.appendChild(meta);
  }

  /**
   * Log security events (for monitoring)
   */
  logSecurityEvent(event: {
    type: 'rate_limit' | 'invalid_origin' | 'invalid_transaction' | 'replay_attack' | 'suspicious_activity';
    details: string;
    metadata?: any;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event,
    };

    // In production, send to monitoring service
    if (this.config.strictMode) {
      console.warn('[Security]', logEntry);
    }

    // Could send to backend monitoring
    // await fetch('/api/security-log', { method: 'POST', body: JSON.stringify(logEntry) });
  }
}

export const createSecurityManager = (config?: SecurityConfig) => new SecurityManager(config);
export default SecurityManager;
