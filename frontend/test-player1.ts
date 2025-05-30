import { ethers } from "ethers";
import { cofhejs, Encryptable } from "cofhejs/node";
import ABI from "./contract/BigNumberGameABI.json" assert { type: "json" };
import * as dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

async function main() {
  await cofhejs.initializeWithEthers({
    ethersProvider: provider,
    ethersSigner: wallet,
    environment: "TESTNET",
  });

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, wallet);

  const encrypted = await cofhejs.encrypt(() => {}, [Encryptable.uint32(42n)]);
  const input = encrypted.data?.[0];
  if (!input) throw new Error("Encryption failed");

  const tx = await contract.submitNumber(input);
  console.log("✅ Player 1 submitted:", tx.hash);
  await tx.wait();

  const p1 = await contract.player1();
  const p2 = await contract.player2();
  console.log("🔎 Contract state → player1:", p1, "| player2:", p2);
}

main().catch(console.error);
