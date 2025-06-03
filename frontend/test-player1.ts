import { ethers } from "ethers";
import { cofhejs, Encryptable } from "cofhejs/node";
import ABI from "./contract/BigNumberGameABI.json" assert { type: "json" };
import { BigNumberGame } from "../typechain-types/contracts/BigNumberGame.js";
import * as dotenv from "dotenv";
dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

async function main() {
  console.log("🔐 Initializing cofhejs with ethers signer + provider");
  await cofhejs.initializeWithEthers({
    ethersProvider: provider,
    ethersSigner: wallet,
    environment: "TESTNET",
  });

  console.log("Initializing contract...");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, wallet) as BigNumberGame;

  const player1Number = 42;
  console.log("🧠 Encrypting number:", player1Number);

  const logState = (state) => {
    console.log(`Log Encrypt State :: ${state}`);
  };

  const results = await cofhejs.encrypt(logState, [Encryptable.uint32(player1Number)]);
  if (!results.success || !results.data?.[0]) throw new Error("Encryption failed");
  const encrypted = results.data?.[0];

  console.log("📨 Submitting encrypted input to contract");
  const tx = await contract.submitNumber(encrypted);
  await tx.wait();

  console.log("✅ getting player1 and player2 values from contract");
  const p1 = await contract.player1();
  const p2 = await contract.player2();
  console.log("🔎 Contract state → player1:", p1, "| player2:", p2);
}

main().catch(console.error);
