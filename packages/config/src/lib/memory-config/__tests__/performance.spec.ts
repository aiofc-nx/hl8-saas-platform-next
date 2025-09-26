import { MemoryConfigService } from '../memory-config.service.js';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter.js';

describe('Performance Tests', () => {
  let memoryConfig: MemoryConfigService;
  let adapter: ConfigCompatibilityAdapter;

  beforeEach(async () => {
    memoryConfig = new MemoryConfigService();
    adapter = new ConfigCompatibilityAdapter(memoryConfig);
    await memoryConfig.onModuleInit();
  });

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

    // 性能应该相对稳定
    expect(maxTime / minTime).toBeLessThan(10); // 最大时间不应超过最小时间的10倍
    expect(standardDeviation / averageTime).toBeLessThan(0.5); // 变异系数应小于50%
  });

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

    expect(duration).toBeLessThan(200); // 应该在200ms内完成
  });
});
