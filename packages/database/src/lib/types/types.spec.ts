import { DatabaseTypeEnum } from './database-type.enum.js';
import { DatabaseConfig } from './database-config.interface.js';

/**
 * 数据库类型定义单元测试
 * 
 * 测试数据库相关的类型定义，包括枚举、接口等。
 * 确保类型定义的正确性和完整性。
 * 
 * @description 数据库类型定义的单元测试套件
 * 
 * @since 1.0.0
 */
describe('Database Types', () => {
  describe('DatabaseTypeEnum', () => {
    it('应该定义 PostgreSQL 类型', () => {
      expect(DatabaseTypeEnum.POSTGRESQL).toBe('postgresql');
    });

    it('应该定义 MongoDB 类型', () => {
      expect(DatabaseTypeEnum.MONGODB).toBe('mongodb');
    });

    it('应该包含所有支持的数据库类型', () => {
      const values = Object.values(DatabaseTypeEnum);
      expect(values).toContain('postgresql');
      expect(values).toContain('mongodb');
      expect(values).toHaveLength(2);
    });

    it('应该具有正确的枚举值', () => {
      expect(DatabaseTypeEnum.POSTGRESQL).toBeDefined();
      expect(DatabaseTypeEnum.MONGODB).toBeDefined();
    });
  });

  describe('DatabaseConfig Interface', () => {
    it('应该支持 PostgreSQL 配置', () => {
      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: [],
        migrations: {
          path: './migrations'
        }
      };

      expect(config.type).toBe(DatabaseTypeEnum.POSTGRESQL);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('test_db');
      expect(config.username).toBe('test_user');
      expect(config.password).toBe('test_password');
      expect(config.entities).toEqual([]);
      expect(config.migrations).toBeDefined();
    });

    it('应该支持 MongoDB 配置', () => {
      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: [],
        migrations: {
          path: './migrations'
        }
      };

      expect(config.type).toBe(DatabaseTypeEnum.MONGODB);
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(27017);
    });

    it('应该支持可选属性', () => {
      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: []
      };

      expect(config.type).toBe(DatabaseTypeEnum.POSTGRESQL);
      expect(config.migrations).toBeUndefined();
    });

    it('应该支持实体数组', () => {
      class TestEntity {}
      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: [TestEntity]
      };

      expect(config.entities).toContain(TestEntity);
      expect(config.entities).toHaveLength(1);
    });

    it('应该支持迁移配置', () => {
      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: [],
        migrations: {
          path: './custom-migrations',
          pattern: '*.ts',
          transactional: true,
          allOrNothing: true,
          dropTables: false,
          safe: false,
          snapshot: true,
          emit: 'ts'
        }
      };

      expect(config.migrations).toBeDefined();
      expect(config.migrations?.path).toBe('./custom-migrations');
      expect(config.migrations?.pattern).toBe('*.ts');
      expect(config.migrations?.transactional).toBe(true);
      expect(config.migrations?.allOrNothing).toBe(true);
      expect(config.migrations?.dropTables).toBe(false);
      expect(config.migrations?.safe).toBe(false);
      expect(config.migrations?.snapshot).toBe(true);
      expect(config.migrations?.emit).toBe('ts');
    });
  });

  describe('IMigrationOptions Interface', () => {
    it('应该支持基本迁移选项', () => {
      const options: IMigrationOptions = {
        name: 'TestMigration',
        path: './migrations',
        empty: true
      };

      expect(options.name).toBe('TestMigration');
      expect(options.path).toBe('./migrations');
      expect(options.empty).toBe(true);
    });

    it('应该支持所有可选属性', () => {
      const options: IMigrationOptions = {
        name: 'TestMigration',
        path: './migrations',
        empty: false,
        dryRun: true,
        check: true,
        diff: true,
        from: '2023-01-01',
        to: '2023-12-31'
      };

      expect(options.name).toBe('TestMigration');
      expect(options.path).toBe('./migrations');
      expect(options.empty).toBe(false);
      expect(options.dryRun).toBe(true);
      expect(options.check).toBe(true);
      expect(options.diff).toBe(true);
      expect(options.from).toBe('2023-01-01');
      expect(options.to).toBe('2023-12-31');
    });

    it('应该支持最小配置', () => {
      const options: IMigrationOptions = {
        name: 'TestMigration'
      };

      expect(options.name).toBe('TestMigration');
      expect(options.path).toBeUndefined();
      expect(options.empty).toBeUndefined();
    });
  });

  describe('类型兼容性', () => {
    it('应该与 MikroORM 配置兼容', () => {
      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: []
      };

      // 验证配置对象的结构
      expect(typeof config.type).toBe('string');
      expect(typeof config.host).toBe('string');
      expect(typeof config.port).toBe('number');
      expect(typeof config.database).toBe('string');
      expect(typeof config.username).toBe('string');
      expect(typeof config.password).toBe('string');
      expect(Array.isArray(config.entities)).toBe(true);
    });

    it('应该支持不同的数据库类型', () => {
      const postgresConfig: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: []
      };

      const mongoConfig: DatabaseConfig = {
        type: DatabaseTypeEnum.MONGODB,
        host: 'localhost',
        port: 27017,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: []
      };

      expect(postgresConfig.type).toBe(DatabaseTypeEnum.POSTGRESQL);
      expect(mongoConfig.type).toBe(DatabaseTypeEnum.MONGODB);
    });
  });

  describe('边界条件', () => {
    it('应该处理空实体数组', () => {
      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: []
      };

      expect(config.entities).toEqual([]);
      expect(config.entities).toHaveLength(0);
    });

    it('应该处理多个实体', () => {
      class Entity1 {}
      class Entity2 {}
      class Entity3 {}

      const config: DatabaseConfig = {
        type: DatabaseTypeEnum.POSTGRESQL,
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        entities: [Entity1, Entity2, Entity3]
      };

      expect(config.entities).toHaveLength(3);
      expect(config.entities).toContain(Entity1);
      expect(config.entities).toContain(Entity2);
      expect(config.entities).toContain(Entity3);
    });
  });
});
