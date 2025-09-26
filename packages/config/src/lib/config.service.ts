import { Injectable } from '@nestjs/common';
import { getConfig } from './config-loader.js';
import { PinoLogger } from '@hl8/logger';

/**
 * 配置服务
 *
 * @description 提供应用程序配置管理功能
 * 采用渐进式开发策略，只保留核心配置功能
 */
@Injectable()
export class ConfigService {
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });
  private config: Record<string, unknown>;

  constructor() {
    this.config = getConfig();
    this.logConfiguration();
  }

  /**
   * 记录配置信息
   *
   * @description 在启动时记录关键配置信息
   */
  private logConfiguration(): void {
    this.logger.log('=== 配置服务初始化 ===');
    this.logger.log(`API端口: ${this.get('api.port')}`);
    this.logger.log(`数据库类型: ${this.get('database.mikroOrm.type')}`);
    this.logger.log(`日志级别: ${this.get('logging.level')}`);
    this.logger.log('==================');
  }

  /**
   * 获取配置值
   *
   * @description 根据路径获取配置值
   * @param {string} path 配置路径，支持点号分隔的嵌套路径
   * @returns {any} 配置值
   * @example
   * ```typescript
   * // 获取API端口
   * const port = configService.get('api.port');
   * 
   * // 获取数据库配置
   * const dbConfig = configService.get('database.mikroOrm');
   * ```
   */
  get<T = unknown>(path: string): T {
    return this.getNestedValue(this.config, path) as T;
  }

  /**
   * 获取嵌套配置值
   *
   * @description 根据点号分隔的路径获取嵌套对象的值
   * @param {Record<string, unknown>} obj 目标对象
   * @param {string} path 路径
   * @returns {unknown} 配置值
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
   * @description 获取API相关配置
   * @returns {Object} API配置对象
   */
  getApiConfig() {
    return this.get('api');
  }

  /**
   * 获取数据库配置
   *
   * @description 获取数据库相关配置
   * @returns {Object} 数据库配置对象
   */
  getDatabaseConfig() {
    return this.get('database');
  }

  /**
   * 获取认证配置
   *
   * @description 获取认证相关配置
   * @returns {Object} 认证配置对象
   */
  getAuthConfig() {
    return this.get('auth');
  }

  /**
   * 获取日志配置
   *
   * @description 获取日志相关配置
   * @returns {Object} 日志配置对象
   */
  getLoggingConfig() {
    return this.get('logging');
  }

  /**
   * 获取功能开关配置
   *
   * @description 获取功能开关相关配置
   * @returns {Object} 功能开关配置对象
   */
  getFeaturesConfig() {
    return this.get('features');
  }

  /**
   * 获取资源文件配置
   *
   * @description 获取资源文件相关配置
   * @returns {Object} 资源文件配置对象
   */
  getAssetsConfig() {
    return this.get('assets');
  }

  /**
   * 检查功能是否启用
   *
   * @description 检查指定功能是否启用
   * @param {string} feature 功能名称
   * @returns {boolean} 是否启用
   * @example
   * ```typescript
   * // 检查多租户功能是否启用
   * const isMultiTenantEnabled = configService.isFeatureEnabled('multiTenant');
   * ```
   */
  isFeatureEnabled(feature: string): boolean {
    return this.get(`features.${feature}`) === true;
  }

  /**
   * 获取环境信息
   *
   * @description 获取当前环境信息
   * @returns {Object} 环境信息对象
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
   * @description 获取完整的配置对象
   * @returns {Object} 完整配置对象
   */
  getAll() {
    return this.config;
  }
}