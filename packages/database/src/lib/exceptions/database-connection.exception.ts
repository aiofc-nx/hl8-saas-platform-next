import { GeneralInternalServerException } from '@hl8/common';

/**
 * 数据库连接异常
 * 
 * 当数据库连接失败或连接不可用时抛出此异常。
 * 提供详细的错误信息和上下文，便于问题诊断和解决。
 * 
 * @description 数据库连接相关的异常类
 * 
 * ## 业务规则
 * 
 * ### 触发条件
 * - 数据库连接初始化失败
 * - 数据库连接断开
 * - 连接池耗尽
 * - 网络连接超时
 * 
 * ### 错误信息
 * - 包含数据库类型和连接信息
 * - 提供具体的错误原因
 * - 支持错误追踪和监控
 * 
 * @example
 * ```typescript
 * throw new DatabaseConnectionException(
 *   '数据库连接失败',
 *   '无法连接到 PostgreSQL 数据库',
 *   { 
 *     database: 'myapp',
 *     host: 'localhost',
 *     port: 5432,
 *     type: 'postgresql'
 *   }
 * );
 * ```
 * 
 * @since 1.0.0
 */
export class DatabaseConnectionException extends GeneralInternalServerException {
  constructor(
    message: string,
    detail?: string,
    context?: Record<string, unknown>
  ) {
    super(message, detail || '', {
      ...context,
      errorCode: 'DATABASE_CONNECTION_ERROR',
      category: 'database',
      severity: 'high'
    });
  }
}
