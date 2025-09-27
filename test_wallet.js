#!/usr/bin/env node

// Test script to verify wallet connection
import { ethers } from "ethers";

const testConfig = {
  privateKey: "0xa6befcc3564adf3659d0f7e6f871d374b79e29874ac4775c13790867ba64ba10",
  rpcUrl: "https://sepolia.rpc.unichain.org",
  chainId: 1301
};

console.log("Testing wallet connection...\n");

try {
  // Create provider with timeout
  const provider = new ethers.JsonRpcProvider(testConfig.rpcUrl, {
    name: "Unichain Sepolia",
    chainId: testConfig.chainId,
  }, {
    polling: false,
    staticNetwork: true
  });

  // Create wallet
  const wallet = new ethers.Wallet(testConfig.privateKey, provider);
  const address = await wallet.getAddress();
  
  console.log("✅ Wallet created successfully!");
  console.log(`Address: ${address}`);
  
  // Try to get balance with timeout
  try {
    const balance = await Promise.race([
      provider.getBalance(address),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);
    
    console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  } catch (balanceError) {
    console.log("⚠️ Balance check failed (RPC issue):", balanceError.message);
  }
  
  // Try to get network info
  try {
    const network = await provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  } catch (networkError) {
    console.log("⚠️ Network info failed (RPC issue):", networkError.message);
  }
  
} catch (error) {
  console.error("❌ Error:", error.message);
}
