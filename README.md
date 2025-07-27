# Time-Locked Vault NFT

This Solidity project allows users to deposit ETH with a lock period, where each deposit is represented by a unique NFT (ERC-721). Once the unlock time is reached, the NFT owner can withdraw the locked funds.

## Stack

- Solidity ^0.8.30
- Hardhat
- OpenZeppelin Contracts v4.9.3
- Ethers.js & Chai (for tests)

---

## Features

- **Time-Locked ETH Deposits** — each deposit is locked for a specific duration
- **ERC-721 NFT** — deposit certificate is minted to user as proof of ownership
- **Role-based Access** — only users with correct roles can deposit/withdraw
- **Complete Unit Test Coverage** — core logic is fully tested

---

## Contracts

| Contract               | Description                                     |
|------------------------|-------------------------------------------------|
| `TimeLockedVault.sol`  | Accepts deposits, locks funds, allows withdraw |
| `TimeLockedDepositNFT.sol` | Mints NFTs representing each deposit     |

---

## Deployment (Local)

```bash
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```
## Run Tests

```bash
npx hardhat test
```
Covers:
- Deposit flow
- NFT minting
- Withdraw after unlock
- Role restrictions
- Reentrancy protection

## Folder Structure

```bash
contracts/
├── TimeLockedVault.sol
├── TimeLockedDepositNFT.sol

scripts/
└── deploy.js

test/
└── TimeLockedVault.test.js
```

## License
MIT
Developed by MariiaFi
