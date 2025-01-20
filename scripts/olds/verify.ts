import { run } from "hardhat";

export async function verify(contractAddress: string, args: any[]) {
    console.log("Verifying contract...");
    console.log("Address:", contractAddress);
    console.log("Arguments:", args);

    try {
        // Try to verify the contract
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
            // Custom verify API settings for Vana
            apiEndpoint: process.env.VANA_VERIFY_API,
            apiKey: process.env.VANA_API_KEY,
            // Optional: Custom explorer URL
            explorerUrl: process.env.VANA_EXPLORER_URL
        });
        console.log("Contract verified successfully!");
    } catch (e: any) {
        // Handle common verification errors
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Contract is already verified!");
        } else if (e.message.toLowerCase().includes("not found")) {
            console.error("Contract not found. Please check the address and network.");
        } else if (e.message.toLowerCase().includes("api key")) {
            console.error("Invalid or missing API key. Please check your environment variables.");
        } else {
            console.error("Verification failed:", e);
        }
        throw e;
    }
} 