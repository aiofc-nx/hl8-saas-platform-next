# 配置验证 DTO 文件结构

本目录包含所有配置验证相关的 DTO（数据传输对象）类，按功能分类组织，便于维护和扩展。

## 文件结构

```text
dto/
├── api-config.dto.ts           # API配置验证
├── database-config.dto.ts     # 数据库配置验证
├── auth-config.dto.ts         # 认证配置验证
├── redis-config.dto.ts        # Redis配置验证
├── assets-config.dto.ts       # 资源文件配置验证
├── logging-config.dto.ts      # 日志配置验证
├── features-config.dto.ts     # 功能开关配置验证
├── application-config.dto.ts  # 主应用程序配置验证
├── index.ts                   # 统一导出
└── README.md                  # 本文件
```

## 各文件说明

### API配置验证 (`api-config.dto.ts`)

- **功能**: 验证API相关配置
- **包含**: 端口号、主机地址、基础URL、环境信息等
- **验证规则**: 端口范围(1-65535)、URL格式、环境名称枚举

### 数据库配置验证 (`database-config.dto.ts`)

- **功能**: 验证数据库连接配置
- **包含**: 数据库类型、连接参数、连接池配置等
- **验证规则**: 数据库类型枚举、端口范围、连接池大小限制

### 认证配置验证 (`auth-config.dto.ts`)

- **功能**: 验证认证相关配置
- **包含**: JWT密钥、过期时间、密码加密等
- **验证规则**: 密钥长度、时间范围、加密轮数限制

### Redis配置验证 (`redis-config.dto.ts`)

- **功能**: 验证Redis连接配置
- **包含**: 主机地址、端口、密码、重试配置等
- **验证规则**: 端口范围、数据库编号范围、重试次数限制

### 资源文件配置验证 (`assets-config.dto.ts`)

- **功能**: 验证资源文件相关配置
- **包含**: 资源路径、公共路径等
- **验证规则**: 路径格式验证

### 日志配置验证 (`logging-config.dto.ts`)

- **功能**: 验证日志相关配置
- **包含**: 日志级别、请求日志、响应日志等
- **验证规则**: 日志级别枚举、布尔值验证

### 功能开关配置验证 (`features-config.dto.ts`)

- **功能**: 验证功能开关配置
- **包含**: 多租户、用户注册、登录方式等
- **验证规则**: 布尔值验证

### 主应用程序配置验证 (`application-config.dto.ts`)

- **功能**: 验证完整应用程序配置
- **包含**: 所有子配置的嵌套验证
- **验证规则**: 递归验证所有子配置

## 使用方式

### 导入单个DTO

```typescript
import { ApiConfigDto } from '@hl8/config/dto/api-config.dto';
import { DatabaseConfigDto } from '@hl8/config/dto/database-config.dto';
```

### 导入所有DTO

```typescript
import { 
  ApiConfigDto,
  DatabaseConfigDto,
  AuthConfigDto,
  ApplicationConfigDto
} from '@hl8/config/dto';
```

### 使用DTO进行验证

```typescript
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ApiConfigDto } from '@hl8/config/dto';

const config = {
  port: 3000,
  host: 'localhost',
  baseUrl: 'http://localhost:3000'
};

const dto = plainToClass(ApiConfigDto, config);
const errors = await validate(dto);

if (errors.length === 0) {
  console.log('配置验证通过');
} else {
  console.log('配置验证失败:', errors);
}
```

## 维护指南

### 添加新的配置验证

1. 在相应的DTO文件中添加新的属性
2. 添加适当的验证装饰器
3. 更新文档说明
4. 添加相应的测试用例

### 修改现有验证规则

1. 更新验证装饰器
2. 更新注释说明
3. 确保向后兼容性
4. 更新相关测试

### 添加新的配置类别

1. 创建新的DTO文件
2. 在 `index.ts` 中添加导出
3. 在 `application-config.dto.ts` 中添加嵌套验证
4. 更新文档和示例

## 验证装饰器说明

### 基础类型验证

- `@IsString()` - 字符串类型验证
- `@IsNumber()` - 数字类型验证
- `@IsBoolean()` - 布尔类型验证
- `@IsOptional()` - 可选字段验证

### 格式验证

- `@IsUrl()` - URL格式验证
- `@IsPort()` - 端口号格式验证
- `@IsIn([...])` - 枚举值验证

### 范围验证

- `@Min(value)` - 最小值验证
- `@Max(value)` - 最大值验证

### 嵌套验证

- `@ValidateNested()` - 嵌套对象验证
- `@Type(() => DtoClass)` - 类型转换

## 最佳实践

1. **单一职责**: 每个DTO文件只负责一个配置类别
2. **清晰命名**: 使用描述性的类名和属性名
3. **完整注释**: 为每个属性和类添加详细的TSDoc注释
4. **合理验证**: 设置适当的验证规则，避免过度验证
5. **向后兼容**: 修改时考虑向后兼容性
6. **测试覆盖**: 为每个DTO添加相应的测试用例

## 注意事项

- 所有DTO类都使用 `!` 操作符声明属性，表示这些属性会被初始化
- 验证装饰器必须正确导入和使用
- 嵌套验证需要正确配置 `@Type()` 装饰器
- 导出路径使用 `.js` 扩展名以支持ES模块
