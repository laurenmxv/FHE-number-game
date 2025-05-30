# 🔐 BigNumberGame — FHE-Powered Encrypted Game on Sepolia

BigNumberGame is a fully homomorphic encryption (FHE)-powered smart contract where **two players each submit a private number**, and the contract determines:
- Who submitted the bigger number (without ever revealing it onchain)
- The encrypted difference between the two numbers
- A sealed result that only the players can decrypt client-side

Built with [Fhenix CoFHE](https://docs.fhenix.zone), this game keeps all logic private using encrypted types (`euint32`) and runs on Sepolia testnet.

---

## 🛠️ Features

- 🔐 Encrypted number submission using `cofhejs`
- 🧠 Fully private comparison & result using `FHE.select()` and `FHE.gt()`
- 🧾 Encrypted outputs sealed for each player
- 👀 Client-side unsealing and winner display using `cofhejs.unseal()`
- 🔁 Supports multiple rounds with `resetGame()`

---

## 🧑‍💻 Setup & Installation

1. **Clone the repo**

```bash
git clone https://github.com/your-username/big-number-game.git
cd big-number-game
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

```bash
PRIVATE_KEY_1=0x...     # Player 1 wallet private key (also owner)
PRIVATE_KEY_2=0x...     # Player 2 wallet private key
CONTRACT_ADDRESS=0x...  # Your deployed BigNumberGame contract address
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key

```
4. **Deploy the contract**

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

5. **Run the game**

```bash
pnpm tsx frontend/test-player1.ts

pnpm tsx frontend/test-player2.ts

```
6. **Reset the game**

```bash
pnpm tsx frontend/reset.ts
```



Built with 🔐 + ❤️ using Fhenix CoFHE