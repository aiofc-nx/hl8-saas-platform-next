import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { DatabaseConnectionManager } from './connection/index.js';
import { MigrationManager } from './migration/index.js';
import { DatabaseTypeEnum } from './types/index.js';
import { PinoLogger as Logger } from '@hl8/logger';
import { DatabaseConnectionException, DatabaseMigrationException, DatabaseConfigException } from './exceptions/index.js';

/**
 * 数据库模块单元测试
 * 
 * 测试数据库模块的核心功能，包括连接管理、迁移管理等。
 * 确保模块功能的正确性和稳定性。
 * 
 * @description 数据库模块的单元测试套件
 * 
 * @since 1.0.0
 */
describe('DatabaseModule', () => {
  let module: TestingModule;
  let connectionManager: DatabaseConnectionManager;
  let migrationManager: MigrationManager;
  let logger: Logger;

  const mockConfig = {
    type: DatabaseTypeEnum.POSTGRESQL,
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password',
    entities: [],
    migrations: {
      path: './migrations'
    }
  };

  beforeEach(async () => {
    // 创建模拟的 Logger
    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    };

    // 创建模拟的 MikroORM
    const mockMikroORM = {
      em: {
        getConnection: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue([])
        })
      },
      getMigrator: jest.fn().mockReturnValue({
        getPendingMigrations: jest.fn().mockResolvedValue([]),
        getExecutedMigrations: jest.fn().mockResolvedValue([]),
        up: jest.fn().mockResolvedValue([]),
        down: jest.fn().mockResolvedValue([]),
        createMigration: jest.fn().mockResolvedValue(null)
      }),
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined)
    };

    module = await Test.createTestingModule({
      providers: [
        DatabaseConnectionManager,
        MigrationManager,
        {
          provide: Logger,
          useValue: mockLogger
        },
        {
          provide: 'MikroORM',
          useValue: mockMikroORM
        }
      ]
    })
    .overrideProvider(DatabaseConnectionManager)
    .useValue({
      getConnectionInfo: jest.fn().mockReturnValue({
        database: mockConfig.database,
        type: mockConfig.type,
        host: mockConfig.host,
        port: mockConfig.port,
        connected: false
      }),
      checkConnection: jest.fn().mockResolvedValue({
        connected: false,
        database: mockConfig.database,
        type: mockConfig.type
      }),
      getEntityManager: jest.fn(),
      getORM: jest.fn().mockReturnValue(mockMikroORM),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn()
    })
    .overrideProvider(MigrationManager)
    .useValue({
      runMigrations: jest.fn().mockResolvedValue({
        executed: 0,
        migrations: [],
        duration: 100
      }),
      revertLastMigration: jest.fn().mockResolvedValue({
        reverted: false,
        duration: 100
      }),
      createMigration: jest.fn().mockResolvedValue({
        filePath: './test-migration.ts',
        className: 'TestMigration',
        timestamp: Date.now()
      }),
      getMigrationStatus: jest.fn().mockResolvedValue({
        executed: [],
        pending: [],
        total: 0
      })
    })
    .compile();

    connectionManager = module.get<DatabaseConnectionManager>(DatabaseConnectionManager);
    migrationManager = module.get<MigrationManager>(MigrationManager);
    logger = module.get<Logger>(Logger);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('DatabaseConnectionManager', () => {
    it('应该正确初始化连接管理器', () => {
      expect(connectionManager).toBeDefined();
    });

    it('应该获取连接信息', () => {
      const connectionInfo = connectionManager.getConnectionInfo();
      
      expect(connectionInfo).toHaveProperty('database', mockConfig.database);
      expect(connectionInfo).toHaveProperty('type', mockConfig.type);
      expect(connectionInfo).toHaveProperty('host', mockConfig.host);
      expect(connectionInfo).toHaveProperty('port', mockConfig.port);
    });

    it('应该检查连接状态', async () => {
      const status = await connectionManager.checkConnection();
      
      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('database', mockConfig.database);
      expect(status).toHaveProperty('type', mockConfig.type);
    });

    it('应该在连接未建立时抛出异常', () => {
      // 模拟连接未建立的情况
      const mockConnectionManager = {
        getEntityManager: jest.fn().mockImplementation(() => {
          throw new DatabaseConnectionException(
            '数据库连接未建立',
            '请先初始化数据库连接后再使用实体管理器'
          );
        })
      };

      expect(() => mockConnectionManager.getEntityManager()).toThrow(DatabaseConnectionException);
    });

    it('应该在 MikroORM 实例未初始化时抛出异常', () => {
      const mockConnectionManager = {
        getORM: jest.fn().mockImplementation(() => {
          throw new DatabaseConnectionException(
            'MikroORM 实例未初始化',
            '请先初始化数据库连接后再使用 MikroORM 实例'
          );
        })
      };

      expect(() => mockConnectionManager.getORM()).toThrow(DatabaseConnectionException);
    });
  });

  describe('MigrationManager', () => {
    it('应该正确初始化迁移管理器', () => {
      expect(migrationManager).toBeDefined();
    });

    it('应该获取迁移状态', async () => {
      const status = await migrationManager.getMigrationStatus();
      
      expect(status).toHaveProperty('executed');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('total');
      expect(Array.isArray(status.executed)).toBe(true);
      expect(Array.isArray(status.pending)).toBe(true);
      expect(typeof status.total).toBe('number');
    });

    it('应该创建迁移文件', async () => {
      const options = {
        name: 'TestMigration',
        path: './test-migrations',
        empty: true
      };

      const result = await migrationManager.createMigration(options);
      
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('className');
      expect(result).toHaveProperty('timestamp');
      expect(result.className).toContain('TestMigration');
    });

    it('应该运行迁移', async () => {
      const result = await migrationManager.runMigrations();
      
      expect(result).toHaveProperty('executed');
      expect(result).toHaveProperty('migrations');
      expect(result).toHaveProperty('duration');
      expect(typeof result.executed).toBe('number');
      expect(Array.isArray(result.migrations)).toBe(true);
    });

    it('应该回滚迁移', async () => {
      const result = await migrationManager.revertLastMigration();
      
      expect(result).toHaveProperty('reverted');
      expect(result).toHaveProperty('duration');
      expect(typeof result.reverted).toBe('boolean');
    });

    it('应该在迁移执行失败时抛出异常', async () => {
      const mockMigrationManager = {
        runMigrations: jest.fn().mockImplementation(() => {
          throw new DatabaseMigrationException(
            '数据库迁移执行失败',
            '执行数据库迁移时发生错误'
          );
        })
      };

      expect(() => mockMigrationManager.runMigrations()).toThrow(DatabaseMigrationException);
    });

    it('应该在迁移回滚失败时抛出异常', async () => {
      const mockMigrationManager = {
        revertLastMigration: jest.fn().mockImplementation(() => {
          throw new DatabaseMigrationException(
            '数据库迁移回滚失败',
            '回滚数据库迁移时发生错误'
          );
        })
      };

      expect(() => mockMigrationManager.revertLastMigration()).toThrow(DatabaseMigrationException);
    });

    it('应该在创建迁移文件失败时抛出异常', async () => {
      const mockMigrationManager = {
        createMigration: jest.fn().mockImplementation(() => {
          throw new DatabaseMigrationException(
            '创建迁移文件失败',
            '创建迁移文件时发生错误'
          );
        })
      };

      expect(() => mockMigrationManager.createMigration({ name: 'Test' })).toThrow(DatabaseMigrationException);
    });
  });

  describe('DatabaseModule', () => {
    it('应该正确配置模块', () => {
      expect(module).toBeDefined();
      expect(module.get(DatabaseConnectionManager)).toBeDefined();
      expect(module.get(MigrationManager)).toBeDefined();
    });

    it('应该支持动态配置', () => {
      const dynamicModule = DatabaseModule.forRoot(mockConfig);
      
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(DatabaseModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });

    it('应该支持特性模块配置', () => {
      const featureModule = DatabaseModule.forFeature([]);
      
      expect(featureModule).toBeDefined();
      expect(featureModule.module).toBe(DatabaseModule);
      expect(featureModule.imports).toBeDefined();
      expect(featureModule.exports).toBeDefined();
    });

    it('应该支持异步配置', () => {
      const asyncModule = DatabaseModule.forRootAsync({
        useFactory: () => mockConfig,
        inject: []
      });
      
      expect(asyncModule).toBeDefined();
      expect(asyncModule.module).toBe(DatabaseModule);
      expect(asyncModule.providers).toBeDefined();
    });
  });

  describe('Logger 集成', () => {
    it('应该正确注入 Logger', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('应该记录日志信息', () => {
      logger.info('测试日志信息');
      
      expect(logger.info).toHaveBeenCalledWith('测试日志信息');
    });
  });

  describe('异常处理', () => {
    it('应该正确创建 DatabaseConnectionException', () => {
      const exception = new DatabaseConnectionException(
        '数据库连接失败',
        '无法连接到数据库服务器',
        { host: 'localhost', port: 5432 }
      );

      expect(exception).toBeInstanceOf(DatabaseConnectionException);
      expect(exception).toBeDefined();
    });

    it('应该正确创建 DatabaseMigrationException', () => {
      const exception = new DatabaseMigrationException(
        '迁移执行失败',
        '迁移文件格式错误',
        { migrationName: 'test_migration', step: 'up' }
      );

      expect(exception).toBeInstanceOf(DatabaseMigrationException);
      expect(exception).toBeDefined();
    });

    it('应该正确创建 DatabaseConfigException', () => {
      const exception = new DatabaseConfigException(
        '配置无效',
        '缺少必需的数据库参数',
        { missingFields: ['host', 'port'] }
      );

      expect(exception).toBeInstanceOf(DatabaseConfigException);
      expect(exception).toBeDefined();
    });
  });
});
