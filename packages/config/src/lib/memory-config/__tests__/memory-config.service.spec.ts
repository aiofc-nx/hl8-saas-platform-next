import { Test, TestingModule } from '@nestjs/testing';
import { MemoryConfigService } from '../memory-config.service';

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

  describe('onModuleInit', () => {
    it('should load config to memory on module initialization', async () => {
      // 设置测试环境变量
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

    it('should handle initialization errors gracefully', async () => {
      // 模拟环境变量读取错误
      const originalEnv = process.env;
      process.env = {}; // 清空环境变量

      try {
        await expect(service.onModuleInit()).resolves.not.toThrow();
        
        // 即使环境变量为空，服务也应该正常初始化
        const status = service.getConfigStatus();
        expect(status.isLoaded).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('config isolation', () => {
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

    it('should maintain isolation across multiple config accesses', async () => {
      process.env.API_PORT = '3000';
      process.env.DB_HOST = 'initial-host';
      await service.onModuleInit();

      const initialApiPort = service.getApiConfig().port;
      const initialDbHost = service.getDatabaseConfig().host;

      // 修改环境变量
      process.env.API_PORT = '9999';
      process.env.DB_HOST = 'modified-host';

      // 多次访问配置，都应该返回初始值
      for (let i = 0; i < 5; i++) {
        expect(service.getApiConfig().port).toBe(initialApiPort);
        expect(service.getDatabaseConfig().host).toBe(initialDbHost);
      }
    });
  });

  describe('type-safe config access', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should provide type-safe API config access', () => {
      const apiConfig = service.getApiConfig();
      
      // 这些访问都是类型安全的
      const port: number = apiConfig.port;
      const host: string = apiConfig.host;
      const production: boolean = apiConfig.production;

      expect(typeof port).toBe('number');
      expect(typeof host).toBe('string');
      expect(typeof production).toBe('boolean');
    });

    it('should provide type-safe database config access', () => {
      const dbConfig = service.getDatabaseConfig();
      
      const port: number = dbConfig.port;
      const host: string = dbConfig.host;
      const sslMode: boolean = dbConfig.sslMode;
      const poolSize: number = dbConfig.poolSize;

      expect(typeof port).toBe('number');
      expect(typeof host).toBe('string');
      expect(typeof sslMode).toBe('boolean');
      expect(typeof poolSize).toBe('number');
    });

    it('should provide type-safe auth config access', () => {
      const authConfig = service.getAuthConfig();
      
      const jwtSecret: string = authConfig.jwtSecret;
      const jwtExpiresIn: string = authConfig.jwtExpiresIn;
      const passwordSaltRounds: number = authConfig.passwordSaltRounds;

      expect(typeof jwtSecret).toBe('string');
      expect(typeof jwtExpiresIn).toBe('string');
      expect(typeof passwordSaltRounds).toBe('number');
    });

    it('should provide type-safe Redis config access', () => {
      const redisConfig = service.getRedisConfig();
      
      const host: string = redisConfig.host;
      const port: number = redisConfig.port;
      const db: number = redisConfig.db;

      expect(typeof host).toBe('string');
      expect(typeof port).toBe('number');
      expect(typeof db).toBe('number');
    });

    it('should provide type-safe MongoDB config access', () => {
      const mongoConfig = service.getMongoDbConfig();
      
      const host: string = mongoConfig.host;
      const port: number = mongoConfig.port;
      const sslMode: boolean = mongoConfig.sslMode;

      expect(typeof host).toBe('string');
      expect(typeof port).toBe('number');
      expect(typeof sslMode).toBe('boolean');
    });

    it('should provide type-safe assets config access', () => {
      const assetsConfig = service.getAssetsConfig();
      
      const path: string = assetsConfig.path;
      const publicPath: string = assetsConfig.publicPath;
      const maxFileSize: number = assetsConfig.maxFileSize;

      expect(typeof path).toBe('string');
      expect(typeof publicPath).toBe('string');
      expect(typeof maxFileSize).toBe('number');
    });

    it('should provide type-safe logging config access', () => {
      const loggingConfig = service.getLoggingConfig();
      
      const level: string = loggingConfig.level;
      const format: string = loggingConfig.format;
      const maxFiles: number = loggingConfig.maxFiles;

      expect(typeof level).toBe('string');
      expect(typeof format).toBe('string');
      expect(typeof maxFiles).toBe('number');
    });

    it('should provide type-safe features config access', () => {
      const featuresConfig = service.getFeaturesConfig();
      
      const enableSwagger: boolean = featuresConfig.enableSwagger;
      const enableMetrics: boolean = featuresConfig.enableMetrics;
      const enableCors: boolean = featuresConfig.enableCors;

      expect(typeof enableSwagger).toBe('boolean');
      expect(typeof enableMetrics).toBe('boolean');
      expect(typeof enableCors).toBe('boolean');
    });
  });

  describe('config status', () => {
    it('should get config status before initialization', () => {
      const status = service.getConfigStatus();
      
      expect(status).toHaveProperty('isLoaded');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('loadTime');
      expect(status).toHaveProperty('configKeys');
      expect(status).toHaveProperty('environment');
      
      expect(status.isLoaded).toBe(false);
      expect(status.configKeys).toEqual([]);
    });

    it('should get config status after initialization', async () => {
      await service.onModuleInit();
      
      const status = service.getConfigStatus();
      
      expect(status.isLoaded).toBe(true);
      expect(status.version).toBeDefined();
      expect(status.loadTime).toBeInstanceOf(Date);
      expect(status.configKeys.length).toBeGreaterThan(0);
      expect(status.environment).toBeDefined();
    });

    it('should include all config keys in status', async () => {
      await service.onModuleInit();
      
      const status = service.getConfigStatus();
      const expectedKeys = [
        'version',
        'environment',
        'loadTime',
        'api',
        'database',
        'mongodb',
        'redis',
        'auth',
        'assets',
        'logging',
        'features'
      ];
      
      expectedKeys.forEach(key => {
        expect(status.configKeys).toContain(key);
      });
    });
  });

  describe('getAllConfig', () => {
    it('should get all config before initialization', () => {
      expect(() => service.getAllConfig()).toThrow('配置未加载到内存中');
    });

    it('should get all config after initialization', async () => {
      await service.onModuleInit();
      
      const allConfig = service.getAllConfig();
      
      expect(allConfig).toHaveProperty('api');
      expect(allConfig).toHaveProperty('database');
      expect(allConfig).toHaveProperty('auth');
      expect(allConfig).toHaveProperty('redis');
      expect(allConfig).toHaveProperty('features');
      expect(allConfig).toHaveProperty('version');
      expect(allConfig).toHaveProperty('environment');
    });

    it('should provide config summary', async () => {
      await service.onModuleInit();
      
      const allConfig = service.getAllConfig();
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
  });

  describe('reloadConfig', () => {
    it('should reload config successfully', async () => {
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

    it('should handle reload errors gracefully', async () => {
      await service.onModuleInit();
      
      // 模拟环境变量读取错误
      const originalEnv = process.env;
      process.env = {}; // 清空环境变量

      try {
        await expect(service.reloadConfig()).resolves.not.toThrow();
        
        // 重新加载后配置应该仍然可用
        const status = service.getConfigStatus();
        expect(status.isLoaded).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    });

    it('should maintain config isolation after reload', async () => {
      await service.onModuleInit();
      
      const initialPort = service.getApiConfig().port;
      
      // 修改环境变量
      process.env.API_PORT = '8080';
      await service.reloadConfig();
      
      const reloadedPort = service.getApiConfig().port;
      expect(reloadedPort).toBe(8080);
      
      // 再次修改环境变量
      process.env.API_PORT = '9999';
      
      // 配置应该不受影响
      const currentPort = service.getApiConfig().port;
      expect(currentPort).toBe(8080);
      expect(currentPort).not.toBe(9999);
    });
  });

  describe('error handling', () => {
    it('should throw error when accessing config before initialization', () => {
      expect(() => service.getApiConfig()).toThrow('配置未加载到内存中');
      expect(() => service.getDatabaseConfig()).toThrow('配置未加载到内存中');
      expect(() => service.getAuthConfig()).toThrow('配置未加载到内存中');
      expect(() => service.getAllConfig()).toThrow('配置未加载到内存中');
    });

    it('should handle invalid environment variable values', async () => {
      // 设置无效的环境变量值
      process.env.API_PORT = 'invalid-port';
      process.env.DB_PORT = 'not-a-number';
      
      await expect(service.onModuleInit()).resolves.not.toThrow();
      
      // 应该使用默认值
      const apiConfig = service.getApiConfig();
      const dbConfig = service.getDatabaseConfig();
      
      expect(typeof apiConfig.port).toBe('number');
      expect(typeof dbConfig.port).toBe('number');
    });
  });

  describe('performance', () => {
    it('should provide fast config access', async () => {
      await service.onModuleInit();
      
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        service.getApiConfig();
        service.getDatabaseConfig();
        service.getAuthConfig();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次访问应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it('should maintain consistent performance across multiple accesses', async () => {
      await service.onModuleInit();
      
      const measurements: number[] = [];
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        service.getApiConfig();
        const endTime = performance.now();
        measurements.push(endTime - startTime);
      }
      
      const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const maxTime = Math.max(...measurements);
      const minTime = Math.min(...measurements);
      
      // 性能应该相对稳定
      expect(maxTime / minTime).toBeLessThan(10); // 最大时间不应超过最小时间的10倍
      expect(averageTime).toBeLessThan(1); // 平均访问时间应小于1ms
    });
  });

  describe('configuration validation', () => {
    it('should validate configuration structure', async () => {
      await service.onModuleInit();
      
      const allConfig = service.getAllConfig();
      
      // 验证配置结构
      expect(allConfig.api).toBeDefined();
      expect(allConfig.database).toBeDefined();
      expect(allConfig.auth).toBeDefined();
      expect(allConfig.redis).toBeDefined();
      expect(allConfig.mongodb).toBeDefined();
      expect(allConfig.assets).toBeDefined();
      expect(allConfig.logging).toBeDefined();
      expect(allConfig.features).toBeDefined();
    });

    it('should validate configuration values', async () => {
      await service.onModuleInit();
      
      const apiConfig = service.getApiConfig();
      const dbConfig = service.getDatabaseConfig();
      const authConfig = service.getAuthConfig();
      
      // 验证API配置
      expect(apiConfig.port).toBeGreaterThan(0);
      expect(apiConfig.port).toBeLessThanOrEqual(65535);
      expect(apiConfig.host).toBeTruthy();
      
      // 验证数据库配置
      expect(dbConfig.port).toBeGreaterThan(0);
      expect(dbConfig.port).toBeLessThanOrEqual(65535);
      expect(dbConfig.host).toBeTruthy();
      expect(dbConfig.poolSize).toBeGreaterThan(0);
      
      // 验证认证配置
      expect(authConfig.jwtSecret).toBeTruthy();
      expect(authConfig.passwordSaltRounds).toBeGreaterThan(0);
    });
  });

  describe('environment-specific behavior', () => {
    it('should handle development environment', async () => {
      process.env.NODE_ENV = 'development';
      await service.onModuleInit();
      
      const apiConfig = service.getApiConfig();
      expect(apiConfig.production).toBe(false);
      expect(apiConfig.envName).toBe('development');
    });

    it('should handle production environment', async () => {
      process.env.NODE_ENV = 'production';
      await service.onModuleInit();
      
      const apiConfig = service.getApiConfig();
      expect(apiConfig.production).toBe(true);
      expect(apiConfig.envName).toBe('production');
    });

    it('should handle test environment', async () => {
      process.env.NODE_ENV = 'test';
      await service.onModuleInit();
      
      const apiConfig = service.getApiConfig();
      expect(apiConfig.envName).toBe('test');
    });
  });
});