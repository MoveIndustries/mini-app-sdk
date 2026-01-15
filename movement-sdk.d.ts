/**
 * Movement Mini Apps SDK - TypeScript Definitions
 *
 * Import this file in your mini app to get full TypeScript support:
 *
 * @example
 * /// <reference path="./movement-sdk.d.ts" />
 *
 * const sdk = window.movementSDK;
 * const result = await sdk.sendTransaction({
 *   function: '0x1::aptos_account::transfer',
 *   arguments: ['0x123...', '1000000']
 * });
 */

// ============================================================================
// Transaction Types
// ============================================================================

export interface SendTransactionParams {
  /** Move function in format: address::module::function_name */
  function: string;

  /** Type arguments for generic Move functions (optional) */
  type_arguments?: string[];

  /** Function arguments as array of values (optional) */
  arguments?: any[];

  /**
   * Target address (optional - auto-extracted from function if not provided)
   * @deprecated Will be automatically parsed from function field
   */
  to?: string;

  /** Transaction title shown in confirmation UI (optional) */
  title?: string;

  /** Transaction description shown in confirmation UI (optional) */
  description?: string;

  /** Whether to use fee payer for sponsored transactions (optional) */
  useFeePayer?: boolean;

  /** Fee payer service URL (optional) */
  feePayerUrl?: string;

  /** Gas limit - use 'Sponsored' for sponsored transactions (optional) */
  gasLimit?: number | 'Sponsored';

  /** Maximum gas amount in octas (optional) */
  maxGasAmount?: number;

  /** Gas unit price in octas (optional) */
  gasUnitPrice?: number;

  /** Expiration timestamp in seconds (optional) */
  expirationTimestampSecs?: number;
}

export interface TransactionResult {
  /** Transaction hash */
  hash: string;

  /** Whether transaction was successful */
  success: boolean;

  /** Transaction version (optional) */
  version?: string;
}

export interface WaitForTransactionResult {
  /** Transaction status */
  status: string;

  /** Transaction hash */
  hash: string;

  /** Transaction version (optional) */
  version?: string;

  /** Error message if failed (optional) */
  error?: string;
}

// ============================================================================
// User & Account Types
// ============================================================================

export interface UserInfo {
  /** Whether wallet is connected */
  isConnected: boolean;

  /** User's Movement wallet address (if connected) */
  address: string | null;

  /** User's display name (optional) */
  displayName?: string;

  /** User's avatar URL (optional) */
  avatarUrl?: string;
}

export interface AccountInfo {
  /** Wallet address */
  address: string;

  /** Public key */
  publicKey: string;
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface PopupButton {
  /** Button identifier */
  id?: string;

  /** Button type */
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';

  /** Button text */
  text: string;
}

export interface PopupOptions {
  /** Popup title (optional) */
  title?: string;

  /** Popup message */
  message: string;

  /** Array of buttons (optional) */
  buttons?: PopupButton[];
}

export interface PopupResult {
  /** ID of clicked button */
  button_id?: string;
}

// ============================================================================
// Haptic & Notification Types
// ============================================================================

export interface HapticOptions {
  /** Haptic feedback type */
  type: 'impact' | 'selection' | 'notification';

  /** Haptic feedback style */
  style?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

export interface NotificationOptions {
  /** Notification title */
  title: string;

  /** Notification body text */
  body: string;

  /** Additional notification data (optional) */
  data?: Record<string, any>;
}

// ============================================================================
// Button API Types
// ============================================================================

export interface ButtonAPI {
  /** Set button text */
  setText(text: string): void;

  /** Show button */
  show(): void;

  /** Hide button */
  hide(): void;

  /** Register click callback */
  onClick(callback: () => void): void;
}

// ============================================================================
// Cloud Storage API Types
// ============================================================================

export interface CloudStorageAPI {
  /** Store a value in cloud storage */
  setItem(key: string, value: string): Promise<void>;

  /** Retrieve a value from cloud storage */
  getItem(key: string): Promise<string | null>;

  /** Remove a value from cloud storage */
  removeItem(key: string): Promise<void>;

  /** Get all storage keys */
  getKeys(): Promise<string[]>;
}

// ============================================================================
// Clipboard API Types
// ============================================================================

export interface ClipboardAPI {
  /** Write text to clipboard */
  writeText(text: string): Promise<void>;

  /** Read text from clipboard */
  readText(): Promise<string>;
}

// ============================================================================
// Movement SDK Interface
// ============================================================================

export interface MovementSDK {
  /** Current connection status */
  isConnected: boolean;

  /** Current user's wallet address (null if not connected) */
  address: string | null;

  /** Current network ('mainnet' | 'testnet') */
  network: string;

  /** SDK configuration (optional) */
  config?: {
    feePayerUrl?: string;
  };

  // ========== Wallet Methods ==========

  /**
   * Connect wallet
   * @returns Account information with address and public key
   */
  connect(): Promise<AccountInfo>;

