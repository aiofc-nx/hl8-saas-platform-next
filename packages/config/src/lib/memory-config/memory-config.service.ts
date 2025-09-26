import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { 
  ApplicationMemoryConfig,
  ApiMemoryConfig,
  DatabaseMemoryConfig,
  MongoDbMemoryConfig,
  RedisMemoryConfig,
  AuthMemoryConfig,
  AssetsMemoryConfig,
  LoggingMemoryConfig,
  FeaturesMemoryConfig
} from './config-classes/application-memory-config.js';

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
  private configVersion = '1.0.0';

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
        envName: process.env.NODE_ENV || 'development'
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
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000')
      },

      // MongoDB配置
      mongodb: {
        host: process.env.MONGO_HOST || 'localhost',
        port: parseInt(process.env.MONGO_PORT || '27017'),
        name: process.env.MONGO_NAME || 'aiofix_events',
        username: process.env.MONGO_USER || 'aiofix_admin',
        password: process.env.MONGO_PASS || 'aiofix_password',
        sslMode: process.env.MONGO_SSL_MODE === 'true',
        logging: process.env.MONGO_LOGGING === 'true'
      },

      // Redis配置
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0')
      },

      // 认证配置
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        passwordSaltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10'),
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret'
      },

      // 资源文件配置
      assets: {
        path: process.env.ASSETS_PATH || './assets',
        publicPath: process.env.ASSETS_PUBLIC_PATH || '/assets',
        maxFileSize: parseInt(process.env.ASSETS_MAX_FILE_SIZE || '10485760'), // 10MB
        allowedTypes: process.env.ASSETS_ALLOWED_TYPES || 'image/*,application/pdf'
      },

      // 日志配置
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        destination: process.env.LOG_DESTINATION || 'console',
        maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
        maxSize: process.env.LOG_MAX_SIZE || '10m'
      },

      // 功能开关
      features: {
        enableSwagger: process.env.ENABLE_SWAGGER === 'true',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableCors: process.env.ENABLE_CORS === 'true',
        enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
        enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === 'true'
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