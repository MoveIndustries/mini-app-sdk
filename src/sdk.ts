/**
 * Movement SDK Client
 * Main SDK interface for mini apps
 */

import type { MovementSDK } from './types';

export function getMovementSDK(): MovementSDK | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.movementSDK || null;
}

export function isInMovementApp(): boolean {
  return typeof window !== 'undefined' && !!window.movementSDK;
}

export function waitForSDK(timeout = 5000): Promise<MovementSDK> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is not defined - not running in browser'));
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
      reject(new Error('Movement SDK not found - app must run inside Movement Everything wallet'));
    }, timeout);
  });
}
