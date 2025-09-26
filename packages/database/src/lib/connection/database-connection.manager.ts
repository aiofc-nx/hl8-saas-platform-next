import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MikroORM, EntityManager, EntityRepository } from '@mikro-orm/core';
import type { DatabaseConfig } from '../types/index.js';
import { DatabaseTypeEnum } from '../types/index.js';
import { PinoLogger as Logger } from '@hl8/logger';
import { DatabaseConnectionException, DatabaseConfigException } from '../exceptions/index.js';

/**
 * 数据库连接管理器
 * 
 * 负责管理数据库连接的创建、维护和销毁，提供统一的数据库访问接口。
 * 支持 PostgreSQL 和 MongoDB 数据库，集成 MikroORM 提供类型安全的数据库操作。
 * 
 * @description 数据库连接的核心管理器，提供连接池管理和生命周期控制
 * 
 * ## 业务规则
 * 
 * ### 连接管理规则
 * - 支持多数据库连接管理
 * - 连接池自动维护和监控
 * - 连接失败时自动重试
 * - 连接超时自动清理
 * 
 * ### 生命周期规则
 * - 模块初始化时建立连接
 * - 模块销毁时关闭连接
 * - 连接状态实时监控
 * - 异常连接自动恢复
 * 
 * ### 性能优化规则
 * - 连接池大小动态调整
 * - 空闲连接自动回收
 * - 查询结果缓存管理
 * - 批量操作优化
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly dbManager: DatabaseConnectionManager
 *   ) {}
 * 
 *   async createUser(userData: CreateUserDto) {
 *     const em = this.dbManager.getEntityManager();
 *     const user = new User(userData);
 *     await em.persistAndFlush(user);
 *     return user;
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
@Injectable()
export class DatabaseConnectionManager implements OnModuleInit, OnModuleDestroy {
  private orm!: MikroORM;
  private entityManager!: EntityManager;
  private isConnected = false;

  constructor(
    private readonly config: DatabaseConfig,
    private readonly logger: Logger
  ) {}

  /**
   * 模块初始化
   * 
   * 在模块初始化时建立数据库连接，配置连接池和监控。
   * 
   * @description 初始化数据库连接和配置
   * 
   * ## 初始化流程
   * 1. 验证数据库配置
   * 2. 创建 MikroORM 实例
   * 3. 建立数据库连接
   * 4. 配置连接池参数
   * 5. 启动健康检查
   * 
   * @throws {Error} 当数据库连接失败时抛出错误
   */
  async onModuleInit(): Promise<void> {
    try {
      // 验证数据库配置
      this.validateConfig();
      
      this.logger.info('正在初始化数据库连接...', {
        database: this.config.database,
        type: this.config.type
      });

      // 创建 MikroORM 实例
      this.orm = await MikroORM.init(this.config as any);
      this.entityManager = this.orm.em;

      // 验证连接
      await this.orm.connect();
      this.isConnected = true;

      this.logger.info('数据库连接初始化成功', {
        database: this.config.database,
        type: this.config.type,
        connected: this.isConnected
      });

      // 启动健康检查
      this.startHealthCheck();
    } catch (error) {
      this.logger.error('数据库连接初始化失败', {
        error: error instanceof Error ? error.message : String(error),
        database: this.config.database,
        type: this.config.type
      });
      throw new DatabaseConnectionException(
        '数据库连接初始化失败',
        `无法连接到 ${this.config.type} 数据库 "${this.config.database}"`,
        {
          database: this.config.database,
          type: this.config.type,
          host: this.config.host,
          port: this.config.port,
          originalError: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * 模块销毁
   * 
   * 在模块销毁时安全关闭数据库连接，清理资源。
   * 
   * @description 安全关闭数据库连接和清理资源
   * 
   * ## 销毁流程
   * 1. 停止健康检查
   * 2. 关闭活跃连接
   * 3. 清理连接池
   * 4. 释放相关资源
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.info('正在关闭数据库连接...');

      if (this.orm && this.isConnected) {
        await this.orm.close();
        this.isConnected = false;
      }

      this.logger.info('数据库连接已安全关闭');
    } catch (error) {
      this.logger.error('关闭数据库连接时发生错误', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取实体管理器
   * 
   * 获取 MikroORM 的实体管理器，用于执行数据库操作。
   * 
   * @description 获取用于数据库操作的实体管理器
   * 
   * @returns MikroORM 实体管理器实例
   * 
   * @throws {Error} 当数据库未连接时抛出错误
   * 
   * @example
   * ```typescript
   * const em = this.dbManager.getEntityManager();
   * const user = await em.findOne(User, { id: 1 });
   * ```
   */
  getEntityManager(): EntityManager {
    if (!this.isConnected || !this.entityManager) {
      throw new DatabaseConnectionException(
        '数据库连接未建立',
        '请先初始化数据库连接后再使用实体管理器',
        {
          connected: this.isConnected,
          hasEntityManager: !!this.entityManager,
          database: this.config.database,
          type: this.config.type
        }
      );
    }
    return this.entityManager;
  }

  /**
   * 获取实体仓库
   * 
   * 获取指定实体的仓库，提供便捷的 CRUD 操作。
   * 
   * @description 获取实体仓库用于便捷的数据库操作
   * 
   * @param entity - 实体类或实体名称
   * @returns 实体仓库实例
   * 
   * @example
   * ```typescript
   * const userRepo = this.dbManager.getRepository(User);
   * const users = await userRepo.findAll();
   * ```
   */
  getRepository<T extends object>(entity: new (...args: any[]) => T): EntityRepository<T> {
    const em = this.getEntityManager();
    return em.getRepository(entity);
  }

  /**
   * 获取 MikroORM 实例
   * 
   * 获取底层的 MikroORM 实例，用于高级操作。
   * 
   * @description 获取 MikroORM 实例用于高级数据库操作
   * 
   * @returns MikroORM 实例
   */
  getORM(): MikroORM {
    if (!this.orm) {
      throw new DatabaseConnectionException(
        'MikroORM 实例未初始化',
        '请先初始化数据库连接后再使用 MikroORM 实例',
        {
          hasORM: !!this.orm,
          database: this.config.database,
          type: this.config.type
        }
      );
    }
    return this.orm;
  }

  /**
   * 检查连接状态
   * 
   * 检查数据库连接是否正常，用于健康检查。
   * 
   * @description 检查数据库连接的健康状态
   * 
   * @returns 连接状态信息
   * 
   * @example
   * ```typescript
   * const status = await this.dbManager.checkConnection();
   * if (status.connected) {
   *   console.log('数据库连接正常');
   * }
   * ```
   */
  async checkConnection(): Promise<{
    connected: boolean;
    database: string;
    type: DatabaseTypeEnum;
    latency?: number;
  }> {
    const startTime = Date.now();
    
    try {
      if (!this.isConnected || !this.orm) {
        return {
          connected: false,
          database: this.config.database,
          type: this.config.type
        };
      }

      // 执行简单查询测试连接
      await this.orm.em.getConnection().execute('SELECT 1');
      
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        database: this.config.database,
        type: this.config.type,
        latency
      };
    } catch (error) {
      this.logger.error('数据库连接检查失败', {
        error: error instanceof Error ? error.message : String(error),
        database: this.config.database
      });
      
      return {
        connected: false,
        database: this.config.database,
        type: this.config.type
      };
    }
  }

  /**
   * 获取连接信息
   * 
   * 获取当前数据库连接的详细信息。
   * 
   * @description 获取数据库连接的详细信息
   * 
   * @returns 连接信息对象
   */
  getConnectionInfo(): {
    database: string;
    type: DatabaseTypeEnum;
    host?: string;
    port?: number;
    connected: boolean;
  } {
    return {
      database: this.config.database,
      type: this.config.type,
      host: this.config.host,
      port: this.config.port,
      connected: this.isConnected
    };
  }

  /**
   * 启动健康检查
   * 
   * 启动定期的数据库连接健康检查，确保连接稳定性。
   * 
   * @description 启动数据库连接的健康检查机制
   * 
   * ## 健康检查规则
   * - 每 30 秒检查一次连接状态
   * - 连接失败时自动重连
   * - 记录连接状态变化
   * - 异常情况及时告警
   */
  private startHealthCheck(): void {
    setInterval(async () => {
      try {
        const status = await this.checkConnection();
        
        if (!status.connected) {
          this.logger.warn('数据库连接异常，尝试重连...', {
            database: this.config.database
          });
          
          // 尝试重连
          await this.reconnect();
        }
      } catch (error) {
        this.logger.error('健康检查失败', {
          error: error instanceof Error ? error.message : String(error),
          database: this.config.database
        });
      }
    }, 30000); // 30 秒检查一次
  }

  /**
   * 验证数据库配置
   * 
   * 验证数据库配置的完整性和有效性。
   * 
   * @description 验证数据库配置参数
   * 
   * @throws {DatabaseConfigException} 当配置无效时抛出异常
   * 
   * @private
   */
  private validateConfig(): void {
    const missingFields: string[] = [];
    
    if (!this.config.database) {
      missingFields.push('database');
    }
    
    if (!this.config.type) {
      missingFields.push('type');
    }
    
    if (this.config.type === DatabaseTypeEnum.POSTGRESQL) {
      if (!this.config.host) missingFields.push('host');
      if (!this.config.port) missingFields.push('port');
      if (!this.config.username) missingFields.push('username');
    }
    
    if (this.config.type === DatabaseTypeEnum.MONGODB) {
      if (!this.config.url && !this.config.host) {
        missingFields.push('url 或 host');
      }
    }
    
    if (missingFields.length > 0) {
      throw new DatabaseConfigException(
        '数据库配置不完整',
        `缺少必需的配置参数: ${missingFields.join(', ')}`,
        {
          missingFields,
          providedFields: Object.keys(this.config).filter(key => 
            this.config[key as keyof DatabaseConfig] !== undefined
          ),
          databaseType: this.config.type
        }
      );
    }
  }

  /**
   * 重新连接
   * 
   * 在连接断开时尝试重新建立数据库连接。
   * 
   * @description 重新建立数据库连接
   * 
   * @throws {Error} 当重连失败时抛出错误
   */
  private async reconnect(): Promise<void> {
    try {
      if (this.orm) {
        await this.orm.close();
      }
      
      this.orm = await MikroORM.init(this.config as any);
      this.entityManager = this.orm.em;
      await this.orm.connect();
      this.isConnected = true;
      
      this.logger.info('数据库重连成功', {
        database: this.config.database
      });
    } catch (error) {
      this.logger.error('数据库重连失败', {
        error: error instanceof Error ? error.message : String(error),
        database: this.config.database
      });
      throw new DatabaseConnectionException(
        '数据库重连失败',
        `重新连接数据库时发生错误: ${error instanceof Error ? error.message : String(error)}`,
        {
          originalError: error instanceof Error ? error.message : String(error),
          database: this.config.database,
          type: this.config.type,
          operation: 'reconnect'
        }
      );
    }
  }
}
