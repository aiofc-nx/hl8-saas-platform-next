/**
 * 迁移选项接口
 * 
 * 定义数据库迁移操作的配置选项，支持迁移生成、执行和回滚等操作。
 * 为数据库迁移提供统一的配置管理接口。
 * 
 * @description 数据库迁移操作的配置接口，支持多种迁移场景
 * 
 * ## 业务规则
 * 
 * ### 迁移生成规则
 * - 迁移名称必须唯一且有意义
 * - 迁移目录必须存在或可创建
 * - 迁移文件命名遵循时间戳+名称的格式
 * - 迁移内容必须包含 up 和 down 方法
 * 
 * ### 迁移执行规则
 * - 迁移按时间戳顺序执行
 * - 每个迁移在独立事务中执行
 * - 迁移失败时自动回滚
 * - 支持批量迁移和单个迁移执行
 * 
 * ### 迁移回滚规则
 * - 回滚按时间戳逆序执行
 * - 回滚操作必须可逆
 * - 支持回滚到指定版本
 * - 回滚前进行安全检查
 * 
 * @example
 * ```typescript
 * const options: MigrationOptions = {
 *   name: 'AddUserTable',
 *   path: './migrations',
 *   transactional: true
 * };
 * ```
 * 
 * @since 1.0.0
 */
export interface MigrationOptions {
  /**
   * 迁移名称
   * 
   * @description 迁移的名称，用于生成迁移文件名和类名
   * 
   * ## 命名规则
   * - 使用 PascalCase 命名
   * - 名称应描述迁移的目的
   * - 避免使用特殊字符
   * - 保持名称简洁明了
   * 
   * @example
   * - 'AddUserTable'
   * - 'CreateIndexOnEmail'
   * - 'UpdateUserSchema'
   */
  name: string;

  /**
   * 迁移文件目录
   * 
   * @description 迁移文件存放的目录路径
   * 
   * ## 目录规则
   * - 目录必须存在或可创建
   * - 支持相对路径和绝对路径
   * - 默认使用 './migrations'
   * - 目录结构应清晰有序
   */
  path?: string;

  /**
   * 迁移表名
   * 
   * @description 存储迁移记录的表名
   * 
   * ## 表名规则
   * - 使用下划线命名法
   * - 表名应具有描述性
   * - 避免与业务表名冲突
   * - 默认使用 'migrations'
   */
  tableName?: string;

  /**
   * 是否在事务中执行
   * 
   * @description 迁移是否在数据库事务中执行
   * 
   * ## 事务规则
   * - 默认启用事务模式
   * - 事务模式确保迁移的原子性
   * - 非事务模式适用于特殊场景
   * - 事务失败时自动回滚
   */
  transactional?: boolean;

  /**
   * 迁移模式
   * 
   * @description 迁移的执行模式
   * 
   * ## 模式说明
   * - 'all': 执行所有待执行的迁移
   * - 'none': 不执行任何迁移
   * - 'safe': 仅执行安全的迁移
   */
  pattern?: 'all' | 'none' | 'safe';

  /**
   * 是否生成空迁移
   * 
   * @description 是否生成空的迁移文件模板
   * 
   * ## 使用场景
   * - 手动编写复杂迁移时使用
   * - 数据迁移场景
   * - 需要自定义 SQL 的场景
   */
  empty?: boolean;

  /**
   * 迁移描述
   * 
   * @description 迁移的详细描述信息
   * 
   * ## 描述规则
   * - 描述应清晰说明迁移目的
   * - 包含迁移的业务背景
   * - 说明可能的影响范围
   * - 提供回滚说明
   */
  description?: string;

  /**
   * 迁移标签
   * 
   * @description 迁移的标签，用于分类和管理
   * 
   * ## 标签规则
   * - 使用小写字母和连字符
   * - 标签应具有描述性
   * - 支持多个标签
   * - 用于迁移分组和过滤
   * 
   * @example
   * - 'schema'
   * - 'data-migration'
   * - 'index-optimization'
   */
  tags?: string[];

  /**
   * 迁移依赖
   * 
   * @description 当前迁移依赖的其他迁移
   * 
   * ## 依赖规则
   * - 依赖的迁移必须已执行
   * - 支持多个依赖关系
   * - 依赖关系形成有向无环图
   * - 自动解析依赖执行顺序
   */
  dependencies?: string[];

  /**
   * 迁移超时时间
   * 
   * @description 迁移执行的超时时间（毫秒）
   * 
   * ## 超时规则
   * - 默认超时时间为 5 分钟
   * - 大数据量迁移可适当延长
   * - 超时后自动回滚
   * - 超时时间应合理设置
   */
  timeout?: number;

  /**
   * 是否强制执行
   * 
   * @description 是否强制执行迁移，忽略警告
   * 
   * ## 强制规则
   * - 默认不强制执行
   * - 强制执行可能带来风险
   * - 需要明确确认后执行
   * - 生产环境谨慎使用
   */
  force?: boolean;
}
