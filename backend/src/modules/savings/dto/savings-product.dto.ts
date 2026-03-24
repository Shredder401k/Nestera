import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SavingsProductDto {
  @ApiProperty({ description: 'On-chain contract identifier' })
  contractId: string;

  @ApiProperty({ description: 'Annual percentage yield (%)' })
  apy: number;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiPropertyOptional({ description: 'Product description' })
  description?: string;

  @ApiProperty({ description: 'Risk level: low | medium | high' })
  riskLevel: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Total value locked as a JS Number' })
  tvlAmount: number;

  @ApiPropertyOptional({ description: 'Total value locked as a formatted string (e.g. "1,234,567.89")' })
  tvlAmountFormatted?: string;
}
