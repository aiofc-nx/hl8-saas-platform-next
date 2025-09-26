import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { SoftDeleteHandler } from 'mikro-orm-soft-delete';
import {
  PostgreSqlDriver,
  Options as MikroOrmPostgreSqlOptions,
} from '@mikro-orm/postgresql';
import {
  MongoDriver,
  Options as MikroOrmMongoOptions,
} from '@mikro-orm/mongodb';
import { DatabaseTypeEnum } from '../types/database-type.enum.js';
import { getLoggingMikroOptions, getTlsOptions } from './database-config.helpers.js';
import { PinoLogger } from '@hl8/logger';
import { defaultConfiguration } from '@hl8/config';

/**
 * 数据库配置服务
 *
 * @description 提供MikroORM数据库连接配置，支持PostgreSQL和MongoDB
 * 根据环境变量自动选择数据库类型和配置参数
 *
 * ## 支持的功能
 *
 * ### 数据库类型
 * - PostgreSQL: 关系型数据库，支持ACID事务
 * - MongoDB: 文档型数据库，支持灵活的数据结构
 *
 * ### 配置特性
 * - 连接池管理：自动配置连接池大小和超时设置
 * - SSL/TLS支持：支持安全的数据库连接
 * - 日志配置：可配置的查询和错误日志
 * - 软删除：支持软删除功能
 * - 命名策略：统一的实体命名策略
 *
 * ## 环境变量
 *
 * ### 必需变量
 * - `DB_TYPE`: 数据库类型 (postgresql | mongodb)
 * - `DB_HOST`: 数据库主机地址
 * - `DB_PORT`: 数据库端口
 * - `DB_NAME`: 数据库名称
 * - `DB_USER`: 数据库用户名
 * - `DB_PASS`: 数据库密码
 *
 * ### 可选变量
 * - `DB_SSL_MODE`: 是否启用SSL (true | false)
 * - `DB_CA_CERT`: Base64编码的CA证书
 * - `DB_LOGGING`: 日志级别 (false | query | all)
 * - `DB_POOL_SIZE`: 连接池大小 (默认: 40)
 * - `DB_CONNECTION_TIMEOUT`: 连接超时时间 (默认: 5000ms)
 * - `DB_IDLE_TIMEOUT`: 空闲超时时间 (默认: 10000ms)
 *
 * @example
 * ```typescript
 * // 获取PostgreSQL配置
 * const postgresConfig = getMikroOrmConfig();
 *
 * // 获取MongoDB配置
 * process.env.DB_TYPE = 'mongodb';
 * const mongoConfig = getMikroOrmConfig();
 * ```
 *
 * @since 1.0.0
 */
