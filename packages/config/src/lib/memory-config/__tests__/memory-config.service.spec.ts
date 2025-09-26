import { Test, TestingModule } from '@nestjs/testing';
import { MemoryConfigService } from '../memory-config.service.js';

describe('MemoryConfigService', () => {
  let service: MemoryConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryConfigService]
    }).compile();

    service = module.get<MemoryConfigService>(MemoryConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load config to memory', async () => {
    // 模拟环境变量
    process.env.API_PORT = '3001';
    process.env.DB_HOST = 'test-db';
    process.env.JWT_SECRET = 'test-secret-key';

    await service.onModuleInit();

    const apiConfig = service.getApiConfig();
    expect(apiConfig.port).toBe(3001);

    const dbConfig = service.getDatabaseConfig();
    expect(dbConfig.host).toBe('test-db');

    const authConfig = service.getAuthConfig();
    expect(authConfig.jwtSecret).toBe('test-secret-key');
  });

  it('should isolate config from environment changes', async () => {
    // 初始配置
    process.env.API_PORT = '3000';
    await service.onModuleInit();
    
    const initialPort = service.getApiConfig().port;
    expect(initialPort).toBe(3000);

    // 修改环境变量
    process.env.API_PORT = '9999';
    
    // 配置应该不受影响
    const currentPort = service.getApiConfig().port;
    expect(currentPort).toBe(3000);
    expect(currentPort).toBe(initialPort);
  });

  it('should provide type-safe config access', () => {
    const apiConfig = service.getApiConfig();
    
    // 这些访问都是类型安全的
    const port: number = apiConfig.port;
    const host: string = apiConfig.host;
    const production: boolean = apiConfig.production;

    expect(typeof port).toBe('number');
    expect(typeof host).toBe('string');
    expect(typeof production).toBe('boolean');
  });

  it('should get config status', () => {
    const status = service.getConfigStatus();
    
    expect(status).toHaveProperty('isLoaded');
    expect(status).toHaveProperty('version');
    expect(status).toHaveProperty('loadTime');
    expect(status).toHaveProperty('configKeys');
    expect(status).toHaveProperty('environment');
  });

  it('should get all config', () => {
    const allConfig = service.getAllConfig();
    
    expect(allConfig).toHaveProperty('api');
    expect(allConfig).toHaveProperty('database');
    expect(allConfig).toHaveProperty('auth');
    expect(allConfig).toHaveProperty('redis');
    expect(allConfig).toHaveProperty('features');
  });

  it('should reload config', async () => {
    await service.onModuleInit();
    
    const initialPort = service.getApiConfig().port;
    
    // 修改环境变量
    process.env.API_PORT = '8080';
    
    // 重新加载配置
    await service.reloadConfig();
    
    const newPort = service.getApiConfig().port;
    expect(newPort).toBe(8080);
    expect(newPort).not.toBe(initialPort);
  });
});
