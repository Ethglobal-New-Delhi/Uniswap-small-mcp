# 🎮 Example Usage Scenarios

This guide shows how to interact with the Uniswap MCP Server through Claude in natural language.

## 📖 Scenario 1: First Time Setup & Simple Swap

### Step 1: Connect Wallet
```
User: "Hey Claude, I want to swap some tokens on Unichain Sepolia. 
       Here's my private key: 0x1234567890abcdef..."

Claude: ✅ Wallet connected successfully!

        Address: 0xYourAddress...
        Balance: 0.5 ETH
        Network: Unichain Sepolia Testnet
```

### Step 2: Check Your Balances
```
User: "What tokens do I have?"

Claude: Let me check your balances:
        - ETH Balance: 0.5 ETH
        - WETH Balance: 1.25 WETH
        - USDC Balance: 100.00 USDC
```

### Step 3: Get a Swap Quote
```
User: "How much USDC can I get if I swap 0.5 WETH?"

Claude: 📊 Swap Quote

        Input: 0.5 WETH
        Output: 1,234.56 USDC
        Price: 1 WETH = 2,469.12 USDC
        Fee Tier: 0.3%

        Note: Add slippage tolerance when executing swap!
```

### Step 4: Approve Token (First Time Only)
```
User: "Approve WETH for swapping"

Claude: ✅ Approval Successful!

        Token: WETH
        Spender: SwapRouter02
        Amount: Unlimited
        Transaction: https://sepolia.uniscan.xyz/tx/0x...
```

### Step 5: Execute the Swap
```
User: "Swap 0.5 WETH for USDC. I'm okay with 2% slippage"

Claude: I'll calculate the minimum amount with 2% slippage...
        Minimum USDC out: 1,209.87 USDC
        
        ✅ Swap Successful!

        Transaction Hash: 0xabc123...
        Explorer: https://sepolia.uniscan.xyz/tx/0xabc123...

        Swapped 0.5 WETH for minimum 1,209.87 USDC
```

---

## 📖 Scenario 2: Advanced Trading with Multiple Quotes

### Compare Different Fee Tiers
```
User: "Compare swap rates for 1 WETH to USDC across different fee tiers"

Claude: Let me check all available fee tiers:

        📊 Fee Tier 0.05% (500)
        Output: 2,470.15 USDC
        
        📊 Fee Tier 0.3% (3000)
        Output: 2,469.12 USDC
        
        📊 Fee Tier 1% (10000)
        Pool not available for this pair
        
        Best rate: 0.05% fee tier with 2,470.15 USDC output
```

### Execute with Specific Fee Tier
```
User: "Swap 1 WETH for USDC using the 0.05% pool with 1% slippage"

Claude: ✅ Swap Successful!

        Fee Tier: 0.05%
        Transaction Hash: 0xdef456...
        Swapped 1 WETH for minimum 2,445.45 USDC
```

---

## 📖 Scenario 3: Portfolio Management

### Check Multiple Addresses
```
User: "Check USDC balance for these addresses:
       0xAddress1...
       0xAddress2..."

Claude: Here are the USDC balances:
        
        Address1: 500.00 USDC
        Address2: 1,234.56 USDC
        Total: 1,734.56 USDC
```

### Track Transactions
```
User: "What's the status of transaction 0xabc123...?"

Claude: I can see your transaction was successful!
        View details: https://sepolia.uniscan.xyz/tx/0xabc123...
```

---

## 📖 Scenario 4: Troubleshooting Common Issues

### Insufficient Allowance
```
User: "Swap 1 WETH for USDC"

Claude: ⚠️ Insufficient allowance. Please approve token first.

        Token: 0x4200...0006 (WETH)
        Required: 1 WETH
        
        Would you like me to approve it?

User: "Yes, approve it"

Claude: ✅ Approval Successful! Now you can proceed with the swap.
```

### Pool Not Found
```
User: "Get quote for swapping TOKEN_A to TOKEN_B"

Claude: ❌ Unable to get quote. Pool may not exist for this pair.

        Try different fee tiers:
        - 500 (0.05%)
        - 3000 (0.3%)
        - 10000 (1%)
        
        Or check if this pair has liquidity on Unichain Sepolia.
```

