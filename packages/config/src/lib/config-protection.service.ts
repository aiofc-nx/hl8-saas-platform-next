import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';

/**
 * 配置保护服务
 *
 * @description 提供配置安全保护功能，防止关键配置被意外修改
 * 包括配置锁定、变更审计、安全验证等功能
 *
 * ## 主要功能
 *
 * ### 配置锁定
 * - 锁定关键配置项，防止意外修改
 * - 支持临时锁定和永久锁定
 * - 提供锁定状态查询
 *
 * ### 变更审计
 * - 记录所有配置变更历史
 * - 提供变更追踪和回滚功能
 * - 支持变更通知和告警
 *
 * ### 安全验证
 * - 验证配置变更的合法性
 * - 检查配置值的合理性
 * - 提供安全建议
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly configProtection: ConfigProtectionService) {}
 *   
 *   async protectConfig() {
 *     await this.configProtection.lockCriticalConfigs();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigProtectionService {
  /**
   * 日志记录器
   */
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });

  /**
   * 锁定的配置项
   */
  private lockedConfigs: Set<string> = new Set();

  /**
   * 配置变更历史
   */
  private changeHistory: ConfigChangeRecord[] = [];

  /**
   * 关键配置项定义
   */
  private readonly criticalConfigs = [
    {
      key: 'DB_PASSWORD',
      description: '数据库密码',
      isLockable: true,
      minLength: 8,
      requiresSpecialChars: true
    },
    {
      key: 'JWT_SECRET',
      description: 'JWT密钥',
      isLockable: true,
      minLength: 32,
      requiresSpecialChars: true
    },
    {
      key: 'REDIS_PASSWORD',
      description: 'Redis密码',
      isLockable: true,
      minLength: 8,
      requiresSpecialChars: false
    },
    {
      key: 'API_PORT',
      description: 'API端口',
      isLockable: false,
      minValue: 1024,
      maxValue: 65535
    }
  ];

  /**
   * 锁定关键配置
   *
   * @description 锁定所有关键配置项，防止意外修改
   * 
   * @param {string[]} configKeys - 要锁定的配置键列表，为空则锁定所有关键配置
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // 锁定所有关键配置
   * await configProtection.lockCriticalConfigs();
   * 
   * // 锁定特定配置
   * await configProtection.lockCriticalConfigs(['DB_PASSWORD', 'JWT_SECRET']);
   * ```
   * 
   * @since 1.0.0
   */
  async lockCriticalConfigs(configKeys?: string[]): Promise<void> {
    const keysToLock = configKeys || this.criticalConfigs
      .filter(config => config.isLockable)
      .map(config => config.key);

    for (const key of keysToLock) {
      this.lockedConfigs.add(key);
      this.logger.info('配置已锁定', { key });
    }

    this.logger.info('关键配置锁定完成', { 
      lockedCount: keysToLock.length,
      lockedKeys: Array.from(this.lockedConfigs)
    });
  }

  /**
   * 解锁配置
   *
   * @description 解锁指定的配置项
   * 
   * @param {string[]} configKeys - 要解锁的配置键列表
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // 解锁特定配置
   * await configProtection.unlockConfigs(['API_PORT']);
   * ```
   * 
   * @since 1.0.0
   */
  async unlockConfigs(configKeys: string[]): Promise<void> {
    for (const key of configKeys) {
      this.lockedConfigs.delete(key);
      this.logger.info('配置已解锁', { key });
    }

    this.logger.info('配置解锁完成', { 
      unlockedKeys: configKeys,
      remainingLocked: Array.from(this.lockedConfigs)
    });
  }

  /**
   * 检查配置是否被锁定
   *
   * @description 检查指定配置项是否被锁定
   * 
   * @param {string} configKey - 配置键
   * @returns {boolean} 是否被锁定
   * 
   * @example
   * ```typescript
   * const isLocked = configProtection.isConfigLocked('DB_PASSWORD');
   * ```
   * 
   * @since 1.0.0
   */
  isConfigLocked(configKey: string): boolean {
    return this.lockedConfigs.has(configKey);
  }

  /**
   * 验证配置变更
   *
   * @description 验证配置变更是否合法和安全
   * 
   * @param {string} configKey - 配置键
   * @param {string} newValue - 新值
   * @param {string} oldValue - 旧值
   * @returns {Promise<ConfigValidationResult>} 验证结果
   * 
   * @example
   * ```typescript
   * const result = await configProtection.validateConfigChange(
   *   'DB_PASSWORD', 
   *   'newPassword123!', 
   *   'oldPassword'
   * );
   * 
   * if (!result.isValid) {
   *   console.error('配置变更验证失败:', result.errors);
   * }
   * ```
   * 
   * @since 1.0.0
   */
  async validateConfigChange(
    configKey: string, 
    newValue: string, 
    oldValue: string
  ): Promise<ConfigValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查是否被锁定
    if (this.isConfigLocked(configKey)) {
      errors.push(`配置项 ${configKey} 已被锁定，无法修改`);
    }

    // 获取配置定义
    const configDef = this.criticalConfigs.find(c => c.key === configKey);
    if (configDef) {
      // 验证密码强度
      if (configDef.minLength && newValue.length < configDef.minLength) {
        errors.push(`密码长度至少需要 ${configDef.minLength} 位`);
      }

      // 验证特殊字符要求
      if (configDef.requiresSpecialChars && !this.hasSpecialChars(newValue)) {
        warnings.push('建议使用包含特殊字符的强密码');
      }

      // 验证数值范围
      if (configDef.minValue !== undefined && configDef.maxValue !== undefined) {
        const numValue = parseInt(newValue);
        if (isNaN(numValue)) {
          errors.push('配置值必须是有效的数字');
        } else if (numValue < configDef.minValue || numValue > configDef.maxValue) {
          errors.push(`配置值必须在 ${configDef.minValue} 到 ${configDef.maxValue} 之间`);
        }
      }
    }

    // 记录变更历史
    this.recordConfigChange(configKey, oldValue, newValue, errors.length === 0);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      isLocked: this.isConfigLocked(configKey),
      changeRecorded: true
    };
  }

  /**
   * 记录配置变更
   *
   * @description 记录配置变更到历史记录
   * 
   * @param {string} configKey - 配置键
   * @param {string} oldValue - 旧值
   * @param {string} newValue - 新值
   * @param {boolean} isValid - 是否有效
   * 
   * @private
   */
  private recordConfigChange(
    configKey: string, 
    oldValue: string, 
    newValue: string, 
    isValid: boolean
  ): void {
    const record: ConfigChangeRecord = {
      timestamp: new Date().toISOString(),
      configKey,
      oldValue: this.maskSensitiveValue(configKey, oldValue),
      newValue: this.maskSensitiveValue(configKey, newValue),
      isValid,
      isLocked: this.isConfigLocked(configKey)
    };

    this.changeHistory.push(record);

    // 保持历史记录在合理范围内
    if (this.changeHistory.length > 1000) {
      this.changeHistory = this.changeHistory.slice(-500);
    }

    this.logger.info('配置变更已记录', {
      configKey,
      isValid,
      isLocked: this.isConfigLocked(configKey)
    });
  }

  /**
   * 检查是否包含特殊字符
   *
   * @description 检查字符串是否包含特殊字符
   * 
   * @param {string} value - 要检查的值
   * @returns {boolean} 是否包含特殊字符
   * 
   * @private
   */
  private hasSpecialChars(value: string): boolean {
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    return specialChars.test(value);
  }

  /**
   * 掩码敏感值
   *
   * @description 对敏感配置值进行掩码处理
   * 
   * @param {string} configKey - 配置键
   * @param {string} value - 原始值
   * @returns {string} 掩码后的值
   * 
   * @private
   */
  private maskSensitiveValue(configKey: string, value: string): string {
    const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
    const isSensitive = sensitiveKeys.some(key => 
      configKey.toUpperCase().includes(key)
    );

    if (isSensitive && value.length > 0) {
      return '*'.repeat(Math.min(value.length, 8));
    }

    return value;
  }

  /**
   * 获取配置变更历史
   *
   * @description 获取配置变更历史记录
   * 
   * @param {number} limit - 限制返回记录数，默认100
   * @returns {ConfigChangeRecord[]} 变更历史记录
   * 
   * @example
   * ```typescript
   * const history = configProtection.getChangeHistory(50);
   * console.log('最近50条变更记录:', history);
   * ```
   * 
   * @since 1.0.0
   */
  getChangeHistory(limit: number = 100): ConfigChangeRecord[] {
    return this.changeHistory
      .slice(-limit)
      .reverse();
  }

  /**
   * 获取锁定状态
   *
   * @description 获取当前配置锁定状态
   * 
   * @returns {ConfigLockStatus} 锁定状态
   * 
   * @example
   * ```typescript
   * const status = configProtection.getLockStatus();
   * console.log('锁定状态:', status);
   * ```
   * 
   * @since 1.0.0
   */
  getLockStatus(): ConfigLockStatus {
    return {
      lockedConfigs: Array.from(this.lockedConfigs),
      totalLocked: this.lockedConfigs.size,
      criticalConfigs: this.criticalConfigs.length,
      isFullyProtected: this.lockedConfigs.size === this.criticalConfigs.length
    };
  }

  /**
   * 获取配置安全建议
   *
   * @description 获取当前配置的安全建议
   * 
   * @returns {ConfigSecurityAdvice[]} 安全建议列表
   * 
   * @example
   * ```typescript
   * const advice = configProtection.getSecurityAdvice();
   * console.log('安全建议:', advice);
   * ```
   * 
   * @since 1.0.0
   */
  getSecurityAdvice(): ConfigSecurityAdvice[] {
    const advice: ConfigSecurityAdvice[] = [];

    // 检查未锁定的关键配置
    const unlockedCritical = this.criticalConfigs.filter(config => 
      config.isLockable && !this.lockedConfigs.has(config.key)
    );

    if (unlockedCritical.length > 0) {
      advice.push({
        type: 'warning',
        message: `发现 ${unlockedCritical.length} 个未锁定的关键配置`,
        configs: unlockedCritical.map(c => c.key),
        recommendation: '建议锁定所有关键配置项'
      });
    }

    // 检查弱密码
    const weakPasswords = this.checkWeakPasswords();
    if (weakPasswords.length > 0) {
      advice.push({
        type: 'error',
        message: '发现弱密码配置',
        configs: weakPasswords,
        recommendation: '建议使用强密码，包含大小写字母、数字和特殊字符'
      });
    }

    return advice;
  }

  /**
   * 检查弱密码
   *
   * @description 检查当前配置中的弱密码
   * 
   * @returns {string[]} 弱密码配置键列表
   * 
   * @private
   */
  private checkWeakPasswords(): string[] {
    const weakPasswords: string[] = [];
    const passwordKeys = ['PASSWORD', 'SECRET', 'KEY'];

    for (const config of this.criticalConfigs) {
      if (passwordKeys.some(key => config.key.includes(key))) {
        const value = process.env[config.key] || '';
        if (value.length < 8 || !this.hasSpecialChars(value)) {
          weakPasswords.push(config.key);
        }
      }
    }

    return weakPasswords;
  }
}

