// core/node/tests/consensus/pos.test.ts

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { PoSConsensus } from '../../src/consensus/pos';
import { Blockchain } from '../../src/blockchain';
import { Mempool } from '../../src/mempool';
import { Validator } from '../../src/validator/validator';
import { StakingManager } from '../../src/staking/stakingManager';
import { Block, Transaction, TransactionType, TransferTransaction } from '../../src/types';

// Mock the dependencies
jest.mock('../../src/blockchain');
jest.mock('../../src/mempool');
jest.mock('../../src/validator/validator');
jest.mock('../../src/staking/stakingManager');

const MockedBlockchain = Blockchain as jest.MockedClass<typeof Blockchain>;
const MockedMempool = Mempool as jest.MockedClass<typeof Mempool>;
const MockedValidator = Validator as jest.MockedClass<typeof Validator>;
const MockedStakingManager = StakingManager as jest.MockedClass<typeof StakingManager>;

describe('PoSConsensus', () => {
    let consensus: PoSConsensus;
    let mockBlockchain: jest.Mocked<Blockchain>;
    let mockMempool: jest.Mocked<Mempool>;
    let mockValidator: jest.Mocked<Validator>;
    let mockStakingManager: jest.Mocked<StakingManager>;

    const validatorPublicKey = 'my-validator-public-key';
    const latestBlock: Block = {
        height: 10,
        hash: 'hash-of-block-10',
        previousHash: 'hash-of-block-9',
        timestamp: Date.now() - 5000,
        transactions: [],
        validator: 'another-validator-key',
        signature: 'sig-10',
        totalFees: 0,
    };

    beforeEach(() => {
        // Reset mocks before each test
        mockBlockchain = new MockedBlockchain(null!, null!, null!, null!, null!, null!) as jest.Mocked<Blockchain>;
        mockMempool = new MockedMempool() as jest.Mocked<Mempool>;
        mockValidator = new MockedValidator() as jest.Mocked<Validator>;
        // We need to manually set the public key on the mock instance
        Object.defineProperty(mockValidator, 'publicKey', { value: validatorPublicKey, writable: false });
        mockStakingManager = new MockedStakingManager([]) as jest.Mocked<StakingManager>;

        // Setup default mock behaviors
        mockBlockchain.getLatestBlock.mockReturnValue(latestBlock);
        mockValidator.sign.mockReturnValue('a-valid-signature');

        consensus = new PoSConsensus(mockBlockchain, mockMempool, mockValidator, mockStakingManager);
    });

    it('should create a valid block when it is the validator\'s turn', async () => {
        // Arrange
        const pendingTxs: TransferTransaction[] = [
            { id: 'tx1', from: 'a', to: 'b', amount: 10, fee: 1, nonce: 0, signature: 'sig1', type: TransactionType.TRANSFER },
            { id: 'tx2', from: 'c', to: 'd', amount: 5, fee: 2, nonce: 0, signature: 'sig2', type: TransactionType.TRANSFER },
        ];
        mockStakingManager.selectNextValidator.mockReturnValue(validatorPublicKey);
        mockMempool.getPendingTransactions.mockReturnValue(pendingTxs);
        
        // Act
        const newBlock = await consensus.createBlock();

        // Assert
        expect(newBlock).toBeDefined();
        expect(newBlock.height).toBe(latestBlock.height + 1);
        expect(newBlock.previousHash).toBe(latestBlock.hash);
        expect(newBlock.validator).toBe(validatorPublicKey);
        expect(newBlock.transactions).toEqual(pendingTxs);
        expect(newBlock.totalFees).toBe(3); // 1 + 2
        expect(newBlock.hash).toBeDefined();
        expect(newBlock.signature).toBe('a-valid-signature');
        
        // Verify that sign was called with the new block's hash
        expect(mockValidator.sign).toHaveBeenCalledWith(newBlock.hash);
    });

    it('should throw an error if it is not the validator\'s turn', async () => {
        // Arrange
        const anotherValidatorKey = 'another-validator-key';
        mockStakingManager.selectNextValidator.mockReturnValue(anotherValidatorKey);

        // Act & Assert
        await expect(consensus.createBlock()).rejects.toThrow(
            `Not our turn to produce a block. Next validator is ${anotherValidatorKey.substring(0, 15)}...`
        );
    });
    
    it('should create a block with no transactions if the mempool is empty', async () => {
        // Arrange
        mockStakingManager.selectNextValidator.mockReturnValue(validatorPublicKey);
        mockMempool.getPendingTransactions.mockReturnValue([]); // Empty mempool

        // Act
        const newBlock = await consensus.createBlock();

        // Assert
        expect(newBlock).toBeDefined();
        expect(newBlock.transactions).toHaveLength(0);
        expect(newBlock.totalFees).toBe(0);
        expect(newBlock.validator).toBe(validatorPublicKey);
    });

    it('should select the validator based on the previous block\'s height', async () => {
        // Arrange
        mockStakingManager.selectNextValidator.mockReturnValue(validatorPublicKey);
        mockMempool.getPendingTransactions.mockReturnValue([]);

        // Act
        await consensus.createBlock();

        // Assert
        // The next validator is selected based on `latestBlock.height`, which is 10.
        expect(mockStakingManager.selectNextValidator).toHaveBeenCalledWith(10);
    });
});