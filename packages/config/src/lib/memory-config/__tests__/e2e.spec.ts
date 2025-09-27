import { Test, TestingModule } from '@nestjs/testing';
import { MemoryConfigService } from '../memory-config.service';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter';
import { HybridConfigService } from '../hybrid-config.service';
import { ConfigService } from '../../config.service';
import { ConfigModule } from '../../config.module';

/**
 * 端到端测试
 *
 * @description 测试完整的应用流程，包括配置加载、访问、隔离和性能
 */
describe('End-to-End Tests', () => {
  let module: TestingModule;
  let memoryConfig: MemoryConfigService;
  let compatibilityAdapter: ConfigCompatibilityAdapter;
  let hybridConfig: HybridConfigService;
  let configService: ConfigService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule]
    }).compile();

    memoryConfig = module.get<MemoryConfigService>(MemoryConfigService);
    compatibilityAdapter = module.get<ConfigCompatibilityAdapter>(ConfigCompatibilityAdapter);
    hybridConfig = module.get<HybridConfigService>(HybridConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Complete Application Flow', () => {
    it('should handle complete application startup flow', async () => {
      console.log('🚀 测试完整应用启动流程...');

      // 1. 配置服务初始化
      expect(memoryConfig).toBeDefined();
      expect(compatibilityAdapter).toBeDefined();
      expect(hybridConfig).toBeDefined();
      expect(configService).toBeDefined();

      // 2. 配置加载验证
      const status = memoryConfig.getConfigStatus();
      expect(status.isLoaded).toBe(true);
      expect(status.configKeys.length).toBeGreaterThan(0);

      // 3. 配置访问验证
      const apiConfig = memoryConfig.getApiConfig();
      const dbConfig = memoryConfig.getDatabaseConfig();
      const authConfig = memoryConfig.getAuthConfig();

      expect(apiConfig.port).toBeDefined();
      expect(dbConfig.host).toBeDefined();
      expect(authConfig.jwtSecret).toBeDefined();

      console.log('✅ 应用启动流程测试完成');
    });

    it('should handle configuration access in real-world scenarios', () => {
      console.log('🌍 测试真实世界配置访问场景...');

      // 模拟应用服务使用配置
      class MockAppService {
        constructor(private readonly config: MemoryConfigService) {}

        initialize() {
          const apiConfig = this.config.getApiConfig();
          const dbConfig = this.config.getDatabaseConfig();
          const authConfig = this.config.getAuthConfig();

          return {
            server: {
              port: apiConfig.port,
              host: apiConfig.host,
              production: apiConfig.production
            },
            database: {
              type: dbConfig.type,
              host: dbConfig.host,
              port: dbConfig.port,
              name: dbConfig.name
            },
            auth: {
              jwtSecret: authConfig.jwtSecret,
              expiresIn: authConfig.jwtExpiresIn
            }
          };
        }
      }

      // 模拟数据库服务使用配置
      class MockDatabaseService {
        constructor(private readonly config: MemoryConfigService) {}

        getConnectionString() {
          const dbConfig = this.config.getDatabaseConfig();
          return `${dbConfig.type}://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`;
        }
      }

      // 模拟认证服务使用配置
      class MockAuthService {
        constructor(private readonly config: MemoryConfigService) {}

        getJwtConfig() {
          const authConfig = this.config.getAuthConfig();
          return {
            secret: authConfig.jwtSecret,
            expiresIn: authConfig.jwtExpiresIn,
            saltRounds: authConfig.passwordSaltRounds
          };
        }
      }

      // 测试服务初始化
      const appService = new MockAppService(memoryConfig);
      const dbService = new MockDatabaseService(memoryConfig);
      const authService = new MockAuthService(memoryConfig);

      const appConfig = appService.initialize();
      const connectionString = dbService.getConnectionString();
      const jwtConfig = authService.getJwtConfig();

      expect(appConfig.server.port).toBeDefined();
      expect(connectionString).toContain('://');
      expect(jwtConfig.secret).toBeDefined();

      console.log('✅ 真实世界配置访问场景测试完成');
    });

    it('should handle configuration isolation in production scenarios', () => {
      console.log('🔒 测试生产环境配置隔离场景...');

      // 记录初始配置
      const initialApiConfig = memoryConfig.getApiConfig();
      const initialDbConfig = memoryConfig.getDatabaseConfig();
      const initialAuthConfig = memoryConfig.getAuthConfig();

      console.log('初始配置:', {
        apiPort: initialApiConfig.port,
        dbHost: initialDbConfig.host,
        jwtSecret: initialAuthConfig.jwtSecret.substring(0, 10) + '...'
      });

      // 模拟生产环境中环境变量被意外修改
      const originalEnv = {
        API_PORT: process.env.API_PORT,
        DB_HOST: process.env.DB_HOST,
        JWT_SECRET: process.env.JWT_SECRET
      };

      process.env.API_PORT = '9999';
      process.env.DB_HOST = 'hacked-db';
      process.env.JWT_SECRET = 'hacked-secret';

      // 验证配置隔离
      const currentApiConfig = memoryConfig.getApiConfig();
      const currentDbConfig = memoryConfig.getDatabaseConfig();
      const currentAuthConfig = memoryConfig.getAuthConfig();

      expect(currentApiConfig.port).toBe(initialApiConfig.port);
      expect(currentDbConfig.host).toBe(initialDbConfig.host);
      expect(currentAuthConfig.jwtSecret).toBe(initialAuthConfig.jwtSecret);

      console.log('隔离后配置:', {
        apiPort: currentApiConfig.port,
        dbHost: currentDbConfig.host,
        jwtSecret: currentAuthConfig.jwtSecret.substring(0, 10) + '...'
      });

      // 恢复环境变量
      if (originalEnv.API_PORT !== undefined) {
        process.env.API_PORT = originalEnv.API_PORT;
      } else {
        delete process.env.API_PORT;
      }
      if (originalEnv.DB_HOST !== undefined) {
        process.env.DB_HOST = originalEnv.DB_HOST;
      } else {
        delete process.env.DB_HOST;
      }
      if (originalEnv.JWT_SECRET !== undefined) {
        process.env.JWT_SECRET = originalEnv.JWT_SECRET;
      } else {
        delete process.env.JWT_SECRET;
      }

      console.log('✅ 生产环境配置隔离场景测试完成');
    });

    it('should handle configuration performance under load', () => {
      console.log('⚡ 测试高负载配置性能...');

      const iterations = 10000;
      const startTime = performance.now();

      // 模拟高负载配置访问
      for (let i = 0; i < iterations; i++) {
        const apiConfig = memoryConfig.getApiConfig();
        const dbConfig = memoryConfig.getDatabaseConfig();
        const redisConfig = memoryConfig.getRedisConfig();
        const authConfig = memoryConfig.getAuthConfig();

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

        // 验证配置值
        expect(serverConfig.port).toBeDefined();
        expect(databaseConfig.host).toBeDefined();
        expect(cacheConfig.host).toBeDefined();
        expect(securityConfig.jwtSecret).toBeDefined();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`高负载性能测试: ${iterations}次 = ${duration.toFixed(2)}ms`);
      console.log(`平均访问时间: ${(duration / iterations).toFixed(4)}ms/次`);

      // 性能应该满足要求
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
      expect(duration / iterations).toBeLessThan(0.1); // 平均每次访问应小于0.1ms
    });

    it('should handle configuration error scenarios', () => {
      console.log('🚨 测试配置错误场景...');

      // 测试未初始化配置服务
      const uninitializedService = new MemoryConfigService();
      
      expect(() => {
        uninitializedService.getApiConfig();
      }).toThrow('配置未加载到内存中');

      // 测试配置状态
      const status = uninitializedService.getConfigStatus();
      expect(status.isLoaded).toBe(false);

      console.log('✅ 配置错误场景测试完成');
    });

    it('should handle configuration reload scenarios', async () => {
      console.log('🔄 测试配置重新加载场景...');

      // 记录初始配置
      const initialPort = memoryConfig.getApiConfig().port;
      const initialHost = memoryConfig.getDatabaseConfig().host;

      console.log('初始配置:', {
        apiPort: initialPort,
        dbHost: initialHost
      });

      // 修改环境变量
      const originalPort = process.env.API_PORT;
      const originalHost = process.env.DB_HOST;

      process.env.API_PORT = '8080';
      process.env.DB_HOST = 'new-db-host';

      // 重新加载配置
      await memoryConfig.reloadConfig();

      // 验证配置已更新
      const newPort = memoryConfig.getApiConfig().port;
      const newHost = memoryConfig.getDatabaseConfig().host;

      expect(newPort).toBe(8080);
      expect(newHost).toBe('new-db-host');
      expect(newPort).not.toBe(initialPort);
      expect(newHost).not.toBe(initialHost);

      console.log('重新加载后配置:', {
        apiPort: newPort,
        dbHost: newHost
      });

      // 恢复环境变量
      if (originalPort !== undefined) {
        process.env.API_PORT = originalPort;
      } else {
        delete process.env.API_PORT;
      }
      if (originalHost !== undefined) {
        process.env.DB_HOST = originalHost;
      } else {
        delete process.env.DB_HOST;
      }

      console.log('✅ 配置重新加载场景测试完成');
    });

    it('should handle configuration consistency across services', () => {
      console.log('🔄 测试跨服务配置一致性...');

      // 测试所有配置服务的一致性
      const memoryApiConfig = memoryConfig.getApiConfig();
      const adapterApiConfig = compatibilityAdapter.get('api');
      const hybridApiConfig = hybridConfig.getApiConfig();
      const serviceApiConfig = configService.getApiConfig();

      // 验证配置一致性
      expect(memoryApiConfig.port).toBe(adapterApiConfig.port);
      expect(adapterApiConfig.port).toBe(hybridApiConfig.port);
      expect(hybridApiConfig.port).toBe(serviceApiConfig.port);

      expect(memoryApiConfig.host).toBe(adapterApiConfig.host);
      expect(adapterApiConfig.host).toBe(hybridApiConfig.host);
      expect(hybridApiConfig.host).toBe(serviceApiConfig.host);

      console.log('配置一致性验证:', {
        memoryPort: memoryApiConfig.port,
        adapterPort: adapterApiConfig.port,
        hybridPort: hybridApiConfig.port,
        servicePort: serviceApiConfig.port
      });

      console.log('✅ 跨服务配置一致性测试完成');
    });

    it('should handle configuration monitoring and health checks', () => {
      console.log('📊 测试配置监控和健康检查...');

      // 测试配置状态监控
      const status = memoryConfig.getConfigStatus();
      expect(status.isLoaded).toBe(true);
      expect(status.configKeys.length).toBeGreaterThan(0);
      expect(status.environment).toBeDefined();

      // 测试配置摘要
      const allConfig = memoryConfig.getAllConfig();
      const summary = allConfig.getSummary();
      expect(summary.version).toBeDefined();
      expect(summary.environment).toBeDefined();
      expect(summary.configCount).toBeGreaterThan(0);
      expect(typeof summary.isProduction).toBe('boolean');

      // 测试配置健康检查
      const healthStatus = configService.checkConfigHealth();
      expect(healthStatus).toHaveProperty('isHealthy');
      expect(healthStatus).toHaveProperty('issues');
      expect(healthStatus).toHaveProperty('timestamp');

      console.log('配置监控信息:', {
        status: status.isLoaded,
        version: status.version,
        environment: status.environment,
        configKeys: status.configKeys.length,
        summary: summary,
        health: healthStatus.isHealthy
      });

      console.log('✅ 配置监控和健康检查测试完成');
    });
  });
});
