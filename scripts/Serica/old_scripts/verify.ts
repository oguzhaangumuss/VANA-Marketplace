import { run } from "hardhat";

async function main() {
    const IMPLEMENTATION_ADDRESS = "0xF0B183CF0fe7f601b6DC72bb86d4AE021C2f1E2a";
    
    console.log("Verifying implementation contract...");
    
    try {
        await run("verify:verify", {
            address: IMPLEMENTATION_ADDRESS,
            constructorArguments: []
        });
        console.log("Implementation contract verified!");
    } catch (error) {
        console.error("Verification failed:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 