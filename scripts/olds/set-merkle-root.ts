import { ethers, network } from "hardhat";
import { loadDeployment } from "./utils";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

async function main() {
    // Load whitelist addresses from environment or file
    const whitelistAddresses = process.env.WHITELIST_ADDRESSES?.split(",") || [];
    if (whitelistAddresses.length === 0) {
        throw new Error("No whitelist addresses provided");
    }

    // Create merkle tree
    const leaves = whitelistAddresses.map(addr => keccak256(addr));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();

    // Load deployment info
    const deployment = await loadDeployment(network.name);
    console.log(`Updating merkle root on ${network.name}...`);

    // Get contract instance
    const nftCollection = await ethers.getContractAt(
        "VanaNFTCollection",
        deployment.nftCollection
    );

    // Update merkle root
    const tx = await nftCollection.setMerkleRoot(root);
    await tx.wait();

    console.log(`Merkle root updated to: ${root}`);
    console.log("Transaction hash:", tx.hash);

    // Save merkle tree info for frontend
    const treeInfo = {
        root,
        tree: tree.toString(),
        addresses: whitelistAddresses
    };

    console.log("Merkle tree info:", treeInfo);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 