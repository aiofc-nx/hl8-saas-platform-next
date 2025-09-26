# 常用命令

## 创建lib项目

```bash
pnpm exec nx generate @nx/js:library --directory=packages/config --importPath=@hl8/config --linter=eslint --name=config --unitTestRunner=jest --tags=scope:lib,type:lib --useProjectJson=true --no-interactive 
```

## pnpm

### 5. 依赖优化技巧

#### **安装优化**

```bash
# 清理缓存
pnpm store prune

# 重新安装依赖
pnpm install --frozen-lockfile

# 检查依赖完整性
pnpm audit
```
