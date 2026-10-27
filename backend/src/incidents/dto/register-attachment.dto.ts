import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
export class RegisterAttachmentDto {
  @ApiProperty({ maxLength: 255, example: 'error-screenshot.png' })
  @IsString() @MaxLength(255) originalFilename!: string;
  @ApiProperty({ maxLength: 100, example: 'image/png' })
  @IsString() @MaxLength(100) mimeType!: string;
  @ApiProperty({ minimum: 1, maximum: 10485759, example: 245760, description: 'File size in bytes; maximum is less than 10 MiB.' })
  @IsInt() @Min(1) @Max(10485759) sizeBytes!: number;
  @ApiProperty({ maxLength: 1024, example: 'incident-id/user-id/file-id-error-screenshot.png' })
  @IsString() @MaxLength(1024) objectPath!: string;
}
