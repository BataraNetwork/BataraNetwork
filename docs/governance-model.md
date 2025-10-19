# Bataranetwork Governance Model

This document outlines the principles and processes of the on-chain governance system for the Bataranetwork.

## Overview

Bataranetwork employs an on-chain governance model that allows the community of token holders to propose, deliberate, and vote on changes to the protocol. This ensures that the evolution of the network is transparent, decentralized, and driven by its stakeholders.

## Key Principles

-   **Decentralization**: No single entity controls the network. Changes are proposed and ratified by a distributed community.
-   **Transparency**: All proposals and votes are recorded immutably on the blockchain, visible to everyone.
-   **Stake-based Power**: Voting power is proportional to the amount of tokens a participant holds or has staked (in this simulation, it's 1 address = 1 vote for simplicity).

## The Proposal Lifecycle

1.  **Proposal Submission**: Any user can submit a proposal by broadcasting a `GOVERNANCE_PROPOSAL` transaction. This requires a deposit to prevent spam (not yet implemented in the simulation). A proposal includes a title, a detailed description, and a defined voting period (specified by an end block height).

2.  **Voting Period**: Once a proposal is submitted, it enters the `ACTIVE` state. During this period, token holders can cast their votes (`yes`, `no`, or `abstain`) by submitting `GOVERNANCE_VOTE` transactions.

3.  **Tallying**: At the conclusion of the voting period (when the current block height exceeds the proposal's `endBlock`), the `GovernanceModule` automatically tallies the votes.

4.  **Outcome**:
    -   If the `yes` votes exceed the `no` votes (and quorum/threshold conditions are met, though not fully simulated), the proposal moves to the `PASSED` state.
    -   Otherwise, it moves to the `FAILED` state.

5.  **Execution**: Passed proposals are queued for execution. In a real system, this would involve an autonomous on-chain process that implements the proposed changes (e.g., updating a protocol parameter or releasing funds from a treasury).

## Types of Proposals

The governance system can be used to decide on various matters, including:

-   **Protocol Parameter Changes**: Adjusting variables like transaction fees, block rewards, or staking parameters.
-   **Software Upgrades**: Coordinating network-wide software updates.
-   **Community Treasury Allocations**: Funding ecosystem projects, grants, and initiatives from a community-controlled treasury (which would hold and allocate **BTR** tokens).