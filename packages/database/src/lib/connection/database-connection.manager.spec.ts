import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM, EntityManager, EntityRepository } from '@mikro-orm/core';
import { PinoLogger } from '@hl8/logger';
import { DatabaseConnectionManager } from './database-connection.manager.js';
import { DatabaseConfig, DatabaseTypeEnum } from '../types/index.js';
import { DatabaseConnectionException, DatabaseConfigException } from '../exceptions/index.js';

/**
 * 数据库连接管理器单元测试
 * 
 * 测试 DatabaseConnectionManager 类的所有核心功能，包括连接管理、生命周期控制、
 * 异常处理和健康检查等关键业务逻辑。
 * 
 * @description DatabaseConnectionManager 的完整单元测试套件
 * 
 * ## 测试覆盖范围
 * 
 * ### 核心功能测试
 * - 模块初始化和销毁
 * - 实体管理器和仓库获取
 * - 连接状态检查
 * - 健康检查机制
 * 
 * ### 异常处理测试
 * - 配置验证异常
 * - 连接失败异常
 * - 重连机制测试
 * - 错误恢复测试
 * 
 * ### 边界条件测试
 * - 无效配置处理
 * - 连接断开处理
 * - 并发访问处理
 * - 资源清理测试
 * 
 * @since 1.0.0
 */
