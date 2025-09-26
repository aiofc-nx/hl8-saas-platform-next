import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { ConfigService } from './config.service.js';
import { ConfigValidationService } from './validation/config-validation.service.js';

/**
 * 配置恢复服务
 *
 * @description 提供配置恢复和回滚功能，当配置出现问题时能够快速恢复
 * 包括配置备份、自动恢复、手动回滚等功能
 *
 * ## 主要功能
 *
 * ### 配置备份
 * - 自动备份关键配置
 * - 支持多版本备份
 * - 提供备份管理功能
 *
 * ### 自动恢复
 * - 检测配置异常并自动恢复
 * - 支持恢复到最近有效配置
 * - 提供恢复策略配置
 *
 * ### 手动回滚
 * - 支持手动选择恢复点
 * - 提供回滚预览功能
 * - 记录回滚操作历史
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly configRecovery: ConfigRecoveryService) {}
 *   
 *   async setupRecovery() {
 *     await this.configRecovery.createBackup('initial');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigRecoveryService {
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
   * 配置备份存储
   */
  private configBackups: Map<string, ConfigBackup> = new Map();

  /**
   * 自动恢复设置
   */
  private autoRecoverySettings: AutoRecoverySettings = {
    enabled: true,
    maxRetries: 3,
    retryInterval: 5000,
    validationTimeout: 10000
  };

  /**
   * 恢复操作历史
   */
  private recoveryHistory: RecoveryRecord[] = [];

  /**
   * 创建配置备份
   *
   * @description 创建当前配置的备份
   * 
   * @param {string} backupName - 备份名称
   * @param {string} description - 备份描述
   * @returns {Promise<ConfigBackup>} 备份信息
   * 
   * @example
   * ```typescript
   * // 创建初始备份
   * const backup = await configRecovery.createBackup('initial', '应用启动时的配置');
   * 
   * // 创建更新前备份
   * const backup = await configRecovery.createBackup('before-update', '配置更新前的备份');
   * ```
   * 
   * @since 1.0.0
   */
  async createBackup(backupName: string, description: string = ''): Promise<ConfigBackup> {
    const timestamp = new Date().toISOString();
    const configSnapshot = this.captureCurrentConfig();

    const backup: ConfigBackup = {
      name: backupName,
      description,
      timestamp,
      config: configSnapshot,
      isValid: true,
      size: JSON.stringify(configSnapshot).length
    };

    this.configBackups.set(backupName, backup);
    
    this.logger.info('配置备份已创建', {
      backupName,
      description,
      size: backup.size
    });

    return backup;
  }

  /**
   * 恢复配置
   *
   * @description 从指定备份恢复配置
   * 
   * @param {string} backupName - 备份名称
   * @param {boolean} validate - 是否验证恢复后的配置
   * @returns {Promise<RecoveryResult>} 恢复结果
   * 
   * @example
   * ```typescript
   * // 恢复配置
   * const result = await configRecovery.restoreConfig('initial', true);
   * 
   * if (result.success) {
   *   console.log('配置恢复成功');
   * } else {
   *   console.error('配置恢复失败:', result.error);
   * }
   * ```
   * 
   * @since 1.0.0
   */
  async restoreConfig(backupName: string, validate: boolean = true): Promise<RecoveryResult> {
    const backup = this.configBackups.get(backupName);
    
    if (!backup) {
      return {
        success: false,
        error: `备份 ${backupName} 不存在`,
        backupName: null
      };
    }

    try {
      this.logger.info('开始恢复配置', { backupName });

      // 创建当前配置的备份（用于回滚）
      const currentBackup = await this.createBackup(
        `before-restore-${Date.now()}`, 
        `恢复 ${backupName} 前的配置`
      );

      // 应用备份配置
      this.applyConfig(backup.config);

      // 验证恢复后的配置
      if (validate) {
        const validationResult = await this.validateRecoveredConfig();
        if (!validationResult.isValid) {
          this.logger.error('恢复后配置验证失败', {
            errors: validationResult.errors
          });
          
          // 自动回滚到恢复前的状态
          await this.rollbackToBackup(currentBackup.name);
          
          return {
            success: false,
            error: '恢复后配置验证失败',
            backupName: currentBackup.name
          };
        }
      }

      // 记录恢复操作
      this.recordRecoveryOperation(backupName, true, '配置恢复成功');

      this.logger.info('配置恢复成功', { backupName });

      return {
        success: true,
        error: null,
        backupName: backupName
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('配置恢复失败', { 
        backupName, 
        error: errorMessage 
      });

      this.recordRecoveryOperation(backupName, false, errorMessage);

      return {
        success: false,
        error: errorMessage,
        backupName: null
      };
    }
  }

  /**
   * 自动恢复配置
   *
   * @description 自动检测配置问题并尝试恢复
   * 
   * @returns {Promise<AutoRecoveryResult>} 自动恢复结果
   * 
   * @example
   * ```typescript
   * const result = await configRecovery.autoRecover();
   * if (result.recovered) {
   *   console.log('配置已自动恢复');
   * }
   * ```
   * 
   * @since 1.0.0
   */
  async autoRecover(): Promise<AutoRecoveryResult> {
    if (!this.autoRecoverySettings.enabled) {
      return {
        recovered: false,
        reason: '自动恢复已禁用',
        attempts: 0
      };
    }

    this.logger.info('开始自动恢复检查');

    // 验证当前配置
    const validationResult = await this.validateCurrentConfig();
    if (validationResult.isValid) {
      return {
        recovered: false,
        reason: '当前配置有效，无需恢复',
        attempts: 0
      };
    }

    this.logger.warn('检测到配置问题，开始自动恢复', {
      errors: validationResult.errors
    });

    // 尝试从最近的备份恢复
    const recentBackups = this.getRecentBackups(5);
    let attempts = 0;

    for (const backup of recentBackups) {
      attempts++;
      
      if (attempts > this.autoRecoverySettings.maxRetries) {
        break;
      }

      this.logger.info('尝试恢复配置', { 
        backupName: backup.name, 
        attempt: attempts 
      });

      const restoreResult = await this.restoreConfig(backup.name, true);
      
      if (restoreResult.success) {
        this.logger.info('自动恢复成功', { 
          backupName: backup.name, 
          attempts 
        });

        return {
          recovered: true,
          reason: `从备份 ${backup.name} 恢复成功`,
          attempts,
          backupName: backup.name
        };
      }

      // 等待重试间隔
      if (attempts < this.autoRecoverySettings.maxRetries) {
        await this.delay(this.autoRecoverySettings.retryInterval);
      }
    }

    this.logger.error('自动恢复失败', { attempts });

    return {
      recovered: false,
      reason: '所有恢复尝试都失败了',
      attempts
    };
  }

  /**
   * 获取可用备份列表
   *
   * @description 获取所有可用的配置备份
   * 
   * @returns {ConfigBackup[]} 备份列表
   * 
   * @example
   * ```typescript
   * const backups = configRecovery.getAvailableBackups();
   * console.log('可用备份:', backups);
   * ```
   * 
   * @since 1.0.0
   */
  getAvailableBackups(): ConfigBackup[] {
    return Array.from(this.configBackups.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * 删除备份
   *
   * @description 删除指定的配置备份
   * 
   * @param {string} backupName - 备份名称
   * @returns {boolean} 是否删除成功
   * 
   * @example
   * ```typescript
   * const deleted = configRecovery.deleteBackup('old-backup');
   * ```
   * 
   * @since 1.0.0
   */
  deleteBackup(backupName: string): boolean {
    const deleted = this.configBackups.delete(backupName);
    
    if (deleted) {
      this.logger.info('备份已删除', { backupName });
    } else {
      this.logger.warn('备份不存在', { backupName });
    }

    return deleted;
  }

  /**
   * 获取恢复历史
   *
   * @description 获取配置恢复操作历史
   * 
   * @param {number} limit - 限制返回记录数
   * @returns {RecoveryRecord[]} 恢复历史记录
   * 
   * @example
   * ```typescript
   * const history = configRecovery.getRecoveryHistory(10);
   * ```
   * 
   * @since 1.0.0
   */
  getRecoveryHistory(limit: number = 50): RecoveryRecord[] {
    return this.recoveryHistory
      .slice(-limit)
      .reverse();
  }

  /**
   * 设置自动恢复
   *
   * @description 配置自动恢复设置
   * 
   * @param {AutoRecoverySettings} settings - 自动恢复设置
   * 
   * @example
   * ```typescript
   * configRecovery.setAutoRecovery({
   *   enabled: true,
   *   maxRetries: 5,
   *   retryInterval: 3000
   * });
   * ```
   * 
   * @since 1.0.0
   */
  setAutoRecovery(settings: Partial<AutoRecoverySettings>): void {
    this.autoRecoverySettings = {
      ...this.autoRecoverySettings,
      ...settings
    };

    this.logger.info('自动恢复设置已更新', this.autoRecoverySettings);
  }

  /**
   * 捕获当前配置
   *
   * @description 捕获当前环境变量构建的配置
   * 
   * @returns {any} 配置对象
   * 
   * @private
   */
  private captureCurrentConfig(): any {
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
   * 应用配置
   *
   * @description 将配置应用到环境变量
   * 
   * @param {any} config - 配置对象
   * 
   * @private
   */
  private applyConfig(config: any): void {
    // 应用API配置
    if (config.api) {
      if (config.api.port) process.env.API_PORT = config.api.port.toString();
      if (config.api.host) process.env.API_HOST = config.api.host;
      if (config.api.baseUrl) process.env.API_BASE_URL = config.api.baseUrl;
      if (config.api.clientBaseUrl) process.env.CLIENT_BASE_URL = config.api.clientBaseUrl;
    }

    // 应用数据库配置
    if (config.database) {
      if (config.database.type) process.env.DB_TYPE = config.database.type;
      if (config.database.host) process.env.DB_HOST = config.database.host;
      if (config.database.port) process.env.DB_PORT = config.database.port.toString();
      if (config.database.name) process.env.DB_NAME = config.database.name;
      if (config.database.username) process.env.DB_USER = config.database.username;
      if (config.database.password) process.env.DB_PASS = config.database.password;
      if (config.database.sslMode !== undefined) process.env.DB_SSL_MODE = config.database.sslMode.toString();
      if (config.database.logging !== undefined) process.env.DB_LOGGING = config.database.logging.toString();
      if (config.database.poolSize) process.env.DB_POOL_SIZE = config.database.poolSize.toString();
      if (config.database.connectionTimeout) process.env.DB_CONNECTION_TIMEOUT = config.database.connectionTimeout.toString();
      if (config.database.idleTimeout) process.env.DB_IDLE_TIMEOUT = config.database.idleTimeout.toString();
    }

    // ... 应用其他配置项
  }

  /**
   * 验证恢复后的配置
   *
   * @description 验证恢复后的配置是否有效
   * 
   * @returns {Promise<ValidationResult>} 验证结果
   * 
   * @private
   */
  private async validateRecoveredConfig(): Promise<ValidationResult> {
    const currentConfig = this.captureCurrentConfig();
    return await this.validationService.validateApplicationConfig(currentConfig);
  }

  /**
   * 验证当前配置
   *
   * @description 验证当前配置是否有效
   * 
   * @returns {Promise<ValidationResult>} 验证结果
   * 
   * @private
   */
  private async validateCurrentConfig(): Promise<ValidationResult> {
    const currentConfig = this.captureCurrentConfig();
    return await this.validationService.validateApplicationConfig(currentConfig);
  }

  /**
   * 回滚到备份
   *
   * @description 回滚到指定备份
   * 
   * @param {string} backupName - 备份名称
   * 
   * @private
   */
  private async rollbackToBackup(backupName: string): Promise<void> {
    const backup = this.configBackups.get(backupName);
    if (backup) {
      this.applyConfig(backup.config);
      this.logger.info('已回滚到备份', { backupName });
    }
  }

  /**
   * 获取最近备份
   *
   * @description 获取最近的配置备份
   * 
   * @param {number} count - 备份数量
   * @returns {ConfigBackup[]} 备份列表
   * 
   * @private
   */
  private getRecentBackups(count: number): ConfigBackup[] {
    return this.getAvailableBackups().slice(0, count);
  }

  /**
   * 记录恢复操作
   *
   * @description 记录恢复操作到历史
   * 
   * @param {string} backupName - 备份名称
   * @param {boolean} success - 是否成功
   * @param {string} message - 操作消息
   * 
   * @private
   */
  private recordRecoveryOperation(backupName: string, success: boolean, message: string): void {
    const record: RecoveryRecord = {
      timestamp: new Date().toISOString(),
      backupName,
      success,
      message
    };

    this.recoveryHistory.push(record);

    // 保持历史记录在合理范围内
    if (this.recoveryHistory.length > 1000) {
      this.recoveryHistory = this.recoveryHistory.slice(-500);
    }
  }

  /**
   * 延迟执行
   *
   * @description 延迟指定时间
   * 
   * @param {number} ms - 延迟时间（毫秒）
   * 
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 配置备份接口
 *
 * @description 配置备份的类型定义
 */
export interface ConfigBackup {
  /** 备份名称 */
  name: string;
  /** 备份描述 */
  description: string;
  /** 备份时间戳 */
  timestamp: string;
  /** 配置对象 */
  config: any;
  /** 是否有效 */
  isValid: boolean;
  /** 备份大小 */
  size: number;
}

/**
 * 恢复结果接口
 *
 * @description 配置恢复结果的类型定义
 */
export interface RecoveryResult {
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error: string | null;
  /** 使用的备份名称 */
  backupName: string | null;
}

/**
 * 自动恢复结果接口
 *
 * @description 自动恢复结果的类型定义
 */
export interface AutoRecoveryResult {
  /** 是否恢复成功 */
  recovered: boolean;
  /** 恢复原因 */
  reason: string;
  /** 尝试次数 */
  attempts: number;
  /** 使用的备份名称 */
  backupName?: string;
}

/**
 * 自动恢复设置接口
 *
 * @description 自动恢复设置的类型定义
 */
export interface AutoRecoverySettings {
  /** 是否启用自动恢复 */
  enabled: boolean;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试间隔（毫秒） */
  retryInterval: number;
  /** 验证超时时间（毫秒） */
  validationTimeout: number;
}

/**
 * 恢复记录接口
 *
 * @description 恢复操作记录的类型定义
 */
export interface RecoveryRecord {
  /** 操作时间戳 */
  timestamp: string;
  /** 备份名称 */
  backupName: string;
  /** 是否成功 */
  success: boolean;
  /** 操作消息 */
  message: string;
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
