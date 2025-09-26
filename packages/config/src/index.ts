// 核心配置模块
export * from './lib/config.module.js';
export { ConfigService } from './lib/config.service.js';

// 配置验证模块
export * from './lib/validation/dto/index.js';
export * from './lib/validation/config-validation.service.js';
export * from './lib/validation/config-validation-error.js';

// 内存配置模块（主要配置服务）
export * from './lib/memory-config/memory-config.service.js';
export * from './lib/memory-config/compatibility-adapter.js';
export * from './lib/memory-config/hybrid-config.service.js';
export * from './lib/memory-config/config-monitor.service.js';
export * from './lib/memory-config/config-classes/application-memory-config.js';

// 环境配置接口
export * from './environments/environment.interface.js';
