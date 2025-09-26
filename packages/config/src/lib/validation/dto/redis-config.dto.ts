import { IsString, IsNumber, IsOptional, IsPort, Min, Max } from 'class-validator';

/**
 * Redis配置验证DTO
 *
 * @description 验证Redis连接配置的数据结构和类型
 * 确保Redis配置符合连接要求
 */
export class RedisConfigDto {
  /**
   * Redis主机地址
   *
   * @description Redis服务器的主机地址
   */
  @IsString()
  host!: string;

  /**
   * Redis端口号
   *
   * @description Redis服务的端口号
   * 默认6379，必须是有效的端口号
   */
  @IsNumber()
  @IsPort()
  port!: number;

  /**
   * Redis密码
   *
   * @description Redis连接密码
   * 可选，但生产环境建议设置
   */
  @IsOptional()
  @IsString()
  password?: string;

  /**
   * Redis数据库编号
   *
   * @description Redis数据库编号，默认为0
   * 范围0-15
   */
  @IsNumber()
  @Min(0)
  @Max(15)
  db!: number;

  /**
   * 最大重试次数
   *
   * @description 连接失败时的最大重试次数
   * 必须在合理范围内
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetriesPerRequest!: number;

  /**
   * 故障转移重试延迟
   *
   * @description 故障转移时的重试延迟时间（毫秒）
   * 必须大于0
   */
  @IsNumber()
  @Min(50)
  @Max(5000)
  retryDelayOnFailover!: number;
}
