import { GeneralBadRequestException } from '@hl8/common';

/**
 * 数据库配置异常
 * 
 * 当数据库配置无效或缺失时抛出此异常。
 * 提供详细的配置错误信息和修复建议。
 * 
 * @description 数据库配置相关的异常类
 * 
 * ## 业务规则
 * 
 * ### 触发条件
 * - 数据库配置参数缺失
 * - 数据库配置参数无效
 * - 数据库类型不支持
 * - 连接参数格式错误
 * 
 * ### 错误信息
 * - 包含具体的配置错误
 * - 提供修复建议
 * - 支持配置验证
 * 
 * @example
 * ```typescript
 * throw new DatabaseConfigException(
 *   '数据库配置无效',
 *   '缺少必需的数据库连接参数',
 *   { 
 *     missingFields: ['host', 'port', 'database'],
 *     providedFields: ['type', 'username']
 *   }
 * );
 * ```
 * 
 * @since 1.0.0
 */
export class DatabaseConfigException extends GeneralBadRequestException {
  constructor(
    message: string,
    detail?: string,
    context?: Record<string, unknown>
  ) {
    super(message, detail || '', {
      ...context,
      errorCode: 'DATABASE_CONFIG_ERROR',
      category: 'database',
      severity: 'medium'
    });
  }
}
