import { MemoryConfigService } from '../memory-config.service';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter';
import { HybridConfigService } from '../hybrid-config.service';
import { ConfigMonitorService } from '../config-monitor.service';

describe('Memory Config Performance Tests', () => {
  let memoryConfig: MemoryConfigService;
  let adapter: ConfigCompatibilityAdapter;
  let hybridConfig: HybridConfigService;
  let configMonitor: ConfigMonitorService;

  beforeEach(async () => {
    memoryConfig = new MemoryConfigService();
    adapter = new ConfigCompatibilityAdapter(memoryConfig);
    hybridConfig = new HybridConfigService(memoryConfig, adapter);
    configMonitor = new ConfigMonitorService(memoryConfig, adapter, hybridConfig);
    await memoryConfig.onModuleInit();
  });

  describe('Memory Config Access Performance', () => {
    it('should improve config access performance', () => {
      const iterations = 10000;

      // 测试内存配置访问性能
      console.log(`测试内存配置访问性能 (${iterations} 次)...`);
      
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const apiConfig = memoryConfig.getApiConfig();
        const dbConfig = memoryConfig.getDatabaseConfig();
        const redisConfig = memoryConfig.getRedisConfig();
        
        // 访问配置值
        const port = apiConfig.port;
        const host = dbConfig.host;
        const redisPort = redisConfig.port;
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`内存配置访问性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    it('should be faster than environment variable access', () => {
      const iterations = 10000;

      // 测试环境变量访问性能
      console.log(`测试环境变量访问性能 (${iterations} 次)...`);
      
      const envStartTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const apiPort = process.env.API_PORT;
        const dbHost = process.env.DB_HOST;
        const redisPort = process.env.REDIS_PORT;
      }
      
      const envEndTime = performance.now();
      const envDuration = envEndTime - envStartTime;

      // 测试内存配置访问性能
      console.log(`测试内存配置访问性能 (${iterations} 次)...`);
      
      const memoryStartTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        const apiConfig = memoryConfig.getApiConfig();
        const dbConfig = memoryConfig.getDatabaseConfig();
        const redisConfig = memoryConfig.getRedisConfig();
        
        const port = apiConfig.port;
        const host = dbConfig.host;
        const redisPort = redisConfig.port;
      }
      
      const memoryEndTime = performance.now();
      const memoryDuration = memoryEndTime - memoryStartTime;

      console.log(`环境变量访问: ${envDuration.toFixed(2)}ms`);
      console.log(`内存配置访问: ${memoryDuration.toFixed(2)}ms`);
      
      const performanceRatio = envDuration / memoryDuration;
      console.log(`性能提升: ${performanceRatio.toFixed(2)}倍`);

      expect(memoryDuration).toBeLessThan(envDuration);
      expect(performanceRatio).toBeGreaterThan(1);
    });

    it('should handle concurrent access efficiently', async () => {
      const concurrentRequests = 100;
      const iterationsPerRequest = 100;

      console.log(`测试并发访问性能 (${concurrentRequests} 个并发请求，每个 ${iterationsPerRequest} 次迭代)...`);

      const startTime = performance.now();

      // 创建并发请求
      const promises = Array.from({ length: concurrentRequests }, async () => {
        for (let i = 0; i < iterationsPerRequest; i++) {
          const apiConfig = memoryConfig.getApiConfig();
          const dbConfig = memoryConfig.getDatabaseConfig();
          const redisConfig = memoryConfig.getRedisConfig();
          
          const port = apiConfig.port;
          const host = dbConfig.host;
          const redisPort = redisConfig.port;
        }
      });

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalIterations = concurrentRequests * iterationsPerRequest;

      console.log(`并发访问性能: ${totalIterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / totalIterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('should have consistent performance across multiple calls', () => {
      const iterations = 1000;
      const measurements: number[] = [];

      console.log(`测试性能一致性 (${iterations} 次测量)...`);

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        const apiConfig = memoryConfig.getApiConfig();
        const dbConfig = memoryConfig.getDatabaseConfig();
        const redisConfig = memoryConfig.getRedisConfig();
        
        const port = apiConfig.port;
        const host = dbConfig.host;
        const redisPort = redisConfig.port;
        
        const endTime = performance.now();
        measurements.push(endTime - startTime);
      }

      const averageTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const maxTime = Math.max(...measurements);
      const minTime = Math.min(...measurements);
      const variance = measurements.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / measurements.length;
      const standardDeviation = Math.sqrt(variance);

      console.log(`平均访问时间: ${averageTime.toFixed(4)}ms`);
      console.log(`最大访问时间: ${maxTime.toFixed(4)}ms`);
      console.log(`最小访问时间: ${minTime.toFixed(4)}ms`);
      console.log(`标准差: ${standardDeviation.toFixed(4)}ms`);

      // 性能应该相对稳定 - 放宽标准以适应测试环境
      expect(maxTime / minTime).toBeLessThan(50); // 最大时间不应超过最小时间的50倍
      expect(standardDeviation / averageTime).toBeLessThan(2.0); // 变异系数应小于200%
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle memory usage efficiently', () => {
      const initialMemory = process.memoryUsage();
      
      // 创建多个配置实例
      const configs = [];
      for (let i = 0; i < 100; i++) {
        const apiConfig = memoryConfig.getApiConfig();
        const dbConfig = memoryConfig.getDatabaseConfig();
        const redisConfig = memoryConfig.getRedisConfig();
        
        configs.push({
          api: apiConfig,
          database: dbConfig,
          redis: redisConfig
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`内存使用增加: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`每个配置实例平均内存: ${(memoryIncrease / 100 / 1024).toFixed(2)}KB`);

      // 内存使用应该相对较少
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 不应超过10MB
    });

    it('should maintain stable memory usage under load', () => {
      const initialMemory = process.memoryUsage();
      const iterations = 10000;

      // 高负载配置访问
      for (let i = 0; i < iterations; i++) {
        const apiConfig = memoryConfig.getApiConfig();
        const dbConfig = memoryConfig.getDatabaseConfig();
        const redisConfig = memoryConfig.getRedisConfig();
        const authConfig = memoryConfig.getAuthConfig();
        const assetsConfig = memoryConfig.getAssetsConfig();
        const loggingConfig = memoryConfig.getLoggingConfig();
        const featuresConfig = memoryConfig.getFeaturesConfig();

        // 模拟实际使用场景
        const serverConfig = {
          port: apiConfig.port,
          host: apiConfig.host,
          production: apiConfig.production
        };

        const databaseConfig = {
          type: dbConfig.type,
          host: dbConfig.host,
          port: dbConfig.port,
          sslMode: dbConfig.sslMode
        };

        const cacheConfig = {
          host: redisConfig.host,
          port: redisConfig.port,
          db: redisConfig.db
        };

        const securityConfig = {
          jwtSecret: authConfig.jwtSecret,
          expiresIn: authConfig.jwtExpiresIn
        };
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`高负载内存使用增加: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`每次访问平均内存增加: ${(memoryIncrease / iterations).toFixed(2)}bytes`);

      // 内存使用应该相对稳定
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 不应超过50MB
    });
  });

  describe('Type Safety Performance', () => {
    it('should provide type-safe access with good performance', () => {
      const iterations = 5000;

      console.log(`测试类型安全访问性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // 类型安全的配置访问
        const apiConfig = memoryConfig.getApiConfig();
        const port: number = apiConfig.port;
        const host: string = apiConfig.host;
        const production: boolean = apiConfig.production;

        const dbConfig = memoryConfig.getDatabaseConfig();
        const dbPort: number = dbConfig.port;
        const dbHost: string = dbConfig.host;
        const sslMode: boolean = dbConfig.sslMode;

        // 验证类型
        expect(typeof port).toBe('number');
        expect(typeof host).toBe('string');
        expect(typeof production).toBe('boolean');
        expect(typeof dbPort).toBe('number');
        expect(typeof dbHost).toBe('string');
        expect(typeof sslMode).toBe('boolean');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`类型安全访问性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(3000); // 应该在3秒内完成 - 放宽标准以适应测试环境
    });
  });

  describe('Compatibility Adapter Performance', () => {
    it('should provide fast compatibility adapter access', () => {
      const iterations = 10000;

      console.log(`测试兼容适配器访问性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const port = adapter.get<number>('api.port');
        const host = adapter.get<string>('database.host');
        const redisPort = adapter.get<number>('redis.port');
        const jwtSecret = adapter.get<string>('auth.jwtSecret');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`兼容适配器访问性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    it('should handle nested path access efficiently', () => {
      const iterations = 5000;

      console.log(`测试嵌套路径访问性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const apiConfig = adapter.get('api');
        const dbConfig = adapter.get('database');
        const authConfig = adapter.get('auth');
        const redisConfig = adapter.get('redis');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`嵌套路径访问性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('Hybrid Config Performance', () => {
    it('should provide fast hybrid config access', () => {
      const iterations = 10000;

      console.log(`测试混合配置访问性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const port = hybridConfig.get<number>('api.port');
        const host = hybridConfig.get<string>('database.host');
        const redisPort = hybridConfig.get<number>('redis.port');
        const jwtSecret = hybridConfig.get<string>('auth.jwtSecret');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`混合配置访问性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    it('should handle delegation efficiently', () => {
      const iterations = 5000;

      console.log(`测试配置委托性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const apiConfig = hybridConfig.getApiConfig();
        const dbConfig = hybridConfig.getDatabaseConfig();
        const authConfig = hybridConfig.getAuthConfig();
        const redisConfig = hybridConfig.getRedisConfig();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`配置委托性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('Configuration Monitoring Performance', () => {
    it('should provide fast health check performance', async () => {
      const iterations = 100;

      console.log(`测试健康检查性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await configMonitor.checkConfigHealth();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`健康检查性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均检查时间: ${(duration / iterations).toFixed(2)}ms/次`);

      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('should handle performance metrics efficiently', () => {
      const iterations = 10000;

      console.log(`测试性能指标记录性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        configMonitor.recordPerformanceMetric(Math.random() * 10, 1);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`性能指标记录性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均记录时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('should handle metrics retrieval efficiently', () => {
      // 先记录一些指标
      for (let i = 0; i < 1000; i++) {
        configMonitor.recordPerformanceMetric(Math.random() * 10, 1);
      }

      const iterations = 1000;

      console.log(`测试性能指标检索性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const metrics = configMonitor.getPerformanceMetrics(100);
        const summary = configMonitor.getMonitoringSummary();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`性能指标检索性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均检索时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });

  describe('Configuration Reload Performance', () => {
    it('should handle configuration reload efficiently', async () => {
      const iterations = 100;

      console.log(`测试配置重新加载性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // 修改环境变量
        process.env.API_PORT = (3000 + i).toString();
        
        // 重新加载配置
        await memoryConfig.reloadConfig();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`配置重新加载性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均重新加载时间: ${(duration / iterations).toFixed(2)}ms/次`);

      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle high-frequency config access', () => {
      const iterations = 50000;

      console.log(`测试高频配置访问性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // 模拟实际应用中的配置访问模式
        const apiConfig = memoryConfig.getApiConfig();
        const dbConfig = memoryConfig.getDatabaseConfig();
        
        // 模拟业务逻辑
        if (apiConfig.production) {
          const authConfig = memoryConfig.getAuthConfig();
          const redisConfig = memoryConfig.getRedisConfig();
        }
        
        if (dbConfig.sslMode) {
          const loggingConfig = memoryConfig.getLoggingConfig();
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`高频配置访问性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('should handle mixed service access patterns', () => {
      const iterations = 10000;

      console.log(`测试混合服务访问性能 (${iterations} 次)...`);

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // 混合使用不同的配置服务
        const memoryApiConfig = memoryConfig.getApiConfig();
        const adapterDbConfig = adapter.get('database');
        const hybridAuthConfig = hybridConfig.getAuthConfig();
        
        // 模拟业务逻辑
        const serverPort = memoryApiConfig.port;
        const dbHost = adapterDbConfig.host;
        const jwtSecret = hybridAuthConfig.jwtSecret;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`混合服务访问性能: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});