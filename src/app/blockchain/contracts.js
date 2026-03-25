// PURPOSE: Single file that connects React app to all smart contracts
// All blockchain interactions happen through this file
// React pages import functions from here instead of talking to contracts directly

import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "./config";

// Import ABIs — these tell ethers.js what functions each contract has
import SocietyRegistryABI from "./abis/SocietyRegistry.json";
import MemberRegistryABI  from "./abis/MemberRegistry.json";
import EnergyListingABI   from "./abis/EnergyListing.json";
import EnergyTradeABI     from "./abis/EnergyTrade.json";

// ─── GET PROVIDER AND SIGNER ───
// provider → reads data from blockchain (free, no MetaMask needed)
// signer   → writes data to blockchain (requires MetaMask confirmation)

// getProvider returns a read-only connection to Ganache via MetaMask
function getProvider() {
  // window.ethereum is injected by MetaMask into the browser
  return new ethers.BrowserProvider(window.ethereum);
}

// getSigner returns the connected MetaMask wallet
// Used for transactions that cost gas or send ETH
async function getSigner() {
  const provider = getProvider();
  return await provider.getSigner();
}

// ─── CONTRACT INSTANCES ───
// These functions return a contract object we can call functions on
// With signer  → can read AND write (used for transactions)
// With provider → can only read (used for fetching data)

async function getSocietyRegistryContract(withSigner = false) {
  const signerOrProvider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.SOCIETY_REGISTRY,
    SocietyRegistryABI.abi,
    signerOrProvider
  );
}

async function getMemberRegistryContract(withSigner = false) {
  const signerOrProvider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.MEMBER_REGISTRY,
    MemberRegistryABI.abi,
    signerOrProvider
  );
}

async function getEnergyListingContract(withSigner = false) {
  const signerOrProvider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ENERGY_LISTING,
    EnergyListingABI.abi,
    signerOrProvider
  );
}

async function getEnergyTradeContract(withSigner = false) {
  const signerOrProvider = withSigner ? await getSigner() : getProvider();
  return new ethers.Contract(
    CONTRACT_ADDRESSES.ENERGY_TRADE,
    EnergyTradeABI.abi,
    signerOrProvider
  );
}

// ─── METAMASK CONNECTION ───

// connectWallet — asks MetaMask to connect and returns the wallet address
// This is called when user clicks "Connect Wallet" button
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask.");
  }

  // eth_requestAccounts asks MetaMask to show the connection popup
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  return accounts[0];
}

// getWalletAddress — returns current connected wallet without popup
export async function getWalletAddress() {
  const signer = await getSigner();
  return await signer.getAddress();
}

// getETHBalance — returns ETH balance of a wallet address
export async function getETHBalance(address) {
  const provider = getProvider();
  const balance = await provider.getBalance(address);

  // formatEther converts Wei to ETH — e.g. 1000000000000000000 → "1.0"
  return ethers.formatEther(balance);
}

// ─── SOCIETY FUNCTIONS ───

// registerSociety — registers a society on blockchain
// ipfsHash: hash returned after uploading society details to IPFS
// gasLimit is set manually because Ganache's gas estimation sometimes fails
export async function registerSociety(ipfsHash) {
  const contract = await getSocietyRegistryContract(true);
  const tx = await contract.registerSociety(ipfsHash, { gasLimit: 500000 });

  // wait(1) waits for 1 block confirmation before returning
  await tx.wait(1);
  return tx;
}

// getSociety — fetch society details from blockchain by ID
export async function getSociety(societyId) {
  const contract = await getSocietyRegistryContract();
  return await contract.getSociety(societyId);
}

// isSociety — check if a wallet address is a registered society
export async function isSociety(address) {
  const contract = await getSocietyRegistryContract();
  return await contract.isSociety(address);
}

// getSocietyCount — get total number of registered societies
export async function getSocietyCount() {
  const contract = await getSocietyRegistryContract();
  return await contract.societyCount();
}

// getSocietyIdByAddress — get a society's ID from their wallet
export async function getSocietyIdByAddress(address) {
  const contract = await getSocietyRegistryContract();
  return await contract.getSocietyIdByAddress(address);
}

// ─── MEMBER FUNCTIONS ───

// registerMember — registers a member and links them to a society
// ipfsHash: hash of member details uploaded to IPFS
// societyId: which society they are joining
// gasLimit is set manually because Ganache's gas estimation sometimes fails
export async function registerMember(ipfsHash, societyId) {
  const contract = await getMemberRegistryContract(true);
  const tx = await contract.registerMember(ipfsHash, societyId, { gasLimit: 500000 });
  await tx.wait(1);
  return tx;
}

