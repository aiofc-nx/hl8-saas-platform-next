#!/bin/bash

# 配置模块测试运行脚本
# 用于运行所有配置模块相关的测试

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

# 运行单元测试
run_unit_tests() {
    log_info "运行单元测试..."
    
    # 运行内存配置服务测试
    log_info "运行内存配置服务测试..."
    pnpm test src/lib/memory-config/__tests__/memory-config.service.spec.ts
    
    # 运行兼容适配器测试
    log_info "运行兼容适配器测试..."
    pnpm test src/lib/memory-config/__tests__/compatibility-adapter.spec.ts
    
    log_success "单元测试完成"
}

# 运行性能测试
run_performance_tests() {
    log_info "运行性能测试..."
    
    # 运行性能测试
    pnpm test src/lib/memory-config/__tests__/performance.spec.ts
    
    log_success "性能测试完成"
}

# 运行集成测试
run_integration_tests() {
    log_info "运行集成测试..."
    
    # 运行集成测试
    pnpm test src/lib/memory-config/__tests__/integration.spec.ts
    
    log_success "集成测试完成"
}

# 运行端到端测试
run_e2e_tests() {
    log_info "运行端到端测试..."
    
    # 运行端到端测试
    pnpm test src/lib/memory-config/__tests__/e2e.spec.ts
    
    log_success "端到端测试完成"
}

# 运行所有测试
run_all_tests() {
    log_info "运行所有测试..."
    
    # 运行所有配置模块测试
    pnpm test src/lib/memory-config/__tests__/
    
    log_success "所有测试完成"
}

# 生成测试报告
generate_test_report() {
    log_info "生成测试报告..."
    
    # 创建测试报告目录
    REPORT_DIR="test-reports-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$REPORT_DIR"
    
    # 运行测试并生成报告
    pnpm test --coverage --coverageReporters=text --coverageReporters=html --coverageDirectory="$REPORT_DIR/coverage"
    
    log_success "测试报告生成完成: $REPORT_DIR"
}

# 检查测试覆盖率
check_test_coverage() {
    log_info "检查测试覆盖率..."
    
    # 运行覆盖率测试
    pnpm test --coverage --coverageReporters=text-summary
    
    log_success "测试覆盖率检查完成"
}

# 主函数
main() {
    log_info "开始配置模块测试..."
    
    # 检查参数
    case "${1:-all}" in
        "unit")
            run_unit_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "all")
            run_all_tests
            ;;
        "report")
            generate_test_report
            ;;
        "coverage")
            check_test_coverage
            ;;
        *)
            log_error "未知测试类型: $1"
            log_info "可用选项: unit, performance, integration, e2e, all, report, coverage"
            exit 1
            ;;
    esac
    
    log_success "配置模块测试完成"
}

# 执行主函数
main "$@"
