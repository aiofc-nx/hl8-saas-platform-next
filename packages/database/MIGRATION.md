# 数据库配置迁移文档

## 迁移概述

本次迁移将配置模块 (`packages/config`) 中的数据库相关配置代码迁移到数据库模块 (`packages/database`) 中，实现更好的模块职责分离和依赖管理。

## 迁移内容

### 1. 迁移的文件

**从 `packages/config` 迁移到 `packages/database`：**

- `packages/config/src/database.ts` → `packages/database/src/lib/config/database-config.service.ts`
- `packages/config/src/database-helpers.ts` → `packages/database/src/lib/config/database-config.helpers.ts`

### 2. 新增的文件

**在 `packages/database` 中新增：**

- `packages/database/src/lib/config/database-config.service.ts` - 数据库配置服务
- `packages/database/src/lib/config/database-config.helpers.ts` - 数据库配置辅助函数
- `packages/database/src/lib/config/index.ts` - 配置模块导出文件

### 3. 更新的文件

**`packages/database` 模块更新：**

- `packages/database/src/index.ts` - 添加配置模块导出
- `packages/database/package.json` - 添加必要的数据库驱动依赖

**`packages/config` 模块更新：**

- `packages/config/src/default-config.ts` - 更新导入路径
- `packages/config/src/index.ts` - 移除数据库配置导出
- `packages/config/package.json` - 更新依赖关系

## 迁移后的架构

### 模块职责分离

**`packages/database` 模块职责：**

- 数据库连接管理
- 数据库配置服务
- 数据库类型定义
- 数据库迁移管理
- 数据库异常处理

**`packages/config` 模块职责：**

- 应用程序配置
- 环境变量管理
- 配置服务
- 基础配置项

### 依赖关系

```
packages/config
├── @hl8/database (新增依赖)
├── @hl8/logger
├── @hl8/common
└── @hl8/utils

packages/database
├── @hl8/logger
├── @hl8/common
├── @mikro-orm/core
├── @mikro-orm/nestjs
├── @mikro-orm/postgresql
├── @mikro-orm/mongodb
└── mikro-orm-soft-delete
```

## 使用方式

### 迁移前

```typescript
import { dbMikroOrmConnectionConfig } from '@hl8/config';
```

### 迁移后

```typescript
import { dbMikroOrmConnectionConfig } from '@hl8/database';
```

## 配置服务功能

### DatabaseConfigService 类

**主要功能：**

- 支持 PostgreSQL 和 MongoDB 数据库配置
- 自动环境变量解析
- 连接池管理
- SSL/TLS 支持
- 日志配置
- 软删除支持

**环境变量支持：**

- `DB_TYPE`: 数据库类型 (postgresql | mongodb)
- `DB_HOST`: 数据库主机地址
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名称
- `DB_USER`: 数据库用户名
- `DB_PASS`: 数据库密码
- `DB_SSL_MODE`: SSL 模式
- `DB_CA_CERT`: CA 证书
- `DB_LOGGING`: 日志级别
- `DB_POOL_SIZE`: 连接池大小
- `DB_CONNECTION_TIMEOUT`: 连接超时
- `DB_IDLE_TIMEOUT`: 空闲超时

### 辅助函数

**getTlsOptions():**

- 解析 SSL/TLS 配置
- 支持 Base64 编码的 CA 证书
- 错误处理和验证

**getLoggingMikroOptions():**

- 配置 MikroORM 日志选项
- 支持多种日志级别
- 性能优化考虑

## 迁移优势

### 1. 模块职责清晰

- 数据库相关功能集中在 database 模块
- 配置模块专注于应用配置
- 减少模块间的耦合

### 2. 依赖管理优化

- 数据库驱动依赖集中在 database 模块
- 减少不必要的依赖传递
- 提高构建效率

### 3. 代码组织改善

- 相关功能聚合在一起
- 便于维护和扩展
- 提高代码可读性

### 4. 测试覆盖改善

- 数据库配置可以独立测试
- 减少测试复杂度
- 提高测试覆盖率

## 注意事项

### 1. 导入路径更新

所有使用数据库配置的模块需要更新导入路径：

```typescript
// 旧路径
import { dbMikroOrmConnectionConfig } from '@hl8/config';

// 新路径
import { dbMikroOrmConnectionConfig } from '@hl8/database';
```

### 2. 依赖安装

迁移后需要重新安装依赖：

```bash
pnpm install
```

### 3. 构建验证

确保所有模块能够正常构建：

```bash
pnpm build
```

## 测试验证

### 1. 单元测试

- 数据库配置服务测试
- 辅助函数测试
- 异常处理测试

### 2. 集成测试

- 模块间依赖测试
- 配置加载测试
- 数据库连接测试

### 3. 端到端测试

- 应用程序启动测试
- 数据库操作测试
- 配置验证测试

## 后续计划

### 1. 功能增强

- 支持更多数据库类型
- 配置验证增强
- 性能监控集成

### 2. 文档完善

- API 文档更新
- 使用示例补充
- 最佳实践指南

### 3. 测试覆盖

- 增加边界条件测试
- 性能测试
- 安全测试
