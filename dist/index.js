"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  getMovementSDK: () => getMovementSDK,
  isInMovementApp: () => isInMovementApp,
  useMovementAccount: () => useMovementAccount,
  useMovementSDK: () => useMovementSDK,
  waitForSDK: () => waitForSDK
});
module.exports = __toCommonJS(index_exports);

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
var import_react = require("react");
function useMovementSDK() {
  const [sdk, setSDK] = (0, import_react.useState)(null);
  const [isConnected, setIsConnected] = (0, import_react.useState)(false);
  const [address, setAddress] = (0, import_react.useState)(null);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
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
  const connect = (0, import_react.useCallback)(async () => {
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
  const sendTransaction = (0, import_react.useCallback)(async (payload) => {
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
  const [account, setAccount] = (0, import_react.useState)(null);
  const [isConnected, setIsConnected] = (0, import_react.useState)(false);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  const [error, setError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getMovementSDK,
  isInMovementApp,
  useMovementAccount,
  useMovementSDK,
  waitForSDK
});
