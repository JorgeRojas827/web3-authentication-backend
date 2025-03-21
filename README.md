# Web3 Authentication Smart Contract

A secure, gas-optimized Ethereum smart contract for Web3 authentication using EIP-191 signatures.

## Features

- EIP-191 compliant signature verification
- Gas-optimized storage using uint256
- Protection against replay attacks
- Event emission for auth state changes
- Custom error handling
- Authentication revocation

## Prerequisites

```shell
node >= 18.0.0
npm >= 9.0.0
```

## Installation

```shell
# Install dependencies
npm install
```

## Development

```shell
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Start local node
npx hardhat node

# Deploy contract
npx hardhat run scripts/deploy.ts --network <network_name>
```

## Contract Architecture

### State Variables

```solidity
mapping(address => uint256) public authenticatedUsers;
mapping(bytes32 => uint256) private usedSignatures;
```

### Events

```solidity
event UserAuthenticated(address indexed user, uint256 indexed timestamp);
event AuthenticationRevoked(address indexed user, uint256 indexed timestamp);
```

### Main Functions

- `verifySignature(string message, bytes signature)`: Authenticates users
- `revokeAuthentication()`: Revokes authentication
- `_recoverSigner(bytes32 messageHash, bytes signature)`: Recovers signer address

## Testing

Tests cover:

- Signature verification
- Authentication state
- Event emission
- Error handling
- Replay attack prevention
- Authentication revocation

## Environment Setup

Create a `.env` file:

```shell
ETHERSCAN_API_KEY=your_etherscan_api_key
PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

## Security

- EIP-191 standard implementation
- Signature replay protection
- No admin privileges
- Gas-optimized storage
- Custom error handling

## License

MIT
