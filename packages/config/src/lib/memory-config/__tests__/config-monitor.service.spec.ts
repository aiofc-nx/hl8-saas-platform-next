import { Test, TestingModule } from '@nestjs/testing';
import { ConfigMonitorService } from '../config-monitor.service';
import { MemoryConfigService } from '../memory-config.service';
import { ConfigCompatibilityAdapter } from '../compatibility-adapter';
import { HybridConfigService } from '../hybrid-config.service';

describe('ConfigMonitorService', () => {
  let service: ConfigMonitorService;
  let memoryConfigService: MemoryConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigMonitorService,
        MemoryConfigService,
        ConfigCompatibilityAdapter,
        HybridConfigService,
      ],
    }).compile();

    service = module.get<ConfigMonitorService>(ConfigMonitorService);
    memoryConfigService = module.get<MemoryConfigService>(MemoryConfigService);

    // 确保配置服务正确初始化
    await memoryConfigService.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkConfigHealth', () => {
    it('should check configuration health', async () => {
      const result = await service.checkConfigHealth();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isHealthy');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('memoryStatus');
      expect(result).toHaveProperty('configIntegrity');
      expect(result).toHaveProperty('configConsistency');
      expect(result).toHaveProperty('performanceHealth');
      expect(typeof result.isHealthy).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should detect configuration issues', async () => {
      // 模拟配置问题 - 设置无效的API端口
      const originalPort = process.env.API_PORT;
      process.env.API_PORT = '0'; // 无效端口
      
      try {
        await memoryConfigService.reloadConfig();
        const result = await service.checkConfigHealth();
        
        expect(result.isHealthy).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      } finally {
        // 恢复环境变量
        if (originalPort !== undefined) {
          process.env.API_PORT = originalPort;
        } else {
          delete process.env.API_PORT;
        }
        await memoryConfigService.reloadConfig();
      }
    });

    it('should return healthy status for valid configuration', async () => {
      const result = await service.checkConfigHealth();
      
      // 在测试环境中，配置应该是健康的
      expect(result.isHealthy).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      // 模拟内存配置服务抛出错误
      jest.spyOn(memoryConfigService, 'getConfigStatus').mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await service.checkConfigHealth();
      
      expect(result.isHealthy).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('Test error');
    });
  });

  describe('recordPerformanceMetric', () => {
    it('should record performance metrics', () => {
      const responseTime = 5.2;
      const requestCount = 100;

      expect(() => {
        service.recordPerformanceMetric(responseTime, requestCount);
      }).not.toThrow();

      const metrics = service.getPerformanceMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].responseTime).toBe(responseTime);
      expect(metrics[0].requestCount).toBe(requestCount);
    });

    it('should record performance metrics with default request count', () => {
      const responseTime = 3.1;

      expect(() => {
        service.recordPerformanceMetric(responseTime);
      }).not.toThrow();

      const metrics = service.getPerformanceMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].responseTime).toBe(responseTime);
      expect(metrics[0].requestCount).toBe(1);
    });

    it('should limit performance metrics history', () => {
      // 记录大量指标
      for (let i = 0; i < 1500; i++) {
        service.recordPerformanceMetric(i, 1);
      }

      const metrics = service.getPerformanceMetrics();
      expect(metrics.length).toBeLessThanOrEqual(500); // 应该被限制在500条
    });
  });

  describe('getPerformanceMetrics', () => {
    beforeEach(() => {
      // 清空之前的指标
      for (let i = 0; i < 10; i++) {
        service.recordPerformanceMetric(i * 10, i + 1);
      }
    });

    it('should get performance metrics with default limit', () => {
      const metrics = service.getPerformanceMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeLessThanOrEqual(100); // 默认限制
    });

    it('should get performance metrics with custom limit', () => {
      const limit = 5;
      const metrics = service.getPerformanceMetrics(limit);
      
      expect(metrics).toHaveLength(limit);
    });

    it('should return metrics in reverse chronological order', () => {
      const metrics = service.getPerformanceMetrics(3);
      
      if (metrics.length >= 2) {
        expect(new Date(metrics[0].timestamp).getTime()).toBeGreaterThan(new Date(metrics[1].timestamp).getTime());
      }
    });
  });

  describe('getHealthCheckHistory', () => {
    beforeEach(async () => {
      // 执行几次健康检查以生成历史记录
      await service.checkConfigHealth();
      await service.checkConfigHealth();
    });

    it('should get health check history with default limit', () => {
      const history = service.getHealthCheckHistory();
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeLessThanOrEqual(50); // 默认限制
    });

    it('should get health check history with custom limit', () => {
      const limit = 2;
      const history = service.getHealthCheckHistory(limit);
      
      expect(history).toHaveLength(limit);
    });

    it('should return history in reverse chronological order', () => {
      const history = service.getHealthCheckHistory(3);
      
      if (history.length >= 2) {
        expect(new Date(history[0].timestamp).getTime()).toBeGreaterThan(new Date(history[1].timestamp).getTime());
      }
    });
  });

  describe('getMonitoringSummary', () => {
    beforeEach(async () => {
      // 记录一些性能指标
      service.recordPerformanceMetric(5.0, 10);
      service.recordPerformanceMetric(3.0, 20);
      
      // 执行健康检查
      await service.checkConfigHealth();
    });

    it('should get monitoring summary', () => {
      const summary = service.getMonitoringSummary();
      
      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('healthRate');
      expect(summary).toHaveProperty('averageResponseTime');
      expect(summary).toHaveProperty('totalRequests');
      expect(summary).toHaveProperty('totalHealthChecks');
      expect(summary).toHaveProperty('totalPerformanceMetrics');
      expect(summary).toHaveProperty('memoryUsage');
      
      expect(typeof summary.healthRate).toBe('number');
      expect(typeof summary.averageResponseTime).toBe('number');
      expect(typeof summary.totalRequests).toBe('number');
      expect(typeof summary.totalHealthChecks).toBe('number');
      expect(typeof summary.totalPerformanceMetrics).toBe('number');
      expect(typeof summary.memoryUsage).toBe('number');
    });

    it('should calculate correct health rate', () => {
      const summary = service.getMonitoringSummary();
      
      expect(summary.healthRate).toBeGreaterThanOrEqual(0);
      expect(summary.healthRate).toBeLessThanOrEqual(100);
    });

    it('should calculate correct average response time', () => {
      const summary = service.getMonitoringSummary();
      
      expect(summary.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle errors in checkConfigHealth', async () => {
      // 模拟内存配置服务抛出错误
      jest.spyOn(memoryConfigService, 'getApiConfig').mockImplementation(() => {
        throw new Error('API config error');
      });

      const result = await service.checkConfigHealth();
      
      expect(result.isHealthy).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.includes('API config error'))).toBe(true);
    });

    it('should handle errors in performance health check', async () => {
      // 模拟性能检查错误
      jest.spyOn(service as any, 'checkPerformanceHealth').mockImplementation(() => {
        throw new Error('Performance check error');
      });

      const result = await service.checkConfigHealth();
      
      expect(result.isHealthy).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('performance metrics edge cases', () => {
    it('should handle zero performance metrics', () => {
      const summary = service.getMonitoringSummary();
      
      expect(summary.averageResponseTime).toBe(0);
      expect(summary.totalRequests).toBe(0);
    });

    it('should handle negative response times gracefully', () => {
      service.recordPerformanceMetric(-1, 1);
      
      const metrics = service.getPerformanceMetrics(1);
      expect(metrics[0].responseTime).toBe(-1);
    });

    it('should handle very large response times', () => {
      const largeTime = 999999;
      service.recordPerformanceMetric(largeTime, 1);
      
      const metrics = service.getPerformanceMetrics(1);
      expect(metrics[0].responseTime).toBe(largeTime);
    });
  });

  describe('memory usage tracking', () => {
    it('should track memory usage in performance metrics', () => {
      service.recordPerformanceMetric(5.0, 10);
      
      const metrics = service.getPerformanceMetrics(1);
      expect(metrics[0].memoryUsage).toBeGreaterThan(0);
      expect(typeof metrics[0].memoryUsage).toBe('number');
    });

    it('should include memory usage in monitoring summary', () => {
      const summary = service.getMonitoringSummary();
      
      expect(summary.memoryUsage).toBeGreaterThan(0);
      expect(typeof summary.memoryUsage).toBe('number');
    });
  });
});
