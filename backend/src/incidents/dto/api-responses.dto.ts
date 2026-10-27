import { ApiProperty } from '@nestjs/swagger';
import { SEVERITIES, STATUSES, type IncidentStatus, type Severity } from '../schemas/incident.schema.js';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' }) status!: string;
  @ApiProperty({ example: 'incident-command-center-api' }) service!: string;
  @ApiProperty({ type: String, format: 'date-time' }) timestamp!: string;
}

export class IncidentResponseDto {
  @ApiProperty({ example: '6ae0f08bf579ab93507f2d19' }) id!: string;
  @ApiProperty({ example: 'API latency is elevated' }) title!: string;
  @ApiProperty({ example: 'Requests are timing out in the payments service.' }) description!: string;
  @ApiProperty({ enum: SEVERITIES, example: 'Critical' }) severity!: Severity;
  @ApiProperty({ enum: STATUSES, example: 'In Progress' }) status!: IncidentStatus;
  @ApiProperty({ nullable: true, example: '69491075-380c-4ad4-8447-a8cced7db91c' }) assignedUserId!: string | null;
  @ApiProperty({ example: '69491075-380c-4ad4-8447-a8cced7db91c' }) createdByUserId!: string;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) resolvedAt!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class PaginatedIncidentsResponseDto {
  @ApiProperty({ type: () => IncidentResponseDto, isArray: true }) items!: IncidentResponseDto[];
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 10 }) pageSize!: number;
  @ApiProperty({ example: 24 }) total!: number;
  @ApiProperty({ example: 3 }) totalPages!: number;
}

export class IncidentAnalyticsResponseDto {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'integer' }, example: { Low: 2, Medium: 4, Critical: 1 } }) activeBySeverity!: Record<Severity, number>;
  @ApiProperty({ nullable: true, example: 183000 }) averageResolutionTimeMs!: number | null;
  @ApiProperty({ example: 12 }) resolvedCount!: number;
}

export class AttachmentResponseDto {
  @ApiProperty({ example: '6ae0f08bf579ab93507f2d19' }) id!: string;
  @ApiProperty({ example: '6ae0f08bf579ab93507f2d19' }) incidentId!: string;
  @ApiProperty({ example: '69491075-380c-4ad4-8447-a8cced7db91c' }) uploaderUserId!: string;
  @ApiProperty({ example: 'error-screenshot.png' }) originalFilename!: string;
  @ApiProperty({ example: 'image/png' }) mimeType!: string;
  @ApiProperty({ example: 245760 }) sizeBytes!: number;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

export class UploadUrlResponseDto {
  @ApiProperty({ example: 'https://project.supabase.co/storage/v1/object/upload/sign/...' }) uploadUrl!: string;
  @ApiProperty({ example: 'incident-id/user-id/file-id-error-screenshot.png' }) objectPath!: string;
  @ApiProperty({ example: 'signed-upload-token' }) token!: string;
  @ApiProperty({ example: 'incident-evidence' }) bucket!: string;
}

export class ReadUrlResponseDto {
  @ApiProperty({ example: 'https://project.supabase.co/storage/v1/object/sign/...' }) url!: string;
  @ApiProperty({ example: 300 }) expiresInSeconds!: number;
}
