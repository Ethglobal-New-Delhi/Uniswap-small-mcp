#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";

// Network configuration for Ethereum Sepolia (more reliable)
const NETWORK_CONFIG = {
  name: "Ethereum Sepolia",
  chainId: 11155111,
  rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Public Infura endpoint
  fallbackRpcUrls: [
    "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    "https://rpc.sepolia.org",
    "https://sepolia.gateway.tenderly.co"
  ],
  explorer: "https://sepolia.etherscan.io",
  contracts: {
    // Uniswap V3 contracts on Ethereum Sepolia
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // WETH on Sepolia
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a25637902743", // USDC on Sepolia
  },
};

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

// Uniswap V3 Router ABI
const ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)",
];

// Quoter V2 ABI
const QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
];

class UniswapMCPServer {
  private server: Server;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "uniswap-sepolia",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize provider with better error handling
    this.provider = this.createProvider();
    this.setupHandlers();
  }

  private createProvider(): ethers.JsonRpcProvider {
    // Try to create provider with timeout and retry logic
    const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl, {
      name: NETWORK_CONFIG.name,
      chainId: NETWORK_CONFIG.chainId,
    }, {
      polling: false, // Disable polling to avoid connection issues
      staticNetwork: true
    });
    
    return provider;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "connect_wallet",
            description: "Connect a wallet using a private key",
            inputSchema: {
              type: "object",
              properties: {
                privateKey: {
                  type: "string",
                  description: "Private key for wallet connection",
                },
              },
              required: ["privateKey"],
            },
          },
          {
            name: "get_balance",
            description: "Get token balance for an address",
            inputSchema: {
              type: "object",
              properties: {
                address: {
                  type: "string",
                  description: "Wallet address to check balance for",
                },
                tokenAddress: {
                  type: "string",
                  description: "Token contract address or 'ETH' for native ETH",
                },
              },
              required: ["address", "tokenAddress"],
            },
          },
          {
            name: "get_quote",
            description: "Get a price quote for swapping tokens",
            inputSchema: {
              type: "object",
              properties: {
                tokenIn: {
                  type: "string",
                  description: "Input token contract address",
                },
                tokenOut: {
                  type: "string",
                  description: "Output token contract address",
                },
                amountIn: {
                  type: "string",
                  description: "Amount to swap (in wei or token units)",
                },
                fee: {
                  type: "number",
                  description: "Pool fee tier (500, 3000, or 10000)",
                  default: 3000,
                },
              },
              required: ["tokenIn", "tokenOut", "amountIn"],
            },
          },
          {
            name: "execute_swap",
            description: "Execute a token swap on Uniswap",
            inputSchema: {
              type: "object",
              properties: {
                tokenIn: {
                  type: "string",
                  description: "Input token contract address",
                },
                tokenOut: {
                  type: "string",
                  description: "Output token contract address",
                },
                amountIn: {
                  type: "string",
                  description: "Amount to swap (in wei or token units)",
                },
                minAmountOut: {
                  type: "string",
                  description: "Minimum acceptable output amount",
                },
                fee: {
                  type: "number",
                  description: "Pool fee tier (500, 3000, or 10000)",
                  default: 3000,
                },
                slippagePercent: {
                  type: "number",
                  description: "Slippage tolerance percentage (e.g., 1 for 1%)",
                  default: 1,
                },
              },
              required: ["tokenIn", "tokenOut", "amountIn", "minAmountOut"],
            },
          },
          {
            name: "approve_token",
            description: "Approve token spending for Uniswap router",
            inputSchema: {
              type: "object",
              properties: {
                tokenAddress: {
                  type: "string",
                  description: "Token contract address to approve",
                },
                amount: {
                  type: "string",
                  description: "Amount to approve ('max' for unlimited)",
                  default: "max",
                },
              },
              required: ["tokenAddress"],
            },
          },
          {
            name: "get_network_info",
            description: "Get current network information and configuration",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new Error("No arguments provided");
      }

      try {
        switch (name) {
          case "connect_wallet":
            return await this.connectWallet(args.privateKey as string);

          case "get_balance":
            return await this.getBalance(args.address as string, args.tokenAddress as string);

          case "get_quote":
            return await this.getQuote(
              args.tokenIn as string,
              args.tokenOut as string,
              args.amountIn as string,
              (args.fee as number) || 3000
            );

          case "execute_swap":
            return await this.executeSwap(
              args.tokenIn as string,
              args.tokenOut as string,
              args.amountIn as string,
              args.minAmountOut as string,
              (args.fee as number) || 3000,
              (args.slippagePercent as number) || 1
            );

          case "approve_token":
            return await this.approveToken(args.tokenAddress as string, (args.amount as string) || "max");

          case "get_network_info":
            return await this.getNetworkInfo();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async connectWallet(privateKey: string) {
    try {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const address = await this.wallet.getAddress();
      
      // Try to get balance with timeout
      let balance;
      try {
        balance = await Promise.race([
          this.provider.getBalance(address),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Balance check timeout')), 10000)
          )
        ]) as bigint;
      } catch (balanceError) {
        // If balance check fails, still allow wallet connection
        balance = 0n;
      }

      return {
        content: [
          {
            type: "text",
            text: `✅ Wallet connected successfully!\n\nAddress: ${address}\nBalance: ${ethers.formatEther(balance)} ETH\nNetwork: ${NETWORK_CONFIG.name}\n\nNote: Balance check may be limited due to RPC connectivity issues.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getBalance(address: string, tokenAddress: string) {
    try {
      if (tokenAddress.toLowerCase() === "eth") {
        const balance = await this.provider.getBalance(address);
        return {
          content: [
            {
              type: "text",
              text: `ETH Balance: ${ethers.formatEther(balance)} ETH`,
            },
          ],
        };
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const [balance, decimals, symbol] = await Promise.all([
        tokenContract.balanceOf(address),
        tokenContract.decimals(),
        tokenContract.symbol(),
      ]);

      const formattedBalance = ethers.formatUnits(balance, decimals);
      return {
        content: [
          {
            type: "text",
            text: `${symbol} Balance: ${formattedBalance} ${symbol}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getQuote(tokenIn: string, tokenOut: string, amountIn: string, fee: number) {
    try {
      const quoterContract = new ethers.Contract(NETWORK_CONFIG.contracts.quoter, QUOTER_ABI, this.provider);
      
      // Convert amount to wei if needed
      let amountInWei: bigint;
      if (tokenIn.toLowerCase() === NETWORK_CONFIG.contracts.weth.toLowerCase()) {
        amountInWei = ethers.parseEther(amountIn);
      } else {
        const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, this.provider);
        const decimals = await tokenContract.decimals();
        amountInWei = ethers.parseUnits(amountIn, decimals);
      }

      const quote = await quoterContract.quoteExactInputSingle.staticCall(
        tokenIn,
        tokenOut,
        fee,
        amountInWei,
        0
      );

      // Convert output to readable format
      let formattedOutput: string;
      if (tokenOut.toLowerCase() === NETWORK_CONFIG.contracts.weth.toLowerCase()) {
        formattedOutput = ethers.formatEther(quote.amountOut);
      } else {
        const tokenContract = new ethers.Contract(tokenOut, ERC20_ABI, this.provider);
        const decimals = await tokenContract.decimals();
        formattedOutput = ethers.formatUnits(quote.amountOut, decimals);
      }

      return {
        content: [
          {
            type: "text",
            text: `📊 Swap Quote\n\nInput: ${amountIn}\nOutput: ${formattedOutput}\nFee Tier: ${fee / 10000}%\nGas Estimate: ${quote.gasEstimate}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    minAmountOut: string,
    fee: number,
    slippagePercent: number
  ) {
    if (!this.wallet) {
      throw new Error("Wallet not connected. Please connect wallet first.");
    }

    try {
      const routerContract = new ethers.Contract(NETWORK_CONFIG.contracts.swapRouter, ROUTER_ABI, this.wallet);
      
      // Convert amounts to wei
      let amountInWei: bigint;
      if (tokenIn.toLowerCase() === NETWORK_CONFIG.contracts.weth.toLowerCase()) {
        amountInWei = ethers.parseEther(amountIn);
      } else {
        const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, this.wallet);
        const decimals = await tokenContract.decimals();
        amountInWei = ethers.parseUnits(amountIn, decimals);
      }

      let minAmountOutWei: bigint;
      if (tokenOut.toLowerCase() === NETWORK_CONFIG.contracts.weth.toLowerCase()) {
        minAmountOutWei = ethers.parseEther(minAmountOut);
      } else {
        const tokenContract = new ethers.Contract(tokenOut, ERC20_ABI, this.wallet);
        const decimals = await tokenContract.decimals();
        minAmountOutWei = ethers.parseUnits(minAmountOut, decimals);
      }

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
      const recipient = await this.wallet.getAddress();

      const swapParams = {
        tokenIn,
        tokenOut,
        fee,
        recipient,
        deadline,
        amountIn: amountInWei,
        amountOutMinimum: minAmountOutWei,
        sqrtPriceLimitX96: 0,
      };

      const tx = await routerContract.exactInputSingle(swapParams, {
        value: tokenIn.toLowerCase() === NETWORK_CONFIG.contracts.weth.toLowerCase() ? amountInWei : 0,
      });

      const receipt = await tx.wait();

      return {
        content: [
          {
            type: "text",
            text: `✅ Swap Successful!\n\nTransaction Hash: ${tx.hash}\nExplorer: ${NETWORK_CONFIG.explorer}/tx/${tx.hash}\n\nSwapped ${amountIn} → ${minAmountOut} (minimum)`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async approveToken(tokenAddress: string, amount: string) {
    if (!this.wallet) {
      throw new Error("Wallet not connected. Please connect wallet first.");
    }

    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
      
      let approveAmount: bigint;
      if (amount === "max") {
        approveAmount = ethers.MaxUint256;
      } else {
        const decimals = await tokenContract.decimals();
        approveAmount = ethers.parseUnits(amount, decimals);
      }

      const tx = await tokenContract.approve(NETWORK_CONFIG.contracts.swapRouter, approveAmount);
      const receipt = await tx.wait();

      return {
        content: [
          {
            type: "text",
            text: `✅ Approval Successful!\n\nToken: ${tokenAddress}\nSpender: ${NETWORK_CONFIG.contracts.swapRouter}\nAmount: ${amount === "max" ? "Unlimited" : amount}\nTransaction: ${NETWORK_CONFIG.explorer}/tx/${tx.hash}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to approve token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getNetworkInfo() {
    try {
      let blockNumber = "N/A";
      let gasPrice = "N/A";
      
      // Try to get network data with timeout
      try {
        const networkData = await Promise.race([
          Promise.all([
            this.provider.getBlockNumber(),
            this.provider.getFeeData()
          ]),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network data timeout')), 15000)
          )
        ]) as [number, any];
        
        blockNumber = networkData[0].toLocaleString();
        gasPrice = networkData[1].gasPrice ? ethers.formatUnits(networkData[1].gasPrice, "gwei") : "N/A";
      } catch (networkError) {
        // If network calls fail, show static info
        console.error("Network data unavailable:", networkError);
      }

      return {
        content: [
          {
            type: "text",
            text: `🌐 Network Information\n\nNetwork: ${NETWORK_CONFIG.name}\nChain ID: ${NETWORK_CONFIG.chainId}\nRPC: ${NETWORK_CONFIG.rpcUrl}\nExplorer: ${NETWORK_CONFIG.explorer}\n\nCurrent Block: ${blockNumber}\nGas Price: ${gasPrice} gwei\n\n📝 Key Contracts:\n• SwapRouter02: ${NETWORK_CONFIG.contracts.swapRouter}\n• QuoterV2: ${NETWORK_CONFIG.contracts.quoter}\n• WETH9: ${NETWORK_CONFIG.contracts.weth}\n• USDC: ${NETWORK_CONFIG.contracts.usdc}\n\n⚠️ Note: RPC connectivity may be limited. Some features may not work properly.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `🌐 Network Information (Limited)\n\nNetwork: ${NETWORK_CONFIG.name}\nChain ID: ${NETWORK_CONFIG.chainId}\nRPC: ${NETWORK_CONFIG.rpcUrl}\nExplorer: ${NETWORK_CONFIG.explorer}\n\n⚠️ RPC Connection Failed: ${error instanceof Error ? error.message : String(error)}\n\n📝 Key Contracts:\n• SwapRouter02: ${NETWORK_CONFIG.contracts.swapRouter}\n• QuoterV2: ${NETWORK_CONFIG.contracts.quoter}\n• WETH9: ${NETWORK_CONFIG.contracts.weth}\n• USDC: ${NETWORK_CONFIG.contracts.usdc}\n\nNote: Some features may not work due to RPC connectivity issues.`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Uniswap MCP Server running on stdio");
  }
}

// Start the server
const server = new UniswapMCPServer();
server.run().catch(console.error);
