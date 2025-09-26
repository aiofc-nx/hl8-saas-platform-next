# @hl8/database

数据库模块，提供完整的数据库管理功能，支持 PostgreSQL 和 MongoDB 数据库，集成 MikroORM 提供类型安全的数据库操作。

## 🚀 特性

- **多数据库支持**: 支持 PostgreSQL 和 MongoDB 数据库
- **ORM 集成**: 基于 MikroORM 提供类型安全的数据库操作
- **连接管理**: 自动连接池管理和健康检查
- **迁移管理**: 完整的数据库迁移生命周期管理
- **日志集成**: 集成自定义 Logger 模块
- **NestJS 集成**: 完整的 NestJS 模块支持

## 📦 安装

```bash
pnpm add @hl8/database
```

## 🔧 配置

### 基础配置

```typescript
import { DatabaseModule, DatabaseTypeEnum } from '@hl8/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      type: DatabaseTypeEnum.POSTGRESQL,
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      username: 'user',
      password: 'password',
      entities: [User, Organization],
      migrations: {
        path: './migrations'
      }
    })
  ]
})
export class AppModule {}
```

### 异步配置

```typescript
import { DatabaseModule, DatabaseTypeEnum } from '@hl8/database';

@Module({
  imports: [
    DatabaseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          type: DatabaseTypeEnum.POSTGRESQL,
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          database: configService.get('DB_NAME'),
          username: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          entities: [User, Organization],
          migrations: {
            path: './migrations'
          }
        };
      },
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
```

### MongoDB 配置

```typescript
import { DatabaseModule, DatabaseTypeEnum } from '@hl8/database';

@Module({
  imports: [
    DatabaseModule.forRoot({
      type: DatabaseTypeEnum.MONGODB,
      host: 'localhost',
      port: 27017,
      database: 'myapp',
      entities: [User, Organization],
      migrations: {
        path: './migrations'
      }
    })
  ]
})
export class AppModule {}
```

## 🛠️ 使用

### 连接管理

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseConnectionManager } from '@hl8/database';

@Injectable()
export class UserService {
  constructor(
    private readonly dbManager: DatabaseConnectionManager
  ) {}

  async createUser(userData: CreateUserDto) {
    const em = this.dbManager.getEntityManager();
    const user = new User(userData);
    await em.persistAndFlush(user);
    return user;
  }

  async findUser(id: string) {
    const em = this.dbManager.getEntityManager();
    return await em.findOne(User, { id });
  }
}
```

### 迁移管理

```typescript
import { Injectable } from '@nestjs/common';
import { MigrationManager } from '@hl8/database';

@Injectable()
export class DatabaseService {
  constructor(
    private readonly migrationManager: MigrationManager
  ) {}

  async runMigrations() {
    const result = await this.migrationManager.runMigrations();
    console.log(`执行了 ${result.executed} 个迁移`);
    return result;
  }

  async createMigration(name: string) {
    return await this.migrationManager.createMigration({
      name,
      path: './migrations'
    });
  }

  async revertLastMigration() {
    return await this.migrationManager.revertLastMigration();
  }
}
```

### 特性模块

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@hl8/database';
import { User, Organization } from './entities';

@Module({
  imports: [
    DatabaseModule.forFeature([User, Organization])
  ]
})
export class UserModule {}
```

## 📋 API 参考

### DatabaseModule

#### `forRoot(config: DatabaseConfig)`

配置数据库模块。

**参数:**

- `config`: 数据库配置选项

#### `forRootAsync(configFactory)`

异步配置数据库模块。

**参数:**

- `configFactory`: 配置工厂函数

#### `forFeature(entities: any[])`

为特性模块配置数据库连接。

**参数:**

- `entities`: 实体类数组

### DatabaseConnectionManager

#### `getEntityManager(): EntityManager`

获取实体管理器。

#### `getRepository<T>(entity: any): EntityRepository<T>`

获取实体仓库。

#### `checkConnection(): Promise<ConnectionStatus>`

检查连接状态。

### MigrationManager

#### `runMigrations(): Promise<MigrationResult>`

运行所有待执行的迁移。

#### `revertLastMigration(): Promise<RevertResult>`

回滚最后一个迁移。

#### `createMigration(options: MigrationOptions): Promise<CreateResult>`

创建新的迁移文件。

#### `getMigrationStatus(): Promise<MigrationStatus>`

获取迁移状态。

## 🔧 配置选项

### DatabaseConfig

```typescript
interface DatabaseConfig {
  type: DatabaseTypeEnum;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  url?: string;
  entities: any[];
  migrations?: {
    path: string;
    tableName?: string;
    pattern?: string;
    transactional?: boolean;
  };
  pool?: {
    min?: number;
    max?: number;
    acquireTimeoutMillis?: number;
    idleTimeoutMillis?: number;
  };
  logging?: boolean | 'all' | string[];
  debug?: boolean;
  autoLoadEntities?: boolean;
  synchronize?: boolean;
  cache?: {
    adapter?: string;
    options?: Record<string, any>;
  };
}
```

### MigrationOptions

```typescript
interface MigrationOptions {
  name: string;
  path?: string;
  tableName?: string;
  transactional?: boolean;
  pattern?: 'all' | 'none' | 'safe';
  empty?: boolean;
  description?: string;
  tags?: string[];
  dependencies?: string[];
  timeout?: number;
  force?: boolean;
}
```

## 🧪 测试

```bash
# 运行单元测试
nx test database

# 运行测试并生成覆盖率报告
nx test database --coverage
```

## 📝 许可证

MIT License
