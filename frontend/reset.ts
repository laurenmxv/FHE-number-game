import { ethers } from "ethers";
import ABI from "./contract/BigNumberGameABI.json" assert { type: "json" };
import * as dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// 👑 Use the DEPLOYER's private key (the original owner of the contract)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

async function main() {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, wallet);

  const tx = await contract.resetGame();
  console.log("🔁 Sent reset tx:", tx.hash);
  await tx.wait();
  console.log("✅ Game has been reset!");
}

main().catch(console.error);
