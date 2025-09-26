import { DatabaseTypeEnum } from './database-type.enum.js';

/**
 * 数据库配置接口
 * 
 * 定义数据库连接和配置的完整接口，支持多种数据库类型和配置选项。
 * 为 MikroORM 提供统一的配置管理接口。
 * 
 * @description 数据库配置的核心接口，支持 PostgreSQL 和 MongoDB 数据库
 * 
 * ## 业务规则
 * 
 * ### 数据库类型规则
 * - 支持 PostgreSQL 关系型数据库
 * - 支持 MongoDB 文档型数据库
 * - 数据库类型必须明确指定
 * - 不同数据库类型使用不同的连接配置
 * 
 * ### 连接配置规则
 * - 连接字符串或连接参数二选一
 * - 连接池配置可选，提供默认值
 * - 超时配置必须合理设置
 * - 字符集和时区配置根据数据库类型自动适配
 * 
 * ### 迁移配置规则
 * - 迁移文件路径必须存在
 * - 迁移表名使用默认值或自定义
 * - 迁移模式支持开发和生产环境
 * - 迁移回滚支持完整和部分回滚
 * 
 * @example
 * ```typescript
 * const config: DatabaseConfig = {
 *   type: DatabaseTypeEnum.POSTGRESQL,
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'myapp',
 *   username: 'user',
 *   password: 'password',
 *   entities: [User, Organization],
 *   migrations: {
 *     path: './migrations',
 *     tableName: 'migrations'
 *   }
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface DatabaseConfig {
  /**
   * 数据库类型
   * 
   * @description 指定使用的数据库类型，支持 PostgreSQL 和 MongoDB
   */
  type: DatabaseTypeEnum;

  /**
   * 自动加载实体
   * 
   * @description 是否自动加载实体类
   */
  autoLoadEntities?: boolean;

  /**
   * 同步数据库模式
   * 
   * @description 是否自动同步数据库模式
   */
  synchronize?: boolean;

  /**
   * 日志配置
   * 
   * @description 数据库日志配置
   */
  logging?: boolean | 'all' | ('schema' | 'query' | 'query-params' | 'error' | 'info' | 'warn')[];

  /**
   * 调试模式
   * 
   * @description 是否启用调试模式
   */
  debug?: boolean;

  /**
   * 数据库主机地址
   * 
   * @description 数据库服务器的主机地址，默认为 localhost
   */
  host?: string;

  /**
   * 数据库端口
   * 
   * @description 数据库服务器的端口号
   * - PostgreSQL 默认端口: 5432
   * - MongoDB 默认端口: 27017
   */
  port?: number;

  /**
   * 数据库名称
   * 
   * @description 要连接的数据库名称
   */
  database: string;

  /**
   * 数据库用户名
   * 
   * @description 连接数据库的用户名
   */
  username?: string;

  /**
   * 数据库密码
   * 
   * @description 连接数据库的密码
   */
  password?: string;

  /**
   * 连接字符串
   * 
   * @description 完整的数据库连接字符串，与 host/port/database 等参数互斥
   */
  url?: string;

  /**
   * 实体类数组
   * 
   * @description MikroORM 实体类数组，用于数据库映射
   */
  entities?: any[];

  /**
   * 迁移配置
   * 
   * @description 数据库迁移相关配置
   */
  migrations?: {
    /**
     * 迁移文件路径
     * 
     * @description 迁移文件存放的目录路径
     */
    path: string;

    /**
     * 迁移表名
     * 
     * @description 存储迁移记录的表名，默认为 'migrations'
     */
    tableName?: string;

    /**
     * 迁移模式
     * 
     * @description 迁移执行模式，支持 'all'、'none'、'safe'
     */
    pattern?: string;

    /**
     * 迁移事务
     * 
     * @description 是否在事务中执行迁移，默认为 true
     */
    transactional?: boolean;
  };

  /**
   * 连接池配置
   * 
   * @description 数据库连接池相关配置
   */
  pool?: {
    /**
     * 最小连接数
     * 
     * @description 连接池中保持的最小连接数
     */
    min?: number;

    /**
     * 最大连接数
     * 
     * @description 连接池中允许的最大连接数
     */
    max?: number;

    /**
     * 连接超时时间（毫秒）
     * 
     * @description 获取连接的超时时间
     */
    acquireTimeoutMillis?: number;

    /**
     * 连接空闲超时时间（毫秒）
     * 
     * @description 连接在池中空闲的最大时间
     */
    idleTimeoutMillis?: number;
  };


  /**
   * 缓存配置
   * 
   * @description 查询缓存相关配置
   */
  cache?: {
    /**
     * 缓存适配器
     * 
     * @description 缓存适配器类型，支持 'memory'、'redis' 等
     */
    adapter?: string;

    /**
     * 缓存选项
     * 
     * @description 缓存的具体配置选项
     */
    options?: Record<string, unknown>;
  };
}
