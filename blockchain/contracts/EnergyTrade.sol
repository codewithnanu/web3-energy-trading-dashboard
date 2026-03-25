// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SocietyRegistry.sol";
import "./MemberRegistry.sol";
import "./EnergyListing.sol";

// PURPOSE: Handles all actual energy purchases on the platform
// This is the heart of the system — real ETH moves here
//
// TWO types of trades:
//   1. Member buys energy from their OWN society
//   2. Society buys energy from ANOTHER society
//
// HOW ETH MOVES:
//   Buyer sends ETH → contract receives it → contract forwards to seller
//   This is trustless — no human handles the money, contract does it automatically
//
// RULES enforced:
//   - Members can ONLY buy from their own society
//   - Societies can ONLY buy from society-type listings
//   - Buyer must send exact ETH amount
//   - Listing must be active and have enough kWh

contract EnergyTrade {

    // ─── WHAT IS A TRADE ───
    // Every completed purchase is recorded as a Trade permanently on blockchain
    // id            → unique trade ID
    // listingId     → which listing was bought from
    // buyerWallet   → who bought the energy
    // sellerWallet  → who sold the energy (society wallet)
    // sellerSocietyId → which society sold it
    // kWhPurchased  → how many kWh were bought
    // totalPaid     → total Wei paid
    // isMemberTrade → true = member bought from society, false = society bought from society
    // timestamp     → when the trade happened
    struct Trade {
        uint256 id;
        uint256 listingId;
        address buyerWallet;
        address sellerWallet;
        uint256 sellerSocietyId;
        uint256 kWhPurchased;
        uint256 totalPaid;
        bool    isMemberTrade;
        uint256 timestamp;
        string  ipfsHash;
    }

    // ─── STORAGE ───

    SocietyRegistry public societyRegistry;
    MemberRegistry  public memberRegistry;
    EnergyListing   public energyListing;

    uint256 public tradeCount = 0;

    // tradeById[1] gives full Trade struct for trade with ID 1
    mapping(uint256 => Trade) public tradeById;

    // tradesByWallet[0xABC...] = [1, 3, 5]
    // Stores all trade IDs for a wallet — used in My Transactions page
    mapping(address => uint256[]) public tradesByWallet;

    // tradesBySociety[1] = [1, 2, 4]
    // Stores all trade IDs for a society — used in Society dashboard
    mapping(uint256 => uint256[]) public tradesBySociety;

    // ─── EVENTS ───

    // Fired when a member buys energy from their society
    event MemberPurchase(
        uint256 indexed tradeId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 kWhPurchased,
        uint256 totalPaid,
        uint256 timestamp
    );

    // Fired when a society buys energy from another society
    event SocietyPurchase(
        uint256 indexed tradeId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 kWhPurchased,
        uint256 totalPaid,
        uint256 timestamp
    );

    // ─── CONSTRUCTOR ───
    // We pass addresses of all 3 already-deployed contracts
    // so EnergyTrade can talk to all of them
    constructor(
        address _societyRegistryAddress,
        address _memberRegistryAddress,
        address _energyListingAddress
    ) {
        societyRegistry = SocietyRegistry(_societyRegistryAddress);
        memberRegistry  = MemberRegistry(_memberRegistryAddress);
        energyListing   = EnergyListing(_energyListingAddress);
    }

    // ─── FUNCTIONS ───

    // memberBuyEnergy — called when a member wants to buy energy from their society
    //
    // listingId  → which listing they are buying from
    // kWh        → how many kWh they want to buy
    //
    // "payable" is a special keyword — it means this function can RECEIVE ETH
    // When member calls this they also send ETH along with the call
    // msg.value is the amount of ETH (in Wei) they sent
    function memberBuyEnergy(uint256 listingId, uint256 kWh, string memory ipfsHash) external payable {

        // ─── VALIDATIONS ───

        // Caller must be a registered member
        require(memberRegistry.isMember(msg.sender), "Not a registered member");

        // Get the listing details from EnergyListing contract
        EnergyListing.Listing memory listing = energyListing.getListing(listingId);

        // Listing must be active
        require(listing.isActive, "Listing is not active");

        // This listing must be of type FOR_MEMBERS (type 0)
        // Members cannot buy from society-to-society listings
        require(
            uint8(listing.listingType) == 0,
            "This listing is not available for members"
        );

        // Member must belong to the SAME society that created this listing
        // This enforces the core rule: members only buy from their own society
        uint256 memberSocietyId = memberRegistry.getMemberSocietyId(msg.sender);
        require(
            memberSocietyId == listing.societyId,
            "You can only buy from your own society"
        );

        // Enough kWh must be available in the listing
        require(listing.availableKwh >= kWh, "Not enough kWh available");

        // Calculate total cost: kWh × price per kWh
        uint256 totalCost = kWh * listing.pricePerKwh;

        // msg.value is the ETH the buyer sent with this transaction
        // It must exactly match the total cost — not more, not less
        require(msg.value == totalCost, "Incorrect ETH amount sent");

        // ─── EXECUTE TRADE ───

        // Tell EnergyListing to reduce the available kWh
        // This updates the listing on blockchain
        energyListing.reduceAvailableKwh(listingId, kWh);

        // Transfer the ETH from this contract to the society's wallet
        // call{value: amount}("") is the safe way to send ETH in Solidity
        // It returns (bool success, bytes data) — we check success
        (bool sent, ) = listing.societyWallet.call{value: msg.value}("");
        require(sent, "ETH transfer to society failed");

        // ─── RECORD TRADE ───

        tradeCount++;

        tradeById[tradeCount] = Trade({
            id:             tradeCount,
            listingId:      listingId,
            buyerWallet:    msg.sender,
            sellerWallet:   listing.societyWallet,
            sellerSocietyId: listing.societyId,
            kWhPurchased:   kWh,
            totalPaid:      msg.value,
            isMemberTrade:  true,
            timestamp:      block.timestamp,
            ipfsHash:       ipfsHash
        });

        // Add trade ID to buyer's history and society's history
        tradesByWallet[msg.sender].push(tradeCount);
        tradesBySociety[listing.societyId].push(tradeCount);

        emit MemberPurchase(
            tradeCount,
            listingId,
            msg.sender,
            listing.societyWallet,
            kWh,
            msg.value,
            block.timestamp
        );
    }

    // societyBuyEnergy — called when a society wants to buy energy from another society
    //
    // listingId → which listing they are buying from
    // kWh       → how many kWh they want to buy
    // payable   → this function receives ETH
    function societyBuyEnergy(uint256 listingId, uint256 kWh, string memory ipfsHash) external payable {

        // ─── VALIDATIONS ───

        // Caller must be a registered society
        require(societyRegistry.isSociety(msg.sender), "Not a registered society");

        EnergyListing.Listing memory listing = energyListing.getListing(listingId);

        require(listing.isActive, "Listing is not active");

        // This listing must be of type FOR_SOCIETIES (type 1)
        // Societies cannot buy from member listings
        require(
            uint8(listing.listingType) == 1,
            "This listing is not available for societies"
        );

        // A society cannot buy from their own listing
        // They must buy from a DIFFERENT society
        uint256 buyerSocietyId = societyRegistry.getSocietyIdByAddress(msg.sender);
        require(
            buyerSocietyId != listing.societyId,
            "Cannot buy from your own listing"
        );

        require(listing.availableKwh >= kWh, "Not enough kWh available");

        uint256 totalCost = kWh * listing.pricePerKwh;

        require(msg.value == totalCost, "Incorrect ETH amount sent");

        // ─── EXECUTE TRADE ───

        energyListing.reduceAvailableKwh(listingId, kWh);

        (bool sent, ) = listing.societyWallet.call{value: msg.value}("");
        require(sent, "ETH transfer to society failed");

        // ─── RECORD TRADE ───

        tradeCount++;

        tradeById[tradeCount] = Trade({
            id:              tradeCount,
            listingId:       listingId,
            buyerWallet:     msg.sender,
            sellerWallet:    listing.societyWallet,
            sellerSocietyId: listing.societyId,
            kWhPurchased:    kWh,
            totalPaid:       msg.value,
            isMemberTrade:   false,
            timestamp:       block.timestamp,
            ipfsHash:        ipfsHash
        });

        tradesByWallet[msg.sender].push(tradeCount);
        tradesBySociety[listing.societyId].push(tradeCount);
        tradesBySociety[buyerSocietyId].push(tradeCount);

        emit SocietyPurchase(
            tradeCount,
            listingId,
            msg.sender,
            listing.societyWallet,
            kWh,
            msg.value,
            block.timestamp
        );
    }

    // getMyTrades — returns all trade IDs for a wallet address
    // React calls this for My Transactions page
    // Then calls getTrade() for each ID to get full details
    function getMyTrades(address wallet) external view returns (uint256[] memory) {
        return tradesByWallet[wallet];
    }

    // getTrade — get full details of a single trade by ID
    function getTrade(uint256 tradeId) external view returns (Trade memory) {
        require(tradeId > 0 && tradeId <= tradeCount, "Trade does not exist");
        return tradeById[tradeId];
    }

    // getSocietyTrades — returns all trade IDs for a society
    // Used in Society dashboard to show all trades
    function getSocietyTrades(uint256 societyId) external view returns (uint256[] memory) {
        return tradesBySociety[societyId];
    }
}
