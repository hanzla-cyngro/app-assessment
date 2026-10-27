import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { IncidentStatus } from '../../common/enums/incident-status.enum.js';
export class StatusDto {
  @ApiProperty({ enum: Object.values(IncidentStatus), example: IncidentStatus.InProgress })
  @IsIn(Object.values(IncidentStatus)) status!: IncidentStatus;
}
