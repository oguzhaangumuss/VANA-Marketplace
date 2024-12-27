import { useState } from 'react';
import { ethers } from 'ethers';
import { useVanaMarketplace } from '../hooks/useVanaMarketplace';

export function ListNFT() {
    const { contract, loading, error } = useVanaMarketplace();
    const [nftContract, setNftContract] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [price, setPrice] = useState('');
    const [listing, setListing] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!contract) return;

        try {
            setListing(true);
            await contract.listNFT(
                nftContract,
                Number(tokenId),
                ethers.parseEther(price)
            );
            // Success notification
        } catch (err) {
            // Error notification
            console.error(err);
        } finally {
            setListing(false);
        }
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <form onSubmit={handleSubmit}>
            <input
                value={nftContract}
                onChange={e => setNftContract(e.target.value)}
                placeholder="NFT Contract Address"
            />
            <input
                value={tokenId}
                onChange={e => setTokenId(e.target.value)}
                placeholder="Token ID"
                type="number"
            />
            <input
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Price in VANA"
                type="number"
                step="0.01"
            />
            <button type="submit" disabled={listing}>
                {listing ? 'Listing...' : 'List NFT'}
            </button>
        </form>
    );
} 