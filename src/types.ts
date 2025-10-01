/**
 * Core types for Movement Mini App SDK
 */

export interface MovementAccount {
  address: string;
  publicKey: string;
}

export interface NetworkInfo {
  chainId: number;
  network: 'mainnet' | 'testnet';
  rpcUrl: string;
  explorerUrl: string;
}

export interface TransactionPayload {
  type?: string;
  function: string;
  arguments: any[];
  type_arguments: string[];
}

export interface TransactionResult {
  hash: string;
  success: boolean;
}

export interface SignMessagePayload {
  message: string;
  nonce?: string;
}

export interface SignMessageResult {
  signature: string;
  publicKey: string;
}

export interface HapticOptions {
  type: 'impact' | 'notification' | 'selection';
  style?: 'light' | 'medium' | 'heavy';
}

export interface NotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface MovementSDK {
  // Connection
  isConnected: boolean;
  address?: string;
  network?: string;

  // Methods
  connect: () => Promise<MovementAccount>;
  getAccount: () => Promise<MovementAccount>;
  sendTransaction: (payload: TransactionPayload) => Promise<TransactionResult>;
  signMessage: (payload: SignMessagePayload) => Promise<SignMessageResult>;

  // Platform APIs
  haptic?: (options: HapticOptions) => Promise<void>;
  notify?: (options: NotificationOptions) => Promise<void>;
  openUrl?: (url: string, target?: 'external' | 'in-app') => void;
  close?: () => void;
}

declare global {
  interface Window {
    movementSDK?: MovementSDK;
  }
}
