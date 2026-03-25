require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {

  solidity: "0.8.28",

  networks: {
    // Local Ganache (for local development)
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0x7749cc0af440d181ea36bc14373167afe5722c073687b701e7a905d0fee94cd0"],
      chainId: 1337,
    },

    // Sepolia Testnet (public test network)
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 11155111,
    },
  },
};