describe('DatabaseConnectionManager', () => {
  let service: DatabaseConnectionManager;
  let mockConfig: DatabaseConfig;
  let mockLogger: jest.Mocked<PinoLogger>;
  let mockORM: jest.Mocked<MikroORM>;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockEntityRepository: jest.Mocked<EntityRepository<any>>;

  beforeEach(async () => {
    // 创建模拟的数据库配置
    mockConfig = {
      type: DatabaseTypeEnum.POSTGRESQL,
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password',
      entities: [],
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
      debug: false
    };

    // 创建模拟的实体仓库
    mockEntityRepository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      remove: jest.fn(),
      getEntityName: jest.fn(),
      getEntityManager: jest.fn()
    } as any;

    // 创建模拟的实体管理器
    mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockEntityRepository),
      persist: jest.fn(),
      flush: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      getConnection: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue(undefined)
      })
    } as any;

    // 创建模拟的 MikroORM 实例
    mockORM = {
      em: mockEntityManager,
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true)
    } as any;

    // 创建模拟的日志器
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    // 模拟 MikroORM.init 方法
    jest.spyOn(MikroORM, 'init').mockResolvedValue(mockORM);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseConnectionManager,
        {
          provide: 'DatabaseConfig',
          useValue: mockConfig
        },
        {
          provide: PinoLogger,
          useValue: mockLogger
        }
      ],
    }).compile();

    service = module.get<DatabaseConnectionManager>(DatabaseConnectionManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('构造函数', () => {
    it('应该正确初始化服务实例', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DatabaseConnectionManager);
    });

    it('应该正确注入依赖', () => {
      // 通过反射访问私有属性来验证依赖注入
      const config = (service as any).config;
      const logger = (service as any).logger;
      
      expect(config).toBe(mockConfig);
      expect(logger).toBe(mockLogger);
    });
  });

  describe('onModuleInit', () => {
    it('应该成功初始化数据库连接', async () => {
      await service.onModuleInit();

      expect(MikroORM.init).toHaveBeenCalledWith(mockConfig);
      expect(mockORM.connect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '正在初始化数据库连接...',
        expect.objectContaining({
          database: 'test_db',
          type: DatabaseTypeEnum.POSTGRESQL
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '数据库连接初始化成功',
        expect.objectContaining({
          database: 'test_db',
          type: DatabaseTypeEnum.POSTGRESQL,
          connected: true
        })
      );
    });

    it('应该在连接失败时抛出 DatabaseConnectionException', async () => {
      const error = new Error('连接失败');
      jest.spyOn(MikroORM, 'init').mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow(DatabaseConnectionException);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        '数据库连接初始化失败',
        expect.objectContaining({
          error: '连接失败',
          database: 'test_db',
          type: DatabaseTypeEnum.POSTGRESQL
        })
      );
    });

    it('应该启动健康检查', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      await service.onModuleInit();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        30000 // 30秒
      );
    });
  });

  describe('onModuleDestroy', () => {
    beforeEach(async () => {
      // 先初始化服务
      await service.onModuleInit();
    });

    it('应该成功关闭数据库连接', async () => {
      await service.onModuleDestroy();

      expect(mockORM.close).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('正在关闭数据库连接...');
      expect(mockLogger.info).toHaveBeenCalledWith('数据库连接已安全关闭');
    });

    it('应该在关闭失败时抛出 DatabaseConnectionException', async () => {
      const error = new Error('关闭失败');
      mockORM.close.mockRejectedValue(error);

      await expect(service.onModuleDestroy()).rejects.toThrow(DatabaseConnectionException);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        '关闭数据库连接时发生错误',
        expect.objectContaining({
          error: '关闭失败'
        })
      );
    });

    it('应该处理未连接状态', async () => {
      // 重置连接状态
      (service as any).isConnected = false;
      
      await service.onModuleDestroy();
      
      expect(mockORM.close).not.toHaveBeenCalled();
    });
  });

  describe('getEntityManager', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该返回实体管理器', () => {
      const em = service.getEntityManager();
      
      expect(em).toBe(mockEntityManager);
    });

    it('应该在未连接时抛出异常', () => {
      (service as any).isConnected = false;
      
      expect(() => service.getEntityManager()).toThrow(DatabaseConnectionException);
    });

    it('应该在实体管理器未初始化时抛出异常', () => {
      (service as any).entityManager = null;
      
      expect(() => service.getEntityManager()).toThrow(DatabaseConnectionException);
    });
  });

  describe('getRepository', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该返回实体仓库', () => {
      class TestEntity {}
      
      const repo = service.getRepository(TestEntity);
      
      expect(repo).toBe(mockEntityRepository);
      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(TestEntity);
    });

    it('应该在未连接时抛出异常', () => {
      (service as any).isConnected = false;
      
      class TestEntity {}
      
      expect(() => service.getRepository(TestEntity)).toThrow(DatabaseConnectionException);
    });
  });

  describe('getORM', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该返回 MikroORM 实例', () => {
      const orm = service.getORM();
      
      expect(orm).toBe(mockORM);
    });

    it('应该在 ORM 未初始化时抛出异常', () => {
      (service as any).orm = null;
      
      expect(() => service.getORM()).toThrow(DatabaseConnectionException);
    });
  });

  describe('checkConnection', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该返回连接状态信息', async () => {
      const status = await service.checkConnection();
      
      expect(status).toEqual({
        connected: true,
        database: 'test_db',
        type: DatabaseTypeEnum.POSTGRESQL,
        latency: expect.any(Number)
      });
    });

    it('应该在未连接时返回未连接状态', async () => {
      (service as any).isConnected = false;
      
      const status = await service.checkConnection();
      
      expect(status).toEqual({
        connected: false,
        database: 'test_db',
        type: DatabaseTypeEnum.POSTGRESQL
      });
    });

    it('应该在连接检查失败时返回未连接状态', async () => {
      const error = new Error('连接检查失败');
      mockEntityManager.getConnection().execute.mockRejectedValue(error);
      
      const status = await service.checkConnection();
      
      expect(status).toEqual({
        connected: false,
        database: 'test_db',
        type: DatabaseTypeEnum.POSTGRESQL
      });
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        '数据库连接检查失败',
        expect.objectContaining({
          error: '连接检查失败',
          database: 'test_db'
        })
      );
    });
  });

  describe('getConnectionInfo', () => {
    it('应该返回连接信息', () => {
      const info = service.getConnectionInfo();
      
      expect(info).toEqual({
        database: 'test_db',
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        connected: false
      });
    });

    it('应该在连接后返回正确的连接状态', async () => {
      await service.onModuleInit();
      
      const info = service.getConnectionInfo();
      
      expect(info.connected).toBe(true);
    });
  });

  describe('配置验证', () => {
    it('应该在缺少数据库名称时抛出异常', async () => {
      const invalidConfig = { ...mockConfig, database: '' };
      const invalidService = new DatabaseConnectionManager(invalidConfig, mockLogger);
      
      await expect(invalidService.onModuleInit()).rejects.toThrow(DatabaseConfigException);
    });

    it('应该在缺少数据库类型时抛出异常', async () => {
      const invalidConfig = { ...mockConfig, type: undefined as any };
      const invalidService = new DatabaseConnectionManager(invalidConfig, mockLogger);
      
      await expect(invalidService.onModuleInit()).rejects.toThrow(DatabaseConfigException);
    });

    it('应该在 PostgreSQL 配置缺少必需参数时抛出异常', async () => {
      const invalidConfig = { 
        ...mockConfig, 
        type: DatabaseTypeEnum.POSTGRESQL,
        host: '',
        port: undefined,
        username: ''
      };
      const invalidService = new DatabaseConnectionManager(invalidConfig, mockLogger);
      
      await expect(invalidService.onModuleInit()).rejects.toThrow(DatabaseConfigException);
    });

    it('应该在 MongoDB 配置缺少连接信息时抛出异常', async () => {
      const invalidConfig = { 
        ...mockConfig, 
        type: DatabaseTypeEnum.MONGODB,
        host: '',
        url: ''
      };
      const invalidService = new DatabaseConnectionManager(invalidConfig, mockLogger);
      
      await expect(invalidService.onModuleInit()).rejects.toThrow(DatabaseConfigException);
    });

    it('应该接受有效的 MongoDB URL 配置', async () => {
      const mongoConfig = {
        ...mockConfig,
        type: DatabaseTypeEnum.MONGODB,
        url: 'mongodb://localhost:27017/test_db',
        host: undefined,
        port: undefined
      };
      
      const mongoService = new DatabaseConnectionManager(mongoConfig, mockLogger);
      
      // 不应该抛出异常
      await expect(mongoService.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('健康检查', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该在连接正常时不触发重连', async () => {
      const reconnectSpy = jest.spyOn(service as any, 'reconnect');
      
      // 模拟健康检查
      const status = await service.checkConnection();
      expect(status.connected).toBe(true);
      
      // 等待健康检查间隔
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(reconnectSpy).not.toHaveBeenCalled();
    });

    it('应该在连接异常时触发重连', async () => {
      const reconnectSpy = jest.spyOn(service as any, 'reconnect').mockResolvedValue(undefined);
      
      // 模拟连接检查失败
      mockEntityManager.getConnection().execute.mockRejectedValue(new Error('连接失败'));
      
      // 等待健康检查执行
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(reconnectSpy).toHaveBeenCalled();
    });

    it('应该在重连失败时记录错误', async () => {
      const reconnectSpy = jest.spyOn(service as any, 'reconnect').mockRejectedValue(new Error('重连失败'));
      
      // 模拟连接检查失败
      mockEntityManager.getConnection().execute.mockRejectedValue(new Error('连接失败'));
      
      // 等待健康检查执行
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '数据库连接异常，尝试重连...',
        expect.objectContaining({
          database: 'test_db'
        })
      );
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '数据库健康检查持续失败，请检查数据库连接状态',
        expect.objectContaining({
          database: 'test_db',
          error: '重连失败'
        })
      );
    });
  });

  describe('重连机制', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('应该成功重连数据库', async () => {
      const newMockORM = { ...mockORM };
      jest.spyOn(MikroORM, 'init').mockResolvedValue(newMockORM);
      
      await (service as any).reconnect();
      
      expect(mockORM.close).toHaveBeenCalled();
      expect(MikroORM.init).toHaveBeenCalledWith(mockConfig);
      expect(newMockORM.connect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        '数据库重连成功',
        expect.objectContaining({
          database: 'test_db'
        })
      );
    });

    it('应该在重连失败时抛出异常', async () => {
      const error = new Error('重连失败');
      jest.spyOn(MikroORM, 'init').mockRejectedValue(error);
      
      await expect((service as any).reconnect()).rejects.toThrow(DatabaseConnectionException);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        '数据库重连失败',
        expect.objectContaining({
          error: '重连失败',
          database: 'test_db'
        })
      );
    });
  });

  describe('边界条件', () => {
    it('应该处理多次初始化', async () => {
      await service.onModuleInit();
      await service.onModuleInit();
      
      expect(MikroORM.init).toHaveBeenCalledTimes(2);
    });

    it('应该处理多次销毁', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();
      await service.onModuleDestroy();
      
      expect(mockORM.close).toHaveBeenCalledTimes(2);
    });

    it('应该处理并发访问', async () => {
      await service.onModuleInit();
      
      // 模拟并发访问
      const promises = [
        service.getEntityManager(),
        service.getEntityManager(),
        service.getEntityManager()
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results.every(em => em === mockEntityManager)).toBe(true);
    });
  });
});
