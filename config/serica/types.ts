export interface NetworkConfig {
    royalty_wallet: string;
    creators: {
        [groupName: string]: string[];
    };
}

export interface Networks {
    hardhat: NetworkConfig;
    vana_testnet: NetworkConfig;
    vana_mainnet: NetworkConfig;
} 