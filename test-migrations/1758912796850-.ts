import { Migration } from '@mikro-orm/migrations';

export class 1758912796850 extends Migration {
  async up(): Promise<void> {
    // TODO: 实现迁移逻辑
    // 示例:
    // this.addSql('CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(255))');
  }

  async down(): Promise<void> {
    // TODO: 实现回滚逻辑
    // 示例:
    // this.addSql('DROP TABLE users');
  }
}
