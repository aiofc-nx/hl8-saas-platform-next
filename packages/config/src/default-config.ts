import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import { dbMikroOrmConnectionConfig } from './database.js';
import { PinoLogger } from '@hl8/logger';

/**
 * 应用配置服务
 *
 * @description 提供应用程序的核心配置，采用渐进式开发策略
 * 只保留必要的配置项，支持多环境配置
 *
 * ## 核心配置
 *
 * ### API配置
 * - 主机和端口配置
 * - 基础URL配置
 *
 * ### 数据库配置
 * - MikroORM连接配置
 * - 数据库迁移设置
 *
 * ### 认证配置
 * - JWT密钥配置
 * - 密码加密设置
 *
 * ### 资源文件配置
 * - 静态资源路径
 * - 公共文件路径
 */
class ApplicationConfigService {
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });
  private readonly assetPath: string;
  private readonly assetPublicPath: string;

  constructor() {
    this.assetPath = this.resolveAssetPath();
    this.assetPublicPath = this.resolveAssetPublicPath();
    this.logConfiguration();
  }

  /**
   * 解析资源文件路径
   *
   * @description 根据运行环境解析资源文件路径
   * @returns {string} 资源文件路径
   */
  private resolveAssetPath(): string {
    const isDocker = process.env.DOCKER === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isDocker) {
      return '/app/public';
    }
    
    if (isProduction) {
      return path.join(process.cwd(), 'public');
    }
    
    return path.join(process.cwd(), 'apps', 'api', 'src', 'assets');
  }

  /**
   * 解析公共资源路径
   *
   * @description 解析公共访问的资源路径
   * @returns {string} 公共资源路径
   */
  private resolveAssetPublicPath(): string {
    const isDocker = process.env.DOCKER === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isDocker || isProduction) {
      return '/public';
    }
    
    return '/public';
  }

  /**
   * 记录配置信息
   *
   * @description 在启动时记录关键配置信息
   */
  private logConfiguration(): void {
    this.logger.log('=== 应用配置信息 ===');
    this.logger.log(`资源路径: ${this.assetPath}`);
    this.logger.log(`公共路径: ${this.assetPublicPath}`);
    this.logger.log(`API端口: ${process.env.API_PORT || 3000}`);
    this.logger.log(`数据库类型: ${process.env.DB_TYPE || 'postgres'}`);
    this.logger.log('==================');
  }

  /**
   * 获取默认配置
   *
   * @description 返回应用程序的默认配置对象
   * @returns {Object} 默认配置对象
   */
  getDefaultConfiguration() {
    return {
      // API配置
      api: {
        port: parseInt(process.env.API_PORT || '3000'),
        host: process.env.API_HOST || 'http://localhost',
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        clientBaseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:4200',
        production: process.env.NODE_ENV === 'production',
        envName: process.env.NODE_ENV || 'development',
      },

      // 数据库配置
      database: {
        mikroOrm: dbMikroOrmConnectionConfig,
      },

      // 认证配置
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'secretKey',
        jwtExpirationTime: parseInt(process.env.JWT_TOKEN_EXPIRATION_TIME || '86400'), // 1天
        jwtRefreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'refreshSecretKey',
        jwtRefreshExpirationTime: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || '604800'), // 7天
        passwordSaltRounds: parseInt(process.env.USER_PASSWORD_BCRYPT_SALT_ROUNDS || '12'),
      },

      // 资源文件配置
      assets: {
        assetPath: this.assetPath,
        assetPublicPath: this.assetPublicPath,
      },

      // 日志配置
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true' || false,
        enableResponseLogging: process.env.ENABLE_RESPONSE_LOGGING === 'true' || false,
      },

      // 功能开关
      features: {
        multiTenant: process.env.FEATURE_MULTI_TENANT === 'true' || true,
        userRegistration: process.env.FEATURE_USER_REGISTRATION === 'true' || true,
        emailPasswordLogin: process.env.FEATURE_EMAIL_PASSWORD_LOGIN === 'true' || true,
        magicLogin: process.env.FEATURE_MAGIC_LOGIN === 'true' || false,
      },
    };
  }
}

// 创建配置服务实例并导出默认配置
const applicationConfigService = new ApplicationConfigService();
export const defaultConfiguration = applicationConfigService.getDefaultConfiguration();