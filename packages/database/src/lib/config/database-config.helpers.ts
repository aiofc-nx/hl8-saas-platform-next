import { TlsOptions } from 'tls';

/**
 * MikroORM日志命名空间类型
 *
 * @description 定义MikroORM支持的日志命名空间类型
 * - query: 查询日志
 * - query-params: 查询参数日志
 * - schema: 模式日志
 * - discovery: 发现日志
 * - info: 信息日志
 * 
 * @since 1.0.0
 */
export type MikroLoggerNamespace =
  | 'query'
  | 'query-params'
  | 'schema'
  | 'discovery'
  | 'info';

/**
 * 检查当前数据库类型是否为PostgreSQL
 *
 * @description 根据环境变量DB_TYPE判断当前使用的数据库类型
 * 
 * @returns {boolean} 如果是PostgreSQL返回true，否则返回false
 * 
 * @example
 * ```typescript
 * if (isPostgres()) {
 *   // 使用PostgreSQL特定配置
 * }
 * ```
 * 
 * @since 1.0.0
 */
export const isPostgres = (): boolean =>
  process.env.DB_TYPE === 'postgresql';

/**
 * 检查当前数据库类型是否为MongoDB
 *
 * @description 根据环境变量DB_TYPE判断当前使用的数据库类型
 * 
 * @returns {boolean} 如果是MongoDB返回true，否则返回false
 * 
 * @example
 * ```typescript
 * if (isMongodb()) {
 *   // 使用MongoDB特定配置
 * }
 * ```
 * 
 * @since 1.0.0
 */
export const isMongodb = (): boolean =>
  process.env.DB_TYPE === 'mongodb';

/**
 * 获取数据库连接的TLS选项
 *
 * @description 根据提供的SSL模式获取数据库连接的TLS选项
 * 支持从环境变量DB_CA_CERT读取Base64编码的CA证书
 *
 * ## 业务规则
 * 
 * ### SSL配置规则
 * - 当SSL模式禁用时返回undefined
 * - 当SSL模式启用但缺少CA证书时返回undefined
 * - 支持Base64编码的CA证书解码
 * - 配置严格的证书验证
 * 
 * ### 错误处理规则
 * - CA证书解码失败时记录错误并返回undefined
 * - 缺少CA证书时记录警告信息
 * - 确保TLS配置的安全性
 *
 * @param {boolean} dbSslMode - 数据库连接的SSL模式
 * @returns {TlsOptions | undefined} 数据库连接的TLS选项，如果SSL被禁用则返回undefined
 *
 * @example
 * ```typescript
 * const tlsOptions = getTlsOptions(true);
 * if (tlsOptions) {
 *   // 使用TLS选项配置数据库连接
 * }
 * ```
 * 
 * @since 1.0.0
 */
export const getTlsOptions = (dbSslMode: boolean): TlsOptions | undefined => {
  // 检查SSL是否启用
  if (!dbSslMode) {
    return undefined;
  }

  // 从环境变量获取CA证书
  const base64data = process.env.DB_CA_CERT;
  if (!base64data) {
    console.error('DB_CA_CERT环境变量未定义，无法配置TLS选项');
    return undefined;
  }

  try {
    // 解码Base64编码的CA证书
    const buff = Buffer.from(base64data, 'base64');
    const sslCert = buff.toString('ascii');

    // 返回TLS选项配置
    return {
      rejectUnauthorized: true,
      ca: sslCert,
    };
  } catch (error) {
    console.error(
      '解码DB_CA_CERT时发生错误:',
      error instanceof Error ? error.message : String(error)
    );
    return undefined;
  }
};

/**
 * 获取MikroORM日志选项
 *
 * @description 根据指定的日志类型获取MikroORM的日志选项
 * 支持多种日志级别：query、query-params、schema、discovery、info、all
 *
 * ## 业务规则
 * 
 * ### 日志级别规则
 * - 'query': 仅记录查询日志
 * - 'query-params': 仅记录查询参数日志
 * - 'schema': 仅记录模式日志
 * - 'discovery': 仅记录发现日志
 * - 'info': 仅记录信息日志
 * - 'all': 记录所有类型的日志
 * - 其他值: 禁用日志记录
 * 
 * ### 性能考虑
 * - 生产环境建议使用'query'或false
 * - 开发环境可以使用'all'进行详细调试
 * - 日志记录会影响性能，需要合理配置
 *
 * @param {string} dbLogging - 日志类型，来自环境变量DB_LOGGING
 * @returns {false | MikroLoggerNamespace[]} 如果日志被禁用返回false，否则返回日志命名空间数组
 *
 * @example
 * ```typescript
 * const loggingOptions = getLoggingMikroOptions('query');
 * // 返回: ['query']
 *
 * const allLogging = getLoggingMikroOptions('all');
 * // 返回: ['query', 'query-params', 'schema', 'discovery', 'info']
 * ```
 * 
 * @since 1.0.0
 */
export const getLoggingMikroOptions = (
  dbLogging: string
): false | MikroLoggerNamespace[] => {
  const loggingOptionsMap: Record<string, MikroLoggerNamespace[]> = {
    query: ['query'],
    'query-params': ['query-params'],
    schema: ['schema'],
    discovery: ['discovery'],
    info: ['info'],
    all: ['query', 'query-params', 'schema', 'discovery', 'info'],
  };

  return loggingOptionsMap[dbLogging] || false;
};
