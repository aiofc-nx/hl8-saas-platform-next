import { IsString, IsNumber, IsBoolean, IsPort, IsIn, Min, Max } from 'class-validator';

/**
 * 数据库配置验证DTO
 *
 * @description 验证数据库连接配置的数据结构和类型
 * 确保数据库配置符合连接要求和安全规范
 */
export class DatabaseConfigDto {
  /**
   * 数据库类型
   *
   * @description 数据库类型标识
   * 支持postgresql、mysql、sqlite等
   */
  @IsString()
  @IsIn(['postgresql', 'mysql', 'sqlite', 'mongodb'])
  type!: string;

  /**
   * 数据库主机地址
   *
   * @description 数据库服务器的主机地址
   */
  @IsString()
  host!: string;

  /**
   * 数据库端口号
   *
   * @description 数据库服务的端口号
   * 必须是有效的端口号
   */
  @IsNumber()
  @IsPort()
  port!: number;

  /**
   * 数据库名称
   *
   * @description 要连接的数据库名称
   * 不能为空，且应符合数据库命名规范
   */
  @IsString()
  name!: string;

  /**
   * 数据库用户名
   *
   * @description 数据库连接用户名
   */
  @IsString()
  username!: string;

  /**
   * 数据库密码
   *
   * @description 数据库连接密码
   * 生产环境必须设置强密码
   */
  @IsString()
  password!: string;

  /**
   * 是否启用SSL模式
   *
   * @description 数据库连接是否使用SSL加密
   */
  @IsBoolean()
  sslMode!: boolean;

  /**
   * 是否启用日志记录
   *
   * @description 是否记录数据库操作日志
   */
  @IsBoolean()
  logging!: boolean;

  /**
   * 连接池大小
   *
   * @description 数据库连接池的最大连接数
   * 必须在合理范围内，避免资源浪费
   */
  @IsNumber()
  @Min(1)
  @Max(100)
  poolSize!: number;

  /**
   * 连接超时时间
   *
   * @description 数据库连接超时时间（毫秒）
   * 必须大于0，建议设置合理值
   */
  @IsNumber()
  @Min(1000)
  @Max(30000)
  connectionTimeout!: number;

  /**
   * 空闲超时时间
   *
   * @description 数据库连接空闲超时时间（毫秒）
   * 必须大于0，建议设置合理值
   */
  @IsNumber()
  @Min(5000)
  @Max(60000)
  idleTimeout!: number;
}

/**
 * MongoDB配置验证DTO
 *
 * @description 验证MongoDB连接配置的数据结构和类型
 * 确保MongoDB配置符合连接要求
 */
export class MongoConfigDto {
  /**
   * MongoDB主机地址
   *
   * @description MongoDB服务器的主机地址
   */
  @IsString()
  host!: string;

  /**
   * MongoDB端口号
   *
   * @description MongoDB服务的端口号
   * 默认27017，必须是有效的端口号
   */
  @IsNumber()
  @IsPort()
  port!: number;

  /**
   * MongoDB数据库名称
   *
   * @description 要连接的MongoDB数据库名称
   */
  @IsString()
  name!: string;

  /**
   * MongoDB用户名
   *
   * @description MongoDB连接用户名
   */
  @IsString()
  username!: string;

  /**
   * MongoDB密码
   *
   * @description MongoDB连接密码
   */
  @IsString()
  password!: string;

  /**
   * 是否启用SSL模式
   *
   * @description MongoDB连接是否使用SSL加密
   */
  @IsBoolean()
  sslMode!: boolean;

  /**
   * 是否启用日志记录
   *
   * @description 是否记录MongoDB操作日志
   */
  @IsBoolean()
  logging!: boolean;
}
