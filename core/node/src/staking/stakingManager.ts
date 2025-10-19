// core/node/src/staking/stakingManager.ts

import { StakeTransaction } from '../types';

interface Stake {
    validator: string;
    amount: number;
}

/**
 * Manages the state of validators and their stakes in the network.
 * In a real blockchain, this state would be stored on-chain and managed by a smart contract.
 * For this simulation, we'll manage it in memory.
 */
export class StakingManager {
  // Map of validator public key to their total stake amount
  private stakes: Map<string, number> = new Map();
  private validators: string[] = []; // Ordered list of active validators

  constructor(genesisValidators: { validator: string; amount: number }[]) {
    console.log('Initializing Staking Manager...');
    genesisValidators.forEach(v => {
      this.stakes.set(v.validator, v.amount);
      this.validators.push(v.validator);
      console.log(`  - Genesis validator ${v.validator.substring(0,15)}... added with stake ${v.amount}`);
    });
  }

  /**
   * Processes a staking transaction to add or increase a validator's stake.
   * @param tx The stake transaction.
   */
  public processStake(tx: StakeTransaction): boolean {
    const currentStake = this.stakes.get(tx.validator) || 0;
    const newStake = currentStake + tx.amount;
    this.stakes.set(tx.validator, newStake);

    // If this is a new validator, add them to the active set
    if (!this.validators.includes(tx.validator)) {
      this.validators.push(tx.validator);
      console.log(`New validator ${tx.validator.substring(0,15)}... added to the active set.`);
    }
    
    console.log(`Stake updated for ${tx.validator.substring(0,15)}... to ${newStake}`);
    return true;
  }

  /**
   * Returns the stake amount for a given validator.
   * @param validator The public key of the validator.
   */
  public getStake(validator: string): number {
    return this.stakes.get(validator) || 0;
  }
  
  /**
   * Selects the next validator to produce a block.
   * This is a simplified round-robin implementation for simulation purposes.
   * A real PoS system would use a more complex, stake-weighted random selection algorithm.
   * @param currentBlockHeight The height of the current block to ensure determinism.
   */
  public selectNextValidator(currentBlockHeight: number): string | null {
    if (this.validators.length === 0) {
      return null;
    }
    const index = (currentBlockHeight + 1) % this.validators.length;
    return this.validators[index];
  }

  /**
   * Returns a list of all active validators and their stakes.
   */
  public getActiveValidators(): Stake[] {
      return this.validators.map(v => ({
          validator: v,
          amount: this.getStake(v)
      }));
  }
}