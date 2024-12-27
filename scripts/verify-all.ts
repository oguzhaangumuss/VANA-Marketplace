import { run } from "hardhat";
import { readFileSync } from "fs";

async function main() {
    const network = process.env.HARDHAT_NETWORK || "localhost";
    const addresses = JSON.parse(
        readFileSync(`deployments/${network}.json`, "utf8")
    );

    // VanaToken verify
    await run("verify:verify", {
        address: addresses.VanaToken,
        constructorArguments: []
    });

    // VanaStaking verify
    await run("verify:verify", {
        address: addresses.VanaStaking,
        constructorArguments: []
    });

    // VanaAirdrop verify
    await run("verify:verify", {
        address: addresses.VanaAirdrop,
        constructorArguments: []
    });

    // VanaMarketplace verify
    await run("verify:verify", {
        address: addresses.VanaMarketplace,
        constructorArguments: []
    });

    console.log("All contracts verified successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 