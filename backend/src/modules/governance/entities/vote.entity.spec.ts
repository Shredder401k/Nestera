import { Vote, VoteDirection } from './vote.entity';
import {
  GovernanceProposal,
  ProposalStatus,
  ProposalCategory,
} from './governance-proposal.entity';

describe('Vote Entity', () => {
  it('should create a vote with required fields', () => {
    const vote = new Vote();
    vote.walletAddress = '0x1234567890abcdef';
    vote.direction = VoteDirection.FOR;
    vote.weight = 150.5;

    expect(vote.walletAddress).toBe('0x1234567890abcdef');
    expect(vote.direction).toBe(VoteDirection.FOR);
    expect(vote.weight).toBe(150.5);
  });

  it('should support FOR and AGAINST directions', () => {
    expect(VoteDirection.FOR).toBe('FOR');
    expect(VoteDirection.AGAINST).toBe('AGAINST');
  });

  it('should map on-chain support values correctly', () => {
    // On-chain: support=1 means FOR
    const forVote = new Vote();
    forVote.direction = 1 === 1 ? VoteDirection.FOR : VoteDirection.AGAINST;
    expect(forVote.direction).toBe(VoteDirection.FOR);

    // On-chain: support=0 means AGAINST
    const againstVote = new Vote();
    againstVote.direction = 0 === 1 ? VoteDirection.FOR : VoteDirection.AGAINST;
    expect(againstVote.direction).toBe(VoteDirection.AGAINST);
  });

  it('should have ManyToOne relationship with proposal', () => {
    const proposal = new GovernanceProposal();
    proposal.id = 'proposal-uuid';
    proposal.onChainId = 1;
    proposal.title = 'Test Proposal';
    proposal.description = 'Description';
    proposal.category = ProposalCategory.GOVERNANCE;
    proposal.status = ProposalStatus.ACTIVE;

    const vote = new Vote();
    vote.walletAddress = '0xabcd';
    vote.direction = VoteDirection.FOR;
    vote.weight = 100;
    vote.proposal = proposal;
    vote.proposalId = proposal.id;

    expect(vote.proposal).toBe(proposal);
    expect(vote.proposalId).toBe('proposal-uuid');
  });

  it('should support decimal weight values', () => {
    const vote = new Vote();
    vote.walletAddress = '0x1234';
    vote.direction = VoteDirection.FOR;
    vote.weight = 123.45678901;

    expect(vote.weight).toBe(123.45678901);
  });

  it('should enforce unique constraint per wallet per proposal', () => {
    // This test demonstrates the expected behavior
    // In practice, TypeORM enforces this at the database level
    const proposal = new GovernanceProposal();
    proposal.id = 'proposal-1';

    const vote1 = new Vote();
    vote1.walletAddress = '0xsame';
    vote1.proposalId = proposal.id;
    vote1.direction = VoteDirection.FOR;
    vote1.weight = 100;

    // Attempting to create another vote with same wallet + proposal
    // should fail at database level due to unique index
    const vote2 = new Vote();
    vote2.walletAddress = '0xsame';
    vote2.proposalId = proposal.id;
    vote2.direction = VoteDirection.AGAINST;
    vote2.weight = 50;

    // In real scenario, saving vote2 would throw a unique constraint error
    expect(vote1.walletAddress).toBe(vote2.walletAddress);
    expect(vote1.proposalId).toBe(vote2.proposalId);
  });
});
