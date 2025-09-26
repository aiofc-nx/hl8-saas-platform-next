import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 配置验证错误类
 *
 * @description 专门用于配置验证错误的异常类
 * 提供详细的错误信息和错误分类
 *
 * ## 错误类型
 * - 数据类型错误
 * - 业务规则错误
 * - 必需字段缺失
 * - 格式验证错误
 * - 范围验证错误
 *
 * @example
 * ```typescript
 * throw new ConfigValidationError(
 *   'API端口号必须是有效的数字',
 *   'api.port',
 *   'INVALID_PORT'
 * );
 * ```
 *
 * @since 1.0.0
 */
export class ConfigValidationError extends HttpException {
  /**
   * 错误属性路径
   *
   * @description 发生错误的配置属性路径
   * 例如：'api.port', 'database.host'
   */
  public readonly property: string;

  /**
   * 错误代码
   *
   * @description 错误的唯一标识码
   * 用于错误分类和处理
   */
  public readonly errorCode: string;

  /**
   * 构造函数
   *
   * @description 创建配置验证错误实例
   * 
   * @param {string} message - 错误消息
   * @param {string} property - 错误属性路径
   * @param {string} errorCode - 错误代码
   * @param {HttpStatus} statusCode - HTTP状态码，默认为400
   */
  constructor(
    message: string,
    property: string,
    errorCode: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(
      {
        message,
        property,
        errorCode,
        timestamp: new Date().toISOString(),
        type: 'ConfigValidationError'
      },
      statusCode
    );
    
    this.property = property;
    this.errorCode = errorCode;
  }

  /**
   * 创建数据类型错误
   *
   * @description 创建数据类型验证错误
   * 
   * @param {string} property - 属性路径
   * @param {string} expectedType - 期望的数据类型
   * @param {any} actualValue - 实际值
   * @returns {ConfigValidationError} 配置验证错误实例
   * 
   * @example
   * ```typescript
   * throw ConfigValidationError.createTypeError('api.port', 'number', '3000');
   * ```
   * 
   * @since 1.0.0
   */
  static createTypeError(property: string, expectedType: string, actualValue: any): ConfigValidationError {
    return new ConfigValidationError(
      `属性 '${property}' 必须是 ${expectedType} 类型，实际值: ${actualValue}`,
      property,
      'INVALID_TYPE'
    );
  }

  /**
   * 创建必需字段错误
   *
   * @description 创建必需字段缺失错误
   * 
   * @param {string} property - 属性路径
   * @returns {ConfigValidationError} 配置验证错误实例
   * 
   * @example
   * ```typescript
   * throw ConfigValidationError.createRequiredError('api.port');
   * ```
   * 
   * @since 1.0.0
   */
  static createRequiredError(property: string): ConfigValidationError {
    return new ConfigValidationError(
      `必需字段 '${property}' 缺失`,
      property,
      'REQUIRED_FIELD_MISSING'
    );
  }

  /**
   * 创建范围错误
   *
   * @description 创建数值范围验证错误
   * 
   * @param {string} property - 属性路径
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @param {any} actualValue - 实际值
   * @returns {ConfigValidationError} 配置验证错误实例
   * 
   * @example
   * ```typescript
   * throw ConfigValidationError.createRangeError('api.port', 1, 65535, 0);
   * ```
   * 
   * @since 1.0.0
   */
  static createRangeError(property: string, min: number, max: number, actualValue: any): ConfigValidationError {
    return new ConfigValidationError(
      `属性 '${property}' 必须在 ${min} 到 ${max} 之间，实际值: ${actualValue}`,
      property,
      'VALUE_OUT_OF_RANGE'
    );
  }

  /**
   * 创建格式错误
   *
   * @description 创建格式验证错误
   * 
   * @param {string} property - 属性路径
   * @param {string} expectedFormat - 期望的格式
   * @param {any} actualValue - 实际值
   * @returns {ConfigValidationError} 配置验证错误实例
   * 
   * @example
   * ```typescript
   * throw ConfigValidationError.createFormatError('api.baseUrl', 'URL', 'invalid-url');
   * ```
   * 
   * @since 1.0.0
   */
  static createFormatError(property: string, expectedFormat: string, actualValue: any): ConfigValidationError {
    return new ConfigValidationError(
      `属性 '${property}' 必须是有效的 ${expectedFormat} 格式，实际值: ${actualValue}`,
      property,
      'INVALID_FORMAT'
    );
  }

