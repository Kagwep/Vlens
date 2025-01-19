# vLens

vLens is a  DeFi position management interface built on Starknet that allows users to monitor and manage their lending positions. It simplifies the process of bridging assets, swapping tokens, and interacting with Vesu lending protocol.

Website: https://vlens.vercel.app

## How to Use vLens

### Web Interface


### Step 1: Bridge Assets to Starknet
1. Connect your Starknet wallet using StarknetKit
2. Connect your EVM wallet (e.g., MetaMask) for source chain interaction
   - Both wallets need to be connected for bridging
   - Make sure you have enough tokens in your EVM wallet
   - Have ETH/MATIC/etc. for gas fees on source chain
3. Navigate to the bridge interface
4. Select your source chain
5. Choose token and amount to bridge
6. Approve token access (requires EVM wallet signature)
7. Confirm bridge transaction
8. Wait for bridging to complete (this may take several minutes)

### Step 2: Swap Tokens (via Avnu)
1. Access the Avnu integration
2. Select your input token
3. Choose desired output token
4. Review rates and confirm swap

### Step 3: Supply & Borrow
1. Navigate to the Vesu interface
2. Choose assets to supply as collateral
3. Supply assets to start earning yield
4. Optionally borrow against your collateral

## Available Features

### 🏦 Vesu Protocol Integration
- Supply assets to earn yield
- Borrow against your collateral
- Basic position monitoring

### 💱 Trading Integration
- Integrated Avnu swaps
- Competitive rates
- Simple token exchanges

### 🌉 Cross-Chain Bridge
- Bridge tokens to Starknet
- Support for major chains
- User-friendly interface

### 📱 Multi-Platform Access

#### Web Interface
- Full feature access
- Supports both EVM and Starknet operations simultaneously
- Integrated wallet connections

#### Telegram Mini App
- Separate EVM and Starknet interfaces for cleaner user experience
- Starknet Wallet Connection:
  - Use Braavos mobile wallet
  - ArgentX web wallet support
  - Argent mobile integration (coming soon)
- EVM Wallet Connection:
  - Separate section for EVM operations
  - Supports standard Web3 wallets
  - Independent from Starknet operations
- Quick access to core features
- Mobile-optimized interface

## Future Improvements

### 🔄 Advanced Collateral Management
- Collateral swapping functionality
- One-click collateral optimization
- Auto-rebalancing options

### 📊 Enhanced Monitoring
- Real-time position overview
- Health factor tracking
- APY/APR comparison tools
- Live market data integration

### 🤖 Automation Features
- Automated position management
- Safety triggers
- Yield optimization strategies

## Technical Stack

### Frontend
- React
- TailwindCSS
- StarknetKit for wallet connections

### Smart Contracts
- Starknet contracts in Cairo
- Vesu protocol integration
- Bridge integrations

## Getting Started

### Prerequisites

#### Required Wallets
- Starknet Wallet (ArgentX or Braavos)
- EVM Wallet (MetaMask or similar) for bridging from other chains

#### Development Setup
```bash
npm install
# or
yarn install
```

### Local Development
```bash
npm run dev
# or
yarn dev
```

## Links
- Website: https://vlens.vercel.app
- Documentation: [Coming Soon]
- Telegram Bot: [Coming Soon]
- Twitter: [Coming Soon]
- Discord: [Coming Soon]

## Security Notice
- Smart contracts pending audit
- Use at your own risk
- Only stake what you can afford to lose

### Telegram Mini App Usage

1. Access through Telegram:
   - Open vLens bot in Telegram
   - Start the Mini App
   - Choose your interface (EVM or Starknet)

2. For Starknet Operations:
   - Connect using Braavos mobile wallet
   - Or connect using ArgentX web wallet
   - Note: Argent mobile integration coming soon

3. For EVM Operations:
   - Access the separate EVM section
   - Connect your Web3 wallet
   - Perform operations independently

Tips for Telegram Mini App:
- Keep your wallets updated
- Ensure you're using compatible wallet versions
- Switch between interfaces as needed
- Check connection status before transactions

## Support
For support or inquiries:
- Telegram: [Coming Soon]
- Email: [Coming Soon]

## Contributing
Contributions are welcome! Please check our contributing guidelines [Coming Soon].

## License
[License Type] - see LICENSE file for details