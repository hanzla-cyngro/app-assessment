import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import {
  AttachmentResponseDto,
  IncidentAnalyticsResponseDto,
  IncidentResponseDto,
  PaginatedIncidentsResponseDto,
  ReadUrlResponseDto,
  UploadUrlResponseDto,
} from './dto/api-responses.dto.js';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { ListIncidentsDto } from './dto/list-incidents.dto.js';
import { StatusDto } from './dto/status.dto.js';
import { UpdateIncidentDto } from './dto/update-incident.dto.js';
import { UploadMetadataDto } from './dto/upload-metadata.dto.js';
import { RegisterAttachmentDto } from './dto/register-attachment.dto.js';
import { IncidentsService } from './incidents.service.js';

@ApiTags('incidents')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid Supabase access token.' })
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get incident analytics' })
  @ApiOkResponse({ type: IncidentAnalyticsResponseDto })
  analytics() {
    return this.service.analytics();
  }

  @Get()
  @ApiOperation({ summary: 'List and filter incidents' })
  @ApiOkResponse({ type: PaginatedIncidentsResponseDto })
  list(@Query() query: ListIncidentsDto) {
    return this.service.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create an incident' })
  @ApiCreatedResponse({ type: IncidentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid incident fields.' })
  create(@Body() dto: CreateIncidentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an incident by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB incident ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiOkResponse({ type: IncidentResponseDto })
  @ApiNotFoundResponse({ description: 'Incident not found.' })
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update incident details or assignee' })
  @ApiParam({ name: 'id', description: 'MongoDB incident ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiOkResponse({ type: IncidentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid incident fields.' })
  @ApiNotFoundResponse({ description: 'Incident not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change incident status' })
  @ApiParam({ name: 'id', description: 'MongoDB incident ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiOkResponse({ type: IncidentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid or disallowed status transition.' })
  @ApiNotFoundResponse({ description: 'Incident not found.' })
  status(@Param('id') id: string, @Body() dto: StatusDto) {
    return this.service.transition(id, dto.status);
  }

  @Post(':id/attachments/upload-url')
  @ApiOperation({ summary: 'Create a signed upload URL for evidence' })
  @ApiParam({ name: 'id', description: 'MongoDB incident ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiCreatedResponse({ type: UploadUrlResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid file metadata or file type.' })
  @ApiNotFoundResponse({ description: 'Incident not found.' })
  uploadUrl(@Param('id') id: string, @Body() body: UploadMetadataDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createUploadUrl(id, user, body);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Register an uploaded evidence file on an incident' })
  @ApiParam({ name: 'id', description: 'MongoDB incident ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiCreatedResponse({ type: AttachmentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid metadata or the uploaded file could not be verified.' })
  @ApiNotFoundResponse({ description: 'Incident not found.' })
  register(@Param('id') id: string, @Body() body: RegisterAttachmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.registerAttachment(id, user, body);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'List evidence attachments for an incident' })
  @ApiParam({ name: 'id', description: 'MongoDB incident ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiOkResponse({ type: AttachmentResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Incident not found.' })
  attachments(@Param('id') id: string) {
    return this.service.listAttachments(id);
  }

  @Get(':id/attachments/:attachmentId/read-url')
  @ApiOperation({ summary: 'Create a temporary signed download URL for an attachment' })
  @ApiParam({ name: 'id', description: 'MongoDB incident ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiParam({ name: 'attachmentId', description: 'MongoDB attachment ID', example: '6ae0f08bf579ab93507f2d19' })
  @ApiOkResponse({ type: ReadUrlResponseDto })
  @ApiNotFoundResponse({ description: 'Incident or attachment not found.' })
  readUrl(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.service.readAttachmentUrl(id, attachmentId);
  }
}
