import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProposalCategory } from '../entities/governance-proposal.entity';

export class CreateProposalDto {
  @ApiProperty({ description: 'On-chain proposal ID', example: 1 })
  @IsInt()
  onChainId: number;

  @ApiProperty({
    description: 'Proposal title',
    example: 'Increase Treasury Allocation',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({
    description: 'Detailed proposal description',
    example: 'This proposal aims to...',
  })
  @IsString()
  description: string;

  @ApiProperty({ enum: ProposalCategory, example: ProposalCategory.TREASURY })
  @IsEnum(ProposalCategory)
  category: ProposalCategory;

  @ApiProperty({
    description: 'Proposer wallet address',
    example: '0x1234...',
    required: false,
  })
  @IsOptional()
  @IsString()
  proposer?: string;

  @ApiProperty({
    description: 'Start block number',
    example: 1000000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  startBlock?: number;

  @ApiProperty({
    description: 'End block number',
    example: 1100000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  endBlock?: number;
}
