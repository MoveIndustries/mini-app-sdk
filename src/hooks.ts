/**
 * React Hooks for Movement SDK
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import type {
  MovementSDK,
  MovementAccount,
  TransactionPayload,
  TransactionResult,
  ThemeInfo,
  AnalyticsAPI,
  AnalyticsEventProperties,
  AnalyticsUserProperties,
} from './types';

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

export interface UseMovementThemeResult {
  theme: ThemeInfo | null;
  isLoading: boolean;
  error: Error | null;
}

export function useMovementTheme(): UseMovementThemeResult {
  const [theme, setTheme] = useState<ThemeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTheme = async () => {
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

        if (window.movementSDK.getTheme) {
          const themeInfo = await window.movementSDK.getTheme();
          setTheme(themeInfo);
        }
      } catch (err) {
        setError(err as Error);
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

// ============================================================================
// Analytics Hook
// ============================================================================

export interface UseAnalyticsResult {
  /**
   * Track a custom event
   */
  track: (eventName: string, properties?: AnalyticsEventProperties) => Promise<void>;

  /**
   * Identify the current user
   */
  identify: (userId: string, traits?: AnalyticsUserProperties) => Promise<void>;

  /**
   * Track a screen/page view
   */
  trackScreen: (screenName: string, properties?: AnalyticsEventProperties) => Promise<void>;

  /**
   * Set user properties
   */
  setUserProperties: (properties: AnalyticsUserProperties) => Promise<void>;

  /**
   * Reset analytics state
   */
  reset: () => Promise<void>;

  /**
   * Check if analytics is enabled
   */
  isEnabled: boolean;

  /**
   * Opt out of analytics
   */
  optOut: () => Promise<void>;

  /**
   * Opt back into analytics
   */
  optIn: () => Promise<void>;

  /**
   * Whether SDK is available
   */
  isAvailable: boolean;
}

/**
 * Hook for tracking analytics events in mini apps.
 *
 * Events are sent through the host app's analytics service (Mixpanel)
 * with automatic mini-app context enrichment.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { track, trackScreen, isAvailable } = useAnalytics();
 *
 *   useEffect(() => {
 *     trackScreen('Home');
 *   }, []);
 *
 *   const handleButtonClick = () => {
 *     track('Button Clicked', { button_name: 'submit' });
 *   };
 *
 *   return <button onClick={handleButtonClick}>Submit</button>;
 * }
 * ```
 */
export function useAnalytics(): UseAnalyticsResult {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check if SDK is available
    if (typeof window !== 'undefined' && window.movementSDK?.analytics) {
      setIsAvailable(true);
    }
  }, []);

  const track = useCallback(async (eventName: string, properties?: AnalyticsEventProperties): Promise<void> => {
    if (typeof window === 'undefined' || !window.movementSDK?.analytics) {
      console.log('[Analytics] SDK not available, skipping track:', eventName);
      return;
    }

    try {
      await window.movementSDK.analytics.track(eventName, properties);
    } catch (error) {
      console.warn('[Analytics] Failed to track event:', eventName, error);
    }
  }, []);

  const identify = useCallback(async (userId: string, traits?: AnalyticsUserProperties): Promise<void> => {
    if (typeof window === 'undefined' || !window.movementSDK?.analytics) {
      console.log('[Analytics] SDK not available, skipping identify');
      return;
    }

    try {
      await window.movementSDK.analytics.identify(userId, traits);
    } catch (error) {
      console.warn('[Analytics] Failed to identify user:', error);
    }
  }, []);

  const trackScreen = useCallback(async (screenName: string, properties?: AnalyticsEventProperties): Promise<void> => {
    if (typeof window === 'undefined' || !window.movementSDK?.analytics) {
      console.log('[Analytics] SDK not available, skipping trackScreen:', screenName);
      return;
    }

    try {
      await window.movementSDK.analytics.trackScreen(screenName, properties);
    } catch (error) {
      console.warn('[Analytics] Failed to track screen:', screenName, error);
    }
  }, []);

  const setUserProperties = useCallback(async (properties: AnalyticsUserProperties): Promise<void> => {
    if (typeof window === 'undefined' || !window.movementSDK?.analytics) {
      console.log('[Analytics] SDK not available, skipping setUserProperties');
      return;
    }

    try {
      await window.movementSDK.analytics.setUserProperties(properties);
    } catch (error) {
      console.warn('[Analytics] Failed to set user properties:', error);
    }
  }, []);

  const reset = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.movementSDK?.analytics) {
      return;
    }

    try {
      await window.movementSDK.analytics.reset();
    } catch (error) {
      console.warn('[Analytics] Failed to reset:', error);
    }
  }, []);

  const optOut = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.movementSDK?.analytics) {
      return;
    }

    try {
      await window.movementSDK.analytics.optOut();
      setIsEnabled(false);
    } catch (error) {
      console.warn('[Analytics] Failed to opt out:', error);
    }
  }, []);

  const optIn = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.movementSDK?.analytics) {
      return;
    }

    try {
      await window.movementSDK.analytics.optIn();
      setIsEnabled(true);
    } catch (error) {
      console.warn('[Analytics] Failed to opt in:', error);
    }
  }, []);

  return {
    track,
    identify,
    trackScreen,
    setUserProperties,
    reset,
    isEnabled,
    optOut,
    optIn,
    isAvailable,
  };
}
