declare module 'merkletreejs' {
    export default class MerkleTree {
        constructor(leaves: Buffer[], hashFunction: Function, options?: { sortPairs: boolean });
        getHexRoot(): string;
        getRoot(): Buffer;
        getHexProof(leaf: Buffer): string[];
    }
} 