  /**
   * 创建枚举值错误
   *
   * @description 创建枚举值验证错误
   * 
   * @param {string} property - 属性路径
   * @param {string[]} allowedValues - 允许的值列表
   * @param {any} actualValue - 实际值
   * @returns {ConfigValidationError} 配置验证错误实例
   * 
   * @example
   * ```typescript
   * throw ConfigValidationError.createEnumError('database.type', ['postgresql', 'mysql'], 'oracle');
   * ```
   * 
   * @since 1.0.0
   */
  static createEnumError(property: string, allowedValues: string[], actualValue: any): ConfigValidationError {
    return new ConfigValidationError(
      `属性 '${property}' 必须是以下值之一: ${allowedValues.join(', ')}，实际值: ${actualValue}`,
      property,
      'INVALID_ENUM_VALUE'
    );
  }

  /**
   * 创建业务规则错误
   *
   * @description 创建业务规则验证错误
   * 
   * @param {string} property - 属性路径
   * @param {string} rule - 业务规则描述
   * @param {any} actualValue - 实际值
   * @returns {ConfigValidationError} 配置验证错误实例
   * 
   * @example
   * ```typescript
   * throw ConfigValidationError.createBusinessRuleError('auth.jwtSecret', 'JWT密钥长度必须至少32位', 'short');
   * ```
   * 
   * @since 1.0.0
   */
  static createBusinessRuleError(property: string, rule: string, actualValue: any): ConfigValidationError {
    return new ConfigValidationError(
      `属性 '${property}' 违反业务规则: ${rule}，实际值: ${actualValue}`,
      property,
      'BUSINESS_RULE_VIOLATION'
    );
  }
}

/**
 * 配置验证错误处理器
 *
 * @description 处理配置验证错误的工具类
 * 提供错误格式化、错误分类和错误处理功能
 *
 * @example
 * ```typescript
 * const errorHandler = new ConfigValidationErrorHandler();
 * 
 * try {
 *   await validateConfig(config);
 * } catch (error) {
 *   const formattedError = errorHandler.formatError(error);
 *   console.error(formattedError);
 * }
 * ```
 *
 * @since 1.0.0
 */
export class ConfigValidationErrorHandler {
  /**
   * 格式化验证错误
   *
   * @description 将验证错误格式化为友好的错误信息
   * 支持多种错误类型的格式化
   * 
   * @param {any} error - 验证错误对象
   * @returns {FormattedError} 格式化后的错误信息
   * 
   * @example
   * ```typescript
   * const formatted = errorHandler.formatError(validationError);
   * console.log(formatted.message);
   * ```
   * 
   * @since 1.0.0
   */
  formatError(error: any): FormattedError {
    if (error instanceof ConfigValidationError) {
      return {
        type: 'ConfigValidationError',
        message: error.message,
        property: error.property,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString(),
        severity: this.getErrorSeverity(error.errorCode),
        suggestions: this.getErrorSuggestions(error.errorCode, error.property)
      };
    }

    if (error.name === 'ValidationError') {
      return {
        type: 'ValidationError',
        message: error.message,
        property: 'unknown',
        errorCode: 'UNKNOWN_VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        severity: 'error',
        suggestions: ['请检查配置格式是否正确']
      };
    }

    return {
      type: 'UnknownError',
      message: error.message || '未知错误',
      property: 'unknown',
      errorCode: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      severity: 'error',
      suggestions: ['请联系技术支持']
    };
  }

  /**
   * 获取错误严重程度
   *
   * @description 根据错误代码确定错误的严重程度
   * 
   * @param {string} errorCode - 错误代码
   * @returns {ErrorSeverity} 错误严重程度
   * 
   * @private
   * 
   * @since 1.0.0
   */
  private getErrorSeverity(errorCode: string): ErrorSeverity {
    const severityMap: Record<string, ErrorSeverity> = {
      'REQUIRED_FIELD_MISSING': 'error',
      'INVALID_TYPE': 'error',
      'VALUE_OUT_OF_RANGE': 'warning',
      'INVALID_FORMAT': 'warning',
      'INVALID_ENUM_VALUE': 'warning',
      'BUSINESS_RULE_VIOLATION': 'error',
      'UNKNOWN_ERROR': 'error'
    };

    return severityMap[errorCode] || 'error';
  }

