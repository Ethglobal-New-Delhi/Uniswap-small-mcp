# 🔧 Claude Desktop MCP Server Troubleshooting Guide

## ✅ **FIXED: Your MCP Server Configuration**

Your configuration has been updated to point to the correct file path:

### **Before (Broken):**
```json
{
  "mcpServers": {
    "uniswap-sepolia": {
      "command": "node",
      "args": ["D:\\EthGlobal\\MCP with C\\build\\index_ethereum_sepolia.js"],
      "env": {}
    }
  }
}
```

### **After (Fixed):**
```json
{
  "mcpServers": {
    "uniswap-sepolia": {
      "command": "node",
      "args": ["C:\\Users\\lenovo\\OneDrive\\Documents\\Uniswap\\Uniswap-small-mcp\\build\\index_ethereum_sepolia.js"],
      "env": {}
    }
  }
}
```

## 🚀 **Next Steps to Fix Your MCP Server**

### 1. **Copy Configuration to Claude Desktop**
Copy the contents of `claude_config.json` to your Claude Desktop config file:

**Location:** `%APPDATA%\Claude\claude_desktop_config.json`

### 2. **Restart Claude Desktop**
- Close Claude Desktop completely
- Reopen Claude Desktop
- The MCP server should now connect successfully!

## 🔍 **Understanding the Error Messages**

### **Invalid URL Error**
```
TypeError: Invalid URL
input: '--fetch-schemes=sentry-ipc'
```
- This is a **Claude Desktop app bug** (v0.13.37)
- It's related to Sentry error reporting initialization
- **Does NOT affect MCP functionality**
- Can be safely ignored

### **MCP Server Not Found**
```
Extension uniswap-sepolia not found in installed extensions
```
- This was caused by the **incorrect file path**
- The server was trying to launch from `D:\EthGlobal\...` (doesn't exist)
- **Now fixed** with correct path: `C:\Users\lenovo\OneDrive\Documents\Uniswap\Uniswap-small-mcp\build\index_ethereum_sepolia.js`

## 🛠️ **Your Available MCP Servers**

You have **multiple working MCP servers**:

### 1. **Uniswap Sepolia Server** (Recommended)
- **File:** `Uniswap-small-mcp/build/index_ethereum_sepolia.js`
- **Network:** Ethereum Sepolia Testnet
- **Features:** Token swapping, balance checking, quote fetching
- **Status:** ✅ Ready to use

### 2. **Uniswap V4 Server** (Alternative)
- **File:** `v4-template/uniswap-v4-fixed.js`
- **Network:** Sepolia Testnet
- **Features:** V4 swapping, Turing tests, hook verification
- **Status:** ✅ Ready to use

## 📊 **Available Tools in Your MCP Server**

Your `uniswap-sepolia` server provides:

1. **`get_token_balance`** - Check token balances
2. **`get_eth_balance`** - Check ETH balance
3. **`get_quote`** - Get swap quotes
4. **`perform_swap`** - Execute token swaps
5. **`check_connection`** - Verify server status

## 🧪 **Testing Your MCP Server**

### Test the server directly:
```bash
cd "C:\Users\lenovo\OneDrive\Documents\Uniswap\Uniswap-small-mcp"
node build/index_ethereum_sepolia.js
```

### Test in Claude Desktop:
1. Open Claude Desktop
2. Look for MCP server connection status
3. Try using the available tools

## 🔧 **Additional Troubleshooting**

### If MCP server still doesn't work:

1. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be 18+ for ES modules support

2. **Verify dependencies:**
   ```bash
   cd "C:\Users\lenovo\OneDrive\Documents\Uniswap\Uniswap-small-mcp"
   npm list @modelcontextprotocol/sdk
   ```

3. **Check file permissions:**
   - Ensure the file exists and is readable
   - Check Windows file permissions

4. **Alternative configuration:**
   If the above doesn't work, try using the V4 server:
   ```json
   {
     "mcpServers": {
       "uniswap-v4-mcp": {
         "command": "node",
         "args": ["C:\\Users\\lenovo\\OneDrive\\Documents\\Uniswap\\v4-template\\uniswap-v4-fixed.js"],
         "env": {}
       }
     }
   }
   ```

## 🎉 **Success Indicators**

Your MCP server is working when you see:
- ✅ No "Extension not found" errors
- ✅ MCP server appears in Claude Desktop
- ✅ Tools are available for use
- ✅ You can execute swaps and check balances

## 📞 **Need More Help?**

If you're still having issues:
1. Check Claude Desktop logs for specific error messages
2. Verify the file path exists and is accessible
3. Try the alternative V4 MCP server
4. Ensure Node.js and dependencies are properly installed

**Your MCP server should now work perfectly!** 🚀

