import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength, IsUUID } from 'class-validator';
import { SEVERITIES } from '../schemas/incident.schema.js';
export class CreateIncidentDto {
  @ApiProperty({ minLength: 1, maxLength: 140, example: 'API latency is elevated' })
  @IsString() @MinLength(1) @MaxLength(140) title!: string;
  @ApiProperty({ enum: SEVERITIES, example: 'Critical' })
  @IsIn([...SEVERITIES]) severity!: (typeof SEVERITIES)[number];
  @ApiProperty({ maxLength: 5000, example: 'Requests are timing out in the payments service.' })
  @IsString() @MaxLength(5000) description!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid', example: '69491075-380c-4ad4-8447-a8cced7db91c' })
  @IsOptional() @IsUUID() assignedUserId?: string | null;
}
