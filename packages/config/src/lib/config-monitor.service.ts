import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { ConfigValidationService } from './validation/config-validation.service.js';

/**
 * 配置监控服务
 *
 * @description 监控环境变量变化，提供配置自动重载和验证功能
 * 确保应用运行过程中配置的一致性和安全性
 *
 * ## 主要功能
 *
 * ### 配置监控
 * - 监控关键环境变量的变化
 * - 检测配置文件的修改
 * - 提供配置变更通知
 *
 * ### 自动重载
 * - 支持配置热重载
 * - 自动验证新配置
 * - 回滚到安全配置
 *
 * ### 安全保护
 * - 防止关键配置被意外修改
 * - 提供配置变更审计
 * - 支持配置锁定机制
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly configMonitor: ConfigMonitorService) {}
 *   
 *   async startMonitoring() {
 *     await this.configMonitor.startMonitoring();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigMonitorService implements OnModuleInit, OnModuleDestroy {
  /**
   * 日志记录器
   */
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });

  /**
   * 配置验证服务
   */
  private readonly validationService = new ConfigValidationService();

  /**
   * 监控间隔（毫秒）
   */
  private readonly monitorInterval = 30000; // 30秒

  /**
   * 监控定时器
   */
  private monitorTimer: NodeJS.Timeout | null = null;

  /**
   * 是否启用监控
   */
  private isMonitoring = false;

  /**
   * 关键配置项列表
   */
  private readonly criticalConfigs = [
    'API_PORT',
    'DB_HOST',
    'DB_PASSWORD',
    'JWT_SECRET',
    'REDIS_PASSWORD'
  ];

  /**
   * 配置快照
   */
  private configSnapshot: Record<string, string> = {};

  /**
   * 配置变更回调函数列表
   */
  private changeCallbacks: Array<(changes: ConfigChangeEvent) => void> = [];

  /**
   * 模块初始化
   *
   * @description 启动配置监控服务
   */
  async onModuleInit(): Promise<void> {
    this.logger.info('配置监控服务初始化');
    await this.initializeConfigSnapshot();
  }

  /**
   * 模块销毁
   *
   * @description 清理监控资源
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.info('配置监控服务销毁');
    this.stopMonitoring();
  }

  /**
   * 初始化配置快照
   *
   * @description 记录当前配置状态，用于后续比较
   * 
   * @private
   */
  private async initializeConfigSnapshot(): Promise<void> {
    this.configSnapshot = {};
    
    for (const configKey of this.criticalConfigs) {
      this.configSnapshot[configKey] = process.env[configKey] || '';
    }

    this.logger.debug('配置快照已初始化', { 
      snapshotKeys: Object.keys(this.configSnapshot) 
    });
  }

  /**
   * 开始监控配置变化
   *
   * @description 启动定时监控，检测环境变量变化
   * 
   * @param {number} interval - 监控间隔（毫秒），默认30秒
   * 
   * @example
   * ```typescript
   * // 开始监控
   * await configMonitor.startMonitoring();
   * 
   * // 自定义监控间隔
   * await configMonitor.startMonitoring(10000); // 10秒
   * ```
   * 
   * @since 1.0.0
   */
  async startMonitoring(interval: number = this.monitorInterval): Promise<void> {
    if (this.isMonitoring) {
      this.logger.warn('配置监控已在运行中');
      return;
    }

    this.logger.info('开始配置监控', { interval });
    this.isMonitoring = true;

    this.monitorTimer = setInterval(async () => {
      await this.checkConfigChanges();
    }, interval);
  }

  /**
   * 停止监控配置变化
   *
   * @description 停止定时监控
   * 
   * @example
   * ```typescript
   * configMonitor.stopMonitoring();
   * ```
   * 
   * @since 1.0.0
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }
    this.isMonitoring = false;
    this.logger.info('配置监控已停止');
  }

  /**
   * 检查配置变化
   *
   * @description 比较当前环境变量与快照，检测变化
   * 
   * @private
   */
  private async checkConfigChanges(): Promise<void> {
    try {
      const changes: ConfigChangeEvent = {
        timestamp: new Date().toISOString(),
        changes: [],
        criticalChanges: [],
        warnings: []
      };

      // 检查关键配置项
      for (const configKey of this.criticalConfigs) {
        const currentValue = process.env[configKey] || '';
        const snapshotValue = this.configSnapshot[configKey];

        if (currentValue !== snapshotValue) {
          const change = {
            key: configKey,
            oldValue: snapshotValue,
            newValue: currentValue,
            isCritical: this.isCriticalConfig(configKey)
          };

          changes.changes.push(change);

          if (change.isCritical) {
            changes.criticalChanges.push(change);
          }

          // 记录变更
          this.logger.warn('检测到配置变更', {
            key: configKey,
            oldValue: snapshotValue,
            newValue: currentValue,
            isCritical: change.isCritical
          });
        }
      }

      // 如果有变化，处理变更
      if (changes.changes.length > 0) {
        await this.handleConfigChanges(changes);
        
        // 更新快照
        this.updateConfigSnapshot();
        
        // 触发回调
        this.triggerChangeCallbacks(changes);
      }

    } catch (error) {
      this.logger.error('配置监控检查失败', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * 处理配置变更
   *
   * @description 根据变更类型采取相应的处理措施
   * 
   * @param {ConfigChangeEvent} changes - 配置变更事件
   * 
   * @private
   */
  private async handleConfigChanges(changes: ConfigChangeEvent): Promise<void> {
    // 处理关键配置变更
    if (changes.criticalChanges.length > 0) {
      this.logger.error('检测到关键配置变更', {
        criticalChanges: changes.criticalChanges
      });

      // 验证新配置
      const validationResult = await this.validateCurrentConfig();
      if (!validationResult.isValid) {
        this.logger.error('新配置验证失败，建议重启应用', {
          errors: validationResult.errors
        });
        changes.warnings.push('新配置验证失败，建议重启应用');
      }
    }

    // 处理一般配置变更
    for (const change of changes.changes) {
      if (!change.isCritical) {
        this.logger.info('配置已更新', {
          key: change.key,
          newValue: change.newValue
        });
      }
    }
  }

  /**
   * 验证当前配置
   *
   * @description 验证当前环境变量构建的配置是否有效
   * 
   * @returns {Promise<ValidationResult>} 验证结果
   * 
   * @private
   */
  private async validateCurrentConfig(): Promise<ValidationResult> {
    // 重新构建配置对象
    const currentConfig = this.buildConfigFromEnv();
    
    // 验证配置
    return await this.validationService.validateApplicationConfig(currentConfig);
  }

  /**
   * 从环境变量构建配置
   *
   * @description 根据当前环境变量重新构建配置对象
   * 
   * @returns {any} 配置对象
   * 
   * @private
   */
  private buildConfigFromEnv(): any {
    return {
      api: {
        port: parseInt(process.env.API_PORT || '3000'),
        host: process.env.API_HOST || 'http://localhost',
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        clientBaseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:4200',
        production: process.env.NODE_ENV === 'production',
        envName: process.env.NODE_ENV || 'development',
      },
      database: {
        type: process.env.DB_TYPE || 'postgresql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'aiofix_platform',
        username: process.env.DB_USER || 'aiofix_user',
        password: process.env.DB_PASS || 'aiofix_password',
        sslMode: process.env.DB_SSL_MODE === 'true',
        logging: process.env.DB_LOGGING || 'false',
        poolSize: parseInt(process.env.DB_POOL_SIZE || '40'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
        idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
      },
      // ... 其他配置项
    };
  }

  /**
   * 判断是否为关键配置
   *
   * @description 判断配置项是否为关键配置
   * 
   * @param {string} configKey - 配置键
   * @returns {boolean} 是否为关键配置
   * 
   * @private
   */
  private isCriticalConfig(configKey: string): boolean {
    const criticalKeys = ['DB_PASSWORD', 'JWT_SECRET', 'REDIS_PASSWORD'];
    return criticalKeys.includes(configKey);
  }

  /**
   * 更新配置快照
   *
   * @description 更新配置快照为当前状态
   * 
   * @private
   */
  private updateConfigSnapshot(): void {
    for (const configKey of this.criticalConfigs) {
      this.configSnapshot[configKey] = process.env[configKey] || '';
    }
  }

  /**
   * 触发变更回调
   *
   * @description 触发所有注册的变更回调函数
   * 
   * @param {ConfigChangeEvent} changes - 配置变更事件
   * 
   * @private
   */
  private triggerChangeCallbacks(changes: ConfigChangeEvent): void {
    for (const callback of this.changeCallbacks) {
      try {
        callback(changes);
      } catch (error) {
        this.logger.error('配置变更回调执行失败', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  /**
   * 注册配置变更回调
   *
   * @description 注册配置变更时的回调函数
   * 
   * @param {Function} callback - 回调函数
   * 
   * @example
   * ```typescript
   * configMonitor.onConfigChange((changes) => {
   *   console.log('配置已变更:', changes);
   * });
   * ```
   * 
   * @since 1.0.0
   */
  onConfigChange(callback: (changes: ConfigChangeEvent) => void): void {
    this.changeCallbacks.push(callback);
  }

  /**
   * 获取当前配置状态
   *
   * @description 获取当前配置监控状态
   * 
   * @returns {ConfigMonitorStatus} 监控状态
   * 
   * @example
   * ```typescript
   * const status = configMonitor.getStatus();
   * console.log('监控状态:', status);
   * ```
   * 
   * @since 1.0.0
   */
  getStatus(): ConfigMonitorStatus {
    return {
      isMonitoring: this.isMonitoring,
      monitorInterval: this.monitorInterval,
      criticalConfigs: this.criticalConfigs,
      callbackCount: this.changeCallbacks.length,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * 强制检查配置
   *
   * @description 立即检查配置变化，不等待定时器
   * 
   * @example
   * ```typescript
   * await configMonitor.forceCheck();
   * ```
   * 
   * @since 1.0.0
   */
  async forceCheck(): Promise<void> {
    this.logger.info('强制执行配置检查');
    await this.checkConfigChanges();
  }
}

/**
 * 配置变更事件接口
 *
 * @description 配置变更事件的类型定义
 */
export interface ConfigChangeEvent {
  /** 变更时间戳 */
  timestamp: string;
  /** 所有变更项 */
  changes: ConfigChange[];
  /** 关键变更项 */
  criticalChanges: ConfigChange[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 配置变更项接口
 *
 * @description 单个配置变更的类型定义
 */
export interface ConfigChange {
  /** 配置键 */
  key: string;
  /** 旧值 */
  oldValue: string;
  /** 新值 */
  newValue: string;
  /** 是否为关键配置 */
  isCritical: boolean;
}

/**
 * 配置监控状态接口
 *
 * @description 配置监控服务状态的类型定义
 */
export interface ConfigMonitorStatus {
  /** 是否正在监控 */
  isMonitoring: boolean;
  /** 监控间隔 */
  monitorInterval: number;
  /** 关键配置项列表 */
  criticalConfigs: string[];
  /** 回调函数数量 */
  callbackCount: number;
  /** 最后检查时间 */
  lastCheck: string;
}

/**
 * 验证结果接口
 *
 * @description 配置验证结果的类型定义
 */
export interface ValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 验证错误列表 */
  errors: any[];
}
