# Uniswap MCP Server - Unichain Sepolia Testnet

A Model Context Protocol (MCP) server that enables Claude to interact with Uniswap on Unichain Sepolia testnet. Users can swap tokens, check balances, get quotes, and manage approvals through natural conversation.

## 🌟 Features

- ✅ **Connect Wallet**: Securely connect your wallet using a private key
- 💰 **Check Balances**: View token balances for any address
- 📊 **Get Quotes**: Fetch real-time swap quotes from Uniswap
- 🔄 **Execute Swaps**: Perform token swaps on Unichain Sepolia
- ✓ **Approve Tokens**: Manage token approvals for the Uniswap router
- 🌐 **Network Info**: View current network status and contract addresses

## 🔧 Prerequisites

- Node.js 18+ 
- Claude Desktop App
- A wallet with Unichain Sepolia ETH (for gas fees)

## 📦 Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Build the project:**
```bash
npm run build
```

## ⚙️ Configuration

### 1. Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the MCP server configuration:

```json
{
  "mcpServers": {
    "uniswap-sepolia": {
      "command": "node",
      "args": ["D:\\EthGlobal\\MCP with C\\build\\index.js"]
    }
  }
}
```

**Important**: Replace `D:\\EthGlobal\\MCP with C\\build\\index.js` with the absolute path to your project's build directory.

### 2. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

## 🚀 Usage

Once configured, you can interact with the Uniswap MCP server through natural language in Claude:

### Example Conversations:

**Connect Your Wallet:**
```
User: Connect my wallet with private key 0x...
Claude: ✅ Wallet connected successfully!
```

**Check Token Balance:**
```
User: What's my USDC balance on address 0x123...?
Claude: USDC Balance: 100.50 USDC
```

**Get a Swap Quote:**
```
User: How much USDC will I get for 1 WETH?
Claude: 📊 Swap Quote
Input: 1.0 WETH
Output: 2500.45 USDC
```

**Execute a Swap:**
```
User: Approve WETH for swapping
Claude: ✅ Approval Successful!

User: Swap 0.1 WETH for USDC with 1% slippage
Claude: ✅ Swap Successful!
```

## 🧪 Getting Testnet Tokens

1. **Get Sepolia ETH:**
   - Use a Sepolia faucet
   - Bridge to Unichain Sepolia: https://bridge.unichain.org

2. **Get Test Tokens on Unichain Sepolia:**
   - USDC: `0xEea1BafFF6A3842ca8C9E86a82E7b26Fc81c8ECa`
   - WETH: `0x4200000000000000000000000000000000000006`
   - Use the Uniswap interface or create pools for testing

## 📋 Available Tools

### 1. `connect_wallet`
Connect a wallet using a private key

**Parameters:**
- `privateKey` (string): Your wallet's private key

### 2. `get_balance`
Get token balance for an address

**Parameters:**
- `address` (string): Wallet address
- `tokenAddress` (string): Token contract address or 'ETH'

### 3. `get_quote`
Get a price quote for swapping tokens

**Parameters:**
- `tokenIn` (string): Input token address
- `tokenOut` (string): Output token address
- `amountIn` (string): Amount to swap
- `fee` (number, optional): Pool fee tier (500, 3000, or 10000)

### 4. `execute_swap`
Execute a token swap on Uniswap

**Parameters:**
- `tokenIn` (string): Input token address
- `tokenOut` (string): Output token address
- `amountIn` (string): Amount to swap
- `minAmountOut` (string): Minimum acceptable output amount
- `fee` (number, optional): Pool fee tier
- `slippagePercent` (number, optional): Slippage tolerance percentage

### 5. `approve_token`
Approve token spending for Uniswap router

**Parameters:**
- `tokenAddress` (string): Token to approve
- `amount` (string, optional): Amount to approve ('max' for unlimited)

### 6. `get_network_info`
Get current network information and configuration

## 🔒 Security Notes

⚠️ **Important Security Considerations:**

1. **Private Keys**: Never share your private key. This is for testnet only.
2. **Testnet Only**: This server is configured for Unichain Sepolia testnet. Do not use on mainnet without proper security audits.
3. **Slippage**: Always set appropriate slippage tolerance when swapping.
4. **Gas Fees**: Ensure you have enough ETH for gas fees.

## 🛠️ Network Details

**Network**: Unichain Sepolia Testnet
**Chain ID**: 1301
**RPC URL**: https://sepolia.rpc.unichain.org
**Explorer**: https://sepolia.uniscan.xyz

**Key Contracts:**
- SwapRouter02: `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`
- QuoterV2: `0xc694a4cf10e2e4f77b49c35c5e6ea1b0fde6f6e8`
- WETH9: `0x4200000000000000000000000000000000000006`
- USDC: `0xEea1BafFF6A3842ca8C9E86a82E7b26Fc81c8ECa`

## 🐛 Troubleshooting

**Server not appearing in Claude:**
- Verify the path in `claude_desktop_config.json` is correct
- Check that the build was successful (`npm run build`)
- Restart Claude Desktop completely

**Cannot connect to network:**
- Verify you have internet connection
- Check if Unichain Sepolia RPC is accessible

**Transaction fails:**
- Ensure you have enough ETH for gas
- Verify token approval before swapping
- Check pool exists for the token pair and fee tier

## 📚 Resources

- [Unichain Documentation](https://docs.unichain.org)
- [Uniswap v3 Docs](https://docs.uniswap.org/contracts/v3/overview)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Ethers.js Documentation](https://docs.ethers.org)

## 🎯 Example Use Cases

### Basic Token Swap Flow

```
1. User: "Connect my wallet with key 0x..."
2. User: "Check my WETH balance at 0x123..."
3. User: "Get me a quote for swapping 0.5 WETH to USDC"
4. User: "Approve WETH for swapping"
5. User: "Execute the swap with 2% slippage"
```

### Check Multiple Balances

```
User: "Show me my balances for WETH and USDC on address 0x..."
```

### Get Network Status

```
User: "What's the current network status and gas price?"
```

## 🔄 Architecture

```
┌─────────────┐
│   Claude    │
│   Desktop   │
└──────┬──────┘
       │
       │ MCP Protocol
       │
┌──────▼──────────────┐
│  MCP Server         │
│  (Node.js)          │
└──────┬──────────────┘
       │
       │ JSON-RPC
       │
┌──────▼──────────────┐
│  Unichain Sepolia   │
│  RPC Endpoint       │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  Uniswap Contracts  │
│  (Smart Contracts)  │
└─────────────────────┘
```

## 📝 Development

### Run in Development Mode

```bash
npm run dev
```

### Testing

You can test the MCP server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

### Adding New Features

To add new tools, extend the `setupHandlers()` method in `src/index.ts`:

1. Add tool definition in `ListToolsRequestSchema` handler
2. Add case in `CallToolRequestSchema` handler
3. Implement the tool method
4. Rebuild with `npm run build`

## 🤝 Contributing

Contributions are welcome! Some ideas for improvements:

- Support for Uniswap v4 hooks
- Multi-hop swaps
- Liquidity provision features
- Price charts and analytics
- Gas optimization suggestions
- Support for other testnets

## ⚖️ License

MIT License - feel free to use and modify for your needs.

## 🆘 Support

For issues or questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review [Unichain Documentation](https://docs.unichain.org)
- Check [MCP Documentation](https://modelcontextprotocol.io)

---

**Remember**: This is a testnet implementation. Always test thoroughly before considering any mainnet deployment, and never commit private keys to version control!

