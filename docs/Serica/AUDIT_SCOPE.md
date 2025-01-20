# Audit Scope

## Core Functionality

1. NFT Minting

   - Single mint
   - Batch mint
   - Whitelist validation
   - Payment processing

2. Group Management

   - Group creation
   - Group updates
   - Time management
   - Supply management

3. Creator Management

   - Creator addition/removal
   - Payment distribution
   - Share calculations

4. Access Control

   - Role management
   - Function permissions
   - Upgrade control

5. Payment System
   - ETH handling
   - Creator payments
   - Royalty calculations
   - Withdrawal mechanisms

## Out of Scope

1. Frontend Integration
2. External API Calls
3. Metadata Storage
4. Off-chain Services

## Critical Areas

1. Payment Handling

   - Creator payment distribution
   - ETH transfers
   - Payment validation

2. Access Control

   - Role management
   - Admin functions
   - Upgrade authorization

3. Supply Management

   - Global limits
   - Group limits
   - Wallet limits

4. Upgrade Mechanism
   - Storage layout
   - Implementation verification
   - Access control

## Key Invariants

1. Supply Constraints

   - Total minted ≤ Max supply
   - Group minted ≤ Group max tokens
   - Wallet minted ≤ Mint per wallet limit

2. Payment Invariants

   - Payment received = Unit price × Quantity
   - Sum of creator shares = 100%
   - Royalty ≤ 10%

3. Time Constraints
   - Start time > Current time
   - End time > Start time (if set)

## Test Coverage Requirements

1. Core Functions: 100%
2. Access Control: 100%
3. Payment Logic: 100%
4. Error Conditions: >90%
5. Branch Coverage: >80%
