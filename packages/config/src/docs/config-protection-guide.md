# 配置保护指南

## 🎯 问题背景

应用在运行过程中，环境变量可能被意外修改，这会导致：

- **配置不一致**：运行时的实际配置与期望配置不符
- **服务中断**：关键配置变更可能导致服务不可用
- **安全风险**：敏感配置的意外暴露
- **调试困难**：配置问题难以追踪

## 🛡️ 解决方案

### 1. 配置监控服务 (ConfigMonitorService)

**功能**：

- 监控关键环境变量的变化
- 检测配置文件的修改
- 提供配置变更通知
- 支持配置热重载

**使用示例**：

```typescript
import { ConfigMonitorService } from '@hl8/config';

const configMonitor = new ConfigMonitorService();

// 启动监控
await configMonitor.startMonitoring(30000); // 每30秒检查一次

// 注册变更回调
configMonitor.onConfigChange((changes) => {
  console.log('配置已变更:', changes);
});
```

### 2. 配置保护服务 (ConfigProtectionService)

**功能**：

- 锁定关键配置项，防止意外修改
- 验证配置变更的合法性
- 记录配置变更历史
- 提供安全建议

**使用示例**：

```typescript
import { ConfigProtectionService } from '@hl8/config';

const configProtection = new ConfigProtectionService();

// 锁定关键配置
await configProtection.lockCriticalConfigs();

// 验证配置变更
const result = await configProtection.validateConfigChange(
  'DB_PASSWORD',
  'newPassword123!',
  'oldPassword'
);

if (!result.isValid) {
  console.error('配置变更验证失败:', result.errors);
}
```

### 3. 配置恢复服务 (ConfigRecoveryService)

**功能**：

- 自动备份关键配置
- 检测配置异常并自动恢复
- 支持手动回滚到指定备份
- 提供恢复操作历史

**使用示例**：

```typescript
import { ConfigRecoveryService } from '@hl8/config';

const configRecovery = new ConfigRecoveryService();

// 创建备份
await configRecovery.createBackup('initial', '应用启动时的配置');

// 恢复配置
const result = await configRecovery.restoreConfig('initial');

// 自动恢复
const autoResult = await configRecovery.autoRecover();
```

## 🔧 完整配置保护设置

### 应用启动时设置

```typescript
import { 
  ConfigMonitorService, 
  ConfigProtectionService, 
  ConfigRecoveryService 
} from '@hl8/config';

export class AppConfigProtection {
  private configMonitor: ConfigMonitorService;
  private configProtection: ConfigProtectionService;
  private configRecovery: ConfigRecoveryService;

  constructor() {
    this.configMonitor = new ConfigMonitorService();
    this.configProtection = new ConfigProtectionService();
    this.configRecovery = new ConfigRecoveryService();
  }

  async setupProtection(): Promise<void> {
    // 1. 创建初始备份
    await this.configRecovery.createBackup(
      'initial', 
      '应用启动时的初始配置'
    );

    // 2. 锁定关键配置
    await this.configProtection.lockCriticalConfigs();

    // 3. 启动配置监控
    await this.configMonitor.startMonitoring(30000);

    // 4. 注册变更回调
    this.configMonitor.onConfigChange((changes) => {
      this.handleConfigChanges(changes);
    });

    // 5. 设置自动恢复
    this.configRecovery.setAutoRecovery({
      enabled: true,
      maxRetries: 3,
      retryInterval: 5000,
      validationTimeout: 10000
    });
  }

  private async handleConfigChanges(changes: any): Promise<void> {
    // 处理关键配置变更
    if (changes.criticalChanges.length > 0) {
      console.error('关键配置被修改:', changes.criticalChanges);
      
      // 尝试自动恢复
      const recoveryResult = await this.configRecovery.autoRecover();
      
      if (!recoveryResult.recovered) {
        console.error('自动恢复失败，需要手动干预');
      }
    }
  }
}
```

## 📋 最佳实践

### 1. 分层保护策略

**关键配置**（必须锁定）：

- `DB_PASSWORD` - 数据库密码
- `JWT_SECRET` - JWT密钥
- `REDIS_PASSWORD` - Redis密码

**重要配置**（建议锁定）：

- `DB_HOST` - 数据库主机
- `API_PORT` - API端口
- `NODE_ENV` - 运行环境

**一般配置**（可动态修改）：

- `LOG_LEVEL` - 日志级别
- `CACHE_TTL` - 缓存时间

### 2. 环境特定设置

**生产环境**：

