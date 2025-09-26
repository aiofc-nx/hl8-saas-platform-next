import { hello } from '@hl8/logger';

/**
 * 配置模块主函数
 * @description 返回配置信息
 * @returns {string} 配置信息字符串
 */
export function config(): string {
  return 'config';
}

/**
 * 调用logger的hello函数
 * @description 调用logger模块的hello函数
 * @returns {void} 无返回值
 */
export function helloConfig(): void {
  hello();
}