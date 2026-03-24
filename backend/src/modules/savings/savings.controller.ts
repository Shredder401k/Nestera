import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SavingsService } from './savings.service';
import { SavingsProductDto } from './dto/savings-product.dto';

@ApiTags('savings')
@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  /**
   * GET /savings/products
   *
   * Query params:
   *   sort=apy|tvl   — sort results descending by APY or TVL
   *   formatTvl=true — include string-formatted TVL alongside the numeric value
   */
  @Get('products')
  @ApiOperation({ summary: 'List savings products with enriched metadata' })
  @ApiQuery({ name: 'sort', required: false, enum: ['apy', 'tvl'], description: 'Sort field (descending)' })
  @ApiQuery({ name: 'formatTvl', required: false, type: Boolean, description: 'Include formatted TVL string' })
  @ApiResponse({ status: 200, type: [SavingsProductDto] })
  getProducts(
    @Query('sort') sort?: 'apy' | 'tvl',
    @Query('formatTvl') formatTvl?: string,
  ): SavingsProductDto[] {
    return this.savingsService.getProducts(sort, formatTvl === 'true');
  }
}