  /**
   * Send a transaction to the Movement blockchain
   * @param params - Transaction parameters
   * @returns Transaction result with hash
   *
   * @example
   * ```typescript
   * const result = await sdk.sendTransaction({
   *   function: '0x1::aptos_account::transfer',
   *   arguments: ['0x123...', '1000000'],
   *   title: 'Send MOVE',
   *   useFeePayer: true,
   *   gasLimit: 'Sponsored'
   * });
   * console.log('Transaction hash:', result.hash);
   * ```
   */
  sendTransaction(params: SendTransactionParams): Promise<TransactionResult>;

  /**
   * Sign and submit a transaction (alias for sendTransaction)
   * @param params - Transaction parameters
   * @returns Transaction result with hash
   */
  signTransaction(params: SendTransactionParams): Promise<TransactionResult>;

  /**
   * Get current user information
   * @returns User info including connection status and address
   */
  getUserInfo(): Promise<UserInfo>;

  /**
   * Get account balance
   * @returns Balance as string
   */
  getBalance(): Promise<string>;

  /**
   * Wait for a transaction to be confirmed
   * @param txHash - Transaction hash to wait for
   * @returns Transaction result with status
   */
  waitForTransaction(txHash: string): Promise<WaitForTransactionResult>;

  // ========== Platform Methods ==========

  /**
   * Scan QR code using device camera
   * @returns Scanned QR code data as string
   * @throws Error if QR scanning is cancelled or fails
   */
  scanQRCode(): Promise<string>;

  /**
   * Trigger haptic feedback
   * @param options - Haptic options
   */
  haptic?(options: HapticOptions): Promise<void>;

  /**
   * Send local notification
   * @param options - Notification options
   */
  notify?(options: NotificationOptions): Promise<void>;

  /**
   * Call a view function on the blockchain
   * @param params - View function parameters
   * @returns Function result
   */
  callViewFunction?(params: {
    function: string;
    type_arguments?: string[];
    arguments?: any[];
  }): Promise<any>;

  // ========== UI Components ==========

  /**
   * Show a popup dialog with custom buttons
   * @param options - Popup options
   * @returns Result indicating which button was clicked
   *
   * @example
   * ```typescript
   * const result = await sdk.showPopup({
   *   title: 'Confirm Action',
   *   message: 'Are you sure you want to proceed?',
   *   buttons: [
   *     { id: 'yes', type: 'ok', text: 'Yes' },
   *     { id: 'no', type: 'cancel', text: 'No' }
   *   ]
   * });
   * if (result.button_id === 'yes') {
   *   // User confirmed
   * }
   * ```
   */
  showPopup(options: PopupOptions): Promise<PopupResult>;

  /**
   * Show a simple alert dialog
   * @param message - Alert message
   */
  showAlert(message: string): Promise<void>;

  /**
   * Show a confirmation dialog
   * @param message - Confirmation message
   * @param okText - OK button text (optional)
   * @param cancelText - Cancel button text (optional)
   * @returns True if user confirmed, false if cancelled
   */
  showConfirm(message: string, okText?: string, cancelText?: string): Promise<boolean>;

  // ========== Button APIs ==========

  /** Main action button */
  MainButton: ButtonAPI;

  /** Secondary action button */
  SecondaryButton: ButtonAPI;

  /** Back button */
  BackButton: ButtonAPI;

  // ========== Storage & Clipboard APIs ==========

  /** Cloud storage for persistent data */
  CloudStorage: CloudStorageAPI;

  /** Clipboard access */
  Clipboard: ClipboardAPI;

  // ========== Event Listeners ==========

  /**
   * Register wallet change listener
   * @param callback - Callback function
   */
  onWalletChange?(callback: (walletInfo: UserInfo) => void): void;

  /** Internal callback storage (do not use directly) */
  _onWalletChange?: (walletInfo: UserInfo) => void;
  _mainButtonCallback?: () => void;
  _secondaryButtonCallback?: () => void;
  _backButtonCallback?: () => void;
}

// ============================================================================
// Aptos Wallet Adapter Interface (for compatibility)
// ============================================================================

export interface AptosWalletAdapter {
  /** Connect wallet */
  connect(): Promise<AccountInfo>;

  /** Get account information */
  account(): Promise<AccountInfo | null>;

  /** Sign and submit transaction */
  signAndSubmitTransaction(transaction: SendTransactionParams): Promise<TransactionResult>;

  /** Get network information */
  network(): Promise<{
    name: string;
    chainId: string;
    url: string;
  }>;

  /** Listen for account changes */
  onAccountChange(callback: (account: AccountInfo | null) => void): () => void;

  /** Listen for balance changes */
  onBalanceChange(callback: (balance: any) => void): () => void;
}

// ============================================================================
// Global Window Interface
// ============================================================================

declare global {
  interface Window {
    /** Movement Mini Apps SDK */
    movementSDK: MovementSDK;

    /** Aptos wallet adapter (for compatibility with Aptos dApps) */
    aptos: AptosWalletAdapter;

    /** Movement wallet adapter (alias for aptos) */
    movement: AptosWalletAdapter;

    /** React Native WebView interface (internal - do not use directly) */
    ReactNativeWebView?: {
      postMessage(message: string): void;
    };
  }
}

export {};
