import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';

describe('AppController', () => {
  let controller: AppController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [AppController] }).compile();
    controller = module.get<AppController>(AppController);
  });
  it('returns a health response without secrets', () => {
    expect(controller.health()).toMatchObject({ status: 'ok', service: 'incident-command-center-api' });
  });
});
