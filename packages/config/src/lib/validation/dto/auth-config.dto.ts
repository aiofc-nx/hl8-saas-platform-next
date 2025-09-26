import { IsString, IsNumber, Min, Max } from 'class-validator';

/**
 * 认证配置验证DTO
 *
 * @description 验证认证相关配置的数据结构和类型
 * 确保认证配置符合安全要求
 */
export class AuthConfigDto {
  /**
   * JWT密钥
   *
   * @description JWT令牌签名密钥
   * 必须是强密钥，长度至少32位
   */
  @IsString()
  jwtSecret!: string;

  /**
   * JWT过期时间
   *
   * @description JWT令牌过期时间（秒）
   * 必须在合理范围内，建议不超过24小时
   */
  @IsNumber()
  @Min(300) // 5分钟
  @Max(86400) // 24小时
  jwtExpirationTime!: number;

  /**
   * JWT刷新密钥
   *
   * @description JWT刷新令牌签名密钥
   * 必须是强密钥，长度至少32位
   */
  @IsString()
  jwtRefreshSecret!: string;

  /**
   * JWT刷新过期时间
   *
   * @description JWT刷新令牌过期时间（秒）
   * 建议设置较长时间，如7天
   */
  @IsNumber()
  @Min(3600) // 1小时
  @Max(604800) // 7天
  jwtRefreshExpirationTime!: number;

  /**
   * 密码加密盐轮数
   *
   * @description bcrypt密码加密的盐轮数
   * 必须在安全范围内，建议10-15轮
   */
  @IsNumber()
  @Min(10)
  @Max(15)
  passwordSaltRounds!: number;
}