```typescript
// 严格保护
await configProtection.lockCriticalConfigs();
configMonitor.startMonitoring(60000); // 1分钟检查一次
```

**开发环境**：

```typescript
// 宽松保护
await configProtection.lockCriticalConfigs(['DB_PASSWORD', 'JWT_SECRET']);
configMonitor.startMonitoring(30000); // 30秒检查一次
```

**测试环境**：

```typescript
// 中等保护
await configProtection.lockCriticalConfigs();
configMonitor.startMonitoring(45000); // 45秒检查一次
```

### 3. 监控和告警

```typescript
// 配置变更告警
configMonitor.onConfigChange((changes) => {
  if (changes.criticalChanges.length > 0) {
    // 发送告警通知
    this.sendAlert({
      type: 'CRITICAL_CONFIG_CHANGE',
      changes: changes.criticalChanges,
      timestamp: changes.timestamp
    });
  }
});
```

### 4. 备份策略

```typescript
// 定期创建备份
setInterval(async () => {
  await configRecovery.createBackup(
    `backup-${Date.now()}`,
    '定期自动备份'
  );
}, 24 * 60 * 60 * 1000); // 每24小时备份一次
```

## 🚨 应急处理

### 1. 配置被意外修改

**自动处理**：

```typescript
// 配置监控会自动检测并尝试恢复
const recoveryResult = await configRecovery.autoRecover();
```

**手动处理**：

```typescript
// 查看可用备份
const backups = configRecovery.getAvailableBackups();

// 手动恢复到指定备份
const result = await configRecovery.restoreConfig('initial');
```

### 2. 配置验证失败

**检查配置状态**：

```typescript
const status = configProtection.getLockStatus();
const advice = configProtection.getSecurityAdvice();
```

**强制恢复**：

```typescript
// 恢复到最近的备份
const recentBackups = configRecovery.getAvailableBackups().slice(0, 3);
for (const backup of recentBackups) {
  const result = await configRecovery.restoreConfig(backup.name);
  if (result.success) break;
}
```

### 3. 服务不可用

**紧急恢复**：

```typescript
// 1. 停止所有监控
configMonitor.stopMonitoring();

// 2. 解锁所有配置
await configProtection.unlockConfigs(
  Array.from(configProtection.getLockStatus().lockedConfigs)
);

// 3. 恢复到初始配置
await configRecovery.restoreConfig('initial', false);
```

## 📊 监控指标

### 配置健康度指标

```typescript
// 获取配置状态
const monitorStatus = configMonitor.getStatus();
const lockStatus = configProtection.getLockStatus();
const recoveryHistory = configRecovery.getRecoveryHistory(10);

// 计算健康度
const healthScore = calculateConfigHealth({
  monitorStatus,
  lockStatus,
  recoveryHistory
});
```

### 告警规则

```typescript
// 配置变更告警
if (changes.criticalChanges.length > 0) {
  alert('CRITICAL_CONFIG_CHANGE');
}

// 配置验证失败告警
if (!validationResult.isValid) {
  alert('CONFIG_VALIDATION_FAILED');
}

// 自动恢复失败告警
if (!recoveryResult.recovered) {
  alert('AUTO_RECOVERY_FAILED');
}
```

## 🔍 故障排查

### 1. 配置问题诊断

```typescript
// 检查配置状态
const status = configMonitor.getStatus();
const lockStatus = configProtection.getLockStatus();
const advice = configProtection.getSecurityAdvice();

// 查看变更历史
const changeHistory = configProtection.getChangeHistory(20);
const recoveryHistory = configRecovery.getRecoveryHistory(10);
```

### 2. 日志分析

```typescript
// 配置变更日志
configMonitor.onConfigChange((changes) => {
  logger.info('配置变更', {
    timestamp: changes.timestamp,
    changes: changes.changes,
    criticalChanges: changes.criticalChanges
  });
});
```

### 3. 性能监控

```typescript
// 监控配置检查性能
const startTime = Date.now();
await configMonitor.forceCheck();
const duration = Date.now() - startTime;

if (duration > 5000) {
  logger.warn('配置检查耗时过长', { duration });
}
```

## 📚 总结

通过配置监控、保护和恢复机制，我们可以：

1. **预防问题**：锁定关键配置，防止意外修改
2. **及时发现问题**：实时监控配置变化
3. **快速恢复**：自动或手动恢复到有效配置
4. **审计追踪**：记录所有配置变更历史

这套机制确保了应用运行过程中配置的稳定性和安全性，大大降低了因配置问题导致的服务中断风险。
