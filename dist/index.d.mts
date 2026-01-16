/**
 * Core types for Movement Mini App SDK
 */
interface MovementAccount {
    address: string;
    publicKey: string;
    balance?: string;
}
interface NetworkInfo {
    chainId: number;
    network: 'mainnet' | 'testnet' | 'devnet';
    rpcUrl: string;
    explorerUrl: string;
}
interface TransactionPayload {
    type?: string;
    function: string;
    arguments: any[];
    type_arguments: string[];
    title?: string;
    description?: string;
    useFeePayer?: boolean;
    feePayerUrl?: string;
    gasLimit?: string | number;
    to?: string;
}
interface MultiAgentTransactionPayload extends TransactionPayload {
    secondarySigners: string[];
}
interface FeePayerTransactionPayload extends TransactionPayload {
    feePayer: string;
}
interface BatchTransactionPayload {
    transactions: TransactionPayload[];
}
interface ScriptComposerPayload {
    script: string;
    type_arguments?: string[];
    arguments?: any[];
}
interface ViewPayload {
    function: string;
    type_arguments?: string[];
    function_arguments?: any[];
}
interface TransactionResult {
    hash: string;
    success: boolean;
    version?: string;
    vmStatus?: string;
}
interface BatchTransactionResult {
    results: TransactionResult[];
    successCount: number;
    failureCount: number;
}
interface TransactionStatus {
    hash: string;
    status: 'pending' | 'success' | 'failed';
    gasUsed?: string;
    timestamp?: number;
    error?: string;
}
type TransactionStatusCallback = (status: TransactionStatus) => void;
interface SignMessagePayload {
    message: string;
    nonce?: string;
}
interface SignMessageResult {
    signature: string;
    publicKey: string;
    fullMessage?: string;
}
interface HapticOptions {
    type: 'impact' | 'notification' | 'selection';
    style?: 'light' | 'medium' | 'heavy' | 'success' | 'error';
}
interface NotificationOptions {
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: boolean;
    badge?: number;
}
interface PopupButton {
    id?: string;
    type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
    text: string;
}
interface PopupOptions {
    title?: string;
    message: string;
    buttons?: PopupButton[];
}
interface PopupResult {
    button_id?: string;
}
interface ShareOptions {
    title?: string;
    message: string;
    url?: string;
}
interface StorageOptions {
    key: string;
    value?: string;
}
interface CameraOptions {
    quality?: number;
    allowsEditing?: boolean;
    mediaTypes?: 'photo' | 'video' | 'all';
}
interface CameraResult {
    uri: string;
    width: number;
    height: number;
    type: 'image' | 'video';
}
interface LocationResult {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
}
interface BiometricOptions {
    promptMessage?: string;
    cancelText?: string;
    fallbackToPasscode?: boolean;
}
interface BiometricResult {
    success: boolean;
    biometricType?: 'FaceID' | 'TouchID' | 'Fingerprint';
}
interface ThemeInfo {
    colorScheme: 'light' | 'dark';
}
interface AnalyticsConfig {
    enabled?: boolean;
    debug?: boolean;
}
interface AnalyticsEventProperties {
    [key: string]: string | number | boolean | null | undefined;
}
interface AnalyticsUserProperties {
    [key: string]: string | number | boolean | null | undefined;
}
interface AnalyticsAPI {
    /**
     * Track a custom event
     * @param eventName - Name of the event to track
     * @param properties - Optional properties to attach to the event
     */
    track: (eventName: string, properties?: AnalyticsEventProperties) => Promise<void>;
    /**
     * Identify the current user with optional traits
     * @param userId - Unique user identifier
     * @param traits - Optional user properties/traits
     */
    identify: (userId: string, traits?: AnalyticsUserProperties) => Promise<void>;
    /**
     * Track a screen/page view
     * @param screenName - Name of the screen being viewed
     * @param properties - Optional additional properties
     */
    trackScreen: (screenName: string, properties?: AnalyticsEventProperties) => Promise<void>;
    /**
     * Set user properties without tracking an event
     * @param properties - Properties to set on the user profile
     */
    setUserProperties: (properties: AnalyticsUserProperties) => Promise<void>;
    /**
     * Reset analytics state (e.g., on logout)
     */
    reset: () => Promise<void>;
    /**
     * Check if analytics is enabled
     */
    isEnabled: () => Promise<boolean>;
    /**
     * Opt out of analytics tracking
     */
    optOut: () => Promise<void>;
    /**
     * Opt back into analytics tracking
     */
    optIn: () => Promise<void>;
}
interface AppContext {
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
    theme: ThemeInfo;
}
interface MovementSDK {
    isConnected: boolean;
    address?: string;
    network?: string;
    isInstalled: () => boolean;
    ready: () => Promise<boolean>;
    connect: () => Promise<MovementAccount>;
    getAccount: () => Promise<MovementAccount>;
    getBalance: () => Promise<string>;
    getContext: () => Promise<AppContext>;
    getTheme: () => Promise<ThemeInfo>;
    scanQRCode?: () => Promise<string>;
    sendTransaction: (payload: TransactionPayload) => Promise<TransactionResult>;
    sendMultiAgentTransaction: (payload: MultiAgentTransactionPayload) => Promise<TransactionResult>;
    sendFeePayerTransaction: (payload: FeePayerTransactionPayload) => Promise<TransactionResult>;
    sendBatchTransactions: (payload: BatchTransactionPayload) => Promise<BatchTransactionResult>;
    sendScriptTransaction: (payload: ScriptComposerPayload) => Promise<TransactionResult>;
    view: (payload: ViewPayload) => Promise<any[]>;
    signMessage: (payload: SignMessagePayload) => Promise<SignMessageResult>;
    waitForTransaction: (hash: string) => Promise<TransactionStatus>;
    onTransactionUpdate?: (hash: string, callback: TransactionStatusCallback) => () => void;
    haptic?: (options: HapticOptions) => Promise<void>;
    notify?: (options: NotificationOptions) => Promise<void>;
    share?: (options: ShareOptions) => Promise<{
        success: boolean;
    }>;
    openUrl?: (url: string, target?: 'external' | 'in-app') => Promise<void>;
    close?: () => Promise<void>;
    storage?: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<void>;
        remove: (key: string) => Promise<void>;
        clear: () => Promise<void>;
        getAll: () => Promise<{
            key: string;
            value: string;
        }[]>;
    };
    camera?: {
        takePicture: (options?: CameraOptions) => Promise<CameraResult>;
        pickImage: (options?: CameraOptions) => Promise<CameraResult>;
    };
    location?: {
        getCurrentPosition: () => Promise<LocationResult>;
        watchPosition: (callback: (position: LocationResult) => void) => () => void;
    };
    biometric?: {
        isAvailable: () => Promise<boolean>;
        authenticate: (options?: BiometricOptions) => Promise<BiometricResult>;
    };
    clipboard?: {
        copy: (text: string) => Promise<void>;
        paste: () => Promise<string>;
    };
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
    CloudStorage?: {
        setItem: (key: string, value: string) => Promise<void>;
        getItem: (key: string) => Promise<string | null>;
        removeItem: (key: string) => Promise<void>;
        getKeys: () => Promise<string[]>;
    };
    analytics?: AnalyticsAPI;
}
declare global {
    interface Window {
        movementSDK?: MovementSDK;
    }
}

