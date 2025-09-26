#!/bin/bash

# 配置模块重构部署脚本
# 用于部署内存配置服务到生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境
check_environment() {
    log_info "检查部署环境..."
    
    # 检查Node.js版本
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_info "Node.js 版本: $NODE_VERSION"
    
    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装"
        exit 1
    fi
    
    PNPM_VERSION=$(pnpm --version)
    log_info "pnpm 版本: $PNPM_VERSION"
    
    # 检查Git
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    log_success "环境检查完成"
}

# 备份现有配置
backup_existing_config() {
    log_info "备份现有配置..."
    
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份现有配置文件
    if [ -f "packages/config/src/lib/config.service.ts" ]; then
        cp "packages/config/src/lib/config.service.ts" "$BACKUP_DIR/"
        log_info "已备份 config.service.ts"
    fi
    
    if [ -f "packages/config/src/lib/config.module.ts" ]; then
        cp "packages/config/src/lib/config.module.ts" "$BACKUP_DIR/"
        log_info "已备份 config.module.ts"
    fi
    
    if [ -f "packages/config/src/index.ts" ]; then
        cp "packages/config/src/index.ts" "$BACKUP_DIR/"
        log_info "已备份 index.ts"
    fi
    
    log_success "配置备份完成: $BACKUP_DIR"
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    
    # 安装项目依赖
    pnpm install
    
    # 安装配置模块依赖
    cd packages/config
    pnpm install
    cd ../..
    
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # 运行配置模块测试
    cd packages/config
    pnpm test
    
    # 运行内存配置测试
    pnpm test src/lib/memory-config/__tests__/
    
    cd ../..
    
    log_success "测试完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 构建配置模块
    pnpm build packages/config
    
    # 构建整个项目
    pnpm build
    
    log_success "项目构建完成"
}

# 验证配置
validate_config() {
    log_info "验证配置..."
    
    # 检查内存配置服务
    if [ ! -f "packages/config/src/lib/memory-config/memory-config.service.ts" ]; then
        log_error "内存配置服务文件不存在"
        exit 1
    fi
    
    # 检查配置类
    if [ ! -f "packages/config/src/lib/memory-config/config-classes/application-memory-config.ts" ]; then
        log_error "应用内存配置类文件不存在"
        exit 1
    fi
    
    # 检查兼容适配器
    if [ ! -f "packages/config/src/lib/memory-config/compatibility-adapter.ts" ]; then
        log_error "兼容适配器文件不存在"
        exit 1
    fi
    
    # 检查混合配置服务
    if [ ! -f "packages/config/src/lib/memory-config/hybrid-config.service.ts" ]; then
        log_error "混合配置服务文件不存在"
        exit 1
    fi
    
    log_success "配置验证完成"
}

# 部署配置
deploy_config() {
    log_info "部署配置..."
    
    # 创建部署目录
    DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$DEPLOY_DIR"
    
    # 复制配置文件
    cp -r packages/config/src/lib/memory-config "$DEPLOY_DIR/"
    cp packages/config/src/lib/config.module.ts "$DEPLOY_DIR/"
    cp packages/config/src/lib/config.service.ts "$DEPLOY_DIR/"
    cp packages/config/src/index.ts "$DEPLOY_DIR/"
    
    # 复制测试文件
    cp -r packages/config/src/lib/memory-config/__tests__ "$DEPLOY_DIR/"
    
    # 复制文档
    cp -r packages/config/src/docs "$DEPLOY_DIR/"
    
    log_success "配置部署完成: $DEPLOY_DIR"
}

