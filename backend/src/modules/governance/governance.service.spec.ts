import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GovernanceService } from './governance.service';
import { UserService } from '../user/user.service';
import { StellarService } from '../blockchain/stellar.service';
import { SavingsService } from '../blockchain/savings.service';
import { TransactionsService } from '../transactions/transactions.service';
import { GovernanceProposal } from './entities/governance-proposal.entity';
import { Vote } from './entities/vote.entity';
import { LedgerTransaction } from '../blockchain/entities/transaction.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GovernanceService', () => {
  let service: GovernanceService;
  let userService: { findById: jest.Mock };
  let stellarService: { getDelegationForUser: jest.Mock };
  let savingsService: { getUserVaultBalance: jest.Mock };
  let transactionsService: any;
  let eventEmitter: { emit: jest.Mock };
  let proposalRepo: { findOneBy: jest.Mock };
  let voteRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock; findAndCount: jest.Mock };
  let transactionRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    userService = { findById: jest.fn() };
    stellarService = { getDelegationForUser: jest.fn() };
    savingsService = { getUserVaultBalance: jest.fn() };
    transactionsService = {};
    eventEmitter = { emit: jest.fn() };
    proposalRepo = { findOneBy: jest.fn() };
    voteRepo = { find: jest.fn(), create: jest.fn(), save: jest.fn(), findAndCount: jest.fn() };
    transactionRepo = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernanceService,
        { provide: UserService, useValue: userService },
        { provide: StellarService, useValue: stellarService },
        { provide: SavingsService, useValue: savingsService },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: EventEmitter2, useValue: eventEmitter },
        {
          provide: getRepositoryToken(GovernanceProposal),
          useValue: proposalRepo,
        },
        { provide: getRepositoryToken(Vote), useValue: voteRepo },
        { provide: getRepositoryToken(LedgerTransaction), useValue: transactionRepo },
      ],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
  });

  // --- getUserDelegation (existing tests, unchanged) ---

  it('returns null when the user has no linked wallet', async () => {
    userService.findById.mockResolvedValue({ id: 'user-1', publicKey: null });

    await expect(service.getUserDelegation('user-1')).resolves.toEqual({
      delegate: null,
    });
    expect(stellarService.getDelegationForUser).not.toHaveBeenCalled();
  });

  it('returns null when no delegation exists on-chain', async () => {
    userService.findById.mockResolvedValue({
      id: 'user-1',
      publicKey: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    });
    stellarService.getDelegationForUser.mockResolvedValue(null);

    await expect(service.getUserDelegation('user-1')).resolves.toEqual({
      delegate: null,
    });
  });

  it('returns the delegated wallet address when present', async () => {
    userService.findById.mockResolvedValue({
      id: 'user-1',
      publicKey: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
    });
    stellarService.getDelegationForUser.mockResolvedValue(
      'GB7TAYQB6A6E7MCCKRUYJ4JYK2YTHJOTD4A5Q65XAH2EJQ2F6J67P5ST',
    );

    await expect(service.getUserDelegation('user-1')).resolves.toEqual({
      delegate: 'GB7TAYQB6A6E7MCCKRUYJ4JYK2YTHJOTD4A5Q65XAH2EJQ2F6J67P5ST',
    });
  });

  // --- getUserVotingPower (new tests) ---

  describe('getUserVotingPower', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      process.env = { ...OLD_ENV, NST_GOVERNANCE_CONTRACT_ID: 'CONTRACT123' };
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    it('returns 0 NST when user has no publicKey', async () => {
      userService.findById.mockResolvedValue({ id: 'user-1', publicKey: null });

      await expect(service.getUserVotingPower('user-1')).resolves.toEqual({
        votingPower: '0 NST',
      });
    });

    it('returns formatted voting power when user has publicKey', async () => {
      userService.findById.mockResolvedValue({
        id: 'user-1',
        publicKey: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      });

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '150000000' }),
      };
      transactionRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(service.getUserVotingPower('user-1')).resolves.toEqual({
        votingPower: '15 NST',
      });
    });

    it('throws when NST_GOVERNANCE_CONTRACT_ID is not set', async () => {
      delete process.env.NST_GOVERNANCE_CONTRACT_ID;
      userService.findById.mockResolvedValue({
        id: 'user-1',
        publicKey: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
      });

      await expect(service.getUserVotingPower('user-1')).rejects.toThrow(
        'NST governance token contract ID not configured',
      );
    });
  });

  describe('castVote', () => {
    it('throws BadRequestException if user has no publicKey', async () => {
      userService.findById.mockResolvedValue({ id: 'user-1', publicKey: null });

      await expect(service.castVote('user-1', 1, 'FOR' as any)).rejects.toThrow(
        'User must have a public key to vote',
      );
    });

    it('throws NotFoundException if proposal not found', async () => {
      userService.findById.mockResolvedValue({ id: 'user-1', publicKey: 'PK1' });
      proposalRepo.findOneBy.mockResolvedValue(null);

      await expect(service.castVote('user-1', 1, 'FOR' as any)).rejects.toThrow(
        'Proposal 1 not found',
      );
    });

    it('throws BadRequestException if already voted', async () => {
      userService.findById.mockResolvedValue({ id: 'user-1', publicKey: 'PK1' });
      proposalRepo.findOneBy.mockResolvedValue({ id: 'p1', onChainId: 1, status: 'Active' });
      voteRepo.findOneBy.mockResolvedValue({ id: 'v1' });

      await expect(service.castVote('user-1', 1, 'FOR' as any)).rejects.toThrow(
        'User has already voted on this proposal',
      );
    });
  });

  describe('delegateVotingPower', () => {
    it('returns a mock transaction hash', async () => {
      userService.findById.mockResolvedValue({ id: 'user-1', publicKey: 'PK1' });

      const result = await service.delegateVotingPower('user-1', 'DELEGATE_PK');
      expect(result.transactionHash).toBeDefined();
      expect(result.transactionHash).toMatch(/^0x/);
    });
  });
});
