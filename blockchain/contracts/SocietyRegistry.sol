// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// PURPOSE: Registers societies on the blockchain
// A society must register here before they can list energy or trade
// All detailed info (name, location etc.) is stored on IPFS
// We only store the IPFS hash + critical data on blockchain

contract SocietyRegistry {

    // ─── WHAT IS A SOCIETY ───
    // id            → unique number like a primary key
    // ipfsHash      → points to full details stored on IPFS
    // walletAddress → their Ethereum wallet
    // isRegistered  → quick true/false check
    // registeredAt  → when they joined
    struct Society {
        uint256 id;
        string  ipfsHash;
        address walletAddress;
        bool    isRegistered;
        uint256 registeredAt;
    }

    // ─── STORAGE ───
    // societyCount tracks how many societies exist and generates unique IDs
    uint256 public societyCount = 0;

    // societyById[1] gives us the full Society struct for society with ID 1
    mapping(uint256 => Society) public societyById;

    // societyIdByAddress[0xABC...] = 1
    // value 0 means this address is NOT a registered society
    mapping(address => uint256) public societyIdByAddress;

    // ─── EVENTS ───
    // React listens to SocietyRegistered and updates the UI when a new society joins
    event SocietyRegistered(
        uint256 indexed id,
        address indexed wallet,
        string  ipfsHash,
        uint256 registeredAt
    );

    // ─── FUNCTIONS ───

    // Called by society when signing up
    // msg.sender is automatically the wallet address of whoever calls this
    // ipfsHash is the hash returned by IPFS after uploading society details
    function registerSociety(string memory ipfsHash) external {

        // require acts like a guard — if condition is false the whole transaction is cancelled
        require(societyIdByAddress[msg.sender] == 0, "Society already registered");

        societyCount++;

        societyById[societyCount] = Society({
            id:            societyCount,
            ipfsHash:      ipfsHash,
            walletAddress: msg.sender,
            isRegistered:  true,
            registeredAt:  block.timestamp
        });

        societyIdByAddress[msg.sender] = societyCount;

        emit SocietyRegistered(societyCount, msg.sender, ipfsHash, block.timestamp);
    }

    // view means read only — FREE to call, no gas fee
    function getSociety(uint256 societyId) external view returns (Society memory) {
        require(societyId > 0 && societyId <= societyCount, "Society does not exist");
        return societyById[societyId];
    }

    // Used by MemberRegistry and EnergyListing to verify a wallet is a society
    function isSociety(address wallet) external view returns (bool) {
        return societyIdByAddress[wallet] != 0;
    }

    // Used by EnergyListing to get societyId from wallet address
    function getSocietyIdByAddress(address wallet) external view returns (uint256) {
        return societyIdByAddress[wallet];
    }
}
