import { Test, TestingModule } from '@nestjs/testing';
import { MemoryConfigService } from '../memory-config.service.js';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter.js';
import { HybridConfigService } from '../hybrid-config.service.js';
import { ConfigService } from '../../config.service.js';
import { ConfigModule } from '../../config.module.js';

describe('Integration Tests', () => {
  let module: TestingModule;
  let memoryConfig: MemoryConfigService;
  let compatibilityAdapter: ConfigCompatibilityAdapter;
  let hybridConfig: HybridConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        MemoryConfigService,
        ConfigCompatibilityAdapter,
        HybridConfigService
      ]
    }).compile();

    memoryConfig = module.get<MemoryConfigService>(MemoryConfigService);
    compatibilityAdapter = module.get<ConfigCompatibilityAdapter>(ConfigCompatibilityAdapter);
    hybridConfig = module.get<HybridConfigService>(HybridConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should integrate with ConfigModule', () => {
    expect(memoryConfig).toBeDefined();
    expect(compatibilityAdapter).toBeDefined();
    expect(hybridConfig).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('should work with ConfigService integration', () => {
    // 测试ConfigService中的内存配置方法
    const apiConfig = configService.getApiConfig();
    expect(apiConfig).toBeDefined();
    expect(apiConfig.port).toBeDefined();
    expect(typeof apiConfig.port).toBe('number');

    const dbConfig = configService.getDatabaseConfig();
    expect(dbConfig).toBeDefined();
    expect(dbConfig.host).toBeDefined();
    expect(typeof dbConfig.host).toBe('string');

    const authConfig = configService.getAuthConfig();
    expect(authConfig).toBeDefined();
    expect(authConfig.jwtSecret).toBeDefined();
    expect(typeof authConfig.jwtSecret).toBe('string');
  });

  it('should maintain backward compatibility', () => {
    // 测试向后兼容性
    const port = configService.get<number>('api.port');
    expect(port).toBeDefined();
    expect(typeof port).toBe('number');

    const host = configService.get<string>('database.host');
    expect(host).toBeDefined();
    expect(typeof host).toBe('string');

    const production = configService.get<boolean>('api.production');
    expect(production).toBeDefined();
    expect(typeof production).toBe('boolean');
  });

  it('should provide consistent configuration across services', () => {
    // 测试配置一致性
    const memoryApiConfig = memoryConfig.getApiConfig();
    const serviceApiConfig = configService.getApiConfig();
    const hybridApiConfig = hybridConfig.getApiConfig();

    expect(memoryApiConfig.port).toBe(serviceApiConfig.port);
    expect(serviceApiConfig.port).toBe(hybridApiConfig.port);
    expect(memoryApiConfig.host).toBe(serviceApiConfig.host);
    expect(serviceApiConfig.host).toBe(hybridApiConfig.host);
  });

  it('should handle configuration isolation', () => {
    // 测试配置隔离
    const initialPort = memoryConfig.getApiConfig().port;
    
    // 修改环境变量
    const originalPort = process.env.API_PORT;
    process.env.API_PORT = '9999';
    
    // 配置应该不受影响
    const currentPort = memoryConfig.getApiConfig().port;
    expect(currentPort).toBe(initialPort);
    expect(currentPort).not.toBe(9999);
    
    // 恢复环境变量
    if (originalPort !== undefined) {
      process.env.API_PORT = originalPort;
    } else {
      delete process.env.API_PORT;
    }
  });

  it('should support configuration reload', async () => {
    // 测试配置重新加载
    const initialPort = memoryConfig.getApiConfig().port;
    
    // 修改环境变量
    const originalPort = process.env.API_PORT;
    process.env.API_PORT = '8080';
    
    // 重新加载配置
    await memoryConfig.reloadConfig();
    
    const newPort = memoryConfig.getApiConfig().port;
    expect(newPort).toBe(8080);
    expect(newPort).not.toBe(initialPort);
    
    // 恢复环境变量
    if (originalPort !== undefined) {
      process.env.API_PORT = originalPort;
    } else {
      delete process.env.API_PORT;
    }
  });

  it('should provide type-safe configuration access', () => {
    // 测试类型安全
    const apiConfig = memoryConfig.getApiConfig();
    const port: number = apiConfig.port;
    const host: string = apiConfig.host;
    const production: boolean = apiConfig.production;

    expect(typeof port).toBe('number');
    expect(typeof host).toBe('string');
    expect(typeof production).toBe('boolean');

    // 测试数据库配置类型安全
    const dbConfig = memoryConfig.getDatabaseConfig();
    const dbPort: number = dbConfig.port;
    const dbHost: string = dbConfig.host;
    const sslMode: boolean = dbConfig.sslMode;

    expect(typeof dbPort).toBe('number');
    expect(typeof dbHost).toBe('string');
    expect(typeof sslMode).toBe('boolean');
  });

  it('should handle configuration status monitoring', () => {
    // 测试配置状态监控
    const status = memoryConfig.getConfigStatus();
    
    expect(status).toHaveProperty('isLoaded');
    expect(status).toHaveProperty('version');
    expect(status).toHaveProperty('loadTime');
    expect(status).toHaveProperty('configKeys');
    expect(status).toHaveProperty('environment');
    
    expect(status.isLoaded).toBe(true);
    expect(status.configKeys).toContain('api');
    expect(status.configKeys).toContain('database');
    expect(status.configKeys).toContain('auth');
  });

  it('should support configuration summary', () => {
    // 测试配置摘要
    const allConfig = memoryConfig.getAllConfig();
    const summary = allConfig.getSummary();
    
    expect(summary).toHaveProperty('version');
    expect(summary).toHaveProperty('environment');
    expect(summary).toHaveProperty('loadTime');
    expect(summary).toHaveProperty('configCount');
    expect(summary).toHaveProperty('isProduction');
    
    expect(typeof summary.version).toBe('string');
    expect(typeof summary.environment).toBe('string');
    expect(typeof summary.configCount).toBe('number');
    expect(typeof summary.isProduction).toBe('boolean');
  });

  it('should handle error scenarios gracefully', () => {
    // 测试错误处理
    expect(() => {
      // 在配置未加载时访问配置应该抛出错误
      const uninitializedService = new MemoryConfigService();
      uninitializedService.getApiConfig();
    }).toThrow('配置未加载到内存中');
  });

  it('should support all configuration types', () => {
    // 测试所有配置类型
    const apiConfig = memoryConfig.getApiConfig();
    const dbConfig = memoryConfig.getDatabaseConfig();
    const mongoConfig = memoryConfig.getMongoDbConfig();
    const redisConfig = memoryConfig.getRedisConfig();
    const authConfig = memoryConfig.getAuthConfig();
    const assetsConfig = memoryConfig.getAssetsConfig();
    const loggingConfig = memoryConfig.getLoggingConfig();
    const featuresConfig = memoryConfig.getFeaturesConfig();

    // 验证所有配置都存在
    expect(apiConfig).toBeDefined();
    expect(dbConfig).toBeDefined();
    expect(mongoConfig).toBeDefined();
    expect(redisConfig).toBeDefined();
    expect(authConfig).toBeDefined();
    expect(assetsConfig).toBeDefined();
    expect(loggingConfig).toBeDefined();
    expect(featuresConfig).toBeDefined();

    // 验证配置属性
    expect(apiConfig.port).toBeDefined();
    expect(dbConfig.host).toBeDefined();
    expect(mongoConfig.host).toBeDefined();
    expect(redisConfig.host).toBeDefined();
    expect(authConfig.jwtSecret).toBeDefined();
    expect(assetsConfig.path).toBeDefined();
    expect(loggingConfig.level).toBeDefined();
    expect(featuresConfig.enableSwagger).toBeDefined();
  });

  it('should maintain configuration consistency across reloads', async () => {
    // 测试配置重新加载的一致性
    const initialConfig = memoryConfig.getAllConfig();
    const initialSummary = initialConfig.getSummary();
    
    // 重新加载配置
    await memoryConfig.reloadConfig();
    
    const reloadedConfig = memoryConfig.getAllConfig();
    const reloadedSummary = reloadedConfig.getSummary();
    
    // 配置结构应该保持一致
    expect(reloadedSummary.configCount).toBe(initialSummary.configCount);
    expect(reloadedConfig.getConfigKeys()).toEqual(initialConfig.getConfigKeys());
    
    // 配置值可能因为环境变量变化而不同，但结构应该一致
    expect(reloadedConfig.getApiConfig()).toBeDefined();
    expect(reloadedConfig.getDatabaseConfig()).toBeDefined();
    expect(reloadedConfig.getAuthConfig()).toBeDefined();
  });
});
