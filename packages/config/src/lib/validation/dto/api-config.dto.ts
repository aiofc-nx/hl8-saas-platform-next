import { IsString, IsNumber, IsBoolean, IsUrl, IsIn, Min, Max } from 'class-validator';

/**
 * API配置验证DTO
 *
 * @description 验证API相关配置的数据结构和类型
 * 确保API配置符合业务规则和数据类型要求
 */
export class ApiConfigDto {
  /**
   * API端口号
   *
   * @description API服务监听的端口号
   * 必须是有效的端口号，范围在1-65535之间
   */
  @IsNumber()
  @Min(1)
  @Max(65535)
  port!: number;

  /**
   * API主机地址
   *
   * @description API服务的主机地址
   * 支持localhost、IP地址或域名
   */
  @IsString()
  host!: string;

  /**
   * API基础URL
   *
   * @description API服务的完整基础URL
   * 必须是有效的URL格式
   */
  @IsUrl()
  baseUrl!: string;

  /**
   * 客户端基础URL
   *
   * @description 客户端应用的基础URL
   * 必须是有效的URL格式
   */
  @IsUrl()
  clientBaseUrl!: string;

  /**
   * 是否为生产环境
   *
   * @description 标识当前是否为生产环境
   */
  @IsBoolean()
  production!: boolean;

  /**
   * 环境名称
   *
   * @description 当前运行环境的名称
   * 支持development、production、test等
   */
  @IsString()
  @IsIn(['development', 'production', 'test', 'staging'])
  envName!: string;
}