  /**
   * 获取错误建议
   *
   * @description 根据错误代码和属性提供修复建议
   * 
   * @param {string} errorCode - 错误代码
   * @param {string} property - 属性路径
   * @returns {string[]} 修复建议列表
   * 
   * @private
   * 
   * @since 1.0.0
   */
  private getErrorSuggestions(errorCode: string, property: string): string[] {
    const suggestions: Record<string, string[]> = {
      'REQUIRED_FIELD_MISSING': [
        '请检查配置文件中是否包含该字段',
        '确认字段名称拼写是否正确',
        '检查环境变量是否已设置'
      ],
      'INVALID_TYPE': [
        '请检查数据类型是否正确',
        '确认数值类型字段是否为数字',
        '检查字符串类型字段是否用引号包围'
      ],
      'VALUE_OUT_OF_RANGE': [
        '请检查数值是否在有效范围内',
        '确认端口号是否在1-65535之间',
        '检查超时时间是否合理'
      ],
      'INVALID_FORMAT': [
        '请检查URL格式是否正确',
        '确认邮箱格式是否有效',
        '检查日期格式是否符合要求'
      ],
      'INVALID_ENUM_VALUE': [
        '请检查值是否在允许的选项列表中',
        '确认大小写是否正确',
        '检查是否有拼写错误'
      ],
      'BUSINESS_RULE_VIOLATION': [
        '请检查业务规则要求',
        '确认密码强度是否足够',
        '检查配置是否符合安全要求'
      ]
    };

    return suggestions[errorCode] || ['请检查配置是否正确'];
  }

  /**
   * 批量处理验证错误
   *
   * @description 处理多个验证错误，提供汇总信息
   * 
   * @param {any[]} errors - 错误列表
   * @returns {BatchErrorResult} 批量处理结果
   * 
   * @example
   * ```typescript
   * const result = errorHandler.handleBatchErrors(validationErrors);
   * console.log(`发现 ${result.errorCount} 个错误`);
   * ```
   * 
   * @since 1.0.0
   */
  handleBatchErrors(errors: any[]): BatchErrorResult {
    const formattedErrors = errors.map(error => this.formatError(error));
    const errorCount = formattedErrors.filter(error => error.severity === 'error').length;
    const warningCount = formattedErrors.filter(error => error.severity === 'warning').length;

    return {
      totalErrors: formattedErrors.length,
      errorCount,
      warningCount,
      errors: formattedErrors,
      summary: this.generateErrorSummary(formattedErrors)
    };
  }

  /**
   * 生成错误摘要
   *
   * @description 生成错误处理的摘要信息
   * 
   * @param {FormattedError[]} errors - 格式化的错误列表
   * @returns {string} 错误摘要
   * 
   * @private
   * 
   * @since 1.0.0
   */
  private generateErrorSummary(errors: FormattedError[]): string {
    const errorTypes = errors.reduce((acc, error) => {
      acc[error.errorCode] = (acc[error.errorCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeSummary = Object.entries(errorTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return `发现 ${errors.length} 个配置问题 (${typeSummary})`;
  }
}

/**
 * 格式化错误接口
 *
 * @description 格式化后的错误信息类型定义
 */
export interface FormattedError {
  /** 错误类型 */
  type: string;
  /** 错误消息 */
  message: string;
  /** 错误属性 */
  property: string;
  /** 错误代码 */
  errorCode: string;
  /** 时间戳 */
  timestamp: string;
  /** 错误严重程度 */
  severity: ErrorSeverity;
  /** 修复建议 */
  suggestions: string[];
}

/**
 * 批量错误处理结果接口
 *
 * @description 批量错误处理结果的类型定义
 */
export interface BatchErrorResult {
  /** 总错误数 */
  totalErrors: number;
  /** 错误数量 */
  errorCount: number;
  /** 警告数量 */
  warningCount: number;
  /** 格式化的错误列表 */
  errors: FormattedError[];
  /** 错误摘要 */
  summary: string;
}

/**
 * 错误严重程度类型
 *
 * @description 错误严重程度的枚举类型
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';
