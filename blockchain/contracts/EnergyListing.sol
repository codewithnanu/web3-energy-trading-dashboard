// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SocietyRegistry.sol";

// PURPOSE: Societies post surplus energy for sale here
// Two types of listings exist:
//   FOR_MEMBERS   → only members of THIS society can buy
//   FOR_SOCIETIES → only other registered societies can buy
// Full details (timeslot, description) stored on IPFS
// Critical numbers (kWh, price) stored on blockchain

contract EnergyListing {

    // ─── LISTING TYPE ───
    // enum is a fixed set of options — like a dropdown with only 2 choices
    // FOR_MEMBERS = 0, FOR_SOCIETIES = 1
    enum ListingType { FOR_MEMBERS, FOR_SOCIETIES }

    // ─── WHAT IS A LISTING ───
    // id            → unique listing ID
    // societyId     → who created this listing
    // societyWallet → wallet address of that society
    // availableKwh  → how much energy is left to buy
    // pricePerKwh   → price in Wei (1 ETH = 1,000,000,000,000,000,000 Wei)
    //                 Solidity cannot handle decimals so we use Wei
    // ipfsHash      → points to full listing details on IPFS
    // listingType   → FOR_MEMBERS or FOR_SOCIETIES
    // isActive      → false means cancelled or sold out
    // createdAt     → timestamp
    struct Listing {
        uint256     id;
        uint256     societyId;
        address     societyWallet;
        uint256     availableKwh;
        uint256     pricePerKwh;
        string      ipfsHash;
        ListingType listingType;
        bool        isActive;
        uint256     createdAt;
    }

    // ─── STORAGE ───
    SocietyRegistry public societyRegistry;

    uint256 public listingCount = 0;

    // listingById[1] gives full Listing struct for listing with ID 1
    mapping(uint256 => Listing) public listingById;

    // listingsBySociety[1] = [1, 3, 5] means society 1 created listings 1, 3 and 5
    // We store only IDs here, not full structs — more gas efficient
    mapping(uint256 => uint256[]) public listingsBySociety;

    // ─── EVENTS ───
    // React listens to these and updates the UI automatically

    event ListingCreated(
        uint256 indexed id,
        uint256 indexed societyId,
        uint256 availableKwh,
        uint256 pricePerKwh,
        string  ipfsHash,
        uint8   listingType,
        uint256 createdAt
    );

    event ListingCancelled(
        uint256 indexed id,
        uint256 indexed societyId
    );

    // Fired when someone buys from a listing and kWh is reduced
    event ListingUpdated(
        uint256 indexed id,
        uint256 remainingKwh
    );

    // ─── CONSTRUCTOR ───
    constructor(address _societyRegistryAddress) {
        societyRegistry = SocietyRegistry(_societyRegistryAddress);
    }

    // ─── FUNCTIONS ───

    // Called by society to post surplus energy for sale
    // listingType 0 = for members, 1 = for other societies
    function createListing(
        uint256     availableKwh,
        uint256     pricePerKwh,
        string memory ipfsHash,
        ListingType listingType
    ) external {

        require(societyRegistry.isSociety(msg.sender), "Only registered societies can list energy");
        require(availableKwh > 0, "Must list at least 1 kWh");
        require(pricePerKwh > 0, "Price must be greater than 0");

        listingCount++;

        uint256 societyId = societyRegistry.getSocietyIdByAddress(msg.sender);

        listingById[listingCount] = Listing({
            id:            listingCount,
            societyId:     societyId,
            societyWallet: msg.sender,
            availableKwh:  availableKwh,
            pricePerKwh:   pricePerKwh,
            ipfsHash:      ipfsHash,
            listingType:   listingType,
            isActive:      true,
            createdAt:     block.timestamp
        });

        listingsBySociety[societyId].push(listingCount);

        emit ListingCreated(
            listingCount,
            societyId,
            availableKwh,
            pricePerKwh,
            ipfsHash,
            uint8(listingType),
            block.timestamp
        );
    }

    // Called by society to remove their own listing
    // We do NOT delete data — blockchain is permanent
    // We just mark isActive = false so nobody can buy from it
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listingById[listingId];

        require(listing.isActive, "Listing is not active");

        // Only the society that created this listing can cancel it
        require(listing.societyWallet == msg.sender, "Only the listing society can cancel");

        listing.isActive = false;

        emit ListingCancelled(listingId, listing.societyId);
    }

    // Called by EnergyTrade contract after a successful purchase
    // Reduces available kWh and deactivates listing if fully sold
    // storage keyword means changes to this variable are saved to blockchain
    function reduceAvailableKwh(uint256 listingId, uint256 purchasedKwh) external {
        Listing storage listing = listingById[listingId];

        require(listing.isActive, "Listing is not active");
        require(listing.availableKwh >= purchasedKwh, "Not enough kWh available");

        listing.availableKwh -= purchasedKwh;

        if (listing.availableKwh == 0) {
            listing.isActive = false;
        }

        emit ListingUpdated(listingId, listing.availableKwh);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        require(listingId > 0 && listingId <= listingCount, "Listing does not exist");
        return listingById[listingId];
    }

    function getSocietyListingIds(uint256 societyId) external view returns (uint256[] memory) {
        return listingsBySociety[societyId];
    }

    // Called by members — shows only their society's active member listings
    // Two pass loop pattern: first count matches, then fill array
    // Solidity arrays need a fixed size so we count before creating
    function getActiveListingsForMembers(uint256 societyId) external view returns (Listing[] memory) {
        uint256[] memory ids = listingsBySociety[societyId];

        uint256 activeCount = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            Listing memory l = listingById[ids[i]];
            if (l.isActive && l.listingType == ListingType.FOR_MEMBERS) {
                activeCount++;
            }
        }

        Listing[] memory result = new Listing[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            Listing memory l = listingById[ids[i]];
            if (l.isActive && l.listingType == ListingType.FOR_MEMBERS) {
                result[index] = l;
                index++;
            }
        }

        return result;
    }

    // Called by societies — shows all active society-to-society listings across the platform
    function getActiveListingsForSocieties() external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            Listing memory l = listingById[i];
            if (l.isActive && l.listingType == ListingType.FOR_SOCIETIES) {
                activeCount++;
            }
        }

        Listing[] memory result = new Listing[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            Listing memory l = listingById[i];
            if (l.isActive && l.listingType == ListingType.FOR_SOCIETIES) {
                result[index] = l;
                index++;
            }
        }

        return result;
    }
}
