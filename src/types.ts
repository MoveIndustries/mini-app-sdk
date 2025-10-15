/**
 * Core types for Movement Mini App SDK
 */

export interface MovementAccount {
  address: string;
  publicKey: string;
  balance?: string;
}

export interface NetworkInfo {
  chainId: number;
  network: 'mainnet' | 'testnet' | 'devnet';
  rpcUrl: string;
  explorerUrl: string;
}

export interface TransactionPayload {
  type?: string;
  function: string;
  arguments: any[];
  type_arguments: string[];
}

// Multi-Agent Transaction
export interface MultiAgentTransactionPayload extends TransactionPayload {
  secondarySigners: string[]; // Addresses of additional signers
}

// Fee Payer (Sponsored) Transaction
export interface FeePayerTransactionPayload extends TransactionPayload {
  feePayer: string; // Address of account paying gas
}

// Batch Transaction
export interface BatchTransactionPayload {
  transactions: TransactionPayload[];
}

// Script Composer Transaction (for complex multi-function calls)
export interface ScriptComposerPayload {
  script: string; // Move script bytecode or composition
  type_arguments?: string[];
  arguments?: any[];
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  version?: string;
  vmStatus?: string;
}

export interface BatchTransactionResult {
  results: TransactionResult[];
  successCount: number;
  failureCount: number;
}

// Transaction monitoring
export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  timestamp?: number;
  error?: string;
}

export type TransactionStatusCallback = (status: TransactionStatus) => void;

export interface SignMessagePayload {
  message: string;
  nonce?: string;
}

export interface SignMessageResult {
  signature: string;
  publicKey: string;
  fullMessage?: string;
}

export interface HapticOptions {
  type: 'impact' | 'notification' | 'selection';
  style?: 'light' | 'medium' | 'heavy';
}

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
}

// UI Component Types
export interface PopupButton {
  id?: string;
  type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  text: string;
}

export interface PopupOptions {
  title?: string;
  message: string;
  buttons?: PopupButton[];
}

export interface PopupResult {
  button_id?: string;
}

export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
}

export interface StorageOptions {
  key: string;
  value?: string;
}

export interface CameraOptions {
  quality?: number; // 0-1
  allowsEditing?: boolean;
  mediaTypes?: 'photo' | 'video' | 'all';
}

export interface CameraResult {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
}

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface BiometricOptions {
  promptMessage?: string;
  cancelText?: string;
  fallbackToPasscode?: boolean;
}

export interface BiometricResult {
  success: boolean;
  biometricType?: 'FaceID' | 'TouchID' | 'Fingerprint';
}

export interface AppContext {
  user: {
    address: string;
    publicKey: string;
    verified: boolean;
  };
  app: {
    id: string;
    name: string;
    version: string;
  };
  platform: {
    os: 'ios' | 'android';
    version: string;
  };
  features: {
    haptics: boolean;
    notifications: boolean;
    camera: boolean;
    biometrics: boolean;
    location: boolean;
  };
}

export interface MovementSDK {
  // Connection & Account
  isConnected: boolean;
  address?: string;
  network?: string;

  // SDK Status
  isInstalled: () => boolean;
  ready: () => Promise<boolean>;

  // Core Methods
  connect: () => Promise<MovementAccount>;
  getAccount: () => Promise<MovementAccount>;
  getBalance: () => Promise<string>;
  getContext: () => Promise<AppContext>;
  scanQRCode?: () => Promise<string>;

  // Transaction Methods
  sendTransaction: (payload: TransactionPayload) => Promise<TransactionResult>;
  sendMultiAgentTransaction: (payload: MultiAgentTransactionPayload) => Promise<TransactionResult>;
  sendFeePayerTransaction: (payload: FeePayerTransactionPayload) => Promise<TransactionResult>;
  sendBatchTransactions: (payload: BatchTransactionPayload) => Promise<BatchTransactionResult>;
  sendScriptTransaction: (payload: ScriptComposerPayload) => Promise<TransactionResult>;

  // Signing Methods
  signMessage: (payload: SignMessagePayload) => Promise<SignMessageResult>;

  // Transaction Monitoring
  waitForTransaction: (hash: string) => Promise<TransactionStatus>;
  onTransactionUpdate?: (hash: string, callback: TransactionStatusCallback) => () => void;

  // Native Features
  haptic?: (options: HapticOptions) => Promise<void>;
  notify?: (options: NotificationOptions) => Promise<void>;
  share?: (options: ShareOptions) => Promise<{ success: boolean }>;
  openUrl?: (url: string, target?: 'external' | 'in-app') => Promise<void>;
  close?: () => Promise<void>;

  // Device Storage
  storage?: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };

  // Camera & Media
  camera?: {
    takePicture: (options?: CameraOptions) => Promise<CameraResult>;
    pickImage: (options?: CameraOptions) => Promise<CameraResult>;
  };

  // Location
  location?: {
    getCurrentPosition: () => Promise<LocationResult>;
    watchPosition: (callback: (position: LocationResult) => void) => () => void;
  };

  // Biometric Auth
  biometric?: {
    isAvailable: () => Promise<boolean>;
    authenticate: (options?: BiometricOptions) => Promise<BiometricResult>;
  };

  // Clipboard
  clipboard?: {
    copy: (text: string) => Promise<void>;
    paste: () => Promise<string>;
  };

  // UI Components
  showPopup?: (options: PopupOptions) => Promise<PopupResult>;
  showAlert?: (message: string) => Promise<void>;
  showConfirm?: (message: string, okText?: string, cancelText?: string) => Promise<boolean>;

  MainButton?: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };

  SecondaryButton?: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };

  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };

  // Cloud Storage (persistent across sessions, 1024 items per user)
  CloudStorage?: {
    setItem: (key: string, value: string) => Promise<void>;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<void>;
    getKeys: () => Promise<string[]>;
  };
}

declare global {
  interface Window {
    movementSDK?: MovementSDK;
  }
}
