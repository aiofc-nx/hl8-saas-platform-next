/**
 * 数据库模块主入口
 * 
 * 提供完整的数据库管理功能，包括连接管理、迁移管理、实体管理等。
 * 支持 PostgreSQL 和 MongoDB 数据库，集成 MikroORM 提供类型安全的数据库操作。
 * 
 * @description 数据库模块的统一导出入口
 * 
 * @since 1.0.0
 */

export * from './lib/database.js';
export * from './lib/config/index.js';
