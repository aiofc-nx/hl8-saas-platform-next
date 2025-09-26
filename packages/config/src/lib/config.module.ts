import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service.js';
import configs from '../config/index.js';

/**
 * 配置模块
 *
 * @description HL8 SAAS平台的全局配置模块，提供统一的配置管理功能
 * 基于 NestJS 的 @nestjs/config 模块，支持多种配置源和动态配置更新
 *
 * ## 主要功能
 *
 * ### 全局配置管理
 * - 提供全局可访问的配置服务
 * - 支持多种配置源（环境变量、配置文件等）
 * - 支持配置缓存，提高性能
 *
 * ### 配置加载机制
 * - 自动加载所有注册的配置模块
 * - 支持配置优先级和覆盖机制
 * - 提供类型安全的配置访问
 *
 * ### 模块特性
 * - 全局模块，无需重复导入
 * - 支持依赖注入
 * - 提供统一的配置接口
 *
 * @example
 * ```typescript
 * // 在应用模块中导入
 * @Module({
 *   imports: [ConfigModule],
 *   providers: [MyService]
 * })
 * export class AppModule {}
 *
 * // 在服务中使用
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly configService: ConfigService) {}
 *   
 *   getApiPort() {
 *     return this.configService.get('api.port');
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Global()
@Module({
	imports: [
		/**
		 * NestJS 配置模块根配置
		 * 
		 * @description 配置 NestJS 配置模块的根设置
		 * 使用 'load' 选项加载不同提供者的配置模块
		 * 
		 * ## 配置选项说明
		 * 
		 * ### isGlobal: true
		 * - 使配置模块全局可用
		 * - 无需在每个模块中重复导入
		 * - 简化配置服务的依赖注入
		 * 
		 * ### cache: true
		 * - 启用配置缓存机制
		 * - 提高配置读取性能
		 * - 减少重复的配置解析开销
		 * 
		 * ### load: [...configs]
		 * - 加载所有注册的配置模块
		 * - 支持动态配置加载
		 * - 提供统一的配置访问接口
		 */
		NestConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			load: [...configs]
		})
	],
	providers: [ConfigService],
	exports: [ConfigService]
})
export class ConfigModule {}
