import { Test, TestingModule } from '@nestjs/testing';
import { MemoryConfigService } from '../memory-config.service';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter';

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

  describe('get method', () => {
    it('should get config value by path', async () => {
      process.env.API_PORT = '3001';
      await memoryConfig.onModuleInit();

      const port = adapter.get<number>('api.port');
      expect(port).toBe(3001);
    });

    it('should return default value when config not found', async () => {
      await memoryConfig.onModuleInit();
      
      const defaultValue = 8080;
      const port = adapter.get<number>('nonexistent.port', defaultValue);
      expect(port).toBe(defaultValue);
    });

    it('should return undefined when config not found and no default value', async () => {
      await memoryConfig.onModuleInit();
      
      const result = adapter.get('nonexistent.config');
      expect(result).toBeUndefined();
    });

    it('should handle nested path access', async () => {
      process.env.API_PORT = '3001';
      process.env.API_HOST = 'localhost';
      await memoryConfig.onModuleInit();

      const apiConfig = adapter.get('api');
      expect(apiConfig).toBeDefined();
      expect(apiConfig.port).toBe(3001);
      expect(apiConfig.host).toBe('localhost');
    });

    it('should handle deep nested path access', async () => {
      process.env.API_PORT = '3001';
      await memoryConfig.onModuleInit();

      const port = adapter.get<number>('api.port');
      expect(port).toBe(3001);
    });

    it('should support generic type inference', async () => {
      process.env.API_PORT = '3001';
      await memoryConfig.onModuleInit();

      const port = adapter.get<number>('api.port');
      expect(typeof port).toBe('number');
      expect(port).toBe(3001);

      const host = adapter.get<string>('api.host');
      expect(typeof host).toBe('string');
    });

    it('should handle boolean values', async () => {
      process.env.ENABLE_SWAGGER = 'true';
      await memoryConfig.onModuleInit();

      const enableSwagger = adapter.get<boolean>('features.enableSwagger');
      expect(typeof enableSwagger).toBe('boolean');
      expect(enableSwagger).toBe(true);
    });

    it('should handle string values', async () => {
      process.env.DB_HOST = 'test-host';
      await memoryConfig.onModuleInit();

      const host = adapter.get<string>('database.host');
      expect(typeof host).toBe('string');
      expect(host).toBe('test-host');
    });

    it('should handle object values', async () => {
      process.env.API_PORT = '3001';
      process.env.API_HOST = 'localhost';
      await memoryConfig.onModuleInit();

      const apiConfig = adapter.get<object>('api');
      expect(typeof apiConfig).toBe('object');
      expect(apiConfig).toHaveProperty('port');
      expect(apiConfig).toHaveProperty('host');
    });
  });

  describe('has method', () => {
    it('should check if config exists', async () => {
      process.env.API_PORT = '3001';
      await memoryConfig.onModuleInit();

      expect(adapter.has('api.port')).toBe(true);
      expect(adapter.has('nonexistent.port')).toBe(false);
    });

    it('should check nested config existence', async () => {
      await memoryConfig.onModuleInit();

      expect(adapter.has('api')).toBe(true);
      expect(adapter.has('database')).toBe(true);
      expect(adapter.has('auth')).toBe(true);
      expect(adapter.has('nonexistent')).toBe(false);
    });

    it('should handle empty path', async () => {
      await memoryConfig.onModuleInit();

      expect(adapter.has('')).toBe(false);
    });

    it('should handle invalid path format', async () => {
      await memoryConfig.onModuleInit();

      expect(adapter.has('invalid..path')).toBe(false);
      expect(adapter.has('.invalid')).toBe(false);
      expect(adapter.has('invalid.')).toBe(false);
    });
  });

  describe('getAllConfig method', () => {
    it('should get all config', async () => {
      await memoryConfig.onModuleInit();
      
      const allConfig = adapter.getAllConfig();
      expect(allConfig).toHaveProperty('api');
      expect(allConfig).toHaveProperty('database');
      expect(allConfig).toHaveProperty('auth');
      expect(allConfig).toHaveProperty('redis');
      expect(allConfig).toHaveProperty('features');
    });

    it('should return the same instance as memory config', async () => {
      await memoryConfig.onModuleInit();
      
      const adapterConfig = adapter.getAllConfig();
      const memoryConfigAll = memoryConfig.getAllConfig();
      
      expect(adapterConfig).toBe(memoryConfigAll);
    });

    it('should provide config summary', async () => {
      await memoryConfig.onModuleInit();
      
      const allConfig = adapter.getAllConfig();
      const summary = allConfig.getSummary();
      
      expect(summary).toHaveProperty('version');
      expect(summary).toHaveProperty('environment');
      expect(summary).toHaveProperty('configCount');
      expect(summary).toHaveProperty('isProduction');
    });
  });

  describe('getConfigStatus method', () => {
    it('should get config status', async () => {
      await memoryConfig.onModuleInit();
      
      const status = adapter.getConfigStatus();
      expect(status).toHaveProperty('isLoaded');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('loadTime');
      expect(status).toHaveProperty('configKeys');
      expect(status).toHaveProperty('environment');
    });

    it('should return the same status as memory config', async () => {
      await memoryConfig.onModuleInit();
      
      const adapterStatus = adapter.getConfigStatus();
      const memoryStatus = memoryConfig.getConfigStatus();
      
      expect(adapterStatus).toEqual(memoryStatus);
    });

    it('should reflect loading state correctly', async () => {
      // 在初始化前
      let status = adapter.getConfigStatus();
      expect(status.isLoaded).toBe(false);
      
      // 初始化后
      await memoryConfig.onModuleInit();
      status = adapter.getConfigStatus();
      expect(status.isLoaded).toBe(true);
    });
  });

  describe('reloadConfig method', () => {
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

    it('should handle reload errors gracefully', async () => {
      await memoryConfig.onModuleInit();
      
      // 模拟重新加载错误
      jest.spyOn(memoryConfig, 'reloadConfig').mockRejectedValue(new Error('Reload failed'));
      
      await expect(adapter.reloadConfig()).rejects.toThrow('Reload failed');
    });

    it('should maintain config consistency after reload', async () => {
      await memoryConfig.onModuleInit();
      
      const initialConfig = adapter.getAllConfig();
      const initialSummary = initialConfig.getSummary();
      
      // 修改环境变量
      process.env.API_PORT = '8080';
      await adapter.reloadConfig();
      
      const reloadedConfig = adapter.getAllConfig();
      const reloadedSummary = reloadedConfig.getSummary();
      
      // 配置结构应该保持一致
      expect(reloadedSummary.configCount).toBe(initialSummary.configCount);
      expect(reloadedConfig.getConfigKeys()).toEqual(initialConfig.getConfigKeys());
    });
  });

  describe('error handling', () => {
    it('should throw error when accessing config before initialization', () => {
      expect(() => adapter.get('api.port')).toThrow('配置未加载到内存中');
      expect(() => adapter.has('api.port')).toThrow('配置未加载到内存中');
      expect(() => adapter.getAllConfig()).toThrow('配置未加载到内存中');
    });

    it('should handle memory config service errors', async () => {
      await memoryConfig.onModuleInit();
      
      // 模拟内存配置服务错误
      jest.spyOn(memoryConfig, 'getAllConfig').mockImplementation(() => {
        throw new Error('Memory config error');
      });
      
      expect(() => adapter.get('api.port')).toThrow('Memory config error');
    });

    it('should handle nested value access errors', async () => {
      await memoryConfig.onModuleInit();
      
      // 模拟嵌套值访问错误
      jest.spyOn(adapter as any, 'getNestedValue').mockImplementation(() => {
        throw new Error('Nested value error');
      });
      
      expect(() => adapter.get('api.port')).toThrow('Nested value error');
    });
  });

  describe('nested value access', () => {
    it('should handle simple nested paths', async () => {
      process.env.API_PORT = '3001';
      await memoryConfig.onModuleInit();

      const port = adapter.get<number>('api.port');
      expect(port).toBe(3001);
    });

    it('should handle complex nested paths', async () => {
      process.env.API_PORT = '3001';
      process.env.DB_HOST = 'localhost';
      await memoryConfig.onModuleInit();

      const apiPort = adapter.get<number>('api.port');
      const dbHost = adapter.get<string>('database.host');
      
      expect(apiPort).toBe(3001);
      expect(dbHost).toBe('localhost');
    });

    it('should handle non-existent nested paths', async () => {
      await memoryConfig.onModuleInit();

      const result = adapter.get('nonexistent.nested.path');
      expect(result).toBeUndefined();
    });

    it('should handle partial nested paths', async () => {
      await memoryConfig.onModuleInit();

      const result = adapter.get('api.nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('type safety', () => {
    beforeEach(async () => {
      await memoryConfig.onModuleInit();
    });

    it('should maintain type safety for number values', () => {
      const port = adapter.get<number>('api.port');
      expect(typeof port).toBe('number');
    });

    it('should maintain type safety for string values', () => {
      const host = adapter.get<string>('api.host');
      expect(typeof host).toBe('string');
    });

    it('should maintain type safety for boolean values', () => {
      const production = adapter.get<boolean>('api.production');
      expect(typeof production).toBe('boolean');
    });

    it('should maintain type safety for object values', () => {
      const apiConfig = adapter.get<object>('api');
      expect(typeof apiConfig).toBe('object');
      expect(apiConfig).not.toBeNull();
    });

    it('should handle type coercion for default values', () => {
      const port = adapter.get<number>('nonexistent.port', 8080);
      expect(typeof port).toBe('number');
      expect(port).toBe(8080);
    });
  });

  describe('performance', () => {
    it('should provide fast config access', async () => {
      await memoryConfig.onModuleInit();
      
      const iterations = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        adapter.get('api.port');
        adapter.get('database.host');
        adapter.has('auth.jwtSecret');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 1000次访问应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it('should maintain consistent performance across multiple accesses', async () => {
      await memoryConfig.onModuleInit();
      
      const measurements: number[] = [];
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        adapter.get('api.port');
        const endTime = performance.now();
        measurements.push(endTime - startTime);
      }
      
      const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const maxTime = Math.max(...measurements);
      const minTime = Math.min(...measurements);
      
      // 性能应该相对稳定
      expect(maxTime / minTime).toBeLessThan(10);
      expect(averageTime).toBeLessThan(1);
    });
  });

  describe('integration scenarios', () => {
    it('should work with real configuration data', async () => {
      await memoryConfig.onModuleInit();
      
      // 测试真实的配置访问
      const apiConfig = adapter.get('api');
      expect(apiConfig).toBeDefined();
      expect(apiConfig.port).toBeDefined();
      expect(typeof apiConfig.port).toBe('number');

      const dbConfig = adapter.get('database');
      expect(dbConfig).toBeDefined();
      expect(dbConfig.host).toBeDefined();
      expect(typeof dbConfig.host).toBe('string');
    });

    it('should maintain consistency with memory config service', async () => {
      await memoryConfig.onModuleInit();
      
      const adapterApiConfig = adapter.get('api');
      const memoryApiConfig = memoryConfig.getApiConfig();
      
      expect(adapterApiConfig.port).toBe(memoryApiConfig.port);
      expect(adapterApiConfig.host).toBe(memoryApiConfig.host);
    });

    it('should handle configuration reload correctly', async () => {
      await memoryConfig.onModuleInit();
      
      const initialPort = adapter.get<number>('api.port');
      
      // 修改环境变量
      const originalPort = process.env.API_PORT;
      process.env.API_PORT = '8080';
      
      try {
        await adapter.reloadConfig();
        const newPort = adapter.get<number>('api.port');
        expect(newPort).toBe(8080);
        expect(newPort).not.toBe(initialPort);
      } finally {
        // 恢复环境变量
        if (originalPort !== undefined) {
          process.env.API_PORT = originalPort;
        } else {
          delete process.env.API_PORT;
        }
        await adapter.reloadConfig();
      }
    });
  });

  describe('edge cases', () => {
    it('should handle null values', async () => {
      await memoryConfig.onModuleInit();
      
      const result = adapter.get('nonexistent.config', null);
      expect(result).toBeNull();
    });

    it('should handle undefined values', async () => {
      await memoryConfig.onModuleInit();
      
      const result = adapter.get('nonexistent.config', undefined);
      expect(result).toBeUndefined();
    });

    it('should handle empty string values', async () => {
      await memoryConfig.onModuleInit();
      
      const result = adapter.get('nonexistent.config', '');
      expect(result).toBe('');
    });

    it('should handle zero values', async () => {
      await memoryConfig.onModuleInit();
      
      const result = adapter.get('nonexistent.config', 0);
      expect(result).toBe(0);
    });

    it('should handle false values', async () => {
      await memoryConfig.onModuleInit();
      
      const result = adapter.get('nonexistent.config', false);
      expect(result).toBe(false);
    });
  });
});