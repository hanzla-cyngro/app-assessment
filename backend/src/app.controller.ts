import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator.js';
import { HealthResponseDto } from './incidents/dto/api-responses.dto.js';

@ApiTags('health')
@Controller('health')
export class AppController {
  @Public()
  @ApiOperation({ summary: 'Check API health' })
  @ApiOkResponse({ type: HealthResponseDto })
  @Get()
  health() {
    return { status: 'ok', service: 'incident-command-center-api', timestamp: new Date().toISOString() };
  }
}
