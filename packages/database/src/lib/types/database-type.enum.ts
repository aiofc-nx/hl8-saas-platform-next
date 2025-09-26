/**
 * 数据库类型枚举
 * 
 * 定义支持的数据库类型，为数据库连接和配置提供类型安全支持。
 * 支持关系型数据库和文档型数据库的主要类型。
 * 
 * @description 数据库类型的枚举定义，支持 PostgreSQL 和 MongoDB
 * 
 * ## 业务规则
 * 
 * ### 数据库类型规则
 * - 支持 PostgreSQL 关系型数据库
 * - 支持 MongoDB 文档型数据库
 * - 数据库类型必须明确指定
 * - 不同数据库类型使用不同的连接配置和查询语法
 * 
 * ### 扩展性规则
 * - 枚举设计支持未来扩展其他数据库类型
 * - 每个数据库类型都有对应的连接器和配置
 * - 数据库类型与 ORM 配置紧密关联
 * 
 * @example
 * ```typescript
 * // PostgreSQL 数据库
 * const config: DatabaseConfig = {
 *   type: DatabaseTypeEnum.POSTGRESQL,
 *   host: 'localhost',
 *   port: 5432,
 *   database: 'myapp'
 * };
 * 
 * // MongoDB 数据库
 * const config: DatabaseConfig = {
 *   type: DatabaseTypeEnum.MONGODB,
 *   host: 'localhost',
 *   port: 27017,
 *   database: 'myapp'
 * };
 * ```
 * 
 * @since 1.0.0
 */
export enum DatabaseTypeEnum {
  /**
   * PostgreSQL 数据库
   * 
   * @description 开源的关系型数据库管理系统，支持 ACID 事务
   * 
   * ## 特性
   * - 支持复杂查询和事务
   * - 支持 JSON 数据类型
   * - 支持全文搜索
   * - 支持扩展和插件
   * 
   * ## 适用场景
   * - 企业级应用
   * - 复杂业务逻辑
   * - 需要强一致性的场景
   * - 数据分析应用
   */
  POSTGRESQL = 'postgresql',

  /**
   * MongoDB 数据库
   * 
   * @description 开源的文档型数据库，支持灵活的文档存储
   * 
   * ## 特性
   * - 支持文档存储
   * - 支持水平扩展
   * - 支持复杂查询
   * - 支持地理空间数据
   * 
   * ## 适用场景
   * - 内容管理系统
   * - 实时分析应用
   * - 物联网数据存储
   * - 快速原型开发
   */
  MONGODB = 'mongodb'
}
