/**
 * 应用内存配置类
 *
 * @description 应用程序的完整配置类
 * 包含所有配置项，存储在内存中，与环境变量完全隔离
 *
 * ## 主要功能
 *
 * ### 配置隔离
 * - 配置存储在内存中，不受环境变量影响
 * - 配置一旦加载就无法被外部修改
 * - 提供配置的版本管理和审计
 *
 * ### 类型安全
 * - 强类型配置类，编译时类型检查
 * - 自动类型推导，无需手动类型转换
 * - 完整的代码提示和重构支持
 *
 * ### 性能优化
 * - 内存直接访问，性能优异
 * - 配置缓存机制，减少重复计算
 * - 减少CPU使用，提高应用性能
 *
 * @example
 * ```typescript
 * const config = new ApplicationMemoryConfig(configData);
 * const apiConfig = config.getApiConfig();
 * console.log(`API端口: ${apiConfig.port}`);
 * ```
 *
 * @since 1.0.0
 */
export class ApplicationMemoryConfig {
  /**
   * 配置版本
   */
  readonly version: string;

  /**
   * 运行环境
   */
  readonly environment: string;

  /**
   * 配置加载时间
   */
  readonly loadTime: string;

  /**
   * API配置
   */
  readonly api: ApiMemoryConfig;

  /**
   * 数据库配置
   */
  readonly database: DatabaseMemoryConfig;

  /**
   * MongoDB配置
   */
  readonly mongodb: MongoDbMemoryConfig;

  /**
   * Redis配置
   */
  readonly redis: RedisMemoryConfig;

  /**
   * 认证配置
   */
  readonly auth: AuthMemoryConfig;

  /**
   * 资源文件配置
   */
  readonly assets: AssetsMemoryConfig;

  /**
   * 日志配置
   */
  readonly logging: LoggingMemoryConfig;

  /**
   * 功能开关配置
   */
  readonly features: FeaturesMemoryConfig;

  constructor(configData: any) {
    this.version = configData.version || '1.0.0';
    this.environment = configData.environment || 'development';
    this.loadTime = configData.loadTime || new Date().toISOString();

    // 初始化子配置
    this.api = new ApiMemoryConfig(configData.api);
    this.database = new DatabaseMemoryConfig(configData.database);
    this.mongodb = new MongoDbMemoryConfig(configData.mongodb);
    this.redis = new RedisMemoryConfig(configData.redis);
    this.auth = new AuthMemoryConfig(configData.auth);
    this.assets = new AssetsMemoryConfig(configData.assets);
    this.logging = new LoggingMemoryConfig(configData.logging);
    this.features = new FeaturesMemoryConfig(configData.features);
  }

  /**
   * 获取API配置
   *
   * @description 获取API配置对象
   * @returns {ApiMemoryConfig} API配置
   * 
   * @example
   * ```typescript
   * const apiConfig = config.getApiConfig();
   * console.log(`API端口: ${apiConfig.port}`);
   * ```
   * 
   * @since 1.0.0
   */
  getApiConfig(): ApiMemoryConfig {
    return this.api;
  }

  /**
   * 获取数据库配置
   *
   * @description 获取数据库配置对象
   * @returns {DatabaseMemoryConfig} 数据库配置
   * 
   * @example
   * ```typescript
   * const dbConfig = config.getDatabaseConfig();
   * console.log(`数据库主机: ${dbConfig.host}`);
   * ```
   * 
   * @since 1.0.0
   */
  getDatabaseConfig(): DatabaseMemoryConfig {
    return this.database;
  }

  /**
   * 获取MongoDB配置
   *
   * @description 获取MongoDB配置对象
   * @returns {MongoDbMemoryConfig} MongoDB配置
   * 
   * @since 1.0.0
   */
  getMongoDbConfig(): MongoDbMemoryConfig {
    return this.mongodb;
  }

  /**
   * 获取Redis配置
   *
   * @description 获取Redis配置对象
   * @returns {RedisMemoryConfig} Redis配置
   * 
   * @since 1.0.0
   */
  getRedisConfig(): RedisMemoryConfig {
    return this.redis;
  }

