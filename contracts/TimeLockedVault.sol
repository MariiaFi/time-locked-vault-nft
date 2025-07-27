// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ILockNFT {
    function mint(address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract TimeLockedVault is Ownable, ReentrancyGuard {
    enum AccessLevel {
        None,
        User,
        Admin
    }

    struct Deposit {
        uint256 amount;
        uint256 unlockAt;
        bool withdrawn;
    }

    ILockNFT public nft;
    uint256 public currentId;

    mapping(uint256 => Deposit) public deposits;
    mapping(address => AccessLevel) public permissions;

    event Deposited(address indexed user, uint256 indexed tokenId, uint256 amount, uint256 unlockAt);
    event Withdrawn(address indexed user, uint256 indexed tokenId, uint256 amount);
    event AccessGranted(address indexed user, AccessLevel level);

    error Unauthorized();
    error NotNFTOwner();
    error AlreadyClaimed();
    error TooEarly();
    error InvalidAmount();

    constructor(address _nft) {
        require(_nft != address(0), "NFT required");
        nft = ILockNFT(_nft);
        permissions[msg.sender] = AccessLevel.Admin;
    }

    modifier onlyAdmin() {
        if (permissions[msg.sender] != AccessLevel.Admin) revert Unauthorized();
        _;
    }

    modifier onlyUser() {
        if (permissions[msg.sender] != AccessLevel.User) revert Unauthorized();
        _;
    }

    function setAccess(address user, AccessLevel level) external onlyAdmin {
        permissions[user] = level;
        emit AccessGranted(user, level);
    }

    function deposit(uint256 lockDuration) external payable onlyUser returns (uint256 tokenId) {
        if (msg.value == 0) revert InvalidAmount();

        tokenId = currentId++;
        uint256 unlockTime = block.timestamp + lockDuration;

        deposits[tokenId] = Deposit({
            amount: msg.value,
            unlockAt: unlockTime,
            withdrawn: false
        });

        nft.mint(msg.sender, tokenId);
        emit Deposited(msg.sender, tokenId, msg.value, unlockTime);
    }

    function withdraw(uint256 tokenId) external nonReentrant onlyUser {
        if (nft.ownerOf(tokenId) != msg.sender) revert NotNFTOwner();

        Deposit storage d = deposits[tokenId];

        if (d.withdrawn) revert AlreadyClaimed();
        if (block.timestamp < d.unlockAt) revert TooEarly();

        d.withdrawn = true;

        (bool ok, ) = msg.sender.call{value: d.amount}("");
        require(ok, "ETH transfer failed");

        emit Withdrawn(msg.sender, tokenId, d.amount);
    }

    function getDeposit(uint256 tokenId) external view returns (Deposit memory) {
        return deposits[tokenId];
    }
}
