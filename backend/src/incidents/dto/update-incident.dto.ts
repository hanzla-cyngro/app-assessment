import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength, IsUUID } from 'class-validator';
import { SEVERITIES } from '../schemas/incident.schema.js';
export class UpdateIncidentDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 140, example: 'API latency is elevated' })
  @IsOptional() @IsString() @MinLength(1) @MaxLength(140) title?: string;
  @ApiPropertyOptional({ enum: SEVERITIES, example: 'Critical' })
  @IsOptional() @IsIn([...SEVERITIES]) severity?: (typeof SEVERITIES)[number];
  @ApiPropertyOptional({ maxLength: 5000, example: 'Requests are timing out in the payments service.' })
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', example: '69491075-380c-4ad4-8447-a8cced7db91c' })
  @IsOptional() @IsUUID() assignedUserId?: string | null;
}
