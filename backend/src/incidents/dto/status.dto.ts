import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { STATUSES } from '../schemas/incident.schema.js';
export class StatusDto {
  @ApiProperty({ enum: STATUSES, example: 'In Progress' })
  @IsIn([...STATUSES]) status!: (typeof STATUSES)[number];
}
