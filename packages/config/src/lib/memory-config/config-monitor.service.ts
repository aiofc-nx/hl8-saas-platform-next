import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';
import { MemoryConfigService } from './memory-config.service.js';
import { ConfigCompatibilityAdapter } from './compatibility-adapter.js';
import { HybridConfigService } from './hybrid-config.service.js';

/**
 * 配置监控服务
 *
 * @description 监控内存配置服务的状态和性能
 * 提供配置健康检查、性能监控和状态报告功能
 *
 * ## 主要功能
 *
 * ### 配置状态监控
 * - 监控配置加载状态
 * - 检查配置完整性
 * - 验证配置一致性
 *
 * ### 性能监控
 * - 监控配置访问性能
 * - 检查内存使用情况
 * - 分析性能指标
 *
 * ### 健康检查
 * - 配置服务健康检查
 * - 配置数据完整性检查
 * - 错误监控和报告
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly configMonitor: ConfigMonitorService) {}
 *   
 *   async checkConfigHealth() {
 *     const health = await this.configMonitor.checkConfigHealth();
 *     console.log('配置健康状态:', health);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigMonitorService {
  /**
   * 日志记录器
   */
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });

  /**
   * 性能指标存储
   */
  private performanceMetrics: PerformanceMetric[] = [];

  /**
   * 健康检查历史
   */
  private healthCheckHistory: HealthCheckRecord[] = [];

  constructor(
    private readonly memoryConfig: MemoryConfigService,
    private readonly compatibilityAdapter: ConfigCompatibilityAdapter,
    private readonly hybridConfig: HybridConfigService
  ) {}

  /**
   * 检查配置健康状态
   *
   * @description 检查配置服务的整体健康状态
   * @returns {Promise<ConfigHealthStatus>} 配置健康状态
   * 
   * @example
   * ```typescript
   * const health = await configMonitor.checkConfigHealth();
   * if (health.isHealthy) {
   *   console.log('配置服务健康');
   * } else {
   *   console.error('配置服务异常:', health.issues);
   * }
   * ```
   * 
   * @since 1.0.0
   */
  async checkConfigHealth(): Promise<ConfigHealthStatus> {
    const startTime = Date.now();
    const issues: string[] = [];
    let isHealthy = true;

    try {
      this.logger.info('开始配置健康检查');

      // 检查内存配置服务状态
      const memoryStatus = this.memoryConfig.getConfigStatus();
      if (!memoryStatus.isLoaded) {
        isHealthy = false;
        issues.push('内存配置服务未加载');
      }

      // 检查配置完整性
      const configIntegrity = await this.checkConfigIntegrity();
      if (!configIntegrity.isValid) {
        isHealthy = false;
        issues.push(...configIntegrity.issues);
      }

      // 检查配置一致性
      const configConsistency = await this.checkConfigConsistency();
      if (!configConsistency.isConsistent) {
        isHealthy = false;
        issues.push(...configConsistency.issues);
      }

      // 检查性能指标
      const performanceHealth = this.checkPerformanceHealth();
      if (!performanceHealth.isHealthy) {
        isHealthy = false;
        issues.push(...performanceHealth.issues);
      }

      const duration = Date.now() - startTime;
      const healthStatus: ConfigHealthStatus = {
        isHealthy,
        issues,
        timestamp: new Date().toISOString(),
        duration,
        memoryStatus,
        configIntegrity,
        configConsistency,
        performanceHealth
      };

      // 记录健康检查历史
      this.recordHealthCheck(healthStatus);

      this.logger.info('配置健康检查完成', {
        isHealthy,
        issuesCount: issues.length,
        duration
      });

      return healthStatus;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('配置健康检查失败', { error: errorMessage });

      const healthStatus: ConfigHealthStatus = {
        isHealthy: false,
        issues: [`配置健康检查失败: ${errorMessage}`],
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        memoryStatus: this.memoryConfig.getConfigStatus(),
        configIntegrity: { 
          isValid: false, 
          issues: [errorMessage], 
          timestamp: new Date().toISOString() 
        },
        configConsistency: { 
          isConsistent: false, 
          issues: [errorMessage], 
          timestamp: new Date().toISOString() 
        },
        performanceHealth: { 
          isHealthy: false, 
          issues: [errorMessage], 
          timestamp: new Date().toISOString(),
          averageResponseTime: 0,
          totalRequests: 0
        }
      };

      this.recordHealthCheck(healthStatus);
      return healthStatus;
    }
  }

  /**
   * 检查配置完整性
   *
   * @description 检查配置数据的完整性
   * @returns {Promise<ConfigIntegrityStatus>} 配置完整性状态
   * 
   * @private
   */
  private async checkConfigIntegrity(): Promise<ConfigIntegrityStatus> {
    const issues: string[] = [];
    let isValid = true;

    try {
      // 检查API配置
      const apiConfig = this.memoryConfig.getApiConfig();
      if (!apiConfig.port || apiConfig.port <= 0) {
        isValid = false;
        issues.push('API端口配置无效');
      }

      // 检查数据库配置
      const dbConfig = this.memoryConfig.getDatabaseConfig();
      if (!dbConfig.host || !dbConfig.name) {
        isValid = false;
        issues.push('数据库配置不完整');
      }

      // 检查认证配置
      const authConfig = this.memoryConfig.getAuthConfig();
      if (!authConfig.jwtSecret || authConfig.jwtSecret.length < 32) {
        isValid = false;
        issues.push('JWT密钥配置不安全');
      }

      // 检查Redis配置
      const redisConfig = this.memoryConfig.getRedisConfig();
      if (!redisConfig.host || redisConfig.port <= 0) {
        isValid = false;
        issues.push('Redis配置无效');
      }

      return {
        isValid,
        issues,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isValid: false,
        issues: [`配置完整性检查失败: ${errorMessage}`],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查配置一致性
   *
   * @description 检查不同配置服务之间的一致性
   * @returns {Promise<ConfigConsistencyStatus>} 配置一致性状态
   * 
   * @private
   */
  private async checkConfigConsistency(): Promise<ConfigConsistencyStatus> {
    const issues: string[] = [];
    let isConsistent = true;

    try {
      // 检查内存配置与兼容适配器的一致性
      const memoryApiConfig = this.memoryConfig.getApiConfig();
      const adapterApiConfig = this.compatibilityAdapter.get<any>('api');

      if (memoryApiConfig.port !== adapterApiConfig?.port) {
        isConsistent = false;
        issues.push('API端口配置不一致');
      }

      if (memoryApiConfig.host !== adapterApiConfig?.host) {
        isConsistent = false;
        issues.push('API主机配置不一致');
      }

      // 检查内存配置与混合配置的一致性
      const hybridApiConfig = this.hybridConfig.getApiConfig();

      if (memoryApiConfig.port !== hybridApiConfig.port) {
        isConsistent = false;
        issues.push('混合配置API端口不一致');
      }

      return {
        isConsistent,
        issues,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isConsistent: false,
        issues: [`配置一致性检查失败: ${errorMessage}`],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 检查性能健康状态
   *
   * @description 检查配置访问的性能健康状态
   * @returns {PerformanceHealthStatus} 性能健康状态
   * 
   * @private
   */
  private checkPerformanceHealth(): PerformanceHealthStatus {
    const issues: string[] = [];
    let isHealthy = true;

    try {
      // 检查最近的性能指标
      const recentMetrics = this.performanceMetrics.slice(-10);
      if (recentMetrics.length === 0) {
        return {
          isHealthy: true,
          issues: [],
          timestamp: new Date().toISOString(),
          averageResponseTime: 0,
          totalRequests: 0
        };
      }

      const averageResponseTime = recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / recentMetrics.length;
      const totalRequests = recentMetrics.reduce((sum, metric) => sum + metric.requestCount, 0);

      // 性能阈值检查
      if (averageResponseTime > 10) { // 10ms
        isHealthy = false;
        issues.push(`平均响应时间过长: ${averageResponseTime.toFixed(2)}ms`);
      }

      if (totalRequests > 1000) { // 1000次请求
        isHealthy = false;
        issues.push(`请求数量过多: ${totalRequests}`);
      }

      return {
        isHealthy,
        issues,
        timestamp: new Date().toISOString(),
        averageResponseTime,
        totalRequests
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isHealthy: false,
        issues: [`性能健康检查失败: ${errorMessage}`],
        timestamp: new Date().toISOString(),
        averageResponseTime: 0,
        totalRequests: 0
      };
    }
  }

  /**
   * 记录性能指标
   *
   * @description 记录配置访问的性能指标
   * @param {number} responseTime - 响应时间（毫秒）
   * @param {number} requestCount - 请求数量
   * 
   * @example
   * ```typescript
   * configMonitor.recordPerformanceMetric(5.2, 100);
   * ```
   * 
   * @since 1.0.0
   */
  recordPerformanceMetric(responseTime: number, requestCount = 1): void {
    const metric: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      responseTime,
      requestCount,
      memoryUsage: process.memoryUsage().heapUsed
    };

    this.performanceMetrics.push(metric);

    // 保持性能指标在合理范围内
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-500);
    }

    this.logger.debug('性能指标已记录', {
      responseTime,
      requestCount,
      memoryUsage: metric.memoryUsage
    });
  }

  /**
   * 获取性能指标
   *
   * @description 获取配置访问的性能指标
   * @param {number} limit - 限制返回记录数
   * @returns {PerformanceMetric[]} 性能指标列表
   * 
   * @example
   * ```typescript
   * const metrics = configMonitor.getPerformanceMetrics(50);
   * console.log('性能指标:', metrics);
   * ```
   * 
   * @since 1.0.0
   */
  getPerformanceMetrics(limit = 100): PerformanceMetric[] {
    return this.performanceMetrics
      .slice(-limit)
      .reverse();
  }

  /**
   * 获取健康检查历史
   *
   * @description 获取配置健康检查的历史记录
   * @param {number} limit - 限制返回记录数
   * @returns {HealthCheckRecord[]} 健康检查历史记录
   * 
   * @example
   * ```typescript
   * const history = configMonitor.getHealthCheckHistory(20);
   * console.log('健康检查历史:', history);
   * ```
   * 
   * @since 1.0.0
   */
  getHealthCheckHistory(limit = 50): HealthCheckRecord[] {
    return this.healthCheckHistory
      .slice(-limit)
      .reverse();
  }

  /**
   * 记录健康检查
   *
   * @description 记录健康检查结果
   * @param {ConfigHealthStatus} healthStatus - 健康状态
   * 
   * @private
   */
  private recordHealthCheck(healthStatus: ConfigHealthStatus): void {
    const record: HealthCheckRecord = {
      timestamp: healthStatus.timestamp,
      isHealthy: healthStatus.isHealthy,
      issuesCount: healthStatus.issues.length,
      duration: healthStatus.duration
    };

    this.healthCheckHistory.push(record);

    // 保持健康检查历史在合理范围内
    if (this.healthCheckHistory.length > 1000) {
      this.healthCheckHistory = this.healthCheckHistory.slice(-500);
    }
  }

  /**
   * 获取监控摘要
   *
   * @description 获取配置监控的摘要信息
   * @returns {MonitoringSummary} 监控摘要
   * 
   * @example
   * ```typescript
   * const summary = configMonitor.getMonitoringSummary();
   * console.log('监控摘要:', summary);
   * ```
   * 
   * @since 1.0.0
   */
  getMonitoringSummary(): MonitoringSummary {
    const recentHealthChecks = this.healthCheckHistory.slice(-10);
    const recentMetrics = this.performanceMetrics.slice(-10);

    const healthyChecks = recentHealthChecks.filter(check => check.isHealthy).length;
    const totalChecks = recentHealthChecks.length;
    const healthRate = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;

    const averageResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / recentMetrics.length 
      : 0;

    const totalRequests = recentMetrics.reduce((sum, metric) => sum + metric.requestCount, 0);

    return {
      timestamp: new Date().toISOString(),
      healthRate,
      averageResponseTime,
      totalRequests,
      totalHealthChecks: this.healthCheckHistory.length,
      totalPerformanceMetrics: this.performanceMetrics.length,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }
}

/**
 * 配置健康状态接口
 *
 * @description 配置健康检查结果的类型定义
 */
export interface ConfigHealthStatus {
  /** 是否健康 */
  isHealthy: boolean;
  /** 问题列表 */
  issues: string[];
  /** 检查时间戳 */
  timestamp: string;
  /** 检查耗时 */
  duration: number;
  /** 内存状态 */
  memoryStatus: any;
  /** 配置完整性 */
  configIntegrity: ConfigIntegrityStatus;
  /** 配置一致性 */
  configConsistency: ConfigConsistencyStatus;
  /** 性能健康状态 */
  performanceHealth: PerformanceHealthStatus;
}

/**
 * 配置完整性状态接口
 *
 * @description 配置完整性检查结果的类型定义
 */
export interface ConfigIntegrityStatus {
  /** 是否有效 */
  isValid: boolean;
  /** 问题列表 */
  issues: string[];
  /** 检查时间戳 */
  timestamp: string;
}

/**
 * 配置一致性状态接口
 *
 * @description 配置一致性检查结果的类型定义
 */
export interface ConfigConsistencyStatus {
  /** 是否一致 */
  isConsistent: boolean;
  /** 问题列表 */
  issues: string[];
  /** 检查时间戳 */
  timestamp: string;
}

/**
 * 性能健康状态接口
 *
 * @description 性能健康检查结果的类型定义
 */
export interface PerformanceHealthStatus {
  /** 是否健康 */
  isHealthy: boolean;
  /** 问题列表 */
  issues: string[];
  /** 检查时间戳 */
  timestamp: string;
  /** 平均响应时间 */
  averageResponseTime: number;
  /** 总请求数 */
  totalRequests: number;
}

/**
 * 性能指标接口
 *
 * @description 性能指标的类型定义
 */
export interface PerformanceMetric {
  /** 时间戳 */
  timestamp: string;
  /** 响应时间（毫秒） */
  responseTime: number;
  /** 请求数量 */
  requestCount: number;
  /** 内存使用量 */
  memoryUsage: number;
}

/**
 * 健康检查记录接口
 *
 * @description 健康检查记录的类型定义
 */
export interface HealthCheckRecord {
  /** 时间戳 */
  timestamp: string;
  /** 是否健康 */
  isHealthy: boolean;
  /** 问题数量 */
  issuesCount: number;
  /** 检查耗时 */
  duration: number;
}

/**
 * 监控摘要接口
 *
 * @description 监控摘要的类型定义
 */
export interface MonitoringSummary {
  /** 时间戳 */
  timestamp: string;
  /** 健康率（百分比） */
  healthRate: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 总请求数 */
  totalRequests: number;
  /** 总健康检查数 */
  totalHealthChecks: number;
  /** 总性能指标数 */
  totalPerformanceMetrics: number;
  /** 内存使用量 */
  memoryUsage: number;
}
