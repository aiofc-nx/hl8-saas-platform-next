import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { MemoryConfigService } from './memory-config/memory-config.service.js';
import { ConfigCompatibilityAdapter } from './memory-config/compatibility-adapter.js';
import { ConfigValidationService, ValidationResult } from './validation/config-validation.service.js';

/**
 * 配置健康状态接口
 *
 * @description 配置健康检查结果的类型定义
 * 包含健康状态、问题列表和时间戳等信息
 */
export interface ConfigHealthStatus {
  /** 配置是否健康 */
  isHealthy: boolean;
  /** 配置问题列表 */
  issues: string[];
  /** 检查时间戳 */
  timestamp: string;
  /** 配置版本 */
  configVersion: string;
}

/**
 * 配置服务
 *
 * @description HL8 SAAS平台的配置管理服务，提供统一的配置访问接口
 * 采用渐进式开发策略，专注于核心配置功能，支持多种配置源和动态配置更新
 *
 * ## 主要功能
 *
 * ### 配置访问
 * - 提供类型安全的配置访问方法
 * - 支持嵌套配置路径访问
 * - 支持默认值设置
 *
 * ### 配置分类
 * - API配置：端口、主机、URL等
 * - 数据库配置：连接参数、类型等
 * - 认证配置：JWT密钥、过期时间等
 * - 日志配置：级别、输出等
 * - 功能开关：多租户、用户注册等
 *
 * ### 性能优化
 * - 配置缓存机制
 * - 延迟加载支持
 * - 内存使用优化
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly configService: ConfigService) {}
 *   
 *   getApiPort() {
 *     return this.configService.get('api.port');
 *   }
 *   
 *   isMultiTenantEnabled() {
 *     return this.configService.isFeatureEnabled('multiTenant');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigService {
  /**
   * 日志记录器
   * 
   * @description 用于记录配置服务的日志信息
   * 使用 Pino 日志库，提供高性能的日志记录功能
   */
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });

  // 不再需要存储配置对象，使用内存配置服务

  /**
   * 构造函数
   * 
   * @description 初始化配置服务，使用内存配置服务
   * 在服务启动时自动执行配置加载和验证
   */
  constructor(
    private readonly memoryConfig: MemoryConfigService,
    private readonly compatibilityAdapter: ConfigCompatibilityAdapter,
    private readonly configValidationService: ConfigValidationService
  ) {
    this.logConfiguration();
  }

  /**
   * 记录配置信息
   *
   * @description 在服务启动时记录关键配置信息，便于调试和监控
   * 记录API端口、数据库类型、日志级别等核心配置项
   * 
   * ## 记录内容
   * - API端口配置
   * - 数据库类型和连接信息
   * - 日志级别设置
   * - 其他关键配置项
   * 
   * @private
   */
  private logConfiguration(): void {
    this.logger.log('=== 配置服务初始化 ===');
    try {
      const apiConfig = this.memoryConfig.getApiConfig();
      const dbConfig = this.memoryConfig.getDatabaseConfig();
      const loggingConfig = this.memoryConfig.getLoggingConfig();
      
      this.logger.log(`API端口: ${apiConfig.port}`);
      this.logger.log(`数据库类型: ${dbConfig.type}`);
      this.logger.log(`日志级别: ${loggingConfig.level}`);
    } catch (error) {
      this.logger.warn('配置服务初始化时无法获取配置信息');
    }
    this.logger.log('==================');
  }

  /**
   * 获取配置值
   *
   * @description 根据点号分隔的路径获取嵌套配置值
   * 支持类型安全的配置访问，提供泛型支持
   * 
   * ## 路径格式
   * - 支持点号分隔的嵌套路径
   * - 例如：'api.port', 'database.host', 'auth.jwt.secret'
   * - 路径不区分大小写
   * 
   * ## 类型安全
   * - 支持泛型类型推断
   * - 提供编译时类型检查
   * - 避免运行时类型错误
   * 
   * @param {string} path - 配置路径，支持点号分隔的嵌套路径
   * @returns {T} 配置值，支持泛型类型推断
   * 
   * @example
   * ```typescript
   * // 获取API端口
   * const port = this.configService.get<number>('api.port');
   * 
   * // 获取数据库配置
   * const dbConfig = this.configService.get('database');
   * 
   * // 获取嵌套配置
   * const jwtSecret = this.configService.get<string>('auth.jwt.secret');
   * ```
   * 
   * @since 1.0.0
   */
  get<T = unknown>(path: string): T {
    // 使用兼容适配器获取配置值
    return this.compatibilityAdapter.get<T>(path);
  }

  // 不再需要getNestedValue方法，使用兼容适配器

  /**
   * 获取API配置
   *
   * @description 获取API相关的完整配置信息
   * 包含端口、主机、基础URL等API服务配置
   * 
   * @returns {Object} API配置对象
   * 
   * @example
   * ```typescript
   * const apiConfig = this.configService.getApiConfig();
   * console.log(apiConfig.port); // 3000
   * console.log(apiConfig.host); // localhost
   * ```
   * 
   * @since 1.0.0
   */
  getApiConfig() {
    return this.memoryConfig.getApiConfig();
  }

  /**
   * 获取数据库配置
   *
   * @description 获取数据库相关的完整配置信息
   * 包含数据库类型、连接参数、认证信息等配置
   * 
   * @returns {Object} 数据库配置对象
   * 
   * @example
   * ```typescript
   * const dbConfig = this.configService.getDatabaseConfig();
   * console.log(dbConfig.type); // postgresql
   * console.log(dbConfig.host); // localhost
   * ```
   * 
   * @since 1.0.0
   */
  getDatabaseConfig() {
    return this.memoryConfig.getDatabaseConfig();
  }

  /**
   * 获取认证配置
   *
   * @description 获取认证相关的完整配置信息
   * 包含JWT密钥、过期时间、密码加密等认证配置
   * 
   * @returns {Object} 认证配置对象
   * 
   * @example
   * ```typescript
   * const authConfig = this.configService.getAuthConfig();
   * console.log(authConfig.jwtSecret); // secretKey
   * console.log(authConfig.jwtExpirationTime); // 86400
   * ```
   * 
   * @since 1.0.0
   */
  getAuthConfig() {
    return this.memoryConfig.getAuthConfig();
  }

  /**
   * 获取日志配置
   *
   * @description 获取日志相关的完整配置信息
   * 包含日志级别、输出方式、请求日志等配置
   * 
   * @returns {Object} 日志配置对象
   * 
   * @example
   * ```typescript
   * const loggingConfig = this.configService.getLoggingConfig();
   * console.log(loggingConfig.level); // info
   * console.log(loggingConfig.enableRequestLogging); // true
   * ```
   * 
   * @since 1.0.0
   */
  getLoggingConfig() {
    return this.memoryConfig.getLoggingConfig();
  }

  /**
   * 获取功能开关配置
   *
   * @description 获取功能开关相关的完整配置信息
   * 包含多租户、用户注册、组织管理等功能的开关配置
   * 
   * @returns {Object} 功能开关配置对象
   * 
   * @example
   * ```typescript
   * const featuresConfig = this.configService.getFeaturesConfig();
   * console.log(featuresConfig.multiTenant); // true
   * console.log(featuresConfig.userRegistration); // true
   * ```
   * 
   * @since 1.0.0
   */
  getFeaturesConfig() {
    return this.memoryConfig.getFeaturesConfig();
  }

  /**
   * 获取资源文件配置
   *
   * @description 获取资源文件相关的完整配置信息
   * 包含静态资源路径、公共资源路径等配置
   * 
   * @returns {Object} 资源文件配置对象
   * 
   * @example
   * ```typescript
   * const assetsConfig = this.configService.getAssetsConfig();
   * console.log(assetsConfig.assetPath); // /app/public
   * console.log(assetsConfig.assetPublicPath); // /public
   * ```
   * 
   * @since 1.0.0
   */
  getAssetsConfig() {
    return this.memoryConfig.getAssetsConfig();
  }

  /**
   * 检查功能是否启用
   *
   * @description 检查指定功能是否启用
   * 提供便捷的功能开关检查方法，支持布尔值判断
   * 
   * ## 支持的功能
   * - multiTenant: 多租户功能
   * - userRegistration: 用户注册功能
   * - emailPasswordLogin: 邮箱密码登录
   * - magicLogin: 魔法登录
   * - organizationManagement: 组织管理
   * - departmentManagement: 部门管理
   * - userManagement: 用户管理
   * - permissionManagement: 权限管理
   * 
   * @param {string} feature - 功能名称
   * @returns {boolean} 是否启用该功能
   * 
   * @example
   * ```typescript
   * // 检查多租户功能是否启用
   * const isMultiTenantEnabled = this.configService.isFeatureEnabled('multiTenant');
   * 
   * // 检查用户注册功能是否启用
   * const isUserRegistrationEnabled = this.configService.isFeatureEnabled('userRegistration');
   * ```
   * 
   * @since 1.0.0
   */
  isFeatureEnabled(feature: string): boolean {
    return this.get(`features.${feature}`) === true;
  }

  /**
   * 获取环境信息
   *
   * @description 获取当前运行环境的详细信息
   * 提供环境类型判断和标识符，便于环境相关的逻辑处理
   * 
   * ## 环境类型
   * - development: 开发环境
   * - production: 生产环境
   * - test: 测试环境
   * 
   * @returns {Object} 环境信息对象
   * 
   * @example
   * ```typescript
   * const env = this.configService.getEnvironment();
   * console.log(env.nodeEnv); // development
   * console.log(env.isDevelopment); // true
   * console.log(env.isProduction); // false
   * ```
   * 
   * @since 1.0.0
   */
  getEnvironment() {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isTest: process.env.NODE_ENV === 'test'
    };
  }

  /**
   * 获取完整配置
   *
   * @description 获取应用程序的完整配置对象
   * 包含所有配置项，用于调试和配置验证
   * 
   * ## 注意事项
   * - 返回的配置对象包含敏感信息，请谨慎使用
   * - 建议仅在调试和开发环境中使用
   * - 生产环境中应避免直接暴露完整配置
   * 
   * @returns {Object} 完整配置对象
   * 
   * @example
   * ```typescript
   * // 获取完整配置（仅用于调试）
   * const allConfig = this.configService.getAll();
   * console.log(JSON.stringify(allConfig, null, 2));
   * ```
   * 
   * @since 1.0.0
   */
  getAll() {
    return this.memoryConfig.getAllConfig();
  }

  /**
   * 验证当前配置
   *
   * @description 验证当前应用程序配置是否符合业务规则
   * 提供配置验证功能，用于检查配置的完整性和正确性
   * 
   * ## 验证内容
   * - 数据类型验证
   * - 业务规则验证
   * - 必需字段检查
   * - 格式和范围验证
   * 
   * @param {boolean} throwOnError - 验证失败时是否抛出错误，默认为false
   * @returns {Promise<ValidationResult>} 验证结果
   * 
   * @example
   * ```typescript
   * // 验证当前配置
   * const result = await this.configService.validateConfig();
   * if (!result.isValid) {
   *   console.error('配置验证失败:', result.errors);
   * }
   * 
   * // 验证并抛出错误
   * await this.configService.validateConfig(true);
   * ```
   * 
   * @since 1.0.0
   */
  async validateConfig(throwOnError = false): Promise<ValidationResult> {
    return await this.configValidationService.validateApplicationConfig(throwOnError);
  }

  /**
   * 验证部分配置
   *
   * @description 验证配置对象的特定部分
   * 支持增量配置验证，适用于配置更新场景
   * 
   * @param {any} partialConfig - 要验证的部分配置
   * @param {string[]} fields - 要验证的字段列表
   * @returns {Promise<ValidationResult>} 验证结果
   * 
   * @example
   * ```typescript
   * // 验证API配置
   * const result = await this.configService.validatePartialConfig(
   *   { api: { port: 3000 } }, 
   *   ['api']
   * );
   * ```
   * 
   * @since 1.0.0
   */
  async validatePartialConfig(partialConfig: any, fields: string[]): Promise<ValidationResult> {
    return await this.configValidationService.validatePartialConfig(partialConfig, fields);
  }

  /**
   * 获取配置验证规则
   *
   * @description 获取配置验证规则的详细说明
   * 用于生成配置文档和错误提示
   * 
   * @returns {ValidationRules} 验证规则说明
   * 
   * @example
   * ```typescript
   * const rules = this.configService.getValidationRules();
   * console.log(rules.api.port.description);
   * ```
   * 
   * @since 1.0.0
   */
  getValidationRules() {
    return this.configValidationService.getValidationRules();
  }

  /**
   * 检查配置健康状态
   *
   * @description 检查配置的健康状态，包括验证和基本检查
   * 提供配置状态的全面检查，确保配置可用性
   * 
   * ## 检查内容
   * - 配置验证检查
   * - 必需配置项检查
   * - 配置值合理性检查
   * - 环境配置一致性检查
   * 
   * @returns {Promise<ConfigHealthStatus>} 配置健康状态
   * 
   * @example
   * ```typescript
   * const health = await this.configService.checkConfigHealth();
   * if (health.isHealthy) {
   *   console.log('配置状态良好');
   * } else {
   *   console.error('配置问题:', health.issues);
   * }
   * ```
   * 
   * @since 1.0.0
   */
  async checkConfigHealth(): Promise<ConfigHealthStatus> {
    const issues: string[] = [];
    let isHealthy = true;

    try {
      // 验证配置
      const validationResult = await this.validateConfig();
      if (!validationResult.isValid) {
        isHealthy = false;
        validationResult.errors.forEach((error: any) => {
          issues.push(`${error.property}: ${Object.values(error.constraints).join(', ')}`);
        });
      }

      // 检查关键配置项
      const criticalConfigs = [
        { path: 'api.port', name: 'API端口' },
        { path: 'database.type', name: '数据库类型' },
        { path: 'auth.jwtSecret', name: 'JWT密钥' }
      ];

      for (const config of criticalConfigs) {
        const value = this.get(config.path);
        if (!value) {
          isHealthy = false;
          issues.push(`缺少关键配置: ${config.name} (${config.path})`);
        }
      }

      // 检查端口号范围
      const apiPort = this.get<number>('api.port');
      if (apiPort && (apiPort < 1 || apiPort > 65535)) {
        isHealthy = false;
        issues.push(`API端口号超出有效范围: ${apiPort}`);
      }

      // 检查数据库类型
      const dbType = this.get<string>('database.type');
      const validDbTypes = ['postgresql', 'mysql', 'sqlite', 'mongodb'];
      if (dbType && !validDbTypes.includes(dbType)) {
        isHealthy = false;
        issues.push(`不支持的数据库类型: ${dbType}`);
      }

      return {
        isHealthy,
        issues,
        timestamp: new Date().toISOString(),
        configVersion: '1.0.0'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('配置健康检查失败', { error: errorMessage });
      return {
        isHealthy: false,
        issues: [`配置健康检查失败: ${errorMessage}`],
        timestamp: new Date().toISOString(),
        configVersion: '1.0.0'
      };
    }
  }

  /**
   * 获取MongoDB配置（内存配置）
   * 
   * @description 获取MongoDB相关的配置，使用内存配置
   * @returns {MongoDbMemoryConfig} MongoDB配置
   * 
   * @since 1.0.0
   */
  getMongoDbConfig() {
    return this.memoryConfig.getMongoDbConfig();
  }

  /**
   * 获取Redis配置（内存配置）
   * 
   * @description 获取Redis相关的配置，使用内存配置
   * @returns {RedisMemoryConfig} Redis配置
   * 
   * @since 1.0.0
   */
  getRedisConfig() {
    return this.memoryConfig.getRedisConfig();
  }

  /**
   * 获取所有配置（内存配置）
   * 
   * @description 获取完整的配置对象，使用内存配置
   * @returns {ApplicationMemoryConfig} 完整配置
   * 
   * @example
   * ```typescript
   * const allConfig = configService.getAllConfig();
   * console.log('配置摘要:', allConfig.getSummary());
   * ```
   * 
   * @since 1.0.0
   */
  getAllConfig() {
    return this.memoryConfig.getAllConfig();
  }

  /**
   * 获取配置状态（内存配置）
   * 
   * @description 获取配置服务的状态信息
   * @returns {ConfigStatus} 配置状态
   * 
   * @example
   * ```typescript
   * const status = configService.getConfigStatus();
   * console.log('配置状态:', status);
   * ```
   * 
   * @since 1.0.0
   */
  getConfigStatus() {
    return this.memoryConfig.getConfigStatus();
  }

  /**
   * 重新加载配置（内存配置）
   * 
   * @description 重新从环境变量加载配置到内存
   * 
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * await configService.reloadConfig();
   * console.log('配置已重新加载');
   * ```
   * 
   * @since 1.0.0
   */
  async reloadConfig(): Promise<void> {
    return await this.memoryConfig.reloadConfig();
  }
}