export class DatabaseConfigService {
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });
  private readonly dbType: string;
  private readonly dbPoolSize: number;
  private readonly dbConnectionTimeout: number;
  private readonly dbIdleTimeout: number;
  private readonly dbSslMode: boolean;

  constructor() {
    const dbConfig = defaultConfiguration.database;
    this.dbType = dbConfig.type;
    this.dbPoolSize = dbConfig.poolSize;
    this.dbConnectionTimeout = dbConfig.connectionTimeout;
    this.dbIdleTimeout = dbConfig.idleTimeout;
    this.dbSslMode = dbConfig.sslMode;

    this.logConfiguration();
  }

  /**
   * 记录配置信息
   *
   * @description 在开发环境中记录数据库配置信息，便于调试
   * 
   * ## 记录信息
   * - Node.js版本
   * - 数据库类型
   * - 连接池配置
   * - 超时设置
   * - SSL配置
   */
  private logConfiguration(): void {
    this.logger.log(`Node.js版本: ${process.version}`);
    this.logger.log(`数据库类型: ${this.dbType}`);
    this.logger.log(`连接池大小: ${this.dbPoolSize}`);
    this.logger.log(`连接超时: ${this.dbConnectionTimeout}ms`);
    this.logger.log(`空闲超时: ${this.dbIdleTimeout}ms`);
    this.logger.log(`SSL模式: ${this.dbSslMode}`);
  }

  /**
   * 获取PostgreSQL数据库配置
   *
   * @description 配置PostgreSQL数据库连接参数
   * 包括连接池、SSL、日志等设置
   *
   * ## 配置特性
   * - 支持SSL/TLS连接
   * - 可配置连接池大小
   * - 支持软删除扩展
   * - 统一的命名策略
   * - 可配置的日志级别
   *
   * @returns {MikroOrmPostgreSqlOptions} PostgreSQL数据库配置选项
   */
  private getPostgresConfig(): MikroOrmPostgreSqlOptions {
    const tlsOptions = getTlsOptions(this.dbSslMode);
    const dbConfig = defaultConfiguration.database;

    return {
      driver: PostgreSqlDriver,
      host: dbConfig.host,
      port: dbConfig.port,
      dbName: dbConfig.name,
      user: dbConfig.username,
      password: dbConfig.password,
      migrations: {
        path: 'src/modules/not-exists/*.migration{.ts,.js}',
      },
      entities: ['src/modules/not-exists/*.entity{.ts,.js}'],
      driverOptions: {
        connection: {
          ssl: tlsOptions,
        },
      },
      pool: {
        min: 0,
        max: this.dbPoolSize,
        idleTimeoutMillis: this.dbIdleTimeout,
        acquireTimeoutMillis: this.dbConnectionTimeout,
      },
      persistOnCreate: true,
      extensions: [SoftDeleteHandler],
      namingStrategy: EntityCaseNamingStrategy,
      debug: getLoggingMikroOptions(defaultConfiguration.database.logging),
    };
  }

  /**
   * 获取MongoDB数据库配置
   *
   * @description 配置MongoDB数据库连接参数
   * 包括连接字符串、数据库名称、日志等设置
   *
   * ## 配置特性
   * - 支持连接字符串配置
   * - 支持用户名密码认证
   * - 支持软删除扩展
   * - 统一的命名策略
   * - 可配置的日志级别
   *
   * @returns {MikroOrmMongoOptions} MongoDB数据库配置选项
   */
  private getMongoConfig(): MikroOrmMongoOptions {
    const dbConfig = defaultConfiguration.database;
    const host = dbConfig.host;
    const port = dbConfig.port.toString();
    const dbName = dbConfig.name;
    const user = dbConfig.username;
    const password = dbConfig.password;

    // 构建MongoDB连接字符串
    let connectionString = `mongodb://${host}:${port}/${dbName}`;

    // 如果提供了用户名和密码，添加到连接字符串中
    if (user && password) {
      connectionString = `mongodb://${user}:${password}@${host}:${port}/${dbName}`;
    }

    return {
      driver: MongoDriver,
      clientUrl: connectionString,
      dbName: dbName,
      migrations: {
        path: 'src/modules/not-exists/*.migration{.ts,.js}',
      },
      entities: ['src/modules/not-exists/*.entity{.ts,.js}'],
      persistOnCreate: true,
      extensions: [SoftDeleteHandler],
      namingStrategy: EntityCaseNamingStrategy,
      debug: getLoggingMikroOptions(defaultConfiguration.database.logging),
    };
  }

  /**
   * 获取数据库配置
   *
   * @description 根据数据库类型返回相应的MikroORM配置
   * 支持PostgreSQL和MongoDB两种数据库类型
   *
   * ## 业务规则
   * 
   * ### 数据库类型支持
   * - PostgreSQL: 关系型数据库，支持ACID事务
   * - MongoDB: 文档型数据库，支持灵活的数据结构
   * 
   * ### 配置验证
   * - 自动验证数据库类型
   * - 提供默认配置值
   * - 支持环境变量覆盖
   *
   * @returns {MikroOrmModuleOptions} MikroORM模块配置选项
   * @throws {Error} 当数据库类型不支持时抛出错误
   *
   * @example
   * ```typescript
   * const configService = new DatabaseConfigService();
   * const config = configService.getConfig();
   * ```
   */
  public getConfig(): MikroOrmModuleOptions {
    switch (this.dbType) {
      case DatabaseTypeEnum.POSTGRESQL:
        return this.getPostgresConfig();

      case DatabaseTypeEnum.MONGODB:
        return this.getMongoConfig();

      default:
        throw new Error(
          `不支持的数据库类型: ${this.dbType}。支持的类型: ${Object.values(
            DatabaseTypeEnum
          ).join(', ')}`
        );
    }
  }
}

// 创建配置服务实例
const databaseConfigService = new DatabaseConfigService();

/**
 * MikroORM数据库连接配置
 *
 * @description 导出MikroORM数据库连接配置，供应用模块使用
 * 根据环境变量自动选择PostgreSQL或MongoDB配置
 *
 * @returns {MikroOrmModuleOptions} MikroORM模块配置选项
 */
export const dbMikroOrmConnectionConfig: MikroOrmModuleOptions =
  databaseConfigService.getConfig();
