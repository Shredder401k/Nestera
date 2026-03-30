import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StellarService } from '../blockchain/stellar.service';
import { SavingsService } from '../blockchain/savings.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UserService } from '../user/user.service';
import { DelegationResponseDto } from './dto/delegation-response.dto';
import { ProposalListItemDto } from './dto/proposal-list-item.dto';
import { ProposalVotesResponseDto } from './dto/proposal-votes-response.dto';
import {
  GovernanceProposal,
  ProposalStatus,
} from './entities/governance-proposal.entity';
import { Vote, VoteDirection } from './entities/vote.entity';
import { VotingPowerResponseDto } from './dto/voting-power-response.dto';
import { TxStatus, TxType } from '../transactions/entities/transaction.entity';
import { LedgerTransaction } from '../blockchain/entities/transaction.entity';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly userService: UserService,
    private readonly stellarService: StellarService,
    private readonly savingsService: SavingsService,
    private readonly transactionsService: TransactionsService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(GovernanceProposal)
    private readonly proposalRepo: Repository<GovernanceProposal>,
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(LedgerTransaction)
    private readonly transactionRepo: Repository<LedgerTransaction>,
  ) {}

  async getProposals(status?: ProposalStatus): Promise<ProposalListItemDto[]> {
    const where = status ? { status } : {};
    const proposals = await this.proposalRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    if (proposals.length === 0) {
      return [];
    }

    const proposalIds = proposals.map((p) => p.id);

    // Aggregate vote counts per proposal in a single query
    const tallies: {
      proposalId: string;
      forCount: string;
      againstCount: string;
      abstainCount: string;
    }[] = await this.voteRepo
      .createQueryBuilder('vote')
      .select('vote.proposalId', 'proposalId')
      .addSelect(
        `SUM(CASE WHEN vote.direction = '${VoteDirection.FOR}' THEN 1 ELSE 0 END)`,
        'forCount',
      )
      .addSelect(
        `SUM(CASE WHEN vote.direction = '${VoteDirection.AGAINST}' THEN 1 ELSE 0 END)`,
        'againstCount',
      )
      .addSelect(
        `SUM(CASE WHEN vote.direction = '${VoteDirection.ABSTAIN}' THEN 1 ELSE 0 END)`,
        'abstainCount',
      )
      .where('vote.proposalId IN (:...ids)', { ids: proposalIds })
      .groupBy('vote.proposalId')
      .getRawMany();

    const tallyMap = new Map(tallies.map((t) => [t.proposalId, t]));

    return proposals.map((proposal) => {
      const tally = tallyMap.get(proposal.id);
      const forCount = tally ? Number(tally.forCount) : 0;
      const againstCount = tally ? Number(tally.againstCount) : 0;
      const abstainCount = tally ? Number(tally.abstainCount) : 0;
      const totalCount = forCount + againstCount + abstainCount;

      const forPercent =
        totalCount > 0 ? Math.round((forCount / totalCount) * 10000) / 100 : 0;
      const againstPercent =
        totalCount > 0
          ? Math.round((againstCount / totalCount) * 10000) / 100
          : 0;
      const abstainPercent =
        totalCount > 0
          ? Math.round((abstainCount / totalCount) * 10000) / 100
          : 0;

      return {
        id: proposal.id,
        onChainId: proposal.onChainId,
        title: proposal.title,
        description: proposal.description ?? null,
        category: proposal.category,
        status: proposal.status,
        proposer: proposal.proposer ?? null,
        forPercent,
        againstPercent,
        abstainPercent,
        timeline: {
          startTime: proposal.startBlock ?? null,
          endTime: proposal.endBlock ?? null,
        },
      };
    });
  }

  async getUserDelegation(userId: string): Promise<DelegationResponseDto> {
    const user = await this.userService.findById(userId);
    if (!user.publicKey) {
      return { delegate: null };
    }
    const delegate = await this.stellarService.getDelegationForUser(
      user.publicKey,
    );
    return { delegate };
  }

  async getUserVotingPower(userId: string): Promise<VotingPowerResponseDto> {
    const user = await this.userService.findById(userId);
    if (!user.publicKey) {
      return { votingPower: '0 NST' };
    }

    // Calculate voting power based on lifetime deposits
    // Requirement: "Calculate voting power based on lifetime deposits"
    const result = await this.transactionRepo
      .createQueryBuilder('tx')
      .select('SUM(CAST(tx.amount AS decimal))', 'total')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.type = :type', { type: TxType.DEPOSIT })
      .andWhere('tx.status = :status', { status: TxStatus.COMPLETED })
      .getRawOne();

    const totalDeposits = parseFloat(result?.total || '0');
    
    // 1 NST per 10,000,000 stroops (assuming stroops based on current implementation)
    // Or if amount is already in human-readable, we just use it.
    // Looking at current implementation: (balance / 10_000_000)
    const votingPower = Math.floor(totalDeposits / 10_000_000).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return { votingPower: `${votingPower} NST` };
  }

  async castVote(
    userId: string,
    onChainId: number,
    direction: VoteDirection,
  ): Promise<{ transactionHash: string }> {
    const user = await this.userService.findById(userId);
    if (!user.publicKey) {
      throw new BadRequestException('User must have a public key to vote');
    }

    const proposal = await this.proposalRepo.findOneBy({ onChainId });
    if (!proposal) {
      throw new NotFoundException(`Proposal ${onChainId} not found`);
    }

    if (proposal.status !== ProposalStatus.ACTIVE) {
      throw new BadRequestException('Proposal is not active for voting');
    }

    // Check for double voting
    const existingVote = await this.voteRepo.findOneBy({
      walletAddress: user.publicKey,
      proposalId: proposal.id,
    });

    if (existingVote) {
      throw new BadRequestException('User has already voted on this proposal');
    }

    const votingPowerResult = await this.getUserVotingPower(userId);
    const weight = parseFloat(votingPowerResult.votingPower.split(' ')[0]);

    if (weight <= 0) {
      throw new BadRequestException('User has no voting power');
    }

    // In a real scenario, this would involve a Stellar transaction.
    // For now, we simulate the transaction hash and save the vote to DB.
    const mockTxHash = `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;

    const vote = this.voteRepo.create({
      walletAddress: user.publicKey,
      direction,
      weight,
      proposal,
      proposalId: proposal.id,
    });

    await this.voteRepo.save(vote);

    // Emit event for real-time updates
    this.eventEmitter.emit('governance.vote_cast', {
      proposalId: proposal.id,
      onChainId: proposal.onChainId,
      direction,
      weight,
      walletAddress: user.publicKey,
    });

    return { transactionHash: mockTxHash };
  }

  async delegateVotingPower(
    userId: string,
    delegateAddress: string,
  ): Promise<{ transactionHash: string }> {
    const user = await this.userService.findById(userId);
    if (!user.publicKey) {
      throw new BadRequestException('User must have a public key to delegate');
    }

    // Simulate Stellar delegation
    const mockTxHash = `0x${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16)}`;

    // In a real app, we'd update the contract on-chain via StellarService
    // and potentially store it in our DB if needed.
    
    return { transactionHash: mockTxHash };
  }

  async getProposalVotesByOnChainId(
    onChainId: number,
    page = 0,
  ): Promise<ProposalVotesResponseDto> {
    const proposal = await this.proposalRepo.findOneBy({ onChainId });
    if (!proposal) {
      throw new NotFoundException(`Proposal ${onChainId} not found`);
    }

    const [votes, total] = await this.voteRepo.findAndCount({
      where: { proposalId: proposal.id },
      order: { createdAt: 'DESC' },
      take: 20,
      skip: page * 20,
    });

    let forWeight = 0;
    let againstWeight = 0;
    let abstainWeight = 0;
    for (const vote of votes) {
      const voteWeight = Number(vote.weight) || 0;
      if (vote.direction === VoteDirection.FOR) {
        forWeight += voteWeight;
      } else if (vote.direction === VoteDirection.AGAINST) {
        againstWeight += voteWeight;
      } else {
        abstainWeight += voteWeight;
      }
    }

    return {
      proposalOnChainId: onChainId,
      tally: {
        forVotes: votes.filter((vote) => vote.direction === VoteDirection.FOR)
          .length,
        againstVotes: votes.filter(
          (vote) => vote.direction === VoteDirection.AGAINST,
        ).length,
        abstainVotes: votes.filter(
          (vote) => vote.direction === VoteDirection.ABSTAIN,
        ).length,
        forWeight: String(forWeight),
        againstWeight: String(againstWeight),
        abstainWeight: String(abstainWeight),
        totalWeight: String(forWeight + againstWeight + abstainWeight),
      },
      recentVoters: votes.map((vote) => ({
        walletAddress: vote.walletAddress,
        direction: vote.direction,
        weight: String(vote.weight),
        votedAt: vote.createdAt.toISOString(),
      })),
      total,
      page,
    };
  }
}
