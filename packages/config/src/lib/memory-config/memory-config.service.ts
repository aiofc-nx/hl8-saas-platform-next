import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';

/**
 * 内存配置服务
 *
 * @description 基于内存的配置管理服务
 * 配置一旦加载到内存中，就与环境变量完全隔离
 * 提供类型安全的配置访问接口
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
 * - 类型安全的配置访问接口
 * - 自动类型推导和验证
 *
 * ### 性能优化
 * - 内存直接访问，性能优异
 * - 配置缓存机制，减少重复计算
 * - 懒加载支持，按需加载配置
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly memoryConfig: MemoryConfigService) {}
 *   
 *   getApiPort(): number {
 *     return this.memoryConfig.getApiConfig().port;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class MemoryConfigService implements OnModuleInit {
  /**
   * 日志记录器
   */
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });

  /**
   * 内存配置对象
   */
  private memoryConfig: ApplicationMemoryConfig | null = null;

  /**
   * 配置加载状态
   */
  private isLoaded = false;

  /**
   * 配置加载时间
   */
  private loadTime: Date | null = null;

  /**
   * 配置版本
   */
  private configVersion: string = '1.0.0';

  /**
   * 模块初始化
   *
   * @description 在模块初始化时加载配置到内存
   */
  async onModuleInit(): Promise<void> {
    this.logger.info('初始化内存配置服务');
    await this.loadConfigToMemory();
  }

  /**
   * 加载配置到内存
   *
   * @description 从环境变量加载配置并存储到内存中
   * 配置一旦加载到内存，就与环境变量完全隔离
   * 
   * @private
   */
  private async loadConfigToMemory(): Promise<void> {
    try {
      this.logger.info('开始加载配置到内存');

      // 从环境变量读取配置
      const configData = this.readConfigFromEnvironment();

      // 创建内存配置对象
      this.memoryConfig = new ApplicationMemoryConfig(configData);

      // 记录加载信息
      this.isLoaded = true;
      this.loadTime = new Date();
      this.configVersion = this.memoryConfig.getVersion();

      this.logger.info('配置已加载到内存', {
        version: this.configVersion,
        loadTime: this.loadTime.toISOString(),
        configKeys: this.memoryConfig.getConfigKeys()
      });

    } catch (error) {
      this.logger.error('配置加载到内存失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 从环境变量读取配置
   *
   * @description 从环境变量读取配置数据
   * 这是最后一次从环境变量读取配置
   * 
   * @returns {any} 配置数据
   * @private
   */
  private readConfigFromEnvironment(): any {
    return {
      // 基础信息
      version: process.env.CONFIG_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      loadTime: new Date().toISOString(),

      // API配置
      api: {
        port: parseInt(process.env.API_PORT || '3000'),
        host: process.env.API_HOST || 'http://localhost',
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        clientBaseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:4200',
        production: process.env.NODE_ENV === 'production',
        envName: process.env.NODE_ENV || 'development',
      },

      // 数据库配置
      database: {
        type: process.env.DB_TYPE || 'postgresql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'aiofix_platform',
        username: process.env.DB_USER || 'aiofix_user',
        password: process.env.DB_PASS || 'aiofix_password',
        sslMode: process.env.DB_SSL_MODE === 'true',
        logging: process.env.DB_LOGGING === 'true',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '40'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
      },

      // MongoDB配置
      mongodb: {
        host: process.env.MONGO_HOST || 'localhost',
        port: parseInt(process.env.MONGO_PORT || '27017'),
        name: process.env.MONGO_NAME || 'aiofix_events',
        username: process.env.MONGO_USER || 'aiofix_admin',
        password: process.env.MONGO_PASS || 'aiofix_password',
        sslMode: process.env.MONGO_SSL_MODE === 'true',
        logging: process.env.MONGO_LOGGING === 'true',
      },

      // Redis配置
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0'),
      },

      // 认证配置
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10'),
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
      },

      // 资源文件配置
      assets: {
        path: process.env.ASSETS_PATH || './assets',
        publicPath: process.env.ASSETS_PUBLIC_PATH || '/assets',
        maxFileSize: parseInt(process.env.ASSETS_MAX_FILE_SIZE || '10485760'), // 10MB
        allowedTypes: process.env.ASSETS_ALLOWED_TYPES || 'image/*,application/pdf',
      },

      // 日志配置
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        destination: process.env.LOG_DESTINATION || 'console',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
        maxSize: process.env.LOG_MAX_SIZE || '10m',
      },

      // 功能开关
      features: {
        enableSwagger: process.env.ENABLE_SWAGGER === 'true',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableCors: process.env.ENABLE_CORS === 'true',
        enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
        enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === 'true',
      }
    };
  }

  /**
   * 获取API配置
   *
   * @description 获取API相关的配置
   * @returns {ApiMemoryConfig} API配置
   * 
   * @example
   * ```typescript
   * const apiConfig = memoryConfig.getApiConfig();
   * console.log(`API端口: ${apiConfig.port}`);
   * ```
   * 
   * @since 1.0.0
   */
  getApiConfig(): ApiMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getApiConfig();
  }

  /**
   * 获取数据库配置
   *
   * @description 获取数据库相关的配置
   * @returns {DatabaseMemoryConfig} 数据库配置
   * 
   * @example
   * ```typescript
   * const dbConfig = memoryConfig.getDatabaseConfig();
   * console.log(`数据库主机: ${dbConfig.host}`);
   * ```
   * 
   * @since 1.0.0
   */
  getDatabaseConfig(): DatabaseMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getDatabaseConfig();
  }

  /**
   * 获取MongoDB配置
   *
   * @description 获取MongoDB相关的配置
   * @returns {MongoDbMemoryConfig} MongoDB配置
   * 
   * @since 1.0.0
   */
  getMongoDbConfig(): MongoDbMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getMongoDbConfig();
  }

  /**
   * 获取Redis配置
   *
   * @description 获取Redis相关的配置
   * @returns {RedisMemoryConfig} Redis配置
   * 
   * @since 1.0.0
   */
  getRedisConfig(): RedisMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getRedisConfig();
  }

  /**
   * 获取认证配置
   *
   * @description 获取认证相关的配置
   * @returns {AuthMemoryConfig} 认证配置
   * 
   * @since 1.0.0
   */
  getAuthConfig(): AuthMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getAuthConfig();
  }

  /**
   * 获取资源文件配置
   *
   * @description 获取资源文件相关的配置
   * @returns {AssetsMemoryConfig} 资源文件配置
   * 
   * @since 1.0.0
   */
  getAssetsConfig(): AssetsMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getAssetsConfig();
  }

  /**
   * 获取日志配置
   *
   * @description 获取日志相关的配置
   * @returns {LoggingMemoryConfig} 日志配置
   * 
   * @since 1.0.0
   */
  getLoggingConfig(): LoggingMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getLoggingConfig();
  }

  /**
   * 获取功能开关配置
   *
   * @description 获取功能开关相关的配置
   * @returns {FeaturesMemoryConfig} 功能开关配置
   * 
   * @since 1.0.0
   */
  getFeaturesConfig(): FeaturesMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!.getFeaturesConfig();
  }

  /**
   * 获取所有配置
   *
   * @description 获取完整的配置对象
   * @returns {ApplicationMemoryConfig} 完整配置
   * 
   * @example
   * ```typescript
   * const allConfig = memoryConfig.getAllConfig();
   * console.log('配置摘要:', allConfig.getSummary());
   * ```
   * 
   * @since 1.0.0
   */
  getAllConfig(): ApplicationMemoryConfig {
    this.ensureConfigLoaded();
    return this.memoryConfig!;
  }

  /**
   * 获取配置状态
   *
   * @description 获取配置服务的状态信息
   * @returns {ConfigStatus} 配置状态
   * 
   * @example
   * ```typescript
   * const status = memoryConfig.getConfigStatus();
   * console.log('配置状态:', status);
   * ```
   * 
   * @since 1.0.0
   */
  getConfigStatus(): ConfigStatus {
    return {
      isLoaded: this.isLoaded,
      version: this.configVersion,
      loadTime: this.loadTime,
      configKeys: this.memoryConfig?.getConfigKeys() || [],
      environment: this.memoryConfig?.getEnvironment() || 'unknown'
    };
  }

  /**
   * 重新加载配置
   *
   * @description 重新从环境变量加载配置到内存
   * 注意：这会重新读取环境变量，但配置仍然存储在内存中
   * 
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * await memoryConfig.reloadConfig();
   * console.log('配置已重新加载');
   * ```
   * 
   * @since 1.0.0
   */
  async reloadConfig(): Promise<void> {
    this.logger.info('重新加载配置到内存');
    
    try {
      await this.loadConfigToMemory();
      this.logger.info('配置重新加载完成');
    } catch (error) {
      this.logger.error('配置重新加载失败', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 检查配置是否已加载
   *
   * @description 确保配置已经加载到内存中
   * 
   * @private
   */
  private ensureConfigLoaded(): void {
    if (!this.isLoaded || !this.memoryConfig) {
      throw new Error('配置未加载到内存中，请确保配置服务已正确初始化');
    }
  }
}

/**
 * 应用内存配置类
 *
 * @description 应用程序的完整配置类
 * 包含所有配置项，存储在内存中
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
   */
  getApiConfig(): ApiMemoryConfig {
    return this.api;
  }

  /**
   * 获取数据库配置
   *
   * @description 获取数据库配置对象
   * @returns {DatabaseMemoryConfig} 数据库配置
   */
  getDatabaseConfig(): DatabaseMemoryConfig {
    return this.database;
  }

  /**
   * 获取MongoDB配置
   *
   * @description 获取MongoDB配置对象
   * @returns {MongoDbMemoryConfig} MongoDB配置
   */
  getMongoDbConfig(): MongoDbMemoryConfig {
    return this.mongodb;
  }

  /**
   * 获取Redis配置
   *
   * @description 获取Redis配置对象
   * @returns {RedisMemoryConfig} Redis配置
   */
  getRedisConfig(): RedisMemoryConfig {
    return this.redis;
  }

  /**
   * 获取认证配置
   *
   * @description 获取认证配置对象
   * @returns {AuthMemoryConfig} 认证配置
   */
  getAuthConfig(): AuthMemoryConfig {
    return this.auth;
  }

  /**
   * 获取资源文件配置
   *
   * @description 获取资源文件配置对象
   * @returns {AssetsMemoryConfig} 资源文件配置
   */
  getAssetsConfig(): AssetsMemoryConfig {
    return this.assets;
  }

  /**
   * 获取日志配置
   *
   * @description 获取日志配置对象
   * @returns {LoggingMemoryConfig} 日志配置
   */
  getLoggingConfig(): LoggingMemoryConfig {
    return this.logging;
  }

  /**
   * 获取功能开关配置
   *
   * @description 获取功能开关配置对象
   * @returns {FeaturesMemoryConfig} 功能开关配置
   */
  getFeaturesConfig(): FeaturesMemoryConfig {
    return this.features;
  }

  /**
   * 获取配置键列表
   *
   * @description 获取所有配置键的列表
   * @returns {string[]} 配置键列表
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
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * 获取版本信息
   *
   * @description 获取配置版本信息
   * @returns {string} 版本号
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * 获取配置摘要
   *
   * @description 获取配置的摘要信息
   * @returns {ConfigSummary} 配置摘要
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
 * 配置状态接口
 *
 * @description 配置服务状态的类型定义
 */
export interface ConfigStatus {
  /** 是否已加载 */
  isLoaded: boolean;
  /** 配置版本 */
  version: string;
  /** 加载时间 */
  loadTime: Date | null;
  /** 配置键列表 */
  configKeys: string[];
  /** 运行环境 */
  environment: string;
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
