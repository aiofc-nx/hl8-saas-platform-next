import { Test, TestingModule } from '@nestjs/testing';
import { MemoryConfigService } from '../memory-config.service';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter';
import { HybridConfigService } from '../hybrid-config.service';
import { ConfigMonitorService } from '../config-monitor.service';
import { ConfigService } from '../../config.service';
import { ConfigModule } from '../../config.module';

describe('Memory Config Integration Tests', () => {
  let module: TestingModule;
  let memoryConfig: MemoryConfigService;
  let compatibilityAdapter: ConfigCompatibilityAdapter;
  let hybridConfig: HybridConfigService;
  let configMonitor: ConfigMonitorService;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        MemoryConfigService,
        ConfigCompatibilityAdapter,
        HybridConfigService,
        ConfigMonitorService
      ]
    }).compile();

    memoryConfig = module.get<MemoryConfigService>(MemoryConfigService);
    compatibilityAdapter = module.get<ConfigCompatibilityAdapter>(ConfigCompatibilityAdapter);
    hybridConfig = module.get<HybridConfigService>(HybridConfigService);
    configMonitor = module.get<ConfigMonitorService>(ConfigMonitorService);
    configService = module.get<ConfigService>(ConfigService);

    // 确保配置服务正确初始化
    await memoryConfig.onModuleInit();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Service Integration', () => {
    it('should integrate with ConfigModule', () => {
      expect(memoryConfig).toBeDefined();
      expect(compatibilityAdapter).toBeDefined();
      expect(hybridConfig).toBeDefined();
      expect(configMonitor).toBeDefined();
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
  });

  describe('Configuration Consistency', () => {
    it('should provide consistent configuration across services', () => {
      // 测试配置一致性
      const memoryApiConfig = memoryConfig.getApiConfig();
      const serviceApiConfig = configService.getApiConfig();
      const hybridApiConfig = hybridConfig.getApiConfig();
      const adapterApiConfig = compatibilityAdapter.get('api');

      expect(memoryApiConfig.port).toBe(serviceApiConfig.port);
      expect(serviceApiConfig.port).toBe(hybridApiConfig.port);
      expect(hybridApiConfig.port).toBe(adapterApiConfig.port);
      expect(memoryApiConfig.host).toBe(serviceApiConfig.host);
      expect(serviceApiConfig.host).toBe(hybridApiConfig.host);
      expect(hybridApiConfig.host).toBe(adapterApiConfig.host);
    });

    it('should maintain consistency across all configuration types', () => {
      // 测试所有配置类型的一致性
      const memoryDbConfig = memoryConfig.getDatabaseConfig();
      const serviceDbConfig = configService.getDatabaseConfig();
      const hybridDbConfig = hybridConfig.getDatabaseConfig();

      expect(memoryDbConfig.host).toBe(serviceDbConfig.host);
      expect(serviceDbConfig.host).toBe(hybridDbConfig.host);
      expect(memoryDbConfig.port).toBe(serviceDbConfig.port);
      expect(serviceDbConfig.port).toBe(hybridDbConfig.port);

      const memoryAuthConfig = memoryConfig.getAuthConfig();
      const serviceAuthConfig = configService.getAuthConfig();
      const hybridAuthConfig = hybridConfig.getAuthConfig();

      expect(memoryAuthConfig.jwtSecret).toBe(serviceAuthConfig.jwtSecret);
      expect(serviceAuthConfig.jwtSecret).toBe(hybridAuthConfig.jwtSecret);
    });
  });

  describe('Configuration Isolation', () => {
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

    it('should maintain isolation across all services', () => {
      const initialPort = memoryConfig.getApiConfig().port;
      
      // 修改环境变量
      const originalPort = process.env.API_PORT;
      process.env.API_PORT = '9999';
      
      try {
        // 所有服务都应该返回相同的隔离配置
        expect(memoryConfig.getApiConfig().port).toBe(initialPort);
        expect(configService.getApiConfig().port).toBe(initialPort);
        expect(hybridConfig.getApiConfig().port).toBe(initialPort);
        expect(compatibilityAdapter.get<number>('api.port')).toBe(initialPort);
      } finally {
        // 恢复环境变量
        if (originalPort !== undefined) {
          process.env.API_PORT = originalPort;
        } else {
          delete process.env.API_PORT;
        }
      }
    });
  });

  describe('Configuration Reload', () => {
    it('should support configuration reload', async () => {
      // 测试配置重新加载
      const initialPort = memoryConfig.getApiConfig().port;
      
      // 修改环境变量
      const originalPort = process.env.API_PORT;
      process.env.API_PORT = '8080';
      
      try {
        // 重新加载配置
        await memoryConfig.reloadConfig();
        
        const newPort = memoryConfig.getApiConfig().port;
        expect(newPort).toBe(8080);
        expect(newPort).not.toBe(initialPort);
        
        // 所有服务都应该反映新的配置
        expect(configService.getApiConfig().port).toBe(8080);
        expect(hybridConfig.getApiConfig().port).toBe(8080);
        expect(compatibilityAdapter.get<number>('api.port')).toBe(8080);
      } finally {
        // 恢复环境变量
        if (originalPort !== undefined) {
          process.env.API_PORT = originalPort;
        } else {
          delete process.env.API_PORT;
        }
        await memoryConfig.reloadConfig();
      }
    });

    it('should maintain consistency after reload', async () => {
      const initialConfig = memoryConfig.getAllConfig();
      const initialSummary = initialConfig.getSummary();
      
      // 修改环境变量
      const originalPort = process.env.API_PORT;
      process.env.API_PORT = '8080';
      
      try {
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
      } finally {
        // 恢复环境变量
        if (originalPort !== undefined) {
          process.env.API_PORT = originalPort;
        } else {
          delete process.env.API_PORT;
        }
        await memoryConfig.reloadConfig();
      }
    });
  });

  describe('Type Safety Integration', () => {
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

    it('should maintain type safety across all services', () => {
      // 测试所有服务的类型安全
      const memoryApiConfig = memoryConfig.getApiConfig();
      const serviceApiConfig = configService.getApiConfig();
      const hybridApiConfig = hybridConfig.getApiConfig();

      // 所有服务都应该返回相同类型的配置
      expect(typeof memoryApiConfig.port).toBe('number');
      expect(typeof serviceApiConfig.port).toBe('number');
      expect(typeof hybridApiConfig.port).toBe('number');

      expect(typeof memoryApiConfig.host).toBe('string');
      expect(typeof serviceApiConfig.host).toBe('string');
      expect(typeof hybridApiConfig.host).toBe('string');
    });
  });

  describe('Configuration Status Monitoring', () => {
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

    it('should provide consistent status across services', () => {
      const memoryStatus = memoryConfig.getConfigStatus();
      const adapterStatus = compatibilityAdapter.getConfigStatus();
      
      expect(memoryStatus).toEqual(adapterStatus);
    });
  });

  describe('Configuration Summary', () => {
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
  });

  describe('Error Handling Integration', () => {
    it('should handle error scenarios gracefully', () => {
      // 测试错误处理
      expect(() => {
        // 在配置未加载时访问配置应该抛出错误
        const uninitializedService = new MemoryConfigService();
        uninitializedService.getApiConfig();
      }).toThrow('配置未加载到内存中');
    });

    it('should handle service errors consistently', async () => {
      // 模拟服务错误
      jest.spyOn(memoryConfig, 'getApiConfig').mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => memoryConfig.getApiConfig()).toThrow('Service error');
      expect(() => configService.getApiConfig()).toThrow('Service error');
      expect(() => hybridConfig.getApiConfig()).toThrow('Service error');
    });
  });

  describe('All Configuration Types', () => {
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

    it('should provide consistent access across all services', () => {
      // 测试所有服务都能访问所有配置类型
      const memoryApiConfig = memoryConfig.getApiConfig();
      const serviceApiConfig = configService.getApiConfig();
      const hybridApiConfig = hybridConfig.getApiConfig();

      expect(memoryApiConfig.port).toBe(serviceApiConfig.port);
      expect(serviceApiConfig.port).toBe(hybridApiConfig.port);

      const memoryDbConfig = memoryConfig.getDatabaseConfig();
      const serviceDbConfig = configService.getDatabaseConfig();
      const hybridDbConfig = hybridConfig.getDatabaseConfig();

      expect(memoryDbConfig.host).toBe(serviceDbConfig.host);
      expect(serviceDbConfig.host).toBe(hybridDbConfig.host);
    });
  });

  describe('Configuration Monitoring Integration', () => {
    it('should integrate with configuration monitoring', async () => {
      // 测试配置监控集成
      const healthStatus = await configMonitor.checkConfigHealth();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus).toHaveProperty('isHealthy');
      expect(healthStatus).toHaveProperty('issues');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('duration');
    });

    it('should track performance metrics', () => {
      // 测试性能指标跟踪
      configMonitor.recordPerformanceMetric(5.0, 10);
      
      const metrics = configMonitor.getPerformanceMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].responseTime).toBe(5.0);
      expect(metrics[0].requestCount).toBe(10);
    });

    it('should provide monitoring summary', () => {
      // 测试监控摘要
      const summary = configMonitor.getMonitoringSummary();
      
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('healthRate');
      expect(summary).toHaveProperty('averageResponseTime');
      expect(summary).toHaveProperty('totalRequests');
      expect(summary).toHaveProperty('totalHealthChecks');
      expect(summary).toHaveProperty('totalPerformanceMetrics');
      expect(summary).toHaveProperty('memoryUsage');
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle application startup scenario', async () => {
      // 模拟应用启动场景
      const appConfig = {
        server: {
          port: memoryConfig.getApiConfig().port,
          host: memoryConfig.getApiConfig().host,
          production: memoryConfig.getApiConfig().production
        },
        database: {
          type: memoryConfig.getDatabaseConfig().type,
          host: memoryConfig.getDatabaseConfig().host,
          port: memoryConfig.getDatabaseConfig().port,
          sslMode: memoryConfig.getDatabaseConfig().sslMode
        },
        cache: {
          host: memoryConfig.getRedisConfig().host,
          port: memoryConfig.getRedisConfig().port,
          db: memoryConfig.getRedisConfig().db
        },
        security: {
          jwtSecret: memoryConfig.getAuthConfig().jwtSecret,
          expiresIn: memoryConfig.getAuthConfig().jwtExpiresIn
        }
      };

      expect(appConfig.server.port).toBeDefined();
      expect(appConfig.database.host).toBeDefined();
      expect(appConfig.cache.host).toBeDefined();
      expect(appConfig.security.jwtSecret).toBeDefined();
    });

    it('should handle configuration validation scenario', async () => {
      // 测试配置验证场景
      const validationResult = await configService.validateConfig();
      
      expect(validationResult).toBeDefined();
      expect(validationResult).toHaveProperty('isValid');
      expect(validationResult).toHaveProperty('errors');
    });

    it('should handle health check scenario', async () => {
      // 测试健康检查场景
      const healthStatus = await configService.checkConfigHealth();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus).toHaveProperty('isHealthy');
      expect(healthStatus).toHaveProperty('issues');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('configVersion');
    });
  });
});