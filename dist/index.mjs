// src/sdk.ts
function getMovementSDK() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.movementSDK || null;
}
function isInMovementApp() {
  return typeof window !== "undefined" && !!window.movementSDK;
}
function waitForSDK(timeout = 5e3) {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is not defined - not running in browser"));
      return;
    }
    if (window.movementSDK) {
      resolve(window.movementSDK);
      return;
    }
    const checkInterval = setInterval(() => {
      if (window.movementSDK) {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(window.movementSDK);
      }
    }, 100);
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error("Movement SDK not found - app must run inside Movement Everything wallet"));
    }, timeout);
  });
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
    if (window.movementSDK) {
      setSDK(window.movementSDK);
      setIsConnected(window.movementSDK.isConnected);
      setAddress(window.movementSDK.address || null);
      setIsLoading(false);
    } else {
      const timeout = setTimeout(() => {
        if (window.movementSDK) {
          setSDK(window.movementSDK);
          setIsConnected(window.movementSDK.isConnected);
          setAddress(window.movementSDK.address || null);
        } else {
          setError(new Error("Movement SDK not available"));
        }
        setIsLoading(false);
      }, 1e3);
      return () => clearTimeout(timeout);
    }
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
      if (typeof window === "undefined" || !window.movementSDK) {
        setIsLoading(false);
        return;
      }
      try {
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
export {
  getMovementSDK,
  isInMovementApp,
  useMovementAccount,
  useMovementSDK,
  waitForSDK
};
