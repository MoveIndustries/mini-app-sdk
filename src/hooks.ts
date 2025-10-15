/**
 * React Hooks for Movement SDK
 */

import { useEffect, useState, useCallback } from 'react';
import type { MovementSDK, MovementAccount, TransactionPayload, TransactionResult } from './types';

export interface UseMovementSDKResult {
  sdk: MovementSDK | null;
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  sendTransaction: (payload: TransactionPayload) => Promise<TransactionResult | null>;
}

export function useMovementSDK(): UseMovementSDKResult {
  const [sdk, setSDK] = useState<MovementSDK | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      setError(new Error('Window is not defined'));
      return;
    }

    // Check if SDK is installed
    if (!window.movementSDK?.isInstalled?.()) {
      setIsLoading(false);
      setError(new Error('Movement SDK not available - please open in Movement wallet'));
      return;
    }

    // Initialize SDK using ready() pattern
    const initSDK = async () => {
      try {
        if (window.movementSDK) {
          // Wait for SDK to be ready
          await window.movementSDK.ready();

          setSDK(window.movementSDK);
          setIsConnected(window.movementSDK.isConnected);
          setAddress(window.movementSDK.address || null);
          setIsLoading(false);
        }
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    initSDK();
  }, []);

  const connect = useCallback(async () => {
    if (!sdk) {
      throw new Error('SDK not available');
    }

    try {
      const account = await sdk.connect();
      setIsConnected(true);
      setAddress(account.address);
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [sdk]);

  const sendTransaction = useCallback(async (payload: TransactionPayload): Promise<TransactionResult | null> => {
    if (!sdk || !isConnected) {
      throw new Error('SDK not connected');
    }

    try {
      const result = await sdk.sendTransaction(payload);
      return result;
    } catch (err) {
      setError(err as Error);
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

export interface UseMovementAccountResult {
  account: MovementAccount | null;
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useMovementAccount(): UseMovementAccountResult {
  const [account, setAccount] = useState<MovementAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      // Check if SDK is installed
      if (!window.movementSDK?.isInstalled?.()) {
        setIsLoading(false);
        setError(new Error('Movement SDK not available - please open in Movement wallet'));
        return;
      }

      try {
        // Wait for SDK to be ready
        await window.movementSDK.ready();

        if (window.movementSDK.isConnected) {
          const acc = await window.movementSDK.getAccount();
          setAccount(acc);
          setIsConnected(true);
        }
      } catch (err) {
        setError(err as Error);
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
