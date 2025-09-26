import { IsString } from 'class-validator';

/**
 * 资源文件配置验证DTO
 *
 * @description 验证资源文件相关配置的数据结构和类型
 * 确保资源文件路径配置正确
 */
export class AssetsConfigDto {
  /**
   * 资源文件路径
   *
   * @description 静态资源文件的存储路径
   * 必须是有效的文件系统路径
   */
  @IsString()
  assetPath!: string;

  /**
   * 公共资源路径
   *
   * @description 公共访问的资源路径
   * 必须是有效的URL路径
   */
  @IsString()
  assetPublicPath!: string;
}
