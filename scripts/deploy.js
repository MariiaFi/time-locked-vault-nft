const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy NFT contract first
  const NFT = await hre.ethers.getContractFactory("TimeLockedDepositNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("NFT deployed at:", nft.target);

  // Deploy Vault contract, passing NFT address to constructor
  const Vault = await hre.ethers.getContractFactory("TimeLockedVault");
  const vault = await Vault.deploy(nft.target);
  await vault.waitForDeployment();
  console.log("Vault deployed at:", vault.target);

  // Transfer NFT contract ownership to Vault
  const tx = await nft.transferOwnership(vault.target);
  await tx.wait();
  console.log("NFT ownership transferred to Vault.");
}

main().catch((error) => {
  console.error("Deploy failed:", error);
  process.exitCode = 1;
});
