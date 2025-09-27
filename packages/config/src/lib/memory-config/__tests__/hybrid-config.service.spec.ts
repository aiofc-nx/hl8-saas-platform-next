import { Test, TestingModule } from '@nestjs/testing';
import { HybridConfigService } from '../hybrid-config.service';
import { MemoryConfigService } from '../memory-config.service';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter';

describe('HybridConfigService', () => {
  let service: HybridConfigService;
  let memoryConfigService: MemoryConfigService;
  let compatibilityAdapter: ConfigCompatibilityAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HybridConfigService,
        MemoryConfigService,
        ConfigCompatibilityAdapter,
      ],
    }).compile();

    service = module.get<HybridConfigService>(HybridConfigService);
    memoryConfigService = module.get<MemoryConfigService>(MemoryConfigService);
    compatibilityAdapter = module.get<ConfigCompatibilityAdapter>(ConfigCompatibilityAdapter);

    // 确保配置服务正确初始化
    await memoryConfigService.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get method', () => {
    it('should get configuration value by path when memory config is loaded', () => {
      const mockValue = 'test-value';
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockValue);

      const result = service.get<string>('api.port');
      expect(result).toBe(mockValue);
      expect(compatibilityAdapter.get).toHaveBeenCalledWith('api.port', undefined);
    });

    it('should get configuration value with default value when memory config is loaded', () => {
      const mockValue = 'default-value';
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockValue);

      const result = service.get<string>('api.port', 'default-value');
      expect(result).toBe(mockValue);
      expect(compatibilityAdapter.get).toHaveBeenCalledWith('api.port', 'default-value');
    });

    it('should fallback to environment when memory config is not loaded', () => {
      // 模拟内存配置未加载
      jest.spyOn(memoryConfigService, 'getConfigStatus').mockReturnValue({
        isLoaded: false,
        version: '1.0.0',
        loadTime: null,
        configKeys: [],
        environment: 'test'
      });

      // 设置环境变量
      process.env.API_PORT = '8080';

      const result = service.get<number>('api.port', 3000);
      expect(result).toBe(8080);
    });

    it('should return default value when environment variable is not set', () => {
      // 模拟内存配置未加载
      jest.spyOn(memoryConfigService, 'getConfigStatus').mockReturnValue({
        isLoaded: false,
        version: '1.0.0',
        loadTime: null,
        configKeys: [],
        environment: 'test'
      });

      // 确保环境变量不存在
      delete process.env.NONEXISTENT_CONFIG;

      const result = service.get<string>('nonexistent.config', 'default-value');
      expect(result).toBe('default-value');
    });

    it('should support generic type inference', () => {
      const mockValue = 3000;
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockValue);

      const result = service.get<number>('api.port');
      expect(result).toBe(mockValue);
      expect(typeof result).toBe('number');
    });

    it('should handle nested path access', () => {
      const mockValue = { port: 3000, host: 'localhost' };
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockValue);

      const result = service.get<any>('api');
      expect(result).toEqual(mockValue);
    });
  });

  describe('has method', () => {
    it('should check if configuration exists', () => {
      jest.spyOn(compatibilityAdapter, 'has').mockReturnValue(true);

      const result = service.has('api.port');
      expect(result).toBe(true);
      expect(compatibilityAdapter.has).toHaveBeenCalledWith('api.port');
    });

    it('should return false for non-existent configuration', () => {
      jest.spyOn(compatibilityAdapter, 'has').mockReturnValue(false);

      const result = service.has('nonexistent.config');
      expect(result).toBe(false);
      expect(compatibilityAdapter.has).toHaveBeenCalledWith('nonexistent.config');
    });
  });

  describe('configuration delegation methods', () => {
    it('should delegate getApiConfig to memory config service', () => {
      const mockApiConfig = { port: 3000, host: 'localhost' };
      jest.spyOn(memoryConfigService, 'getApiConfig').mockReturnValue(mockApiConfig as any);

      const result = service.getApiConfig();
      expect(result).toEqual(mockApiConfig);
      expect(memoryConfigService.getApiConfig).toHaveBeenCalled();
    });

    it('should delegate getDatabaseConfig to memory config service', () => {
      const mockDbConfig = { host: 'localhost', port: 5432 };
      jest.spyOn(memoryConfigService, 'getDatabaseConfig').mockReturnValue(mockDbConfig as any);

      const result = service.getDatabaseConfig();
      expect(result).toEqual(mockDbConfig);
      expect(memoryConfigService.getDatabaseConfig).toHaveBeenCalled();
    });

    it('should delegate getMongoDbConfig to memory config service', () => {
      const mockMongoConfig = { host: 'localhost', port: 27017 };
      jest.spyOn(memoryConfigService, 'getMongoDbConfig').mockReturnValue(mockMongoConfig as any);

      const result = service.getMongoDbConfig();
      expect(result).toEqual(mockMongoConfig);
      expect(memoryConfigService.getMongoDbConfig).toHaveBeenCalled();
    });

    it('should delegate getRedisConfig to memory config service', () => {
      const mockRedisConfig = { host: 'localhost', port: 6379 };
      jest.spyOn(memoryConfigService, 'getRedisConfig').mockReturnValue(mockRedisConfig as any);

      const result = service.getRedisConfig();
      expect(result).toEqual(mockRedisConfig);
      expect(memoryConfigService.getRedisConfig).toHaveBeenCalled();
    });

    it('should delegate getAuthConfig to memory config service', () => {
      const mockAuthConfig = { jwtSecret: 'secret', jwtExpiresIn: '24h' };
      jest.spyOn(memoryConfigService, 'getAuthConfig').mockReturnValue(mockAuthConfig as any);

      const result = service.getAuthConfig();
      expect(result).toEqual(mockAuthConfig);
      expect(memoryConfigService.getAuthConfig).toHaveBeenCalled();
    });

    it('should delegate getAssetsConfig to memory config service', () => {
      const mockAssetsConfig = { path: './assets', publicPath: '/assets' };
      jest.spyOn(memoryConfigService, 'getAssetsConfig').mockReturnValue(mockAssetsConfig as any);

      const result = service.getAssetsConfig();
      expect(result).toEqual(mockAssetsConfig);
      expect(memoryConfigService.getAssetsConfig).toHaveBeenCalled();
    });

    it('should delegate getLoggingConfig to memory config service', () => {
      const mockLoggingConfig = { level: 'info', format: 'json' };
      jest.spyOn(memoryConfigService, 'getLoggingConfig').mockReturnValue(mockLoggingConfig as any);

      const result = service.getLoggingConfig();
      expect(result).toEqual(mockLoggingConfig);
      expect(memoryConfigService.getLoggingConfig).toHaveBeenCalled();
    });

    it('should delegate getFeaturesConfig to memory config service', () => {
      const mockFeaturesConfig = { enableSwagger: true, enableCors: true };
      jest.spyOn(memoryConfigService, 'getFeaturesConfig').mockReturnValue(mockFeaturesConfig as any);

      const result = service.getFeaturesConfig();
      expect(result).toEqual(mockFeaturesConfig);
      expect(memoryConfigService.getFeaturesConfig).toHaveBeenCalled();
    });

    it('should delegate getAllConfig to memory config service', () => {
      const mockAllConfig = { api: {}, database: {} };
      jest.spyOn(memoryConfigService, 'getAllConfig').mockReturnValue(mockAllConfig as any);

      const result = service.getAllConfig();
      expect(result).toEqual(mockAllConfig);
      expect(memoryConfigService.getAllConfig).toHaveBeenCalled();
    });

    it('should delegate getConfigStatus to memory config service', () => {
      const mockStatus = { isLoaded: true, version: '1.0.0' };
      jest.spyOn(memoryConfigService, 'getConfigStatus').mockReturnValue(mockStatus as any);

      const result = service.getConfigStatus();
      expect(result).toEqual(mockStatus);
      expect(memoryConfigService.getConfigStatus).toHaveBeenCalled();
    });
  });

  describe('reloadConfig method', () => {
    it('should delegate reloadConfig to memory config service', async () => {
      jest.spyOn(memoryConfigService, 'reloadConfig').mockResolvedValue();

      await service.reloadConfig();
      expect(memoryConfigService.reloadConfig).toHaveBeenCalled();
    });

    it('should handle reload errors', async () => {
      const error = new Error('Reload failed');
      jest.spyOn(memoryConfigService, 'reloadConfig').mockRejectedValue(error);

      await expect(service.reloadConfig()).rejects.toThrow('Reload failed');
    });
  });

  describe('environment fallback', () => {
    beforeEach(() => {
      // 模拟内存配置未加载
      jest.spyOn(memoryConfigService, 'getConfigStatus').mockReturnValue({
        isLoaded: false,
        version: '1.0.0',
        loadTime: null,
        configKeys: [],
        environment: 'test'
      });
    });

    it('should get nested values from environment', () => {
      // 设置嵌套环境变量
      process.env.API_PORT = '8080';
      process.env.DB_HOST = 'test-db';

      const port = service.get<number>('api.port', 3000);
      const host = service.get<string>('database.host', 'localhost');

      expect(port).toBe(8080);
      expect(host).toBe('test-db');
    });

    it('should handle missing nested values', () => {
      delete process.env.NONEXISTENT_CONFIG;

      const result = service.get<string>('nonexistent.nested.config', 'default');
      expect(result).toBe('default');
    });

    it('should handle complex nested paths', () => {
      // 模拟复杂嵌套配置
      const mockConfig = {
        api: {
          server: {
            port: 3000,
            host: 'localhost'
          }
        }
      };

      // 由于环境变量不支持复杂嵌套，应该返回默认值
      const result = service.get<any>('api.server.port', 8080);
      expect(result).toBe(8080);
    });
  });

  describe('type safety', () => {
    it('should maintain type safety for string values', () => {
      const mockValue = 'string-value';
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockValue);

      const result = service.get<string>('test.path');
      expect(typeof result).toBe('string');
      expect(result).toBe(mockValue);
    });

    it('should maintain type safety for number values', () => {
      const mockValue = 123;
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockValue);

      const result = service.get<number>('test.path');
      expect(typeof result).toBe('number');
      expect(result).toBe(mockValue);
    });

    it('should maintain type safety for boolean values', () => {
      const mockValue = true;
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockValue);

      const result = service.get<boolean>('test.path');
      expect(typeof result).toBe('boolean');
      expect(result).toBe(mockValue);
    });

    it('should maintain type safety for object values', () => {
      const mockObject = { key: 'value', nested: { prop: 123 } };
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockObject);

      const result = service.get<typeof mockObject>('test.path');
      expect(typeof result).toBe('object');
      expect(result).toEqual(mockObject);
    });

    it('should maintain type safety for array values', () => {
      const mockArray = [1, 2, 3, 'test'];
      jest.spyOn(compatibilityAdapter, 'get').mockReturnValue(mockArray);

      const result = service.get<typeof mockArray>('test.path');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockArray);
    });
  });

  describe('error handling', () => {
    it('should handle errors from compatibility adapter', () => {
      jest.spyOn(compatibilityAdapter, 'get').mockImplementation(() => {
        throw new Error('Adapter error');
      });

      expect(() => service.get('test.path')).toThrow('Adapter error');
    });

    it('should handle errors from has method', () => {
      jest.spyOn(compatibilityAdapter, 'has').mockImplementation(() => {
        throw new Error('Has method error');
      });

      expect(() => service.has('test.path')).toThrow('Has method error');
    });

    it('should handle errors from memory config service delegation', () => {
      jest.spyOn(memoryConfigService, 'getApiConfig').mockImplementation(() => {
        throw new Error('Memory config error');
      });

      expect(() => service.getApiConfig()).toThrow('Memory config error');
    });
  });

  describe('integration scenarios', () => {
    it('should work with real configuration data', () => {
      // 使用真实的配置数据
      const apiConfig = service.getApiConfig();
      expect(apiConfig).toBeDefined();
      expect(apiConfig.port).toBeDefined();
      expect(typeof apiConfig.port).toBe('number');

      const dbConfig = service.getDatabaseConfig();
      expect(dbConfig).toBeDefined();
      expect(dbConfig.host).toBeDefined();
      expect(typeof dbConfig.host).toBe('string');
    });

    it('should maintain consistency between get and specific methods', () => {
      const apiConfigFromGet = service.get('api');
      const apiConfigFromMethod = service.getApiConfig();

      expect(apiConfigFromGet.port).toBe(apiConfigFromMethod.port);
      expect(apiConfigFromGet.host).toBe(apiConfigFromMethod.host);
    });

    it('should handle configuration reload correctly', async () => {
      const initialPort = service.getApiConfig().port;

      // 修改环境变量
      const originalPort = process.env.API_PORT;
      process.env.API_PORT = '8080';

      try {
        await service.reloadConfig();
        const newPort = service.getApiConfig().port;
        expect(newPort).toBe(8080);
        expect(newPort).not.toBe(initialPort);
      } finally {
        // 恢复环境变量
        if (originalPort !== undefined) {
          process.env.API_PORT = originalPort;
        } else {
          delete process.env.API_PORT;
        }
        await service.reloadConfig();
      }
    });
  });
});