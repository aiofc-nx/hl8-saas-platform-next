# HL8 配置模块

HL8 SAAS平台的配置管理模块，提供统一的配置管理、验证和健康检查功能。

## 功能特性

### 🔧 配置管理

- **统一配置访问**: 提供类型安全的配置访问接口
- **多环境支持**: 支持开发、测试、生产等多种环境
- **动态配置更新**: 支持运行时配置更新和热重载
- **配置合并**: 支持默认配置与自定义配置的深度合并

### ✅ 配置验证

- **类型验证**: 使用 class-validator 进行严格的类型检查
- **业务规则验证**: 验证配置值是否符合业务规则
- **格式验证**: 验证URL、邮箱、端口号等格式
- **范围验证**: 验证数值范围、字符串长度等
- **必需字段检查**: 确保关键配置项不为空

### 🏥 健康检查

- **配置完整性检查**: 验证所有必需配置项是否存在
- **配置合理性检查**: 检查配置值是否在合理范围内
- **环境一致性检查**: 确保配置与环境要求一致
- **问题诊断**: 提供详细的配置问题诊断信息

## 快速开始

### 安装依赖

```bash
pnpm add @hl8/config
```

### 基本使用

```typescript
import { ConfigService } from '@hl8/config';

// 创建配置服务实例
const configService = new ConfigService();

// 获取配置值
const apiPort = configService.get<number>('api.port');
const dbHost = configService.get<string>('database.host');

// 检查功能是否启用
const isMultiTenantEnabled = configService.isFeatureEnabled('multiTenant');
```

### 配置验证

```typescript
import { ConfigService } from '@hl8/config';

const configService = new ConfigService();

// 验证当前配置
const validationResult = await configService.validateConfig();
if (!validationResult.isValid) {
  console.error('配置验证失败:', validationResult.errors);
}

// 验证部分配置
const partialResult = await configService.validatePartialConfig(
  { api: { port: 3000 } }, 
  ['api']
);
```

### 健康检查

```typescript
import { ConfigService } from '@hl8/config';

const configService = new ConfigService();

// 执行配置健康检查
const healthStatus = await configService.checkConfigHealth();
if (!healthStatus.isHealthy) {
  console.error('配置问题:', healthStatus.issues);
}
```

## 配置结构

### API配置

```typescript
{
  api: {
    port: number;           // API端口号 (1-65535)
    host: string;           // API主机地址
    baseUrl: string;        // API基础URL (必须是有效URL)
    clientBaseUrl: string;  // 客户端基础URL (必须是有效URL)
    production: boolean;    // 是否为生产环境
    envName: string;        // 环境名称 (development|production|test|staging)
  }
}
```

### 数据库配置

```typescript
{
  database: {
    type: string;              // 数据库类型 (postgresql|mysql|sqlite|mongodb)
    host: string;              // 数据库主机
    port: number;              // 数据库端口 (1-65535)
    name: string;              // 数据库名称
    username: string;          // 数据库用户名
    password: string;           // 数据库密码
    sslMode: boolean;          // 是否启用SSL
    logging: boolean;          // 是否启用日志
    poolSize: number;          // 连接池大小 (1-100)
    connectionTimeout: number;  // 连接超时时间 (1000-30000ms)
    idleTimeout: number;       // 空闲超时时间 (5000-60000ms)
  }
}
```

### 认证配置

```typescript
{
  auth: {
    jwtSecret: string;              // JWT密钥 (至少32位)
    jwtExpirationTime: number;      // JWT过期时间 (300-86400秒)
    jwtRefreshSecret: string;       // JWT刷新密钥 (至少32位)
    jwtRefreshExpirationTime: number; // JWT刷新过期时间 (3600-604800秒)
    passwordSaltRounds: number;    // 密码加密盐轮数 (10-15轮)
  }
}
```

### 功能开关配置

