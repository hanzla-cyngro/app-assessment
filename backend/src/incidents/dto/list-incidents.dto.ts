import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentSeverity } from '../../common/enums/incident-severity.enum.js';
import { IncidentStatus } from '../../common/enums/incident-status.enum.js';
export class ListIncidentsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10, description: 'Number of incidents per page.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 10;
  @ApiPropertyOptional({ enum: Object.values(IncidentStatus) })
  @IsOptional() @IsIn(Object.values(IncidentStatus)) status?: IncidentStatus;
  @ApiPropertyOptional({ enum: Object.values(IncidentSeverity) })
  @IsOptional() @IsIn(Object.values(IncidentSeverity)) severity?: IncidentSeverity;
  @ApiPropertyOptional({ example: '69491075-380c-4ad4-8447-a8cced7db91c', description: 'Use "unassigned" to filter incidents without an assignee.' })
  @IsOptional() @IsString() @MaxLength(100) assignedUserId?: string;
  @ApiPropertyOptional({ maxLength: 140, example: 'latency' })
  @IsOptional() @IsString() @MaxLength(140) q?: string;
}
