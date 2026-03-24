import { Injectable } from '@nestjs/common';
import { SavingsProductDto } from './dto/savings-product.dto';

/** Static product catalogue — replace with DB/contract queries as needed. */
const PRODUCTS: Omit<SavingsProductDto, 'tvlAmountFormatted'>[] = [
  {
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4',
    name: 'Flexi Savings',
    description: 'Flexible deposits with no lock-up period.',
    apy: 5.2,
    riskLevel: 'low',
    tvlAmount: 1_250_000,
  },
  {
    contractId: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4',
    name: 'Goal Savings',
    description: 'Target-based savings with boosted yield.',
    apy: 8.75,
    riskLevel: 'medium',
    tvlAmount: 3_400_000,
  },
  {
    contractId: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSC4',
    name: 'Group Savings',
    description: 'Community pooled savings with shared rewards.',
    apy: 11.0,
    riskLevel: 'high',
    tvlAmount: 780_000,
  },
];

@Injectable()
export class SavingsService {
  /**
   * Returns enriched savings products.
   * @param sort  'apy' | 'tvl' — sort field (descending). Omit for default order.
   * @param formatTvl  When true, includes `tvlAmountFormatted` string alongside the number.
   */
  getProducts(
    sort?: 'apy' | 'tvl',
    formatTvl = false,
  ): SavingsProductDto[] {
    let products: SavingsProductDto[] = PRODUCTS.map((p) => ({
      ...p,
      ...(formatTvl
        ? { tvlAmountFormatted: p.tvlAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) }
        : {}),
    }));

    if (sort === 'apy') {
      products = products.sort((a, b) => b.apy - a.apy);
    } else if (sort === 'tvl') {
      products = products.sort((a, b) => b.tvlAmount - a.tvlAmount);
    }

    return products;
  }
}
