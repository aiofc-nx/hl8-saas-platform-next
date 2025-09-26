import { Test, TestingModule } from '@nestjs/testing';
import { MemoryConfigService } from '../memory-config.service.js';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter.js';

describe('ConfigCompatibilityAdapter', () => {
  let adapter: ConfigCompatibilityAdapter;
  let memoryConfig: MemoryConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryConfigService, ConfigCompatibilityAdapter]
    }).compile();

    adapter = module.get<ConfigCompatibilityAdapter>(ConfigCompatibilityAdapter);
    memoryConfig = module.get<MemoryConfigService>(MemoryConfigService);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should get config value by path', async () => {
    process.env.API_PORT = '3001';
    await memoryConfig.onModuleInit();

    const port = adapter.get<number>('api.port');
    expect(port).toBe(3001);
  });

  it('should return default value when config not found', () => {
    const defaultValue = 8080;
    const port = adapter.get<number>('nonexistent.port', defaultValue);
    expect(port).toBe(defaultValue);
  });

  it('should check if config exists', async () => {
    process.env.API_PORT = '3001';
    await memoryConfig.onModuleInit();

    expect(adapter.has('api.port')).toBe(true);
    expect(adapter.has('nonexistent.port')).toBe(false);
  });

  it('should get all config', async () => {
    await memoryConfig.onModuleInit();
    
    const allConfig = adapter.getAllConfig();
    expect(allConfig).toHaveProperty('api');
    expect(allConfig).toHaveProperty('database');
    expect(allConfig).toHaveProperty('auth');
  });

  it('should get config status', async () => {
    await memoryConfig.onModuleInit();
    
    const status = adapter.getConfigStatus();
    expect(status).toHaveProperty('isLoaded');
    expect(status).toHaveProperty('version');
  });

  it('should reload config', async () => {
    await memoryConfig.onModuleInit();
    
    const initialPort = adapter.get<number>('api.port');
    
    // 修改环境变量
    process.env.API_PORT = '8080';
    
    // 重新加载配置
    await adapter.reloadConfig();
    
    const newPort = adapter.get<number>('api.port');
    expect(newPort).toBe(8080);
    expect(newPort).not.toBe(initialPort);
  });
});