### Low Gas Balance
```
User: "Swap tokens"

Claude: ⚠️ Your ETH balance is low (0.001 ETH).
        
        You may not have enough for gas fees. Please add more ETH first.
        
        Get testnet ETH:
        1. Use Sepolia faucet
        2. Bridge to Unichain: https://bridge.unichain.org
```

---

## 📖 Scenario 5: Information Queries

### Network Status
```
User: "What's the current network status?"

Claude: 🌐 Network Information

        Network: Unichain Sepolia Testnet
        Chain ID: 1301
        RPC: https://sepolia.rpc.unichain.org
        Explorer: https://sepolia.uniscan.xyz

        Current Block: 123,456
        Gas Price: 0.5 gwei

        📝 Key Contracts:
        • SwapRouter02: 0x94cC0A...
        • QuoterV2: 0xc694a4...
        • WETH9: 0x420000...
        • USDC: 0xEea1Ba...
```

### Check Contract Addresses
```
User: "What's the USDC contract address on Unichain Sepolia?"

Claude: The USDC contract on Unichain Sepolia is:
        0xEea1BafFF6A3842ca8C9E86a82E7b26Fc81c8ECa
        
        Explorer: https://sepolia.uniscan.xyz/address/0xEea1Ba...
```

---

## 📖 Scenario 6: Batch Operations

### Multiple Approvals
```
User: "I need to approve WETH, USDC, and another token for swapping"

Claude: I'll approve all three tokens:

        ✅ WETH approved
        ✅ USDC approved  
        ✅ TOKEN approved
        
        All tokens are now ready for swapping!
```

### Sequential Swaps
```
User: "First swap 1 WETH to USDC, then swap 500 USDC to another token"

Claude: Executing swaps in sequence:

        ✅ Swap 1: 1 WETH → 2,469 USDC (Complete)
        Transaction: 0xabc...
        
        ✅ Swap 2: 500 USDC → 0.202 TOKEN (Complete)
        Transaction: 0xdef...
        
        All swaps completed successfully!
```

---

## 💡 Pro Tips

### 1. Always Use Slippage Protection
```
❌ Bad: "Swap 1 WETH for exactly 2,469 USDC"
✅ Good: "Swap 1 WETH for USDC with 1% slippage"
```

### 2. Check Quotes Before Swapping
```
✅ Good Flow:
1. Get quote
2. Review the rate
3. Execute with appropriate slippage
```

### 3. Approve Once, Swap Many Times
```
✅ Approve with "max" amount once
Then you can swap multiple times without re-approving
```

### 4. Monitor Gas Prices
```
User: "What's the current gas price?"
Claude: Gas Price: 0.5 gwei (very low - good time to trade!)
```

### 5. Use Natural Language
```
✅ "Swap half my WETH to USDC"
✅ "What's my wallet worth?"
✅ "Give me the best rate for this swap"
✅ "Is this a good time to trade?"
```

---

## 🎯 Quick Commands Reference

| What You Want | What To Say |
|---------------|-------------|
| Connect wallet | "Connect wallet with key 0x..." |
| Check balance | "What's my WETH balance?" |
| Get quote | "Quote for 1 WETH to USDC" |
| Approve token | "Approve WETH" |
| Execute swap | "Swap 1 WETH for USDC with 2% slippage" |
| Network info | "Show network status" |
| Multiple quotes | "Compare all fee tiers for WETH to USDC" |
| Transaction status | "Check transaction 0x..." |

---

## 🚨 Important Reminders

1. **Always use testnet**: This server is for Unichain Sepolia only
2. **Slippage matters**: Set appropriate slippage for volatile tokens
3. **Check quotes first**: Prices change quickly in DeFi
4. **Approve before swapping**: First-time swaps need approval
5. **Keep ETH for gas**: Always maintain ETH balance for transactions
6. **Verify addresses**: Double-check token contract addresses
7. **Test with small amounts**: Start small when trying new features

---

## 📚 Next Steps

Once comfortable with basic swaps:
- Explore different fee tiers for better rates
- Monitor gas prices for optimal swap timing
- Track your transaction history
- Learn about MEV protection features
- Understand pool liquidity dynamics

Happy swapping! 🎉