/**
 * Security utilities for Movement SDK
 * Provides validation, sanitization, and attack prevention
 */
interface SecurityConfig {
    maxTransactionAmount?: string;
    allowedOrigins?: string[];
    rateLimitWindow?: number;
    maxRequestsPerWindow?: number;
    enableCSP?: boolean;
    strictMode?: boolean;
}
declare class SecurityManager {
    private config;
    private rateLimitMap;
    private nonceSet;
    constructor(config?: SecurityConfig);
    /**
     * Validate origin of request
     */
    validateOrigin(origin: string): boolean;
    /**
     * Rate limiting check
     */
    checkRateLimit(identifier: string): boolean;
    /**
     * Validate transaction payload
     */
    validateTransaction(payload: any): {
        valid: boolean;
        error?: string;
    };
    /**
     * Validate Aptos address format
     */
    isValidAddress(address: string): boolean;
    /**
     * Sanitize message for signing
     */
    sanitizeMessage(message: string): string;
    /**
     * Generate and validate nonce for message signing
     */
    generateNonce(): string;
    validateNonce(nonce: string): boolean;
    /**
     * Setup Content Security Policy
     */
    private setupCSP;
    /**
     * Log security events (for monitoring)
     */
    logSecurityEvent(event: {
        type: 'rate_limit' | 'invalid_origin' | 'invalid_transaction' | 'replay_attack' | 'suspicious_activity';
        details: string;
        metadata?: any;
    }): void;
}
declare const createSecurityManager: (config?: SecurityConfig) => SecurityManager;

