#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";

// Network configuration for Unichain Sepolia
const NETWORK_CONFIG = {
  name: "Unichain Sepolia",
  chainId: 1301,
  rpcUrl: "https://sepolia.rpc.unichain.org",
  explorer: "https://sepolia.uniscan.xyz",
  contracts: {
    swapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
    quoter: "0xc694a4cf10e2e4f77b49c35c5e6ea1b0fde6f6e8",
    weth: "0x4200000000000000000000000000000000000006",
    usdc: "0xEea1BafFF6A3842ca8C9E86a82E7b26Fc81c8ECa",
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

    this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
    this.setupHandlers();
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
      const balance = await this.provider.getBalance(address);

      return {
        content: [
          {
            type: "text",
            text: `✅ Wallet connected successfully!\n\nAddress: ${address}\nBalance: ${ethers.formatEther(balance)} ETH\nNetwork: ${NETWORK_CONFIG.name}`,
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
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();

      return {
        content: [
          {
            type: "text",
            text: `🌐 Network Information\n\nNetwork: ${NETWORK_CONFIG.name}\nChain ID: ${NETWORK_CONFIG.chainId}\nRPC: ${NETWORK_CONFIG.rpcUrl}\nExplorer: ${NETWORK_CONFIG.explorer}\n\nCurrent Block: ${blockNumber.toLocaleString()}\nGas Price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A"} gwei\n\n📝 Key Contracts:\n• SwapRouter02: ${NETWORK_CONFIG.contracts.swapRouter}\n• QuoterV2: ${NETWORK_CONFIG.contracts.quoter}\n• WETH9: ${NETWORK_CONFIG.contracts.weth}\n• USDC: ${NETWORK_CONFIG.contracts.usdc}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get network info: ${error instanceof Error ? error.message : String(error)}`);
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
