import { Global, Module, DynamicModule, Provider } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DatabaseConfig } from './types/index.js';
import { DatabaseConnectionManager } from './connection/index.js';
import { MigrationManager } from './migration/index.js';
import { PinoLogger as Logger } from '@hl8/logger';

/**
 * 数据库模块
 * 
 * 提供完整的数据库管理功能，包括连接管理、迁移管理、实体管理等。
 * 支持 PostgreSQL 和 MongoDB 数据库，集成 MikroORM 提供类型安全的数据库操作。
 * 
 * @description 数据库模块的核心配置，提供全局的数据库服务
 * 
 * ## 业务规则
 * 
 * ### 模块配置规则
 * - 支持动态配置数据库连接
 * - 自动注册全局服务
 * - 支持多数据库连接
 * - 集成日志和监控功能
 * 
 * ### 服务注册规则
 * - 连接管理器全局可用
 * - 迁移管理器全局可用
 * - 实体管理器自动注入
 * - 日志服务自动集成
 * 
 * ### 生命周期规则
 * - 模块初始化时建立连接
 * - 模块销毁时安全关闭
 * - 连接状态实时监控
 * - 异常情况自动处理
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     DatabaseModule.forRoot({
 *       type: DatabaseTypeEnum.POSTGRESQL,
 *       host: 'localhost',
 *       port: 5432,
 *       database: 'myapp',
 *       entities: [User, Organization]
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 * 
 * @since 1.0.0
 */
@Global()
@Module({})
export class DatabaseModule {
  /**
   * 配置数据库模块
   * 
   * 为应用程序配置数据库连接和相关服务。
   * 
   * @description 配置数据库模块的静态方法，支持动态配置
   * 
   * @param config - 数据库配置选项
   * @returns 配置好的动态模块
   * 
   * ## 配置流程
   * 1. 验证数据库配置
   * 2. 创建 MikroORM 配置
   * 3. 注册服务提供者
   * 4. 配置模块导出
   * 
   * @example
   * ```typescript
   * DatabaseModule.forRoot({
   *   type: DatabaseTypeEnum.POSTGRESQL,
   *   host: 'localhost',
   *   port: 5432,
   *   database: 'myapp',
   *   username: 'user',
   *   password: 'password',
   *   entities: [User, Organization],
   *   migrations: {
   *     path: './migrations'
   *   }
   * })
   * ```
   */
  static forRoot(config: DatabaseConfig): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'DATABASE_CONFIG',
        useValue: config
      },
      {
        provide: DatabaseConnectionManager,
        useFactory: (logger: Logger) => {
          return new DatabaseConnectionManager(config, logger);
        },
        inject: [Logger]
      },
      {
        provide: MigrationManager,
        useFactory: (connectionManager: DatabaseConnectionManager, logger: Logger) => {
          return new MigrationManager(connectionManager.getORM(), logger);
        },
        inject: [DatabaseConnectionManager, Logger]
      }
    ];

    return {
      module: DatabaseModule,
      imports: [
        MikroOrmModule.forRoot(config)
      ],
      providers,
      exports: [
        DatabaseConnectionManager,
        MigrationManager,
        MikroOrmModule
      ]
    };
  }

  /**
   * 配置数据库模块（异步）
   * 
   * 支持异步配置数据库连接，适用于需要动态获取配置的场景。
   * 
   * @description 异步配置数据库模块，支持动态配置获取
   * 
   * @param configFactory - 配置工厂函数
   * @returns 配置好的动态模块
   * 
   * ## 异步配置流程
   * 1. 异步获取配置信息
   * 2. 验证配置有效性
   * 3. 创建数据库连接
   * 4. 注册相关服务
   * 
   * @example
   * ```typescript
   * DatabaseModule.forRootAsync({
   *   useFactory: async (configService: ConfigService) => {
   *     return {
   *       type: DatabaseTypeEnum.POSTGRESQL,
   *       host: configService.get('DB_HOST'),
   *       port: configService.get('DB_PORT'),
   *       database: configService.get('DB_NAME'),
   *       entities: [User, Organization]
   *     };
   *   },
   *   inject: [ConfigService]
   * })
   * ```
   */
  static forRootAsync(configFactory: {
    useFactory: (...args: unknown[]) => Promise<DatabaseConfig> | DatabaseConfig;
    inject?: unknown[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'DATABASE_CONFIG',
        useFactory: configFactory.useFactory,
        inject: (configFactory.inject as any[]) || []
      },
      {
        provide: DatabaseConnectionManager,
        useFactory: async (config: DatabaseConfig, logger: Logger) => {
          const resolvedConfig = await config;
          return new DatabaseConnectionManager(resolvedConfig, logger);
        },
        inject: ['DATABASE_CONFIG', Logger]
      },
      {
        provide: MigrationManager,
        useFactory: (connectionManager: DatabaseConnectionManager, logger: Logger) => {
          return new MigrationManager(connectionManager.getORM(), logger);
        },
        inject: [DatabaseConnectionManager, Logger]
      }
    ];

    return {
      module: DatabaseModule,
      imports: [
        MikroOrmModule.forRootAsync({
          useFactory: async (...args: unknown[]) => {
            const config = await configFactory.useFactory(...args);
            return {
              ...config,
              autoLoadEntities: config.autoLoadEntities ?? true,
              synchronize: config.synchronize ?? false,
              logging: config.logging ?? false,
              debug: config.debug ?? false
            };
          },
          inject: configFactory.inject || []
        })
      ],
      providers,
      exports: [
        DatabaseConnectionManager,
        MigrationManager,
        MikroOrmModule
      ]
    };
  }

  /**
   * 配置数据库模块（特性模块）
   * 
   * 为特定功能模块配置数据库连接，支持模块级别的数据库配置。
   * 
   * @description 为特性模块配置数据库连接
   * 
   * @param config - 数据库配置选项
   * @returns 配置好的动态模块
   * 
   * ## 特性模块配置
   * - 支持模块级别的数据库配置
   * - 支持多数据库连接
   * - 支持模块级别的实体管理
   * - 支持模块级别的迁移管理
   * 
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     DatabaseModule.forFeature([User, Organization])
   *   ]
   * })
   * export class UserModule {}
   * ```
   */
  static forFeature(entities: any[]): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MikroOrmModule.forFeature(entities)
      ],
      exports: [
        MikroOrmModule
      ]
    };
  }
}