declare class SecureMovementSDK {
    private sdk;
    private security;
    constructor(sdk: MovementSDK, config?: SecurityConfig);
    get isConnected(): boolean;
    get address(): string | undefined;
    get network(): string | undefined;
    isInstalled(): boolean;
    ready(): Promise<boolean>;
    connect(): Promise<MovementAccount>;
    getAccount(): Promise<MovementAccount>;
    getBalance(): Promise<string>;
    scanQRCode(): Promise<string>;
    sendTransaction(payload: TransactionPayload): Promise<TransactionResult>;
    signMessage(payload: SignMessagePayload): Promise<SignMessageResult>;
    sendMultiAgentTransaction(payload: MultiAgentTransactionPayload): Promise<TransactionResult>;
    sendFeePayerTransaction(payload: FeePayerTransactionPayload): Promise<TransactionResult>;
    sendBatchTransactions(payload: BatchTransactionPayload): Promise<BatchTransactionResult>;
    sendScriptTransaction(payload: ScriptComposerPayload): Promise<TransactionResult>;
    getContext(): Promise<AppContext>;
    view(payload: ViewPayload): Promise<any[]>;
    waitForTransaction(hash: string): Promise<TransactionStatus>;
    onTransactionUpdate(hash: string, callback: any): (() => void) | undefined;
    haptic(options: any): Promise<void | undefined>;
    notify(options: any): Promise<void | undefined>;
    openUrl(url: string, target?: 'external' | 'in-app'): Promise<void> | undefined;
    close(): Promise<void> | undefined;
    get storage(): {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<void>;
        remove: (key: string) => Promise<void>;
        clear: () => Promise<void>;
        getAll: () => Promise<{
            key: string;
            value: string;
        }[]>;
    } | undefined;
}
declare function getMovementSDK(config?: SecurityConfig): MovementSDK | null;
declare function isInMovementApp(): boolean;
declare function waitForSDK(timeout?: number, config?: SecurityConfig): Promise<MovementSDK>;

/**
 * React Hooks for Movement SDK
 */

interface UseMovementSDKResult {
    sdk: MovementSDK | null;
    isConnected: boolean;
    address: string | null;
    isLoading: boolean;
    error: Error | null;
    connect: () => Promise<void>;
    sendTransaction: (payload: TransactionPayload) => Promise<TransactionResult | null>;
}
declare function useMovementSDK(): UseMovementSDKResult;
interface UseMovementAccountResult {
    account: MovementAccount | null;
    isConnected: boolean;
    isLoading: boolean;
    error: Error | null;
}
declare function useMovementAccount(): UseMovementAccountResult;
interface UseMovementThemeResult {
    theme: ThemeInfo | null;
    isLoading: boolean;
    error: Error | null;
}
declare function useMovementTheme(): UseMovementThemeResult;
interface UseAnalyticsResult {
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
declare function useAnalytics(): UseAnalyticsResult;

export { type AnalyticsAPI, type AnalyticsConfig, type AnalyticsEventProperties, type AnalyticsUserProperties, type AppContext, type BatchTransactionPayload, type BatchTransactionResult, type BiometricOptions, type BiometricResult, type CameraOptions, type CameraResult, type FeePayerTransactionPayload, type HapticOptions, type LocationResult, type MovementAccount, type MovementSDK, type MultiAgentTransactionPayload, type NetworkInfo, type NotificationOptions, type PopupButton, type PopupOptions, type PopupResult, type ScriptComposerPayload, SecureMovementSDK, type SecurityConfig, type ShareOptions, type SignMessagePayload, type SignMessageResult, type StorageOptions, type ThemeInfo, type TransactionPayload, type TransactionResult, type TransactionStatus, type TransactionStatusCallback, type UseAnalyticsResult, type UseMovementAccountResult, type UseMovementSDKResult, type UseMovementThemeResult, type ViewPayload, createSecurityManager, getMovementSDK, isInMovementApp, useAnalytics, useMovementAccount, useMovementSDK, useMovementTheme, waitForSDK };
