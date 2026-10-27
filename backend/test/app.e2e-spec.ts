import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from '../src/app.controller.js';

describe('Health endpoint (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ controllers: [AppController] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  it('GET /health is public and returns service status', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect(({ body }) => {
      expect(body.status).toBe('ok');
      expect(body.service).toBe('incident-command-center-api');
    });
  });
  afterEach(async () => { await app.close(); });
});
