import { ApplicationPluginConfig } from '@hl8/common';
import { deepMerge } from '@hl8/utils';
import { defaultConfiguration } from '../default-config.js';
import { ConfigValidationService, ValidationResult, ValidationRules } from './validation/config-validation.service.js';

/**
 * 当前应用程序配置
 * 
 * @description 存储当前应用程序的配置状态，初始值为默认配置
 * 支持运行时动态更新配置
 */
let currentAppConfig: ApplicationPluginConfig = { ...defaultConfiguration };

/**
 * 配置验证服务实例
 * 
 * @description 用于验证配置数据的服务实例
 * 在配置更新时自动进行验证
 */
const configValidationService = new ConfigValidationService();

/**
 * 定义应用程序配置
 * 
 * @description 将提供的配置与现有的默认配置进行深度合并
 * 支持部分配置更新，未提供的配置项保持原有值
 * 自动进行配置验证，确保配置数据符合业务规则
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
 * - 自动验证配置数据类型和业务规则
 * - 验证失败时抛出详细错误信息
 * 
 * ### 验证流程
 * 1. 基础类型检查（null、undefined、对象类型）
 * 2. 配置合并（深度合并策略）
 * 3. 配置验证（使用 class-validator）
 * 4. 验证通过后更新配置
 * 
 * @param {Partial<ApplicationPluginConfig>} providedConfig - 要合并的配置值
 * @param {boolean} skipValidation - 是否跳过验证，默认为false
 * @returns {Promise<void>} - 配置成功更新后解析
 * 
 * @throws {Error} 当提供的配置无效时抛出错误
 * @throws {ValidationError} 当配置验证失败时抛出验证错误
 * 
 * @example
 * ```typescript
 * // 更新数据库配置（带验证）
 * await defineConfig({
 *   database: {
 *     type: 'postgresql',
 *     host: 'localhost',
 *     port: 5432
 *   }
 * });
 * 
 * // 更新API配置（跳过验证）
 * await defineConfig({
 *   api: {
 *     port: 3001,
 *     host: '0.0.0.0'
 *   }
 * }, true);
 * ```
 * 
 * @since 1.0.0
 */
export async function defineConfig(
	providedConfig: Partial<ApplicationPluginConfig>, 
	skipValidation: boolean = false
): Promise<void> {
	// 基础类型检查
	if (!providedConfig || typeof providedConfig !== 'object') {
		throw new Error('Invalid configuration provided. Expected a non-empty object.');
	}

	// 配置合并
	const mergedConfig = await deepMerge(currentAppConfig, providedConfig);

	// 配置验证（除非明确跳过）
	if (!skipValidation) {
		const validationResult = await configValidationService.validateApplicationConfig(mergedConfig);
		
		if (!validationResult.isValid) {
			const errorMessages = validationResult.errors.map(error => 
				`${error.property}: ${Object.values(error.constraints).join(', ')}`
			).join('; ');
			
			throw new Error(`Configuration validation failed: ${errorMessages}`);
		}
	}

	// 更新配置
	currentAppConfig = mergedConfig;
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
 * 验证当前配置
 * 
 * @description 验证当前应用程序配置是否符合业务规则
 * 提供配置验证功能，用于检查配置的完整性和正确性
 * 
 * ## 验证内容
 * - 数据类型验证
 * - 业务规则验证
 * - 必需字段检查
 * - 格式和范围验证
 * 
 * @param {boolean} throwOnError - 验证失败时是否抛出错误，默认为false
 * @returns {Promise<ValidationResult>} 验证结果
 * 
 * @example
 * ```typescript
 * // 验证当前配置
 * const result = await validateCurrentConfig();
 * if (!result.isValid) {
 *   console.error('配置验证失败:', result.errors);
 * }
 * 
 * // 验证并抛出错误
 * await validateCurrentConfig(true);
 * ```
 * 
 * @since 1.0.0
 */
export async function validateCurrentConfig(throwOnError: boolean = false): Promise<ValidationResult> {
	const validationResult = await configValidationService.validateApplicationConfig(currentAppConfig);
	
	if (throwOnError && !validationResult.isValid) {
		const errorMessages = validationResult.errors.map(error => 
			`${error.property}: ${Object.values(error.constraints).join(', ')}`
		).join('; ');
		
		throw new Error(`Current configuration validation failed: ${errorMessages}`);
	}
	
	return validationResult;
}

/**
 * 验证部分配置
 * 
 * @description 验证配置对象的特定部分
 * 支持增量配置验证，适用于配置更新场景
 * 
 * @param {Partial<ApplicationPluginConfig>} partialConfig - 要验证的部分配置
 * @param {string[]} fields - 要验证的字段列表
 * @returns {Promise<ValidationResult>} 验证结果
 * 
 * @example
 * ```typescript
 * // 验证API配置
 * const result = await validatePartialConfig(
 *   { api: { port: 3000 } }, 
 *   ['api']
 * );
 * ```
 * 
 * @since 1.0.0
 */
export async function validatePartialConfig(
	partialConfig: Partial<ApplicationPluginConfig>, 
	fields: string[]
): Promise<ValidationResult> {
	return await configValidationService.validatePartialConfig(partialConfig, fields);
}

/**
 * 获取配置验证规则
 * 
 * @description 获取配置验证规则的详细说明
 * 用于生成配置文档和错误提示
 * 
 * @returns {ValidationRules} 验证规则说明
 * 
 * @example
 * ```typescript
 * const rules = getValidationRules();
 * console.log(rules.api.port.description);
 * ```
 * 
 * @since 1.0.0
 */
export function getValidationRules(): ValidationRules {
	return configValidationService.getValidationRules();
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
