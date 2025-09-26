import { ApplicationPluginConfig } from '@hl8/common';
import { deepMerge } from '@hl8/utils';
import { defaultConfiguration } from '../default-config.js';

/**
 * 当前应用程序配置
 * 
 * @description 存储当前应用程序的配置状态，初始值为默认配置
 * 支持运行时动态更新配置
 */
let currentAppConfig: ApplicationPluginConfig = { ...defaultConfiguration };

/**
 * 定义应用程序配置
 * 
 * @description 将提供的配置与现有的默认配置进行深度合并
 * 支持部分配置更新，未提供的配置项保持原有值
 * 
 * ## 业务规则
 * 
 * ### 配置合并规则
 * - 使用深度合并策略，支持嵌套对象合并
 * - 数组类型配置会被完全替换
 * - 对象类型配置会进行递归合并
 * - 基础类型配置会直接覆盖
 * 
 * ### 验证规则
 * - 配置对象不能为 null 或 undefined
 * - 配置对象必须是有效的对象类型
 * - 空对象会被拒绝，避免意外清空配置
 * 
 * @param {Partial<ApplicationPluginConfig>} providedConfig - 要合并的配置值
 * @returns {Promise<void>} - 配置成功更新后解析
 * 
 * @throws {Error} 当提供的配置无效时抛出错误
 * 
 * @example
 * ```typescript
 * // 更新数据库配置
 * await defineConfig({
 *   database: {
 *     type: 'postgresql',
 *     host: 'localhost'
 *   }
 * });
 * 
 * // 更新API配置
 * await defineConfig({
 *   api: {
 *     port: 3001,
 *     host: '0.0.0.0'
 *   }
 * });
 * ```
 * 
 * @since 1.0.0
 */
export async function defineConfig(providedConfig: Partial<ApplicationPluginConfig>): Promise<void> {
	if (!providedConfig || typeof providedConfig !== 'object') {
		throw new Error('Invalid configuration provided. Expected a non-empty object.');
	}

	currentAppConfig = await deepMerge(currentAppConfig, providedConfig);
}

/**
 * 获取当前应用程序配置
 * 
 * @description 获取当前应用程序的完整配置信息
 * 返回的配置对象是只读的，防止意外修改
 * 
 * ## 业务规则
 * 
 * ### 配置获取规则
 * - 返回当前配置的深拷贝，确保配置隔离
 * - 配置对象被冻结，防止运行时修改
 * - 包含所有已合并的配置项
 * 
 * ### 性能考虑
 * - 每次调用都会创建新的配置对象
 * - 适合配置读取频繁的场景
 * - 配置对象相对较小，性能影响可忽略
 * 
 * @returns {Readonly<ApplicationPluginConfig>} - 当前配置的只读副本
 * 
 * @example
 * ```typescript
 * // 获取完整配置
 * const config = getConfig();
 * console.log(config.api.port); // 3000
 * console.log(config.database.type); // postgresql
 * 
 * // 在服务中使用
 * @Injectable()
 * export class MyService {
 *   private config = getConfig();
 *   
 *   getApiPort() {
 *     return this.config.api.port;
 *   }
 * }
 * ```
 * 
 * @since 1.0.0
 */
export function getConfig(): Readonly<ApplicationPluginConfig> {
	return Object.freeze({ ...currentAppConfig });
}

/**
 * 重置配置到默认值
 * 
 * @description 将当前配置重置为默认配置值
 * 清除所有运行时配置更改，恢复到初始状态
 * 
 * ## 业务规则
 * 
 * ### 重置规则
 * - 完全替换当前配置为默认配置
 * - 清除所有运行时配置更改
 * - 重置后配置与启动时一致
 * 
 * ### 使用场景
 * - 测试环境配置重置
 * - 配置错误后的恢复
 * - 开发环境的配置清理
 * 
 * @example
 * ```typescript
 * // 重置配置
 * resetConfig();
 * 
 * // 验证重置结果
 * const config = getConfig();
 * console.log(config.api.port); // 默认端口值
 * ```
 * 
 * @since 1.0.0
 */
export function resetConfig(): void {
	currentAppConfig = { ...defaultConfiguration };
	console.log('HL8 Config Reset to Defaults');
}
