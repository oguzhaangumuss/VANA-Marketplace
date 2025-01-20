import fs from 'fs';
import path from 'path';

async function main() {
    // Collection metadata
    const collectionMetadata = {
        name: "Serica NFT Collection",
        description: "Serica is a nft collection on Vana",
        image: "https://ipfs.io/ipfs/bafybeibdxmgjkhbh7h5nmkufb2huwhrttti6ygtp77i5rst7h42ifuap2e/images/preview.png",
        external_link: "https://serica.xyz",
        seller_fee_basis_points: 500, // 5%
        fee_recipient: "0x..."  // royalty address
    };

    // Collection metadata'sını kaydet
    const collectionPath = path.join(__dirname, '../frontend/public/collections/nft/metadata/collection.json');
    fs.writeFileSync(collectionPath, JSON.stringify(collectionMetadata, null, 2));
    console.log("Generated collection metadata");

    // IPFS'e yüklemek için metadata klasörünü hazırla
    const ipfsPath = path.join(__dirname, '../frontend/public/collections/nft/ipfs');
    if (!fs.existsSync(ipfsPath)) {
        fs.mkdirSync(ipfsPath, { recursive: true });
    }
    fs.copyFileSync(collectionPath, path.join(ipfsPath, 'collection.json'));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 