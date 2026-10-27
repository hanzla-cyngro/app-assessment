import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength, IsUUID } from 'class-validator';
import { IncidentSeverity } from '../../common/enums/incident-severity.enum.js';
export class UpdateIncidentDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 140, example: 'API latency is elevated' })
  @IsOptional() @IsString() @MinLength(1) @MaxLength(140) title?: string;
  @ApiPropertyOptional({ enum: Object.values(IncidentSeverity), example: IncidentSeverity.Critical })
  @IsOptional() @IsIn(Object.values(IncidentSeverity)) severity?: IncidentSeverity;
  @ApiPropertyOptional({ maxLength: 5000, example: 'Requests are timing out in the payments service.' })
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', example: '69491075-380c-4ad4-8447-a8cced7db91c' })
  @IsOptional() @IsUUID() assignedUserId?: string | null;
}