  /**
   * 获取认证配置
   *
   * @description 获取认证配置对象
   * @returns {AuthMemoryConfig} 认证配置
   * 
   * @since 1.0.0
   */
  getAuthConfig(): AuthMemoryConfig {
    return this.auth;
  }

  /**
   * 获取资源文件配置
   *
   * @description 获取资源文件配置对象
   * @returns {AssetsMemoryConfig} 资源文件配置
   * 
   * @since 1.0.0
   */
  getAssetsConfig(): AssetsMemoryConfig {
    return this.assets;
  }

  /**
   * 获取日志配置
   *
   * @description 获取日志配置对象
   * @returns {LoggingMemoryConfig} 日志配置
   * 
   * @since 1.0.0
   */
  getLoggingConfig(): LoggingMemoryConfig {
    return this.logging;
  }

  /**
   * 获取功能开关配置
   *
   * @description 获取功能开关配置对象
   * @returns {FeaturesMemoryConfig} 功能开关配置
   * 
   * @since 1.0.0
   */
  getFeaturesConfig(): FeaturesMemoryConfig {
    return this.features;
  }

  /**
   * 获取配置键列表
   *
   * @description 获取所有配置键的列表
   * @returns {string[]} 配置键列表
   * 
   * @example
   * ```typescript
   * const keys = config.getConfigKeys();
   * console.log('配置键:', keys);
   * ```
   * 
   * @since 1.0.0
   */
  getConfigKeys(): string[] {
    return [
      'version',
      'environment',
      'loadTime',
      'api',
      'database',
      'mongodb',
      'redis',
      'auth',
      'assets',
      'logging',
      'features'
    ];
  }

  /**
   * 获取环境信息
   *
   * @description 获取运行环境信息
   * @returns {string} 环境名称
   * 
   * @since 1.0.0
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * 获取版本信息
   *
   * @description 获取配置版本信息
   * @returns {string} 版本号
   * 
   * @since 1.0.0
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * 获取配置摘要
   *
   * @description 获取配置的摘要信息
   * @returns {ConfigSummary} 配置摘要
   * 
   * @example
   * ```typescript
   * const summary = config.getSummary();
   * console.log('配置摘要:', summary);
   * ```
   * 
   * @since 1.0.0
   */
  getSummary(): ConfigSummary {
    return {
      version: this.version,
      environment: this.environment,
      loadTime: this.loadTime,
      configCount: this.getConfigKeys().length,
      isProduction: this.environment === 'production'
    };
  }
}

/**
 * API内存配置类
 *
 * @description API相关的配置类
 */
export class ApiMemoryConfig {
  readonly port: number;
  readonly host: string;
  readonly baseUrl: string;
  readonly clientBaseUrl: string;
  readonly production: boolean;
  readonly envName: string;

  constructor(configData: any) {
    this.port = configData.port || 3000;
    this.host = configData.host || 'http://localhost';
    this.baseUrl = configData.baseUrl || 'http://localhost:3000';
    this.clientBaseUrl = configData.clientBaseUrl || 'http://localhost:4200';
    this.production = configData.production || false;
    this.envName = configData.envName || 'development';
  }
}

/**
 * 数据库内存配置类
 *
 * @description 数据库相关的配置类
 */
export class DatabaseMemoryConfig {
  readonly type: string;
  readonly host: string;
  readonly port: number;
  readonly name: string;
  readonly username: string;
  readonly password: string;
  readonly sslMode: boolean;
  readonly logging: boolean;
  readonly poolSize: number;
  readonly connectionTimeout: number;
  readonly idleTimeout: number;

  constructor(configData: any) {
    this.type = configData.type || 'postgresql';
    this.host = configData.host || 'localhost';
    this.port = configData.port || 5432;
    this.name = configData.name || 'aiofix_platform';
    this.username = configData.username || 'aiofix_user';
    this.password = configData.password || 'aiofix_password';
    this.sslMode = configData.sslMode || false;
    this.logging = configData.logging || false;
    this.poolSize = configData.poolSize || 40;
    this.connectionTimeout = configData.connectionTimeout || 5000;
    this.idleTimeout = configData.idleTimeout || 10000;
  }
}

