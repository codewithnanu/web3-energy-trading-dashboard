// PURPOSE: Deploys all 4 contracts to Ganache in the correct order
// Order matters because:
//   MemberRegistry needs SocietyRegistry address
//   EnergyListing  needs SocietyRegistry address
//   EnergyTrade    needs all 3 addresses
//
// Run this script with:
//   npx hardhat run scripts/deploy.js --network ganache

async function main() {

  // ethers is injected by hardhat-toolbox automatically
  // getSigners() returns the accounts from hardhat.config.js
  // We use the first account (Account 0 from Ganache) as the deployer
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("─────────────────────────────────────────");

  // ─── STEP 1: Deploy SocietyRegistry ───
  // getContractFactory gets the compiled contract ready to deploy
  // deploy() sends it to the blockchain and returns a contract object
  // waitForDeployment() waits until blockchain confirms it is deployed
  console.log("Deploying SocietyRegistry...");
  const SocietyRegistry = await ethers.getContractFactory("SocietyRegistry");
  const societyRegistry = await SocietyRegistry.deploy();
  await societyRegistry.waitForDeployment();

  // target is the blockchain address where this contract now lives
  // Like a URL for the contract — we need it to deploy the next contracts
  const societyRegistryAddress = await societyRegistry.getAddress();
  console.log("SocietyRegistry deployed to:", societyRegistryAddress);

  // ─── STEP 2: Deploy MemberRegistry ───
  // We pass societyRegistryAddress so MemberRegistry knows where to find SocietyRegistry
  console.log("Deploying MemberRegistry...");
  const MemberRegistry = await ethers.getContractFactory("MemberRegistry");
  const memberRegistry = await MemberRegistry.deploy(societyRegistryAddress);
  await memberRegistry.waitForDeployment();

  const memberRegistryAddress = await memberRegistry.getAddress();
  console.log("MemberRegistry deployed to:", memberRegistryAddress);

  // ─── STEP 3: Deploy EnergyListing ───
  console.log("Deploying EnergyListing...");
  const EnergyListing = await ethers.getContractFactory("EnergyListing");
  const energyListing = await EnergyListing.deploy(societyRegistryAddress);
  await energyListing.waitForDeployment();

  const energyListingAddress = await energyListing.getAddress();
  console.log("EnergyListing deployed to:", energyListingAddress);

  // ─── STEP 4: Deploy EnergyTrade ───
  // EnergyTrade needs all 3 addresses because it talks to all 3 contracts
  console.log("Deploying EnergyTrade...");
  const EnergyTrade = await ethers.getContractFactory("EnergyTrade");
  const energyTrade = await EnergyTrade.deploy(
    societyRegistryAddress,
    memberRegistryAddress,
    energyListingAddress
  );
  await energyTrade.waitForDeployment();

  const energyTradeAddress = await energyTrade.getAddress();
  console.log("EnergyTrade deployed to:", energyTradeAddress);

  // ─── PRINT SUMMARY ───
  // These addresses are what the React app needs to talk to the contracts
  // Copy these into the React app after deployment
  console.log("─────────────────────────────────────────");
  console.log("ALL CONTRACTS DEPLOYED SUCCESSFULLY");
  console.log("─────────────────────────────────────────");
  console.log("Copy these addresses into your React app:");
  console.log("");
  console.log("SOCIETY_REGISTRY_ADDRESS =", societyRegistryAddress);
  console.log("MEMBER_REGISTRY_ADDRESS  =", memberRegistryAddress);
  console.log("ENERGY_LISTING_ADDRESS   =", energyListingAddress);
  console.log("ENERGY_TRADE_ADDRESS     =", energyTradeAddress);
  console.log("─────────────────────────────────────────");
}

// Standard way to run an async function in Hardhat scripts
// If something goes wrong, it prints the error and exits
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
