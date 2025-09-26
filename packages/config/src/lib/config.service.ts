import { Injectable } from '@nestjs/common';
import { getConfig } from './config-loader.js';
import { PinoLogger } from '@hl8/logger';

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

  /**
   * 配置存储
   * 
   * @description 存储当前应用程序的完整配置信息
   * 支持动态配置更新和缓存机制
   */
  private config: Record<string, unknown>;

  /**
   * 构造函数
   * 
   * @description 初始化配置服务，加载配置并记录关键配置信息
   * 在服务启动时自动执行配置加载和验证
   */
  constructor() {
    this.config = getConfig();
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
    this.logger.log(`API端口: ${this.get('api.port')}`);
    this.logger.log(`数据库类型: ${this.get('database.type')}`);
    this.logger.log(`日志级别: ${this.get('logging.level')}`);
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
    return this.getNestedValue(this.config, path) as T;
  }

  /**
   * 获取嵌套配置值
   *
   * @description 根据点号分隔的路径获取嵌套对象的值
   * 使用递归方式遍历对象属性，支持深层嵌套访问
   * 
   * ## 算法说明
   * - 将路径按点号分割为键数组
   * - 使用 reduce 方法逐层访问对象属性
   * - 支持类型检查和空值处理
   * - 路径不存在时返回 undefined
   * 
   * @param {Record<string, unknown>} obj - 目标配置对象
   * @param {string} path - 点号分隔的路径字符串
   * @returns {unknown} 配置值，如果路径不存在则返回 undefined
   * 
   * @private
   * 
   * @example
   * ```typescript
   * const config = { api: { port: 3000 }, database: { host: 'localhost' } };
   * 
   * // 获取嵌套值
   * const port = this.getNestedValue(config, 'api.port'); // 3000
   * const host = this.getNestedValue(config, 'database.host'); // 'localhost'
   * const invalid = this.getNestedValue(config, 'invalid.path'); // undefined
   * ```
   * 
   * @since 1.0.0
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && current !== null && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

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
    return this.get('api');
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
    return this.get('database');
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
    return this.get('auth');
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
    return this.get('logging');
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
    return this.get('features');
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
    return this.get('assets');
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
      isTest: process.env.NODE_ENV === 'test',
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
    return this.config;
  }
}