// isMember — check if a wallet is a registered member
export async function isMember(address) {
  const contract = await getMemberRegistryContract();
  return await contract.isMember(address);
}

// getMemberSocietyId — get which society a member belongs to
export async function getMemberSocietyId(address) {
  const contract = await getMemberRegistryContract();
  return await contract.getMemberSocietyId(address);
}

// ─── ENERGY LISTING FUNCTIONS ───

// createListing — society posts surplus energy for sale
// availableKwh: how many kWh to list
// pricePerKwh:  price in ETH string (we convert to Wei inside this function)
// ipfsHash:     IPFS hash of listing details
// listingType:  0 = for members, 1 = for societies
export async function createListing(availableKwh, pricePerKwh, ipfsHash, listingType) {
  const contract = await getEnergyListingContract(true);

  // parseEther converts ETH string to Wei — e.g. "0.04" → 40000000000000000
  // Solidity cannot handle decimals so we always work in Wei
  const priceInWei = ethers.parseEther(pricePerKwh.toString());

  const tx = await contract.createListing(availableKwh, priceInWei, ipfsHash, listingType, { gasLimit: 500000 });
  await tx.wait(1);
  return tx;
}

// cancelListing — society removes their listing
export async function cancelListing(listingId) {
  const contract = await getEnergyListingContract(true);
  const tx = await contract.cancelListing(listingId, { gasLimit: 200000 });
  await tx.wait(1);
  return tx;
}

// getListing — get full details of a single listing by ID
export async function getListing(listingId) {
  const contract = await getEnergyListingContract();
  return await contract.getListing(listingId);
}

// getSocietyListingIds — get all listing IDs created by a society
export async function getSocietyListingIds(societyId) {
  const contract = await getEnergyListingContract();
  return await contract.getSocietyListingIds(societyId);
}

// getActiveListingsForMembers — fetch all active listings for a society's members
export async function getActiveListingsForMembers(societyId) {
  const contract = await getEnergyListingContract();
  return await contract.getActiveListingsForMembers(societyId);
}

// getActiveListingsForSocieties — fetch all active society-to-society listings
export async function getActiveListingsForSocieties() {
  const contract = await getEnergyListingContract();
  return await contract.getActiveListingsForSocieties();
}

// ─── ENERGY TRADE FUNCTIONS ───

// memberBuyEnergy — member purchases energy from their society
// listingId:      which listing to buy from
// kWh:            how many kWh to buy
// pricePerKwhWei: price per kWh in Wei (BigInt from the listing, no floating point issues)
export async function memberBuyEnergy(listingId, kWh, pricePerKwhWei) {
  const contract = await getEnergyTradeContract(true);

  // Multiply kWh by price in Wei to get total cost in Wei
  // We use BigInt arithmetic to avoid floating point rounding errors
  const totalCostWei = BigInt(kWh) * BigInt(pricePerKwhWei.toString());

  // value: totalCostWei sends ETH along with the function call
  // This is the ETH that goes to the society
  const tx = await contract.memberBuyEnergy(listingId, kWh, { value: totalCostWei, gasLimit: 500000 });
  await tx.wait(1);
  return tx;
}

// societyBuyEnergy — society purchases energy from another society
// pricePerKwhWei: price per kWh in Wei (BigInt from the listing)
export async function societyBuyEnergy(listingId, kWh, pricePerKwhWei) {
  const contract = await getEnergyTradeContract(true);
  const totalCostWei = BigInt(kWh) * BigInt(pricePerKwhWei.toString());
  const tx = await contract.societyBuyEnergy(listingId, kWh, { value: totalCostWei, gasLimit: 500000 });
  await tx.wait(1);
  return tx;
}

// getMyTrades — get all trade IDs for the connected wallet
export async function getMyTrades(address) {
  const contract = await getEnergyTradeContract();
  return await contract.getMyTrades(address);
}

// getTrade — get full details of a single trade
export async function getTrade(tradeId) {
  const contract = await getEnergyTradeContract();
  return await contract.getTrade(tradeId);
}

// getSocietyTrades — get all trades for a society
export async function getSocietyTrades(societyId) {
  const contract = await getEnergyTradeContract();
  return await contract.getSocietyTrades(societyId);
}
