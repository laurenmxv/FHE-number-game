import { ethers } from "hardhat";

async function main() {
  const Contract = await ethers.getContractFactory("BigNumberGame");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  console.log("BigNumberGame deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
