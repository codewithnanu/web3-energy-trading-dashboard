// PURPOSE: Central config file for all blockchain and IPFS settings
// Any time contracts are redeployed, update the addresses here only
// All other files import from here so nothing else needs to change

// ─── CONTRACT ADDRESSES ───
// These are the addresses printed when we ran deploy.js on Sepolia
// Each address is where that contract lives on Sepolia testnet
export const CONTRACT_ADDRESSES = {
  SOCIETY_REGISTRY: "0xb398f0FA455D66617Bd210F31CfF92e8DA20E9Be",
  MEMBER_REGISTRY:  "0x84Be6210b7D2D616424A2a4be7902E449ea05B3f",
  ENERGY_LISTING:   "0x1e067d22c14a5882aE4a0e5A226c8004f9973698",
  ENERGY_TRADE:     "0xd8e51E16386899B96D97B931D7730A11f8C64E59",
};

// ─── PINATA IPFS CONFIG ───
// JWT token is used to authenticate with Pinata when uploading data to IPFS
export const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1NGI2Zjk4Ny00NzQ4LTRlZmUtODczMi0yZmNiY2Y5ZjVjMTMiLCJlbWFpbCI6ImdhdXJhbmlzaGEwNTNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjMzMTMwZGVmZTQzYmY3MTRjOTIzIiwic2NvcGVkS2V5U2VjcmV0IjoiYmVlZmMxMzUxMjlhMzQ5MmI2MWFiZjllZTg1OTE3YjQ1MDUzNDRmYjBhNWFiYTQyYjY0MzVlOWYzYzg5Njg0OCIsImV4cCI6MTgwNTg4NTU1OH0.CHGyuOf-OPD1mRZpmmjzR2g-HK8Npx2os8AEp9oPIzk";

// ─── PINATA GATEWAY ───
// This is the URL used to READ files from IPFS
// Format: PINATA_GATEWAY + ipfsHash = full URL to the file
export const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

// ─── SEPOLIA NETWORK ───
// Sepolia testnet chain ID — MetaMask must be on this network
export const SEPOLIA_CHAIN_ID = 11155111;
