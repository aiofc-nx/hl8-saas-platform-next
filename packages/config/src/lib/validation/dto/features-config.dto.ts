import { IsBoolean } from 'class-validator';

/**
 * 功能开关配置验证DTO
 *
 * @description 验证功能开关配置的数据结构和类型
 * 确保功能开关配置正确
 */
export class FeaturesConfigDto {
  /**
   * 多租户功能
   *
   * @description 是否启用多租户功能
   */
  @IsBoolean()
  multiTenant!: boolean;

  /**
   * 用户注册功能
   *
   * @description 是否启用用户注册功能
   */
  @IsBoolean()
  userRegistration!: boolean;

  /**
   * 邮箱密码登录功能
   *
   * @description 是否启用邮箱密码登录功能
   */
  @IsBoolean()
  emailPasswordLogin!: boolean;

  /**
   * 魔法登录功能
   *
   * @description 是否启用魔法登录功能
   */
  @IsBoolean()
  magicLogin!: boolean;
}
