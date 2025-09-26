import { registerAs } from '@nestjs/config';

/**
 * 基础设置配置
 *
 * 定义应用程序的基础设置和功能标志。
 * 使用 @nestjs/config 库注册配置值。
 *
 * @description 提供应用程序的基础功能开关和设置
 * @returns {Object} 表示基础设置配置的对象
 */
export default registerAs('setting', () => ({
	/** 是否启用邮箱/密码登录 */
	email_password_login: process.env.FEATURE_EMAIL_PASSWORD_LOGIN === 'true' || true,

	/** 是否启用魔法登录 */
	magic_login: process.env.FEATURE_MAGIC_LOGIN === 'true' || false,

	/** 是否启用用户注册 */
	user_registration: process.env.FEATURE_USER_REGISTRATION === 'true' || true,

	/** 是否启用多租户功能 */
	multi_tenant: process.env.FEATURE_MULTI_TENANT === 'true' || true,

	/** 是否启用组织管理 */
	organization_management: process.env.FEATURE_ORGANIZATION_MANAGEMENT === 'true' || true,

	/** 是否启用部门管理 */
	department_management: process.env.FEATURE_DEPARTMENT_MANAGEMENT === 'true' || true,

	/** 是否启用用户管理 */
	user_management: process.env.FEATURE_USER_MANAGEMENT === 'true' || true,

	/** 是否启用权限管理 */
	permission_management: process.env.FEATURE_PERMISSION_MANAGEMENT === 'true' || true
}));