```typescript
{
  features: {
    multiTenant: boolean;           // 多租户功能
    userRegistration: boolean;      // 用户注册功能
    emailPasswordLogin: boolean;    // 邮箱密码登录
    magicLogin: boolean;           // 魔法登录
  }
}
```

## 验证规则

### 数据类型验证

- **数字类型**: 验证数值范围和格式
- **字符串类型**: 验证长度和格式
- **布尔类型**: 验证布尔值
- **URL类型**: 验证URL格式

### 业务规则验证

- **端口号**: 必须在1-65535范围内
- **数据库类型**: 必须是支持的类型
- **JWT密钥**: 必须达到最小长度要求
- **超时时间**: 必须在合理范围内

### 格式验证

- **URL格式**: 验证URL的有效性
- **邮箱格式**: 验证邮箱地址格式
- **端口格式**: 验证端口号格式

## 错误处理

### 验证错误类型

- **类型错误**: 数据类型不匹配
- **格式错误**: 格式不符合要求
- **范围错误**: 数值超出有效范围
- **必需字段错误**: 缺少必需配置项
- **业务规则错误**: 违反业务规则

### 错误处理示例

```typescript
import { ConfigValidationError, ConfigValidationErrorHandler } from '@hl8/config';

try {
  await configService.validateConfig(true);
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error('配置验证错误:', error.message);
    console.error('错误属性:', error.property);
    console.error('错误代码:', error.errorCode);
  }
}

// 使用错误处理器
const errorHandler = new ConfigValidationErrorHandler();
const formattedError = errorHandler.formatError(error);
console.log('格式化错误:', formattedError);
```

## 高级功能

### 自定义验证

```typescript
import { ConfigValidationService } from '@hl8/config';

const validationService = new ConfigValidationService();

// 验证完整配置
const result = await validationService.validateApplicationConfig(config);

// 验证部分配置
const partialResult = await validationService.validatePartialConfig(
  partialConfig, 
  ['api', 'database']
);
```

### 配置更新

```typescript
import { defineConfig } from '@hl8/config';

// 更新配置（带验证）
await defineConfig({
  api: {
    port: 3001,
    host: '0.0.0.0'
  }
});

// 更新配置（跳过验证）
await defineConfig({
  api: {
    port: 3001
  }
}, true);
```

### 配置重置

```typescript
import { resetConfig } from '@hl8/config';

// 重置到默认配置
resetConfig();
```

## 最佳实践

### 1. 配置验证

- 在应用启动时验证配置
- 在配置更新时进行验证
- 使用健康检查监控配置状态

### 2. 错误处理

- 提供友好的错误信息
- 记录详细的错误日志
- 提供修复建议

### 3. 性能优化

- 缓存验证结果
- 避免重复验证
- 使用部分验证减少开销

### 4. 安全考虑

- 不要在日志中记录敏感信息
- 使用环境变量管理敏感配置
- 定期检查配置安全性

## 示例项目

查看 `src/examples/` 目录下的示例代码：

- `config-validation.example.ts`: 完整的配置验证示例
- `simple-validation-test.ts`: 简单的验证测试

## API 参考

### ConfigService

- `get<T>(path: string): T` - 获取配置值
- `validateConfig(throwOnError?: boolean): Promise<ValidationResult>` - 验证配置
- `checkConfigHealth(): Promise<ConfigHealthStatus>` - 健康检查
- `isFeatureEnabled(feature: string): boolean` - 检查功能开关

### ConfigValidationService

- `validateApplicationConfig(config: any): Promise<ValidationResult>` - 验证完整配置
- `validatePartialConfig(config: any, fields: string[]): Promise<ValidationResult>` - 验证部分配置

### ConfigValidationError

- `createTypeError(property, expectedType, actualValue)` - 创建类型错误
- `createRequiredError(property)` - 创建必需字段错误
- `createRangeError(property, min, max, actualValue)` - 创建范围错误
- `createFormatError(property, expectedFormat, actualValue)` - 创建格式错误

## 许可证

MIT License
