# VANA NFT Marketplace & Launchpad Platform

## Overview

This repository contains a comprehensive NFT ecosystem built on the VANA blockchain, featuring a Launchpad for new NFT collections and a Marketplace for trading. The platform leverages VANA's efficient blockchain infrastructure to provide a seamless experience for creators, collectors, and traders.

## Architecture

The project consists of two main components:

### 1. Smart Contracts

Three primary smart contracts power the platform:

- **VanaNFTCollection.sol**: Base contract for creating NFT collections on VANA blockchain
- **SericaNFTCollection.sol**: Extended NFT collection contract with advanced minting features
- **VanaMarketplace.sol**: Marketplace contract for listing, buying, and selling NFTs

### 2. Frontend Application

A Next.js application providing a user-friendly interface for:

- Browsing and minting NFTs from collections
- Managing collection launches with stages (whitelist, public)
- Trading NFTs in the marketplace
- Wallet integration and transaction management

## Key Features

### Smart Contract Capabilities

#### VanaNFTCollection

- ERC-721 standard implementation
- Role-based access control
- Metadata management
- Customizable base URI
- Ownership transferability

#### SericaNFTCollection

- Multi-stage minting (whitelist, public)
- Group-based access control
- Dynamic pricing in VANA tokens
- Mint quantity restrictions
- Pausable functionality

#### VanaMarketplace

- Fixed price listings
- Auction support
- Royalty distribution
- Fee management
- Secure transaction handling
- Batch operations for collections

### Frontend Features

- Responsive design for all devices
- Real-time VANA token price integration
- Wallet connection (Metamask & other providers)
- Collection status management (UPCOMING, LIVE, ENDED)
- NFT metadata display and management
- Whitelist verification

## Technical Highlights

- **Security**: Reentrancy protection, access control, and input validation
- **Efficiency**: Optimized gas usage for all contract operations
- **Scalability**: Architecture designed to handle large collections and high transaction volumes
- **Interoperability**: Standard compliance ensuring compatibility with external platforms

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
cd frontend
npm run dev

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy contracts
npx hardhat run scripts/deploy.ts --network vana
```

## Deployment Information

- **Network**: VANA Blockchain
- **ChainID**: 14800
- **RPC URL**: https://rpc.moksha.vana.org

## Future Roadmap

- NFT staking mechanism
- Airdrop distribution system
- Enhanced analytics dashboard
- Multi-chain support
- Mobile application

## Security Considerations

This project implements best practices for blockchain security:

- Comprehensive access control
- Input validation throughout the codebase
- Economic attack vector mitigation
- Regular security audits
- Pausable functions for emergency response

## License

MIT License

## Contact


[![linkedin](https://img.shields.io/badge/Linkedin-000000?style=for-the-badge&logo=Linkedin&logoColor=white)](https://www.linkedin.com/in/oğuzhan-gümüş-755739197/)
[![Twitter](https://img.shields.io/badge/Twitter-000000?style=for-the-badge&logo=Twitter&logoColor=white)](https://twitter.com/ozziecrypt)
[![Github](https://img.shields.io/badge/Github-000000?style=for-the-badge&logo=Github&logoColor=white)](https://github.com/oguzhaangumuss)
[![Email](https://img.shields.io/badge/email-000000?style=for-the-badge&logo=email&logoColor=white)](oguzhaangumuss@gmail.com) 




For technical inquiries about this project, please contact the development team at [contact information].
