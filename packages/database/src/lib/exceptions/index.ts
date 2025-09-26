/**
 * 数据库模块异常类
 * 
 * 提供数据库模块专用的异常类，继承自 common 包的通用异常类。
 * 支持标准化的错误响应、国际化消息和结构化日志记录。
 * 
 * @description 数据库模块异常类的统一导出入口
 * 
 * @since 1.0.0
 */

export * from './database-connection.exception.js';
export * from './database-migration.exception.js';
export * from './database-config.exception.js';
