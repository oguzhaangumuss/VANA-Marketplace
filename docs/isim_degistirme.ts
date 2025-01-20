const fs = require('fs');
const path = require('path');

const rootCID = '<root-CID>'; // Replace with your actual root CID
const metadataDir = path.join(__dirname, 'nft', 'metadata');

fs.readdir(metadataDir, (err, files) => {
  if (err) throw err;

  files.forEach(file => {
    const filePath = path.join(metadataDir, file);
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const imageName = path.basename(file, '.json') + '.png';
    metadata.image = `ipfs://${rootCID}/images/${imageName}`;

    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    console.log(`Updated ${file}`);
  });
});