import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseConnectionException, DatabaseMigrationException, DatabaseConfigException } from './index.js';

/**
 * 数据库异常类单元测试
 * 
 * 测试数据库模块专用异常类的功能和继承关系。
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

      expect(exception.message).toBe('数据库连接失败');
      expect(exception.getResponse()).toMatchObject({
        title: 'Internal Server Error',
        detail: '无法连接到数据库服务器',
        errorCode: 'DATABASE_CONNECTION_ERROR',
        category: 'database',
        severity: 'high'
      });
    });
  });

  describe('DatabaseMigrationException', () => {
    it('应该正确创建数据库迁移异常', () => {
      const exception = new DatabaseMigrationException(
        '迁移执行失败',
        '迁移文件格式错误',
        { migrationName: 'test_migration', step: 'up' }
      );

      expect(exception.message).toBe('迁移执行失败');
      expect(exception.getResponse()).toMatchObject({
        title: 'Internal Server Error',
        detail: '迁移文件格式错误',
        errorCode: 'DATABASE_MIGRATION_ERROR',
        category: 'database',
        severity: 'high'
      });
    });
  });

  describe('DatabaseConfigException', () => {
    it('应该正确创建数据库配置异常', () => {
      const exception = new DatabaseConfigException(
        '配置无效',
        '缺少必需的数据库参数',
        { missingFields: ['host', 'port'] }
      );

      expect(exception.message).toBe('配置无效');
      expect(exception.getResponse()).toMatchObject({
        title: 'Bad Request',
        detail: '缺少必需的数据库参数',
        errorCode: 'DATABASE_CONFIG_ERROR',
        category: 'database',
        severity: 'medium'
      });
    });
  });
});
