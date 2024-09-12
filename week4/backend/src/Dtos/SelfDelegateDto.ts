import { ApiProperty } from '@nestjs/swagger';
import { Address } from 'viem';

export class SelfDelegateDto {
  @ApiProperty({ type: String, required: true })
  address: Address;
}
