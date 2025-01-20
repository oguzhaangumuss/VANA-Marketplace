import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import "solidity-coverage";

declare module "hardhat/config" {
  interface HardhatUserConfig {
    coverage?: {
      exclude?: string[];
    };
  }
}

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "paris"
    }
  },
  networks: {
    hardhat: {},
    vana_testnet: {
      url: process.env.VANA_TESTNET_RPC || "https://rpc.moksha.vana.org",
      accounts: [process.env.PRIVATE_KEY || ""]
    },
    vana_mainnet: {
      url: process.env.VANA_MAINNET_RPC || "",
      accounts: [process.env.PRIVATE_KEY || ""]
    }
  },
  etherscan: {
    apiKey: {
      vana_testnet: "any"
    },
    customChains: [
      {
        network: "vana_testnet",
        chainId: 14800,
        urls: {
          apiURL: "https://moksha.vanascan.io",
          browserURL: "https://moksha.vanascan.io"
        }
      }
    ]
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },
  coverage: {
    exclude: ["contracts/mocks", "contracts/test"]
  }
};

export default config;