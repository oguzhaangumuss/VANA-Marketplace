import fs from 'fs';
import path from 'path';
import { run } from 'hardhat';

export async function saveDeploymentInfo(
  network: string, 
  info: Record<string, any>
) {
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filePath = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
}

export async function verifyContract(address: string, constructorArguments: any[]) {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
    });
  } catch (error) {
    console.log(`Verification failed: ${error}`);
  }
} 