const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimeLockedVault", function () {
  let vault, nft;
  let owner, admin, user1, user2;

  beforeEach(async function () {
    [owner, admin, user1, user2] = await ethers.getSigners();

    // Deploy NFT contract
    const NFT = await ethers.getContractFactory("TimeLockedDepositNFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    // Deploy Vault and pass NFT address
    const Vault = await ethers.getContractFactory("TimeLockedVault");
    vault = await Vault.deploy(nft.target);
    await vault.waitForDeployment();

    // Transfer NFT ownership to vault
    await nft.transferOwnership(vault.target);

    // Grant roles
    await vault.connect(owner).setAccess(user1.address, 1); // User
    await vault.connect(owner).setAccess(admin.address, 2); // Admin
  });

  it("should mint NFT and lock ETH", async function () {
    const depositAmount = ethers.parseEther("1");
    const lockSeconds = 3;

    const tx = await vault.connect(user1).deposit(lockSeconds, {
      value: depositAmount,
    });
    await tx.wait();

    expect(await nft.balanceOf(user1.address)).to.equal(1);

    const depositData = await vault.getDeposit(0);
    expect(depositData.amount).to.equal(depositAmount);
    expect(depositData.withdrawn).to.equal(false);
  });

  it("should fail to withdraw before unlock time", async function () {
    await vault.connect(user1).deposit(5, { value: ethers.parseEther("0.5") });
    await expect(vault.connect(user1).withdraw(0)).to.be.revertedWithCustomError(
      vault,
      "TooEarly"
    );
  });

  it("should withdraw after unlock", async function () {
    const depositAmount = ethers.parseEther("1");
    await vault.connect(user1).deposit(1, { value: depositAmount });

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    const initialBalance = await ethers.provider.getBalance(user1.address);
    const tx = await vault.connect(user1).withdraw(0);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;

    const finalBalance = await ethers.provider.getBalance(user1.address);
    expect(finalBalance).to.be.closeTo(initialBalance + depositAmount - gasUsed, ethers.parseEther("0.01"));
  });

  it("should prevent double withdrawal", async function () {
    await vault.connect(user1).deposit(1, { value: ethers.parseEther("1") });

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    await vault.connect(user1).withdraw(0);
    await expect(vault.connect(user1).withdraw(0)).to.be.revertedWithCustomError(
      vault,
      "AlreadyClaimed"
    );
  });

  it("should reject deposit from non-user", async function () {
    await expect(
      vault.connect(user2).deposit(1, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWithCustomError(vault, "Unauthorized");
  });

  it("should allow admin to assign roles", async function () {
    await vault.connect(owner).setAccess(user2.address, 1);
    expect(await vault.permissions(user2.address)).to.equal(1);
  });
});
