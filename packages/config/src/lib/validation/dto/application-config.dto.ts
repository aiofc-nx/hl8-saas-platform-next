import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiConfigDto } from './api-config.dto.js';
import { DatabaseConfigDto, MongoConfigDto } from './database-config.dto.js';
import { RedisConfigDto } from './redis-config.dto.js';
import { AuthConfigDto } from './auth-config.dto.js';
import { AssetsConfigDto } from './assets-config.dto.js';
import { LoggingConfigDto } from './logging-config.dto.js';
import { FeaturesConfigDto } from './features-config.dto.js';

/**
 * 应用程序配置验证DTO
 *
 * @description 验证完整应用程序配置的数据结构和类型
 * 这是最顶层的配置验证类，包含所有子配置的验证
 */
export class ApplicationConfigDto {
  /**
   * API配置
   *
   * @description API相关的配置验证
   */
  @ValidateNested()
  @Type(() => ApiConfigDto)
  api!: ApiConfigDto;

  /**
   * 数据库配置
   *
   * @description 数据库相关的配置验证
   */
  @ValidateNested()
  @Type(() => DatabaseConfigDto)
  database!: DatabaseConfigDto;

  /**
   * MongoDB配置
   *
   * @description MongoDB相关的配置验证
   */
  @ValidateNested()
  @Type(() => MongoConfigDto)
  mongodb!: MongoConfigDto;

  /**
   * Redis配置
   *
   * @description Redis相关的配置验证
   */
  @ValidateNested()
  @Type(() => RedisConfigDto)
  redis!: RedisConfigDto;

  /**
   * 认证配置
   *
   * @description 认证相关的配置验证
   */
  @ValidateNested()
  @Type(() => AuthConfigDto)
  auth!: AuthConfigDto;

  /**
   * 资源文件配置
   *
   * @description 资源文件相关的配置验证
   */
  @ValidateNested()
  @Type(() => AssetsConfigDto)
  assets!: AssetsConfigDto;

  /**
   * 日志配置
   *
   * @description 日志相关的配置验证
   */
  @ValidateNested()
  @Type(() => LoggingConfigDto)
  logging!: LoggingConfigDto;

  /**
   * 功能开关配置
   *
   * @description 功能开关相关的配置验证
   */
  @ValidateNested()
  @Type(() => FeaturesConfigDto)
  features!: FeaturesConfigDto;
}
