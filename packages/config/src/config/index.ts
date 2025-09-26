import app from './app.js';
import setting from './setting.js';

/**
 * 基础配置模块数组
 *
 * 包含应用程序的基础配置模块。
 * 采用渐进式开发策略，只保留核心功能配置。
 */
export default [app, setting];
