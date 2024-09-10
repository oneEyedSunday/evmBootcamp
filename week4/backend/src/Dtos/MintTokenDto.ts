import { ApiProperty } from '@nestjs/swagger';

export class MintTokenDto {
  @ApiProperty({ type: String, required: true, default: '0x0000000000000' })
  address: string;
  @ApiProperty({ type: String, required: false, default: '' })
  signature: string;
  @ApiProperty({ type: Number, required: true, default: 1 })
  amount: number;
}
