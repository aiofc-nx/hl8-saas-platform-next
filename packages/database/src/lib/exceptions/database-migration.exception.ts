import { GeneralInternalServerException } from '@hl8/common';

/**
 * 数据库迁移异常
 * 
 * 当数据库迁移执行失败时抛出此异常。
 * 提供详细的迁移信息和错误上下文，便于问题诊断和解决。
 * 
 * @description 数据库迁移相关的异常类
 * 
 * ## 业务规则
 * 
 * ### 触发条件
 * - 迁移文件执行失败
 * - 迁移回滚失败
 * - 迁移文件格式错误
 * - 数据库模式冲突
 * 
 * ### 错误信息
 * - 包含迁移名称和版本信息
 * - 提供具体的失败原因
 * - 支持迁移状态追踪
 * 
 * @example
 * ```typescript
 * throw new DatabaseMigrationException(
 *   '迁移执行失败',
 *   '迁移文件 "20240101000001_create_users_table" 执行失败',
 *   { 
 *     migrationName: '20240101000001_create_users_table',
 *     step: 'up',
 *     error: 'Table already exists'
 *   }
 * );
 * ```
 * 
 * @since 1.0.0
 */
export class DatabaseMigrationException extends GeneralInternalServerException {
  constructor(
    message: string,
    detail?: string,
    context?: Record<string, unknown>
  ) {
    super(message, detail || '', {
      ...context,
      errorCode: 'DATABASE_MIGRATION_ERROR',
      category: 'database',
      severity: 'high'
    });
  }
}
