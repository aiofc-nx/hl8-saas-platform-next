# TSLint 到 ESLint 规则迁移

## 迁移概述

本文档记录了从 `tslint.json` 到 `eslint.config.mjs` 的规则迁移过程。

## 迁移的规则

### 1. 基础代码质量规则

| TSLint 规则 | ESLint 规则 | 说明 |
|------------|-------------|------|
| `arrow-return-shorthand` | `arrow-body-style: ['error', 'as-needed']` | 箭头函数返回简写 |
| `class-name` | `@typescript-eslint/naming-convention` | 类名命名规范 |
| `forin` | `guard-for-in` | 禁止使用 for...in 循环 |
| `interface-over-type-literal` | `@typescript-eslint/consistent-type-definitions` | 接口优于类型字面量 |
| `member-ordering` | `@typescript-eslint/member-ordering` | 成员排序 |
| `trailing-comma` | `comma-dangle: ['error', 'never']` | 禁止尾随逗号 |

### 2. 禁止规则

| TSLint 规则 | ESLint 规则 | 说明 |
|------------|-------------|------|
| `no-arg` | `prefer-rest-params` | 禁止使用 arguments |
| `no-bitwise` | `no-bitwise` | 禁止位运算 |
| `no-console` | `no-console` | 控制台日志限制 |
| `no-construct` | `no-new` | 禁止使用 new 构造器 |
| `no-debugger` | `no-debugger` | 禁止 debugger |
| `no-duplicate-super` | `no-dupe-class-members` | 禁止重复的 super 调用 |
| `no-empty-interface` | `@typescript-eslint/no-empty-interface` | 空接口 |
| `no-eval` | `no-eval` | 禁止 eval |
| `no-inferrable-types` | `@typescript-eslint/no-inferrable-types` | 禁止可推断的类型 |
| `no-misused-new` | `@typescript-eslint/no-misused-new` | 禁止误用 new |
| `no-non-null-assertion` | `@typescript-eslint/no-non-null-assertion` | 禁止非空断言 |
| `no-shadowed-variable` | `no-shadow`, `@typescript-eslint/no-shadow` | 禁止变量遮蔽 |
| `no-string-literal` | `@typescript-eslint/dot-notation` | 禁止字符串字面量 |
| `no-string-throw` | `no-throw-literal` | 禁止字符串抛出 |
| `no-switch-case-fall-through` | `no-fallthrough` | 禁止 switch case 穿透 |
| `no-unnecessary-initializer` | `@typescript-eslint/no-unnecessary-initializer` | 禁止不必要的初始化 |
| `no-unused-expression` | `no-unused-expressions`, `@typescript-eslint/no-unused-expressions` | 禁止未使用的表达式 |
| `no-var-keyword` | `no-var` | 禁止 var |

### 3. 偏好规则

| TSLint 规则 | ESLint 规则 | 说明 |
|------------|-------------|------|
| `prefer-const` | `prefer-const` | 偏好 const |
| `radix` | `radix` | 要求 radix 参数 |
| `triple-equals` | `eqeqeq: ['error', 'always', { null: 'ignore' }]` | 严格相等 |
| `unified-signatures` | `@typescript-eslint/unified-signatures` | 统一签名 |

### 4. 命名规范

| TSLint 规则 | ESLint 规则 | 说明 |
|------------|-------------|------|
| `variable-name` | `@typescript-eslint/naming-convention` | 变量命名规范 |

### 5. 弃用规则

| TSLint 规则 | ESLint 规则 | 说明 |
|------------|-------------|------|
| `deprecation` | `@typescript-eslint/no-deprecated` | 弃用警告 |

## 移除的规则

以下 Angular 相关规则已移除，因为这是 NestJS 项目：

- `directive-selector`
- `component-selector`
- `no-conflicting-lifecycle`
- `no-host-metadata-property`
- `no-input-rename`
- `no-inputs-metadata-property`
- `no-output-native`
- `no-output-on-prefix`
- `no-output-rename`
- `no-outputs-metadata-property`
- `template-banana-in-box`
- `template-no-negated-async`
- `use-lifecycle-interface`
- `use-pipe-transform-interface`

## 配置验证

迁移后的 ESLint 配置已通过测试，所有规则正常工作：

- ✅ 基础代码质量规则
- ✅ 禁止规则
- ✅ 偏好规则
- ✅ 命名规范
- ✅ 弃用警告

## 注意事项

1. **规则兼容性**: 所有迁移的规则都与现有的 TypeScript 和 NestJS 项目兼容
2. **性能影响**: 新配置不会显著影响 ESLint 运行性能
3. **团队协作**: 确保团队成员了解新的规则配置
4. **逐步迁移**: 建议在团队中逐步启用新规则，避免一次性引入过多变更

## 后续步骤

1. 删除 `tslint.json` 文件
2. 更新项目文档
3. 通知团队成员新的代码规范
4. 在 CI/CD 中验证新规则
