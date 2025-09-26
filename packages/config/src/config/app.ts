import { registerAs } from '@nestjs/config';

/**
 * 应用程序配置
 *
 * 使用 @nestjs/config 库定义应用程序的配置设置。
 * 包含应用程序名称、Logo URL 等基础配置项。
 * 配置值从环境变量中获取，并提供默认值。
 *
 * @description 应用程序的基础配置模块，提供应用名称和Logo等基础信息
 * 
 * ## 配置项说明
 * 
 * ### 应用名称 (app_name)
 * - 应用程序的显示名称
 * - 环境变量: `APP_NAME`
 * - 默认值: `HL8-SAAS`
 * - 用途: 在界面中显示应用程序名称
 * 
 * ### 应用Logo (app_logo)
 * - 应用程序的Logo图片URL
 * - 环境变量: `APP_LOGO`
 * - 默认值: 基于 `CLIENT_BASE_URL` 构建的默认Logo路径
 * - 用途: 在界面中显示应用程序Logo
 * 
 * ## 环境变量
 * 
 * ### 必需变量
 * - `CLIENT_BASE_URL`: 客户端基础URL，用于构建默认Logo路径
 * 
 * ### 可选变量
 * - `APP_NAME`: 应用程序名称
 * - `APP_LOGO`: 应用程序Logo URL
 * 
 * ## 使用示例
 * 
 * ```typescript
 * // 在服务中获取应用配置
 * const appConfig = this.configService.get('app');
 * console.log(appConfig.app_name); // HL8-SAAS
 * console.log(appConfig.app_logo); // http://localhost:4200/assets/images/logos/logo_HL8-SAAS.png
 * ```
 * 
 * @returns {Object} 包含应用程序配置的对象
 * 
 * @since 1.0.0
 */
export default registerAs('app', () => ({
  /**
   * 应用程序名称
   * 
   * @description 应用程序的显示名称，用于界面展示和标识
   * 
   * ## 业务规则
   * - 优先使用环境变量 `APP_NAME` 的值
   * - 如果环境变量未设置，使用默认值 `HL8-SAAS`
   * - 名称应简洁明了，便于用户识别
   * 
   * @example
   * ```typescript
   * // 环境变量设置
   * process.env.APP_NAME = 'My Custom App';
   * // 结果: app_name = 'My Custom App'
   * ```
   */
  app_name: process.env.APP_NAME || 'HL8-SAAS',

  /**
   * 应用程序Logo URL
   * 
   * @description 应用程序Logo图片的完整URL路径
   * 
   * ## 业务规则
   * - 优先使用环境变量 `APP_LOGO` 的值
   * - 如果环境变量未设置，使用默认Logo路径
   * - 默认路径基于 `CLIENT_BASE_URL` 环境变量构建
   * - Logo文件应位于客户端静态资源目录中
   * 
   * ## 路径构建规则
   * - 基础URL: `CLIENT_BASE_URL` 环境变量
   * - 默认路径: `/assets/images/logos/logo_HL8-SAAS.png`
   * - 完整URL: `${CLIENT_BASE_URL}/assets/images/logos/logo_HL8-SAAS.png`
   * 
   * @example
   * ```typescript
   * // 环境变量设置
   * process.env.CLIENT_BASE_URL = 'http://localhost:4200';
   * process.env.APP_LOGO = 'https://example.com/logo.png';
   * // 结果: app_logo = 'https://example.com/logo.png'
   * 
   * // 使用默认值
   * process.env.CLIENT_BASE_URL = 'http://localhost:4200';
   * // 结果: app_logo = 'http://localhost:4200/assets/images/logos/logo_HL8-SAAS.png'
   * ```
   */
  app_logo:
    process.env.APP_LOGO ||
    `${process.env.CLIENT_BASE_URL}/assets/images/logos/logo_HL8-SAAS.png`,
}));
