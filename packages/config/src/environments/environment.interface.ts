/**
 * 环境配置接口定义
 *
 * @description 定义HL8 SAAS平台的环境配置接口，采用渐进式开发策略
 * 只保留核心配置选项，支持多环境配置、认证、数据库等功能
 *
 * @fileoverview 环境配置接口定义文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const environment: IEnvironment = {
 *   port: 3000,
 *   host: 'localhost',
 *   baseUrl: 'http://localhost:3000',
 *   clientBaseUrl: 'http://localhost:4200',
 *   production: false,
 *   envName: 'development',
 *   // ... 其他配置
 * };
 * ```
 */

/**
 * 日志级别枚举
 *
 * @description 定义支持的日志级别
 */
export enum LogLevel {
  /** 跟踪级别 - 最详细的日志信息 */
  TRACE = 'trace',
  /** 调试级别 - 调试信息 */
  DEBUG = 'debug',
  /** 信息级别 - 一般信息 */
  INFO = 'info',
  /** 警告级别 - 警告信息 */
  WARN = 'warn',
  /** 错误级别 - 错误信息 */
  ERROR = 'error',
  /** 致命级别 - 致命错误信息 */
  FATAL = 'fatal'
}

/**
 * 环境类型枚举
 *
 * @description 定义支持的环境类型
 */
export enum Env {
  /** 开发环境 */
  DEVELOPMENT = 'development',
  /** 生产环境 */
  PRODUCTION = 'production',
  /** 测试环境 */
  TEST = 'test'
}

/**
 * 文件系统配置接口
 *
 * @description 定义文件系统相关配置
 */
export interface FileSystem {
  /** 资源文件路径 */
  assetPath: string;
  /** 公共资源路径 */
  assetPublicPath: string;
}

/**
 * HL8平台功能配置接口
 *
 * @description 定义HL8 SAAS平台的核心功能配置
 */
export interface IHl8Features {
  /** 是否启用多租户功能 */
  multiTenant: boolean;
  /** 是否启用用户注册 */
  userRegistration: boolean;
  /** 是否启用邮箱密码登录 */
  emailPasswordLogin: boolean;
  /** 是否启用魔法登录 */
  magicLogin: boolean;
  /** 是否启用组织管理 */
  organizationManagement: boolean;
  /** 是否启用部门管理 */
  departmentManagement: boolean;
  /** 是否启用用户管理 */
  userManagement: boolean;
  /** 是否启用权限管理 */
  permissionManagement: boolean;
}

/**
 * 演示凭据配置接口
 *
 * @description 定义演示环境的凭据配置
 */
export interface IDemoCredential {
  /** 演示用户名 */
  username: string;
  /** 演示密码 */
  password: string;
}

/**
 * 环境配置接口
 *
 * @description 定义HL8 SAAS平台的完整环境配置
 * 采用渐进式开发策略，只保留核心配置选项
 */
export interface IEnvironment {
  /** API端口 */
  port: number;
  /** API主机 */
  host: string;
  /** API基础URL */
  baseUrl: string;
  /** 客户端基础URL */
  clientBaseUrl: string;
  /** 是否为生产环境 */
  production: boolean;
  /** 环境名称 */
  envName: string;

  /** 环境变量配置 */
  env: {
    /** 日志级别 */
    LOG_LEVEL: LogLevel;
  };

  /** 会话密钥 */
  EXPRESS_SESSION_SECRET: string;
  /** 用户密码加密盐轮数 */
  USER_PASSWORD_BCRYPT_SALT_ROUNDS: number;

  /** JWT配置 */
  JWT_SECRET: string;
  JWT_TOKEN_EXPIRATION_TIME: number;
  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: number;
  JWT_VERIFICATION_TOKEN_SECRET: string;
  JWT_VERIFICATION_TOKEN_EXPIRATION_TIME: number;

  /** 数据库配置 */
  DB_TYPE: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_SSL_MODE: boolean;

  /** 文件系统配置 */
  fileSystem: FileSystem;

  /** HL8平台功能配置 */
  hl8Features: IHl8Features;

  /** 演示凭据配置 */
  demoCredential?: IDemoCredential;

  /** 日志配置 */
  logger: {
    /** 日志级别 */
    level: LogLevel;
    /** 是否启用请求日志 */
    enableRequestLogging: boolean;
    /** 是否启用响应日志 */
    enableResponseLogging: boolean;
  };
}