# 创建回滚脚本
create_rollback_script() {
    log_info "创建回滚脚本..."
    
    cat > rollback-config-refactoring.sh << 'EOF'
#!/bin/bash

# 配置模块重构回滚脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 回滚配置
rollback_config() {
    log_info "开始回滚配置..."
    
    # 检查备份目录
    BACKUP_DIR=$(ls -t backup-* | head -n 1)
    if [ -z "$BACKUP_DIR" ]; then
        log_error "未找到备份目录"
        exit 1
    fi
    
    log_info "使用备份目录: $BACKUP_DIR"
    
    # 恢复配置文件
    if [ -f "$BACKUP_DIR/config.service.ts" ]; then
        cp "$BACKUP_DIR/config.service.ts" "packages/config/src/lib/"
        log_info "已恢复 config.service.ts"
    fi
    
    if [ -f "$BACKUP_DIR/config.module.ts" ]; then
        cp "$BACKUP_DIR/config.module.ts" "packages/config/src/lib/"
        log_info "已恢复 config.module.ts"
    fi
    
    if [ -f "$BACKUP_DIR/index.ts" ]; then
        cp "$BACKUP_DIR/index.ts" "packages/config/src/"
        log_info "已恢复 index.ts"
    fi
    
    # 删除内存配置相关文件
    rm -rf packages/config/src/lib/memory-config
    rm -rf packages/config/src/lib/memory-config/__tests__
    
    log_success "配置回滚完成"
}

# 重新构建项目
rebuild_project() {
    log_info "重新构建项目..."
    
    pnpm build packages/config
    pnpm build
    
    log_success "项目重新构建完成"
}

# 验证回滚
validate_rollback() {
    log_info "验证回滚..."
    
    # 检查配置文件是否存在
    if [ ! -f "packages/config/src/lib/config.service.ts" ]; then
        log_error "配置文件不存在"
        exit 1
    fi
    
    # 检查内存配置文件是否已删除
    if [ -d "packages/config/src/lib/memory-config" ]; then
        log_warning "内存配置目录仍然存在"
    fi
    
    log_success "回滚验证完成"
}

# 主函数
main() {
    log_info "开始配置模块重构回滚..."
    
    rollback_config
    rebuild_project
    validate_rollback
    
    log_success "配置模块重构回滚完成"
}

# 执行主函数
main "$@"
EOF

    chmod +x rollback-config-refactoring.sh
    log_success "回滚脚本创建完成: rollback-config-refactoring.sh"
}

# 创建监控脚本
create_monitoring_script() {
    log_info "创建监控脚本..."
    
    cat > monitor-config-refactoring.sh << 'EOF'
#!/bin/bash

# 配置模块重构监控脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 监控配置状态
monitor_config_status() {
    log_info "监控配置状态..."
    
    # 检查内存配置服务
    if [ -f "packages/config/src/lib/memory-config/memory-config.service.ts" ]; then
        log_success "内存配置服务存在"
    else
        log_error "内存配置服务不存在"
        return 1
    fi
    
    # 检查配置类
    if [ -f "packages/config/src/lib/memory-config/config-classes/application-memory-config.ts" ]; then
        log_success "应用内存配置类存在"
    else
        log_error "应用内存配置类不存在"
        return 1
    fi
    
    # 检查兼容适配器
    if [ -f "packages/config/src/lib/memory-config/compatibility-adapter.ts" ]; then
        log_success "兼容适配器存在"
    else
        log_error "兼容适配器不存在"
        return 1
    fi
    
    # 检查混合配置服务
    if [ -f "packages/config/src/lib/memory-config/hybrid-config.service.ts" ]; then
        log_success "混合配置服务存在"
    else
        log_error "混合配置服务不存在"
        return 1
    fi
    
    log_success "配置状态监控完成"
}

# 监控性能
monitor_performance() {
    log_info "监控性能..."
    
    # 运行性能测试
    cd packages/config
    pnpm test src/lib/memory-config/__tests__/performance.spec.ts
    cd ../..
    
    log_success "性能监控完成"
}

# 监控测试
monitor_tests() {
    log_info "监控测试..."
    
    # 运行所有测试
    cd packages/config
    pnpm test
    cd ../..
    
    log_success "测试监控完成"
}

# 主函数
main() {
    log_info "开始配置模块重构监控..."
    
    monitor_config_status
    monitor_performance
    monitor_tests
    
    log_success "配置模块重构监控完成"
}

# 执行主函数
main "$@"
EOF

    chmod +x monitor-config-refactoring.sh
    log_success "监控脚本创建完成: monitor-config-refactoring.sh"
}

# 主函数
main() {
    log_info "开始配置模块重构部署..."
    
    check_environment
    backup_existing_config
    install_dependencies
    validate_config
    run_tests
    build_project
    deploy_config
    create_rollback_script
    create_monitoring_script
    
    log_success "配置模块重构部署完成"
    log_info "部署文件: deploy-$(date +%Y%m%d-%H%M%S)"
    log_info "回滚脚本: rollback-config-refactoring.sh"
    log_info "监控脚本: monitor-config-refactoring.sh"
}

# 执行主函数
main "$@"
