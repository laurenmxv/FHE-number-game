import { ethers } from "ethers";
import ABI from "./contract/BigNumberGameABI.json" assert { type: "json" };
import * as dotenv from "dotenv";
import { BigNumberGame } from "../typechain-types/contracts/BigNumberGame.js";
dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// 👑 Use the DEPLOYER's private key (the original owner of the contract)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_1!, provider);

async function main() {
  console.log("Initializing contract");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, wallet) as BigNumberGame;

  console.log("🔁 Sending reset tx");
  const tx = await contract.resetGame();
  await tx.wait();
  console.log("✅ Game has been reset! tx:", tx.hash);
}

main().catch(console.error);