/**
 * 配置验证结果接口
 *
 * @description 配置变更验证结果的类型定义
 */
export interface ConfigValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: string[];
  /** 警告信息列表 */
  warnings: string[];
  /** 是否被锁定 */
  isLocked: boolean;
  /** 是否已记录变更 */
  changeRecorded: boolean;
}

/**
 * 配置变更记录接口
 *
 * @description 配置变更历史记录的类型定义
 */
export interface ConfigChangeRecord {
  /** 变更时间戳 */
  timestamp: string;
  /** 配置键 */
  configKey: string;
  /** 旧值（已掩码） */
  oldValue: string;
  /** 新值（已掩码） */
  newValue: string;
  /** 是否有效 */
  isValid: boolean;
  /** 是否被锁定 */
  isLocked: boolean;
}

/**
 * 配置锁定状态接口
 *
 * @description 配置锁定状态的类型定义
 */
export interface ConfigLockStatus {
  /** 已锁定的配置键列表 */
  lockedConfigs: string[];
  /** 锁定配置总数 */
  totalLocked: number;
  /** 关键配置总数 */
  criticalConfigs: number;
  /** 是否完全保护 */
  isFullyProtected: boolean;
}

/**
 * 配置安全建议接口
 *
 * @description 配置安全建议的类型定义
 */
export interface ConfigSecurityAdvice {
  /** 建议类型 */
  type: 'info' | 'warning' | 'error';
  /** 建议消息 */
  message: string;
  /** 相关配置键 */
  configs: string[];
  /** 推荐操作 */
  recommendation: string;
}
