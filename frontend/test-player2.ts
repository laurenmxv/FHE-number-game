import { ethers } from "ethers";
import { cofhejs, Encryptable, FheTypes } from "cofhejs/node";
import ABI from "./contract/BigNumberGameABI.json" assert { type: "json" };
import * as dotenv from "dotenv";

dotenv.config();

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_2!, provider);

async function main() {
  // 🔐 Initialize cofhejs with ethers signer + provider
  await cofhejs.initializeWithEthers({
    ethersProvider: provider,
    ethersSigner: wallet,
    environment: "TESTNET",
  });

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, wallet);

  // 🧠 Encrypt a number (e.g. 42)
  const encrypted = await cofhejs.encrypt(() => {}, [Encryptable.uint32(24n)]);
  const input = encrypted.data?.[0];
  if (!input) throw new Error("Encryption failed");
  

  // 📨 Submit encrypted input to contract
  const tx = await contract.submitNumber(input);
  console.log("Submitted encrypted number:", tx.hash);
  await tx.wait();

  const [winnerEncrypted, difference] = await contract.getEncryptedResult();

  // 🔐 Create permit with full Result-based error handling
  const permitResult = await cofhejs.createPermit({
    type: "self",
    issuer: wallet.address,
  });
  
  if (!permitResult.success) {
    console.error("❌ Permit creation failed:", permitResult.error);
    return;
  }
  
  const permit = permitResult.data!;
  
  // 🔓 Unseal difference
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
  
  // 🔓 Unseal winnerEncrypted
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
