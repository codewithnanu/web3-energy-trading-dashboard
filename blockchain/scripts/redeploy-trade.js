// Redeploys only EnergyTrade contract using existing deployed addresses
// Run: npx hardhat run scripts/redeploy-trade.js --network sepolia

const SOCIETY_REGISTRY = "0xb398f0FA455D66617Bd210F31CfF92e8DA20E9Be";
const MEMBER_REGISTRY  = "0x84Be6210b7D2D616424A2a4be7902E449ea05B3f";
const ENERGY_LISTING   = "0x1e067d22c14a5882aE4a0e5A226c8004f9973698";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  console.log("Deploying EnergyTrade...");
  const EnergyTrade = await ethers.getContractFactory("EnergyTrade");
  const energyTrade = await EnergyTrade.deploy(
    SOCIETY_REGISTRY,
    MEMBER_REGISTRY,
    ENERGY_LISTING
  );
  await energyTrade.waitForDeployment();

  const address = await energyTrade.getAddress();
  console.log("─────────────────────────────────────────");
  console.log("EnergyTrade deployed to:", address);
  console.log("Update ENERGY_TRADE in src/app/blockchain/config.js");
  console.log("─────────────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
