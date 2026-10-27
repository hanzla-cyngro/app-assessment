import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength, IsUUID } from 'class-validator';
import { IncidentSeverity } from '../../common/enums/incident-severity.enum.js';
export class CreateIncidentDto {
  @ApiProperty({ minLength: 1, maxLength: 140, example: 'API latency is elevated' })
  @IsString() @MinLength(1) @MaxLength(140) title!: string;
  @ApiProperty({ enum: Object.values(IncidentSeverity), example: IncidentSeverity.Critical })
  @IsIn(Object.values(IncidentSeverity)) severity!: IncidentSeverity;
  @ApiProperty({ maxLength: 5000, example: 'Requests are timing out in the payments service.' })
  @IsString() @MaxLength(5000) description!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', example: '69491075-380c-4ad4-8447-a8cced7db91c' })
  @IsOptional() @IsUUID() assignedUserId?: string | null;
}
