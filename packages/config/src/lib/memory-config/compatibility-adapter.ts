import { Injectable } from '@nestjs/common';
import { MemoryConfigService } from './memory-config.service.js';

/**
 * 配置兼容适配器
 *
 * @description 提供向后兼容的配置访问接口
 * 支持渐进式迁移，保持现有API的兼容性
 *
 * ## 主要功能
 *
 * ### 向后兼容
 * - 保持现有配置API的兼容性
 * - 支持配置路径访问方式
 * - 提供默认值支持
 *
 * ### 渐进式迁移
 * - 支持新旧配置方式并存
 * - 提供统一的配置访问接口
 * - 支持配置访问的平滑过渡
 *
 * ### 类型安全
 * - 保持类型安全的配置访问
 * - 支持泛型配置访问
 * - 提供编译时类型检查
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly adapter: ConfigCompatibilityAdapter) {}
 *   
 *   getApiPort(): number {
 *     return this.adapter.get<number>('api.port');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigCompatibilityAdapter {
  constructor(private readonly memoryConfig: MemoryConfigService) {}

  /**
   * 获取配置值（兼容旧API）
   * 
   * @description 通过配置路径获取配置值
   * 支持嵌套路径访问，如 'api.port'、'database.host'
   * 
   * @param {string} path - 配置路径，如 'api.port'
   * @param {T} defaultValue - 可选的默认值
   * @returns {T} 配置值或默认值
   * 
   * @example
   * ```typescript
   * // 获取API端口
   * const port = adapter.get<number>('api.port');
   * 
   * // 获取API端口，带默认值
   * const port = adapter.get<number>('api.port', 8080);
   * 
   * // 获取数据库主机
   * const host = adapter.get<string>('database.host');
   * ```
   * 
   * @since 1.0.0
   */
  get<T>(path: string, defaultValue?: T): T {
    this.ensureConfigLoaded();
    const value = this.getNestedValue(this.memoryConfig.getAllConfig(), path);
    return value !== undefined ? value : (defaultValue as T);
  }

  /**
   * 检查配置是否存在
   * 
   * @description 检查指定路径的配置是否存在
   * 
   * @param {string} path - 配置路径
   * @returns {boolean} 是否存在
   * 
   * @example
   * ```typescript
   * // 检查API端口是否存在
   * if (adapter.has('api.port')) {
   *   const port = adapter.get<number>('api.port');
   * }
   * ```
   * 
   * @since 1.0.0
   */
  has(path: string): boolean {
    try {
      const value = this.get(path);
      return value !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * 获取所有配置
   * 
   * @description 获取完整的配置对象
   * 
   * @returns {ApplicationMemoryConfig} 完整配置
   * 
   * @example
   * ```typescript
   * const allConfig = adapter.getAllConfig();
   * console.log('配置摘要:', allConfig.getSummary());
   * ```
   * 
   * @since 1.0.0
   */
  getAllConfig() {
    this.ensureConfigLoaded();
    return this.memoryConfig.getAllConfig();
  }

  /**
   * 获取配置状态
   * 
   * @description 获取配置服务的状态信息
   * 
   * @returns {ConfigStatus} 配置状态
   * 
   * @example
   * ```typescript
   * const status = adapter.getConfigStatus();
   * console.log('配置状态:', status);
   * ```
   * 
   * @since 1.0.0
   */
  getConfigStatus() {
    return this.memoryConfig.getConfigStatus();
  }

  /**
   * 重新加载配置
   * 
   * @description 重新从环境变量加载配置到内存
   * 
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * await adapter.reloadConfig();
   * console.log('配置已重新加载');
   * ```
   * 
   * @since 1.0.0
   */
  async reloadConfig(): Promise<void> {
    return await this.memoryConfig.reloadConfig();
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

  /**
   * 检查配置是否已加载
   * 
   * @description 确保配置已经加载到内存中
   * 
   * @private
   */
  private ensureConfigLoaded(): void {
    if (!this.memoryConfig.getConfigStatus().isLoaded) {
      throw new Error('配置未加载到内存中，请确保配置服务已正确初始化');
    }
  }
}
