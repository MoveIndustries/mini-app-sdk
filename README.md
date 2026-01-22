# @moveindustries/miniapp-sdk

Official SDK for building Movement Mini Apps - blockchain-powered applications that run inside the Movement Everything mobile app.

## Installation

```bash
npm install @moveindustries/miniapp-sdk
```

## Quick Start

### Vanilla JavaScript

```javascript
import { getMovementSDK } from '@moveindustries/miniapp-sdk';

const sdk = getMovementSDK();

if (sdk) {
  // Connect wallet
  const account = await sdk.connect();
  console.log('Connected:', account.address);

  // Send transaction
  const result = await sdk.sendTransaction({
    function: '0x1::coin::transfer',
    arguments: [recipientAddress, amount],
    type_arguments: ['0x1::aptos_coin::AptosCoin']
  });

  console.log('Transaction hash:', result.hash);
}
```

### React / Next.js

```typescript
import { useMovementSDK } from '@moveindustries/miniapp-sdk';

function MyApp() {
  const { sdk, isConnected, address, connect, sendTransaction } = useMovementSDK();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {address}</p>
          <button onClick={() => sendTransaction({
            function: '0x1::coin::transfer',
            arguments: [recipient, '100'],
            type_arguments: ['0x1::aptos_coin::AptosCoin']
          })}>
            Send Tokens
          </button>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### Functions

#### `getMovementSDK()`
Get the Movement SDK instance if available.

```typescript
const sdk = getMovementSDK();
```

#### `isInMovementApp()`
Check if running inside Movement app.

```typescript
if (isInMovementApp()) {
  // SDK is available
}
```

#### `waitForSDK(timeout?)`
Wait for SDK to load (useful for iframes).

```typescript
const sdk = await waitForSDK(5000); // 5 second timeout
```

### React Hooks

#### `useMovementSDK()`
React hook for SDK access.

```typescript
const {
  sdk,           // SDK instance
  isConnected,   // Connection status
  address,       // Wallet address
  isLoading,     // Loading state
  error,         // Error state
  connect,       // Connect function
  sendTransaction // Send transaction function
} = useMovementSDK();
```

#### `useMovementAccount()`
React hook for account info.

```typescript
const {
  account,      // Account object { address, publicKey }
  isConnected,  // Connection status
  isLoading,    // Loading state
  error         // Error state
} = useMovementAccount();
```

### SDK Methods

#### `connect()`
Connect to user's wallet.

```typescript
const account = await sdk.connect();
// { address: string, publicKey: string }
```

#### `getAccount()`
Get current account info.

```typescript
const account = await sdk.getAccount();
```

#### `sendTransaction(payload)`
Sign and submit a transaction.

```typescript
const result = await sdk.sendTransaction({
  function: '0x1::coin::transfer',
  arguments: [recipient, amount],
  type_arguments: ['0x1::aptos_coin::AptosCoin']
});
// { hash: string, success: boolean }
```

#### `signMessage(payload)`
Sign a message.

```typescript
const result = await sdk.signMessage({
  message: 'Hello Movement!',
  nonce: '12345'
});
// { signature: string, publicKey: string }
```

#### `haptic(options)` (Optional)
Trigger haptic feedback.

```typescript
await sdk.haptic?.({
  type: 'impact',
  style: 'medium'
});
```

#### `notify(options)` (Optional)
Show notification.

```typescript
await sdk.notify?.({
  title: 'Success!',
  body: 'Transaction complete'
});
```

#### `openUrl(url, target?)` (Optional)
Open URL externally or in-app.

```typescript
sdk.openUrl?.('https://example.com', 'external');
```

#### `close()` (Optional)
Close the mini app.

```typescript
sdk.close?.();
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions included.

### Using Type Definitions

For direct `window.movementSDK` usage (without npm package), reference the type definitions:

```typescript
/// <reference path="./movement-sdk.d.ts" />

// Now you have full IntelliSense and type checking!
const result = await window.movementSDK.sendTransaction({
  function: '0x1::aptos_account::transfer',
  arguments: ['0x123...', '1000000'],
  title: 'Send MOVE',
  useFeePayer: true,
  gasLimit: 'Sponsored'
});
```

### Import Types

```typescript
import type {
  MovementSDK,
  SendTransactionParams,
  TransactionResult,
  UserInfo,
  PopupOptions
} from '@moveindustries/miniapp-sdk';
```

### Transaction Parameters

The `SendTransactionParams` interface provides full type safety:

```typescript
interface SendTransactionParams {
  /** Move function: address::module::function_name */
  function: string;

  /** Type arguments (optional) */
  type_arguments?: string[];

  /** Function arguments (optional) */
  arguments?: any[];

  /** UI title (optional) */
  title?: string;

  /** UI description (optional) */
  description?: string;

  /** Use sponsored transactions (optional) */
  useFeePayer?: boolean;

  /** Gas limit (optional) - use 'Sponsored' for sponsored txs */
  gasLimit?: number | 'Sponsored';
}
```

**Note:** The `to` field is now optional and automatically extracted from the `function` field (the address before the first `::`).

## Examples

Check out example projects:
- [Token Sender](https://github.com/movementlabsxyz/miniapp-examples/tree/main/token-sender)
- [NFT Gallery](https://github.com/movementlabsxyz/miniapp-examples/tree/main/nft-gallery)
- [Racing Game](https://github.com/movementlabsxyz/miniapp-examples/tree/main/racing-game)

## Documentation

Full documentation: https://docs.movementlabs.xyz/miniapps

## License

MIT

## Support

- [Discord](https://discord.gg/movementlabs)
- [GitHub Issues](https://github.com/movementlabsxyz/movement-miniapp-sdk/issues)
- [Twitter](https://twitter.com/movementlabsxyz)
