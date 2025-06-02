 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract BigNumberGame {
    address public owner;
    address public player1;
    address public player2;

    // ⬇️ Store encrypted player inputs
    euint32 public number1;
    euint32 public number2;

    // ⬇️ Outputs: difference and encrypted winner ID
    euint32 public difference;
    euint32 public winnerEncrypted; // 0 = tie, 1 = player1 wins, 2 = player2 wins

    constructor() {
        owner = msg.sender;
    }

    function submitNumber(InEuint32 calldata encryptedInput) external {
        require(player1 == address(0) || player2 == address(0), "Game full");
        require(msg.sender != player1 && msg.sender != player2, "Already submitted");

        if (player1 == address(0)) {
            player1 = msg.sender;
            number1 = FHE.asEuint32(encryptedInput);
            FHE.allowThis(number1); // ✅ REQUIRED: grant contract access
        } else {
            player2 = msg.sender;
            number2 = FHE.asEuint32(encryptedInput);
            FHE.allowThis(number2);

            computeWinner();
        }
    }

    function computeWinner() internal {
        // ✅ Use FHE comparison (encrypted domain)
        ebool isP1Greater = FHE.gt(number1, number2);
        ebool isP2Greater = FHE.lt(number1, number2);

        // ✅ Difference is also calculated without leaking values
        difference = FHE.sub(FHE.max(number1, number2), FHE.min(number1, number2));

        // ✅ Constant-time selection with FHE.select()
        // winnerEncrypted = 1 if player1 wins, 2 if player2 wins, else 0 (tie)
        winnerEncrypted = FHE.select(
            isP1Greater,
            FHE.asEuint32(1),
            FHE.select(isP2Greater, FHE.asEuint32(2), FHE.asEuint32(0))
        );

        // ✅ Allow players to decrypt sealed output client-side via cofhejs
        FHE.allowSender(difference);
        FHE.allowSender(winnerEncrypted);
    }

    function getEncryptedResult() external view returns (euint32, euint32) {
        require(msg.sender == player1 || msg.sender == player2, "Not a player");

        // Encrypted winner and diff can be unsealed client-side using cofhejs
        return (winnerEncrypted, difference);
    }

    function resetGame() external {
        require(msg.sender == owner, "Only owner can reset");

        player1 = address(0);
        player2 = address(0);

        number1 = FHE.asEuint32(0);
        number2 = FHE.asEuint32(0);
        difference = FHE.asEuint32(0);
        winnerEncrypted = FHE.asEuint32(0);
    }
}
