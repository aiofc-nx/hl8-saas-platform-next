import { Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ApplicationConfigDto } from './dto/application-config.dto.js';
import { PinoLogger } from '@hl8/logger';

/**
 * 配置验证服务
 *
 * @description 提供配置验证功能，确保配置数据符合业务规则和类型要求
 * 使用 class-validator 和 class-transformer 进行配置验证和转换
 *
 * ## 主要功能
 *
 * ### 配置验证
 * - 验证配置数据的类型和格式
 * - 检查配置值的业务规则
 * - 提供详细的验证错误信息
 *
 * ### 配置转换
 * - 将普通对象转换为验证DTO
 * - 支持嵌套对象验证
 * - 自动类型转换和格式化
 *
 * ### 错误处理
 * - 收集所有验证错误
 * - 提供友好的错误信息
 * - 支持部分验证和完整验证
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly configValidationService: ConfigValidationService) {}
 *   
 *   async validateConfig(config: any) {
 *     const result = await this.configValidationService.validateApplicationConfig(config);
 *     if (!result.isValid) {
 *       console.error('配置验证失败:', result.errors);
 *     }
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ConfigValidationService {
  /**
   * 日志记录器
   * 
   * @description 用于记录配置验证的日志信息
   * 使用 Pino 日志库，提供高性能的日志记录功能
   */
  private readonly logger = new PinoLogger({
    level: 'info',
    destination: { type: 'console' }
  });

  /**
   * 验证应用程序配置
   *
   * @description 验证完整的应用程序配置，包括所有子配置项
   * 使用 class-validator 进行深度验证，确保配置符合所有业务规则
   * 
   * ## 验证规则
   * 
   * ### 类型验证
   * - 验证所有配置项的数据类型
   * - 检查必需字段是否存在
   * - 验证可选字段的类型
   * 
   * ### 业务规则验证
   * - 验证端口号范围
   * - 检查URL格式
   * - 验证密码强度
   * - 检查超时时间合理性
   * 
   * ### 嵌套验证
   * - 递归验证所有嵌套对象
   * - 验证数组元素
   * - 检查对象结构完整性
   * 
   * @param {any} config - 要验证的配置对象
   * @returns {Promise<ValidationResult>} 验证结果，包含是否有效和错误信息
   * 
   * @example
   * ```typescript
   * const config = {
   *   api: { port: 3000, host: 'localhost' },
   *   database: { type: 'postgresql', host: 'localhost' }
   * };
   * 
   * const result = await this.configValidationService.validateApplicationConfig(config);
   * if (result.isValid) {
   *   console.log('配置验证通过');
   * } else {
   *   console.error('配置验证失败:', result.errors);
   * }
   * ```
   * 
   * @since 1.0.0
   */
  async validateApplicationConfig(config: any): Promise<ValidationResult> {
    try {
      this.logger.debug('开始验证应用程序配置');
      
      // 将普通对象转换为验证DTO
      const configDto = plainToClass(ApplicationConfigDto, config, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false
      });

      // 执行验证
      const errors = await validate(configDto, {
        whitelist: true,
        forbidNonWhitelisted: true
      });

      if (errors.length === 0) {
        this.logger.debug('应用程序配置验证通过');
        return {
          isValid: true,
          errors: [],
          config: configDto
        };
      }

      // 处理验证错误
      const validationErrors = this.formatValidationErrors(errors);
      this.logger.warn('应用程序配置验证失败', { errors: validationErrors });

      return {
        isValid: false,
        errors: validationErrors,
        config: null
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('配置验证过程中发生错误', { error: errorMessage });
      return {
        isValid: false,
        errors: [{
          property: 'validation',
          value: null,
          constraints: {
            validation: `配置验证过程中发生错误: ${errorMessage}`
          }
        }],
        config: null
      };
    }
  }

  /**
   * 验证部分配置
   *
   * @description 验证配置对象的特定部分，支持增量验证
   * 适用于配置更新和部分配置验证场景
   * 
   * ## 使用场景
   * - 配置热更新时的验证
   * - 部分配置项更新验证
   * - 配置迁移时的验证
   * 
   * @param {any} partialConfig - 要验证的部分配置对象
   * @param {string[]} fields - 要验证的字段列表
   * @returns {Promise<ValidationResult>} 验证结果
   * 
   * @example
   * ```typescript
   * const partialConfig = { api: { port: 3000 } };
   * const result = await this.configValidationService.validatePartialConfig(
   *   partialConfig, 
   *   ['api']
   * );
   * ```
   * 
   * @since 1.0.0
   */
  async validatePartialConfig(partialConfig: any, fields: string[]): Promise<ValidationResult> {
    try {
      this.logger.debug('开始验证部分配置', { fields });
      
      // 创建部分配置的DTO
      const configDto = plainToClass(ApplicationConfigDto, partialConfig, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false
      });

      // 只验证指定字段
      const errors = await validate(configDto, {
        whitelist: true,
        forbidNonWhitelisted: false,
        skipMissingProperties: true
      });

      // 过滤只包含指定字段的错误
      const filteredErrors = errors.filter(error => 
        fields.some(field => error.property.startsWith(field))
      );

      if (filteredErrors.length === 0) {
        this.logger.debug('部分配置验证通过', { fields });
        return {
          isValid: true,
          errors: [],
          config: configDto
        };
      }

      const validationErrors = this.formatValidationErrors(filteredErrors);
      this.logger.warn('部分配置验证失败', { fields, errors: validationErrors });

      return {
        isValid: false,
        errors: validationErrors,
        config: null
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('部分配置验证过程中发生错误', { error: errorMessage });
      return {
        isValid: false,
        errors: [{
          property: 'validation',
          value: null,
          constraints: {
            validation: `部分配置验证过程中发生错误: ${errorMessage}`
          }
        }],
        config: null
      };
    }
  }

  /**
   * 格式化验证错误
   *
   * @description 将 class-validator 的验证错误转换为友好的错误信息
   * 支持嵌套错误处理和错误信息本地化
   * 
   * ## 错误格式化规则
   * - 提取错误约束信息
   * - 处理嵌套对象错误
   * - 生成友好的错误消息
   * - 支持错误路径追踪
   * 
   * @param {ValidationError[]} errors - 验证错误数组
   * @returns {FormattedValidationError[]} 格式化后的错误信息
   * 
   * @private
   * 
   * @example
   * ```typescript
   * const errors = [
   *   {
   *     property: 'api.port',
   *     constraints: { min: '端口号必须大于等于1' }
   *   }
   * ];
   * 
   * const formatted = this.formatValidationErrors(errors);
   * // 结果: [{ property: 'api.port', value: null, constraints: { min: '端口号必须大于等于1' } }]
   * ```
   * 
   * @since 1.0.0
   */
  private formatValidationErrors(errors: ValidationError[]): FormattedValidationError[] {
    const formattedErrors: FormattedValidationError[] = [];

    for (const error of errors) {
      if (error.constraints) {
        // 直接错误，有约束信息
        formattedErrors.push({
          property: error.property,
          value: error.value,
          constraints: error.constraints
        });
      } else if (error.children && error.children.length > 0) {
        // 嵌套错误，递归处理
        const childErrors = this.formatValidationErrors(error.children);
        for (const childError of childErrors) {
          formattedErrors.push({
            property: `${error.property}.${childError.property}`,
            value: childError.value,
            constraints: childError.constraints
          });
        }
      }
    }

    return formattedErrors;
  }

  /**
   * 验证配置值
   *
   * @description 验证单个配置值是否符合要求
   * 支持基本类型验证和自定义验证规则
   * 
   * @param {any} value - 要验证的值
   * @param {string} property - 属性名称
   * @param {string} type - 期望的类型
   * @returns {boolean} 验证是否通过
   * 
   * @example
   * ```typescript
   * const isValid = this.configValidationService.validateConfigValue(3000, 'port', 'number');
   * ```
   * 
   * @since 1.0.0
   */
  validateConfigValue(value: any, property: string, type: string): boolean {
    switch (type) {
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'string':
        return typeof value === 'string' && value.length > 0;
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null;
      default:
        return false;
    }
  }

  /**
   * 获取验证规则说明
   *
   * @description 获取配置验证规则的详细说明
   * 用于生成配置文档和错误提示
   * 
   * @returns {ValidationRules} 验证规则说明
   * 
   * @example
   * ```typescript
   * const rules = this.configValidationService.getValidationRules();
   * console.log(rules.api.port.description);
   * ```
   * 
   * @since 1.0.0
   */
  getValidationRules(): ValidationRules {
    return {
      api: {
        port: {
          type: 'number',
          min: 1,
          max: 65535,
          description: 'API端口号，范围1-65535'
        },
        host: {
          type: 'string',
          description: 'API主机地址'
        },
        baseUrl: {
          type: 'string',
          format: 'url',
          description: 'API基础URL，必须是有效的URL格式'
        }
      },
      database: {
        type: {
          type: 'string',
          enum: ['postgresql', 'mysql', 'sqlite', 'mongodb'],
          description: '数据库类型，支持postgresql、mysql、sqlite、mongodb'
        },
        port: {
          type: 'number',
          min: 1,
          max: 65535,
          description: '数据库端口号，范围1-65535'
        }
      }
      // 可以继续添加更多规则说明
    };
  }
}

/**
 * 验证结果接口
 *
 * @description 配置验证结果的类型定义
 * 包含验证状态、错误信息和验证后的配置对象
 */
export interface ValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 验证错误列表 */
  errors: FormattedValidationError[];
  /** 验证后的配置对象 */
  config: ApplicationConfigDto | null;
}

/**
 * 格式化验证错误接口
 *
 * @description 格式化后的验证错误信息
 * 包含属性名、值和约束信息
 */
export interface FormattedValidationError {
  /** 错误属性名 */
  property: string;
  /** 错误值 */
  value: any;
  /** 错误约束信息 */
  constraints: Record<string, string>;
}

/**
 * 验证规则接口
 *
 * @description 配置验证规则的详细说明
 * 用于生成配置文档和错误提示
 */
export interface ValidationRules {
  [key: string]: {
    [property: string]: {
      type: string;
      min?: number;
      max?: number;
      enum?: string[];
      format?: string;
      description: string;
    };
  };
}
