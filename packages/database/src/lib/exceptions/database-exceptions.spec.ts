import { DatabaseConnectionException, DatabaseMigrationException, DatabaseConfigException } from './index.js';
import { GeneralInternalServerException, GeneralBadRequestException } from '@hl8/common';

/**
 * 数据库异常类单元测试
 * 
 * 测试数据库模块专用异常类的基本功能和继承关系。
 * 验证异常类的正确创建和基本属性。
 * 
 * @description 数据库异常类的单元测试
 * 
 * @since 1.0.0
 */
describe('Database Exceptions', () => {
  describe('DatabaseConnectionException', () => {
    it('应该正确创建数据库连接异常', () => {
      const exception = new DatabaseConnectionException(
        '数据库连接失败',
        '无法连接到数据库服务器',
        { host: 'localhost', port: 5432 }
      );

      expect(exception).toBeInstanceOf(DatabaseConnectionException);
      expect(exception).toBeInstanceOf(GeneralInternalServerException);
    });

    it('应该处理空的detail参数', () => {
      const exception = new DatabaseConnectionException(
        '数据库连接失败',
        undefined,
        { host: 'localhost' }
      );

      expect(exception).toBeInstanceOf(DatabaseConnectionException);
    });

    it('应该处理空的context参数', () => {
      const exception = new DatabaseConnectionException(
        '数据库连接失败',
        '无法连接到数据库服务器'
      );

      expect(exception).toBeInstanceOf(DatabaseConnectionException);
    });
  });

  describe('DatabaseMigrationException', () => {
    it('应该正确创建数据库迁移异常', () => {
      const exception = new DatabaseMigrationException(
        '迁移执行失败',
        '迁移文件格式错误',
        { migrationName: 'test_migration', step: 'up' }
      );

      expect(exception).toBeInstanceOf(DatabaseMigrationException);
      expect(exception).toBeInstanceOf(GeneralInternalServerException);
    });

    it('应该处理空的detail参数', () => {
      const exception = new DatabaseMigrationException(
        '迁移执行失败',
        undefined,
        { migrationName: 'test_migration' }
      );

      expect(exception).toBeInstanceOf(DatabaseMigrationException);
    });
  });

  describe('DatabaseConfigException', () => {
    it('应该正确创建数据库配置异常', () => {
      const exception = new DatabaseConfigException(
        '配置无效',
        '缺少必需的数据库参数',
        { missingFields: ['host', 'port'] }
      );

      expect(exception).toBeInstanceOf(DatabaseConfigException);
      expect(exception).toBeInstanceOf(GeneralBadRequestException);
    });

    it('应该处理空的detail参数', () => {
      const exception = new DatabaseConfigException(
        '配置无效',
        undefined,
        { missingFields: ['host'] }
      );

      expect(exception).toBeInstanceOf(DatabaseConfigException);
    });
  });

  describe('异常继承关系', () => {
    it('DatabaseConnectionException 应该继承自 GeneralInternalServerException', () => {
      const exception = new DatabaseConnectionException('test');
      expect(exception).toBeInstanceOf(GeneralInternalServerException);
    });

    it('DatabaseMigrationException 应该继承自 GeneralInternalServerException', () => {
      const exception = new DatabaseMigrationException('test');
      expect(exception).toBeInstanceOf(GeneralInternalServerException);
    });

    it('DatabaseConfigException 应该继承自 GeneralBadRequestException', () => {
      const exception = new DatabaseConfigException('test');
      expect(exception).toBeInstanceOf(GeneralBadRequestException);
    });
  });
});
