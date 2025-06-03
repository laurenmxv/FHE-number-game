import { ethers } from "ethers";
import { cofhejs, Encryptable, FheTypes } from "cofhejs/node";
import ABI from "./contract/BigNumberGameABI.json" assert { type: "json" };
import * as dotenv from "dotenv";
import { BigNumberGame } from "../typechain-types/contracts/BigNumberGame.js";

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_2!, provider);

async function main() {
  console.log("🔐 Initializing cofhejs with ethers signer + provider");
  await cofhejs.initializeWithEthers({
    ethersProvider: provider,
    ethersSigner: wallet,
    environment: "TESTNET",
  });

  console.log("Initializing contract...");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, wallet) as BigNumberGame;

  const player2Number = 10;
  console.log("🧠 Encrypting number:", player2Number);

  const logState = (state) => {
    console.log(`Log Encrypt State :: ${state}`);
  };

  const results = await cofhejs.encrypt(logState, [Encryptable.uint32(player2Number)]);
  if (!results.success || !results.data?.[0]) throw new Error("Encryption failed");
  const encrypted = results.data?.[0];

  console.log("📨 Submitting encrypted input to contract:");
  const tx = await contract.submitNumber(encrypted);
  await tx.wait();

  console.log("Getting encrypted result...");
  const [winnerEncrypted, difference] = await contract.getEncryptedResult();

  // 🔐 Create permit with full Result-based error handling
  console.log("🔐 Creating permit");
  const permitResult = await cofhejs.createPermit({
    type: "self",
    issuer: wallet.address,
  });

  if (!permitResult.success) {
    console.error("❌ Permit creation failed:", permitResult.error);
    return;
  }

  const permit = permitResult.data!;

  console.log("🔓 Unsealing difference");
  const differenceResult = await cofhejs.unseal(
    difference,
    FheTypes.Uint32,
    permit.issuer,
    permit.getHash()
  );

  if (!differenceResult.success) {
    console.error("❌ Failed to unseal difference:", differenceResult.error);
    return;
  }

  console.log("🔓 Unsealing winnerEncrypted");
  const winnerResult = await cofhejs.unseal(
    winnerEncrypted,
    FheTypes.Uint32,
    permit.issuer,
    permit.getHash()
  );

  if (!winnerResult.success) {
    console.error("❌ Failed to unseal winnerEncrypted:", winnerResult.error);
    return;
  }

  // ✅ Safe to use unsealed values now
  const unsealedDifference = differenceResult.data;
  const unsealedWinner = winnerResult.data;

  console.log("📏 Decrypted difference:", unsealedDifference);
  console.log("🏆 Decrypted winner code:", unsealedWinner);

  // ✅ FHE-safe result interpretation — no if/else branching on encrypted values

  const winnerMessageMap = {
    0: "🤝 It's a tie.",
    1: "🎉 Player 1 wins!",
    2: "🎉 Player 2 wins!",
  } as const;

  type WinnerCode = 0 | 1 | 2;
  const winnerCode = Number(unsealedWinner) as WinnerCode;

  const message = winnerMessageMap[winnerCode] ?? "❓ Unknown result";
  console.log("📣", message);
}

main().catch(console.error);