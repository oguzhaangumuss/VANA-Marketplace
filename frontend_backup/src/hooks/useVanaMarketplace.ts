import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { VanaMarketplace } from '../types/contracts';
import VanaMarketplaceABI from '../abi/VanaMarketplace.json';

export function useVanaMarketplace() {
    const [contract, setContract] = useState<VanaMarketplace | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function init() {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                
                const marketplace = new ethers.Contract(
                    process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS!,
                    VanaMarketplaceABI,
                    signer
                ) as VanaMarketplace;

                setContract(marketplace);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        }

        init();
    }, []);

    return { contract, loading, error };
} 