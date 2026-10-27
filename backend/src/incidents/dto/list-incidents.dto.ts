import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SEVERITIES, STATUSES } from '../schemas/incident.schema.js';
export class ListIncidentsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10, description: 'Number of incidents per page.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 10;
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional() @IsIn([...STATUSES]) status?: (typeof STATUSES)[number];
  @ApiPropertyOptional({ enum: SEVERITIES })
  @IsOptional() @IsIn(SEVERITIES) severity?: (typeof SEVERITIES)[number];
  @ApiPropertyOptional({ example: '69491075-380c-4ad4-8447-a8cced7db91c', description: 'Use "unassigned" to filter incidents without an assignee.' })
  @IsOptional() @IsString() @MaxLength(100) assignedUserId?: string;
  @ApiPropertyOptional({ maxLength: 140, example: 'latency' })
  @IsOptional() @IsString() @MaxLength(140) q?: string;
}
