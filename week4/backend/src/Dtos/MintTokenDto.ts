import { ApiProperty } from '@nestjs/swagger';

export class MintTokenDto {
  @ApiProperty({ type: String, required: true, default: '0x0000000000000' })
  address: string;
  @ApiProperty({ type: String, required: true, default: 'MySignature' })
  signature: string;
}
