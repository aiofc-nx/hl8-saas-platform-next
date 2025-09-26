/**
 * 异常处理模块使用示例
 *
 * @description 展示如何使用异常处理模块的各种功能
 * 包括基本配置、自定义异常、消息提供者等
 *
 * @example
 * ```typescript
 * // 基本使用
 * import { ExceptionModule, GeneralNotFoundException } from '@hl8/common/exceptions';
 *
 * @Module({
 *   imports: [ExceptionModule.forRoot()],
 * })
 * export class AppModule {}
 *
 * // 使用异常
 * throw new GeneralNotFoundException('User not found', 'The user does not exist');
 * ```
 *
 * @since 1.0.0
 */

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExceptionModule,
  GeneralNotFoundException,
  GeneralBadRequestException,
  GeneralInternalServerException,
  ExceptionMessageProvider,
} from '../index.js';

/**
 * 基本配置示例
 *
 * @description 展示如何配置异常处理模块
 */
@Module({
  imports: [
    ExceptionModule.forRoot({
      documentationUrl: 'https://docs.example.com/errors',
      logLevel: 'error',
      enableStackTrace: true,
    }),
  ],
})
export class BasicExceptionModule {}

/**
 * 异步配置示例
 *
 * @description 展示如何使用异步配置
 */
@Module({
  imports: [
    ExceptionModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        documentationUrl: configService.get('EXCEPTION_DOCS_URL'),
        logLevel: configService.get('LOG_LEVEL', 'error'),
        enableStackTrace: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AsyncExceptionModule {}

/**
 * 自定义消息提供者示例
 *
 * @description 展示如何实现自定义消息提供者
 */
export class CustomMessageProvider implements ExceptionMessageProvider {
  private messages = {
    'USER_NOT_FOUND': {
      title: 'User Not Found',
      detail: 'The user with ID "{userId}" does not exist'
    },
    'INSUFFICIENT_PERMISSIONS': {
      title: 'Insufficient Permissions',
      detail: 'You do not have permission to {action} {resource}'
    },
    'INVALID_EMAIL': {
      title: 'Invalid Email',
      detail: 'The email address "{email}" is not valid'
    }
  };

  getMessage(errorCode: string, messageType: 'title' | 'detail', params?: Record<string, any>): string | undefined {
    const message = this.messages[errorCode as keyof typeof this.messages]?.[messageType];
    if (!message) return undefined;

    if (params) {
      return message.replace(/\{(\w+)\}/g, (match: string, key: string) => {
        return params[key]?.toString() || match;
      });
    }

    return message;
  }

  hasMessage(errorCode: string, messageType: 'title' | 'detail'): boolean {
    return !!this.messages[errorCode as keyof typeof this.messages]?.[messageType];
  }

  getAvailableErrorCodes(): string[] {
    return Object.keys(this.messages);
  }
}

/**
 * 自定义消息提供者配置示例
 *
 * @description 展示如何使用自定义消息提供者
 */
@Module({
  imports: [
    ExceptionModule.forRoot({
      documentationUrl: 'https://docs.example.com/errors',
      messageProvider: new CustomMessageProvider(),
      logLevel: 'error',
    }),
  ],
})
export class CustomMessageExceptionModule {}

/**
 * 业务异常示例
 *
 * @description 展示如何创建业务特定的异常
 */
export class UserNotFoundException extends GeneralNotFoundException {
  constructor(userId: string) {
    super(
      'User not found',
      `The user with ID "${userId}" does not exist`,
      { userId }
    );
  }
}

export class InsufficientPermissionsException extends GeneralBadRequestException {
  constructor(resource: string, action: string) {
    super(
      'Insufficient permissions',
      `You do not have permission to ${action} ${resource}`,
      { resource, action }
    );
  }
}

export class DatabaseConnectionException extends GeneralInternalServerException {
  constructor(operation: string, originalError?: unknown) {
    super(
      'Database connection failed',
      `Unable to connect to database for operation: ${operation}`,
      { operation },
      originalError
    );
  }
}

/**
 * 服务类示例
 *
 * @description 展示如何在服务中使用异常
 */
export class UserService {
  /**
   * 根据ID查找用户
   *
   * @param userId 用户ID
   * @returns 用户信息
   * @throws UserNotFoundException 用户不存在时抛出
   */
  async findUserById(userId: string): Promise<any> {
    // 模拟数据库查询
    const user = await this.queryUserFromDatabase(userId);
    
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    
    return user;
  }

  /**
   * 检查用户权限
   *
   * @param userId 用户ID
   * @param resource 资源
   * @param action 操作
   * @throws InsufficientPermissionsException 权限不足时抛出
   */
  async checkUserPermission(userId: string, resource: string, action: string): Promise<void> {
    const hasPermission = await this.checkPermission(userId, resource, action);
    
    if (!hasPermission) {
      throw new InsufficientPermissionsException(resource, action);
    }
  }

  /**
   * 保存用户信息
   *
   * @param userData 用户数据
   * @returns 保存结果
   * @throws DatabaseConnectionException 数据库连接失败时抛出
   */
  async saveUser(userData: any): Promise<any> {
    try {
      return await this.saveToDatabase(userData);
    } catch (error) {
      throw new DatabaseConnectionException('saveUser', error);
    }
  }

  // 模拟方法
  private async queryUserFromDatabase(userId: string): Promise<any> {
    // 模拟数据库查询
    return null;
  }

  private async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // 模拟权限检查
    return false;
  }

  private async saveToDatabase(userData: any): Promise<any> {
    // 模拟数据库保存
    throw new Error('Database connection failed');
  }
}

/**
 * 控制器示例
 *
 * @description 展示如何在控制器中使用异常
 */
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户信息
   *
   * @param userId 用户ID
   * @returns 用户信息
   */
  async getUser(userId: string): Promise<any> {
    return await this.userService.findUserById(userId);
  }

  /**
   * 更新用户信息
   *
   * @param userId 用户ID
   * @param userData 用户数据
   * @returns 更新结果
   */
  async updateUser(userId: string, userData: any): Promise<any> {
    // 检查权限
    await this.userService.checkUserPermission(userId, 'user', 'update');
    
    // 保存用户信息
    return await this.userService.saveUser(userData);
  }
}

/**
 * 完整应用示例
 *
 * @description 展示完整的应用配置
 */
@Module({
  imports: [
    ExceptionModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        documentationUrl: configService.get('EXCEPTION_DOCS_URL', 'https://docs.example.com/errors'),
        messageProvider: new CustomMessageProvider(),
        logLevel: configService.get('LOG_LEVEL', 'error'),
        enableStackTrace: configService.get('NODE_ENV') !== 'production',
        enableRequestLogging: true,
        enableResponseLogging: true,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class AppModule {}