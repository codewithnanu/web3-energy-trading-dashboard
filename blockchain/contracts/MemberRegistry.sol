// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SocietyRegistry.sol";

// PURPOSE: Registers members and links each one to a society
// RULE: A member can only belong to ONE society
// RULE: That society must already be registered in SocietyRegistry
// RULE: A member cannot change their society after registering

contract MemberRegistry {

    // ─── WHAT IS A MEMBER ───
    // id            → unique number like a primary key
    // ipfsHash      → points to member details on IPFS
    // walletAddress → their Ethereum wallet
    // societyId     → which society they belong to
    // isRegistered  → quick true/false check
    // registeredAt  → when they joined
    struct Member {
        uint256 id;
        string  ipfsHash;
        address walletAddress;
        uint256 societyId;
        bool    isRegistered;
        uint256 registeredAt;
    }

    // ─── STORAGE ───

    // We store a reference to SocietyRegistry so we can call its functions
    // This is how contracts talk to each other on the blockchain
    SocietyRegistry public societyRegistry;

    uint256 public memberCount = 0;

    // memberById[1] gives full Member struct for member with ID 1
    mapping(uint256 => Member) public memberById;

    // memberIdByAddress[0xABC...] = 1
    // value 0 means this wallet is NOT a registered member
    mapping(address => uint256) public memberIdByAddress;

    // ─── EVENTS ───
    // React listens to MemberRegistered and updates UI when a new member joins
    event MemberRegistered(
        uint256 indexed id,
        address indexed wallet,
        uint256 indexed societyId,
        string  ipfsHash,
        uint256 registeredAt
    );

    // ─── CONSTRUCTOR ───
    // Runs ONCE when this contract is deployed
    // We pass the address of the already deployed SocietyRegistry
    // so this contract knows where to find it on the blockchain
    constructor(address _societyRegistryAddress) {
        societyRegistry = SocietyRegistry(_societyRegistryAddress);
    }

    // ─── FUNCTIONS ───

    // Called by member when signing up
    // ipfsHash  → IPFS hash of their details
    // societyId → the ID of the society they want to join
    function registerMember(string memory ipfsHash, uint256 societyId) external {

        require(memberIdByAddress[msg.sender] == 0, "Member already registered");

        // We call isSociety() from the imported SocietyRegistry contract
        // to verify the chosen society actually exists before registering
        require(
            societyRegistry.isSociety(getSocietyAddress(societyId)),
            "Society does not exist"
        );

        memberCount++;

        memberById[memberCount] = Member({
            id:            memberCount,
            ipfsHash:      ipfsHash,
            walletAddress: msg.sender,
            societyId:     societyId,
            isRegistered:  true,
            registeredAt:  block.timestamp
        });

        memberIdByAddress[msg.sender] = memberCount;

        emit MemberRegistered(memberCount, msg.sender, societyId, ipfsHash, block.timestamp);
    }

    function getMember(uint256 memberId) external view returns (Member memory) {
        require(memberId > 0 && memberId <= memberCount, "Member does not exist");
        return memberById[memberId];
    }

    // Used by EnergyTrade to verify the buyer is a registered member
    function isMember(address wallet) external view returns (bool) {
        return memberIdByAddress[wallet] != 0;
    }

    // Used by EnergyTrade to check: does this member belong to the society they are buying from?
    function getMemberSocietyId(address wallet) external view returns (uint256) {
        uint256 memberId = memberIdByAddress[wallet];
        require(memberId != 0, "Not a registered member");
        return memberById[memberId].societyId;
    }

    // internal means only this contract can call this function
    // Gets the wallet address of a society by ID so we can pass it to isSociety()
    function getSocietyAddress(uint256 societyId) internal view returns (address) {
        return societyRegistry.getSociety(societyId).walletAddress;
    }
}
