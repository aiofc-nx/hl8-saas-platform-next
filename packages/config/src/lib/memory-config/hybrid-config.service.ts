import { Injectable } from '@nestjs/common';
import { MemoryConfigService } from './memory-config.service.js';
import { ConfigCompatibilityAdapter } from './compatibility-adapter.js';

/**
 * 混合配置服务
 *
 * @description 支持新旧配置方式并存的服务
 * 提供智能的配置选择机制，支持渐进式迁移
 *
 * ## 主要功能
 *
 * ### 智能配置选择
 * - 优先使用内存配置
 * - 回退到环境变量配置
 * - 提供统一的配置访问接口
 *
 * ### 渐进式迁移
 * - 支持新旧配置方式并存
 * - 提供平滑的迁移路径
 * - 保持向后兼容性
 *
 * ### 统一接口
 * - 提供统一的配置访问接口
 * - 支持类型安全的配置访问
 * - 提供完整的配置管理功能
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly hybridConfig: HybridConfigService) {}
 *   
 *   getApiPort(): number {
 *     return this.hybridConfig.get<number>('api.port');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class HybridConfigService {
  constructor(
    private readonly memoryConfig: MemoryConfigService,
    private readonly compatibilityAdapter: ConfigCompatibilityAdapter
  ) {}

  /**
   * 获取配置（智能选择）
   * 
   * @description 智能选择配置源，优先使用内存配置
   * 如果内存配置不可用，则回退到环境变量配置
   * 
   * @param {string} path - 配置路径
   * @returns {T} 配置值
   * 
   * @example
   * ```typescript
   * // 智能获取API端口
   * const port = hybridConfig.get<number>('api.port');
   * ```
   * 
   * @since 1.0.0
   */
  get<T>(path: string): T;
  get<T>(path: string, defaultValue: T): T;
  get<T>(path: string, defaultValue?: T): T {
    // 优先使用内存配置
    if (this.memoryConfig.getConfigStatus().isLoaded) {
      return this.compatibilityAdapter.get<T>(path, defaultValue);
    }
    
    // 回退到环境变量
    return this.getFromEnvironment<T>(path, defaultValue!);
  }

  /**
   * 获取API配置
   * 
   * @description 获取API相关的配置
   * @returns {ApiMemoryConfig} API配置
   * 
   * @since 1.0.0
   */
  getApiConfig() {
    return this.memoryConfig.getApiConfig();
  }

  /**
   * 获取数据库配置
   * 
   * @description 获取数据库相关的配置
   * @returns {DatabaseMemoryConfig} 数据库配置
   * 
   * @since 1.0.0
   */
  getDatabaseConfig() {
    return this.memoryConfig.getDatabaseConfig();
  }

  /**
   * 获取MongoDB配置
   * 
   * @description 获取MongoDB相关的配置
   * @returns {MongoDbMemoryConfig} MongoDB配置
   * 
   * @since 1.0.0
   */
  getMongoDbConfig() {
    return this.memoryConfig.getMongoDbConfig();
  }

  /**
   * 获取Redis配置
   * 
   * @description 获取Redis相关的配置
   * @returns {RedisMemoryConfig} Redis配置
   * 
   * @since 1.0.0
   */
  getRedisConfig() {
    return this.memoryConfig.getRedisConfig();
  }

  /**
   * 获取认证配置
   * 
   * @description 获取认证相关的配置
   * @returns {AuthMemoryConfig} 认证配置
   * 
   * @since 1.0.0
   */
  getAuthConfig() {
    return this.memoryConfig.getAuthConfig();
  }

  /**
   * 获取资源文件配置
   * 
   * @description 获取资源文件相关的配置
   * @returns {AssetsMemoryConfig} 资源文件配置
   * 
   * @since 1.0.0
   */
  getAssetsConfig() {
    return this.memoryConfig.getAssetsConfig();
  }

  /**
   * 获取日志配置
   * 
   * @description 获取日志相关的配置
   * @returns {LoggingMemoryConfig} 日志配置
   * 
   * @since 1.0.0
   */
  getLoggingConfig() {
    return this.memoryConfig.getLoggingConfig();
  }

  /**
   * 获取功能开关配置
   * 
   * @description 获取功能开关相关的配置
   * @returns {FeaturesMemoryConfig} 功能开关配置
   * 
   * @since 1.0.0
   */
  getFeaturesConfig() {
    return this.memoryConfig.getFeaturesConfig();
  }

  /**
   * 获取所有配置
   * 
   * @description 获取完整的配置对象
   * @returns {ApplicationMemoryConfig} 完整配置
   * 
   * @since 1.0.0
   */
  getAllConfig() {
    return this.memoryConfig.getAllConfig();
  }

  /**
   * 获取配置状态
   * 
   * @description 获取配置服务的状态信息
   * @returns {ConfigStatus} 配置状态
   * 
   * @since 1.0.0
   */
  getConfigStatus() {
    return this.memoryConfig.getConfigStatus();
  }

  /**
   * 检查配置是否存在
   * 
   * @description 检查指定路径的配置是否存在
   * 
   * @param {string} path - 配置路径
   * @returns {boolean} 是否存在
   * 
   * @since 1.0.0
   */
  has(path: string): boolean {
    return this.compatibilityAdapter.has(path);
  }

  /**
   * 重新加载配置
   * 
   * @description 重新从环境变量加载配置到内存
   * 
   * @returns {Promise<void>}
   * 
   * @since 1.0.0
   */
  async reloadConfig(): Promise<void> {
    return await this.memoryConfig.reloadConfig();
  }

  /**
   * 从环境变量获取配置
   * 
   * @description 从环境变量获取配置值（回退机制）
   * 
   * @param {string} path - 配置路径
   * @param {T} defaultValue - 默认值
   * @returns {T} 配置值
   * 
   * @private
   */
  private getFromEnvironment<T>(path: string, defaultValue: T): T {
    const value = this.getNestedValue(process.env, path);
    return value !== undefined ? value as T : defaultValue;
  }

  /**
   * 获取嵌套值
   * 
   * @description 从嵌套对象中获取指定路径的值
   * 
   * @param {any} obj - 对象
   * @param {string} path - 路径
   * @returns {any} 值
   * 
   * @private
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key] !== undefined ? current[key] : undefined, obj);
  }
}
