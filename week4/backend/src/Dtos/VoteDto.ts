import { ApiProperty } from '@nestjs/swagger';

export class VoteDto {
  @ApiProperty({ type: Number, required: true })
  proposalIndex: number;

  @ApiProperty({ type: Number, required: true })
  amount: number;
}