/**
 * MongoDB内存配置类
 *
 * @description MongoDB相关的配置类
 */
export class MongoDbMemoryConfig {
  readonly host: string;
  readonly port: number;
  readonly name: string;
  readonly username: string;
  readonly password: string;
  readonly sslMode: boolean;
  readonly logging: boolean;

  constructor(configData: any) {
    this.host = configData.host || 'localhost';
    this.port = configData.port || 27017;
    this.name = configData.name || 'aiofix_events';
    this.username = configData.username || 'aiofix_admin';
    this.password = configData.password || 'aiofix_password';
    this.sslMode = configData.sslMode || false;
    this.logging = configData.logging || false;
  }
}

/**
 * Redis内存配置类
 *
 * @description Redis相关的配置类
 */
export class RedisMemoryConfig {
  readonly host: string;
  readonly port: number;
  readonly password: string;
  readonly db: number;

  constructor(configData: any) {
    this.host = configData.host || 'localhost';
    this.port = configData.port || 6379;
    this.password = configData.password || '';
    this.db = configData.db || 0;
  }
}

/**
 * 认证内存配置类
 *
 * @description 认证相关的配置类
 */
export class AuthMemoryConfig {
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly passwordSaltRounds: number;
  readonly sessionSecret: string;

  constructor(configData: any) {
    this.jwtSecret = configData.jwtSecret || 'your-super-secret-jwt-key';
    this.jwtExpiresIn = configData.jwtExpiresIn || '24h';
    this.passwordSaltRounds = configData.passwordSaltRounds || 10;
    this.sessionSecret = configData.sessionSecret || 'your-session-secret';
  }
}

/**
 * 资源文件内存配置类
 *
 * @description 资源文件相关的配置类
 */
export class AssetsMemoryConfig {
  readonly path: string;
  readonly publicPath: string;
  readonly maxFileSize: number;
  readonly allowedTypes: string;

  constructor(configData: any) {
    this.path = configData.path || './assets';
    this.publicPath = configData.publicPath || '/assets';
    this.maxFileSize = configData.maxFileSize || 10485760; // 10MB
    this.allowedTypes = configData.allowedTypes || 'image/*,application/pdf';
  }
}

/**
 * 日志内存配置类
 *
 * @description 日志相关的配置类
 */
export class LoggingMemoryConfig {
  readonly level: string;
  readonly format: string;
  readonly destination: string;
  readonly maxFiles: number;
  readonly maxSize: string;

  constructor(configData: any) {
    this.level = configData.level || 'info';
    this.format = configData.format || 'json';
    this.destination = configData.destination || 'console';
    this.maxFiles = configData.maxFiles || 5;
    this.maxSize = configData.maxSize || '10m';
  }
}

/**
 * 功能开关内存配置类
 *
 * @description 功能开关相关的配置类
 */
export class FeaturesMemoryConfig {
  readonly enableSwagger: boolean;
  readonly enableMetrics: boolean;
  readonly enableCors: boolean;
  readonly enableRateLimit: boolean;
  readonly enableHealthCheck: boolean;

  constructor(configData: any) {
    this.enableSwagger = configData.enableSwagger || false;
    this.enableMetrics = configData.enableMetrics || false;
    this.enableCors = configData.enableCors || false;
    this.enableRateLimit = configData.enableRateLimit || false;
    this.enableHealthCheck = configData.enableHealthCheck || false;
  }
}

/**
 * 配置摘要接口
 *
 * @description 配置摘要信息的类型定义
 */
export interface ConfigSummary {
  /** 配置版本 */
  version: string;
  /** 运行环境 */
  environment: string;
  /** 加载时间 */
  loadTime: string;
  /** 配置项数量 */
  configCount: number;
  /** 是否为生产环境 */
  isProduction: boolean;
}
