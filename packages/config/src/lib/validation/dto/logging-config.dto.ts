import { IsString, IsBoolean, IsIn } from 'class-validator';

/**
 * 日志配置验证DTO
 *
 * @description 验证日志相关配置的数据结构和类型
 * 确保日志配置符合要求
 */
export class LoggingConfigDto {
  /**
   * 日志级别
   *
   * @description 日志记录级别
   * 支持error、warn、info、debug、trace
   */
  @IsString()
  @IsIn(['error', 'warn', 'info', 'debug', 'trace'])
  level!: string;

  /**
   * 是否启用请求日志
   *
   * @description 是否记录HTTP请求日志
   */
  @IsBoolean()
  enableRequestLogging!: boolean;

  /**
   * 是否启用响应日志
   *
   * @description 是否记录HTTP响应日志
   */
  @IsBoolean()
  enableResponseLogging!: boolean;
}
