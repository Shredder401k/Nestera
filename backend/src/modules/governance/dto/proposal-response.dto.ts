import { ApiProperty } from '@nestjs/swagger';
import {
  ProposalStatus,
  ProposalCategory,
} from '../entities/governance-proposal.entity';
import { VoteResponseDto } from './vote-response.dto';

export class ProposalResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id: string;

  @ApiProperty({ description: 'On-chain proposal ID' })
  onChainId: number;

  @ApiProperty({ description: 'Proposal title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;

  @ApiProperty({ enum: ProposalCategory })
  category: ProposalCategory;

  @ApiProperty({ enum: ProposalStatus })
  status: ProposalStatus;

  @ApiProperty({ description: 'Proposer wallet address', nullable: true })
  proposer: string | null;

  @ApiProperty({ description: 'Start block number', nullable: true })
  startBlock: number | null;

  @ApiProperty({ description: 'End block number', nullable: true })
  endBlock: number | null;

  @ApiProperty({
    type: [VoteResponseDto],
    description: 'All votes on this proposal',
  })
  votes: VoteResponseDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
