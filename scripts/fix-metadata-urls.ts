import fs from 'fs';
import path from 'path';

async function main() {
    const metadataDir = path.join(__dirname, '../frontend/public/collections/nft/metadata');
    const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
        const filePath = path.join(metadataDir, file);
        const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // URL'deki fazla ipfs/ kısmını kaldır
        metadata.image = metadata.image.replace('ipfs://ipfs/', 'ipfs://');

        // Dosyayı güncelle
        fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
        console.log(`Updated ${file}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    }); 