# 工人按需结算系统 (Worker On-Demand Settlement System)

## 概述 (Overview)

此系统允许日结工人随时请求结算未付薪资，支持跨月结算。每个工作日志只能被结算一次，确保不会重复支付。

This system allows piece-rate workers to request settlement at any time, supporting cross-month settlements. Each work log can only be settled once to prevent duplicate payments.

## 功能特点 (Features)

✅ **跨月结算** - 支持结算跨越多个自然月的工作日志
✅ **防重复支付** - 每个工作日志只能被结算一次
✅ **自动计算** - 自动计算EPF、SOCSO、EIS、PCB等法定扣除
✅ **完整记录** - 记录每次结算的详细信息和支付状态
✅ **灵活查询** - 可查询工人的结算历史和未结算工作日志

## 数据库表结构 (Database Tables)

### 1. worker_settlements
记录每次结算的详细信息

```sql
- id: 结算记录ID
- worker_id: 工人ID
- settlement_date: 结算日期
- from_date: 工作日志起始日期
- to_date: 工作日志结束日期
- total_tons: 总吨数（日结工人）
- gross_pay: 总薪资（扣除前）
- total_deductions: 总扣除额
- net_pay: 净薪资（扣除后）
- epf_employee/employer: EPF员工/雇主部分
- socso_employee/employer: SOCSO员工/雇主部分
- eis_employee/employer: EIS员工/雇主部分
- pcb_mtd: 个人所得税
- payment_status: 支付状态 (pending/paid/cancelled)
- payment_method: 支付方式
- notes: 备注
```

### 2. settlement_work_logs
关联工作日志到结算记录

```sql
- settlement_id: 结算记录ID
- work_log_id: 工作日志ID（唯一，防止重复结算）
- log_date: 工作日期
- amount: 该工作日志的金额
```

## API接口 (API Endpoints)

### 1. 查询未结算工作日志
**GET** `/api/api_get_worker_unsettled_logs.php?worker_id=123`

返回指定工人所有未结算的工作日志

**响应示例:**
```json
{
  "worker": {
    "id": 116,
    "name": "Nguyen Van Thang",
    "type": "Foreign"
  },
  "unsettled_logs": [
    {
      "id": 100,
      "log_date": "2025-09-02",
      "customer_name": "ABC Company",
      "tons": 7.00,
      "rate_per_ton": 60.00,
      "amount": 420.00
    }
  ],
  "summary": {
    "count": 57,
    "total_tons": 358.10,
    "total_amount": 20093.70,
    "from_date": "2025-09-02",
    "to_date": "2025-11-29"
  }
}
```

### 2. 创建工人结算
**POST** `/api/api_worker_settlement.php`

为指定工人创建结算记录

**请求体:**
```json
{
  "worker_id": 116,
  "settlement_date": "2025-11-22",
  "payment_method": "Cash",
  "notes": "Weekly settlement"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "Settlement created successfully",
  "settlement": {
    "id": 1,
    "worker_id": 116,
    "worker_name": "Nguyen Van Thang",
    "worker_type": "Foreign",
    "settlement_date": "2025-11-22",
    "from_date": "2025-09-02",
    "to_date": "2025-11-29",
    "total_tons": 358.10,
    "gross_pay": 20093.70,
    "net_pay": 20093.70,
    "epf_employee": 0.00,
    "epf_employer": 0.00,
    "socso_employee": 0.00,
    "socso_employer": 61.55,
    "eis_employee": 0.00,
    "eis_employer": 0.00,
    "pcb_mtd": 0.00,
    "total_deductions": 0.00,
    "work_logs_count": 57,
    "work_logs": [...]
  }
}
```

### 3. 查询结算历史
**GET** `/api/api_get_worker_settlements.php?worker_id=123&limit=50&status=pending`

查询工人的结算历史记录

**参数:**
- `worker_id` (可选): 工人ID
- `limit` (可选, 默认50): 返回记录数量
- `status` (可选): 支付状态 (pending/paid/cancelled)

**响应示例:**
```json
[
  {
    "id": 1,
    "worker_id": 116,
    "worker_name": "Nguyen Van Thang",
    "worker_type": "Foreign",
    "settlement_date": "2025-11-22",
    "from_date": "2025-09-02",
    "to_date": "2025-11-29",
    "gross_pay": 20093.70,
    "net_pay": 20093.70,
    "payment_status": "pending",
    "work_logs_count": 57,
    "created_at": "2025-11-22 08:28:07"
  }
]
```

## 使用流程 (Usage Flow)

### 步骤 1: 查询未结算工作日志
```bash
GET /api/api_get_worker_unsettled_logs.php?worker_id=116
```

确认工人有未结算的工作日志

### 步骤 2: 创建结算
```bash
POST /api/api_worker_settlement.php
Content-Type: application/json

{
  "worker_id": 116,
  "settlement_date": "2025-11-22",
  "payment_method": "Cash"
}
```

系统会：
1. 查找该工人所有未结算的工作日志
2. 计算总金额和法定扣除
3. 创建结算记录
4. 将工作日志标记为已结算（通过settlement_work_logs表）
5. 返回结算详情

### 步骤 3: 查看结算历史
```bash
GET /api/api_get_worker_settlements.php?worker_id=116
```

查看该工人的所有结算记录

## 计算规则 (Calculation Rules)

### Local Worker (本地工人)
- **EPF员工**: gross_pay × 11%
- **EPF雇主**: gross_pay × 13% (年龄<60) 或 4% (年龄≥60)
- **SOCSO**: 根据gross_pay查表
- **EIS**: 根据gross_pay查表
- **PCB**: 简化计算（应使用完整PCB表）

### Foreign Worker (外籍工人)
- **SOCSO雇主**: 根据gross_pay查表（仅雇主承担）
- 无EPF、EIS、PCB扣除

## 测试示例 (Testing Examples)

### 测试脚本
```bash
# 1. 查看测试数据
php api/test_settlement.php

# 2. 创建测试结算
php api/test_create_settlement.php

# 3. 查询结算记录
mysql -u root easisawit_db -e "SELECT * FROM worker_settlements;"
```

### 验证结果
```sql
-- 检查结算记录
SELECT * FROM worker_settlements WHERE id = 1;

-- 检查关联的工作日志
SELECT COUNT(*), SUM(amount)
FROM settlement_work_logs
WHERE settlement_id = 1;

-- 查询工人的未结算工作日志
SELECT COUNT(*)
FROM work_logs wl
WHERE wl.worker_id = 116
  AND wl.id NOT IN (SELECT work_log_id FROM settlement_work_logs);
```

## 跨月结算示例 (Cross-Month Settlement Example)

**场景**: 工人在9月、10月、11月都有工作，在11月22日请求结算

**结果**:
- Settlement ID: 1
- 工作日期范围: 2025-09-02 至 2025-11-29 (跨3个月)
- 工作日志数量: 57条
- 总吨数: 358.10吨
- 总薪资: RM 20,093.70

**优点**:
✅ 系统自动处理跨月计算
✅ 不受自然月份限制
✅ 所有未结算工作日志一次性结清
✅ 防止重复支付

## 注意事项 (Important Notes)

1. **唯一性约束**: 每个work_log只能被结算一次（settlement_work_logs表有唯一约束）
2. **事务处理**: 所有结算操作在事务中完成，确保数据一致性
3. **状态管理**: 支持pending/paid/cancelled三种状态
4. **审计追踪**: 所有结算记录保留created_at和paid_at时间戳

## 后续开发 (Future Development)

- [ ] 前端界面集成
- [ ] 支付状态更新API
- [ ] PDF结算单生成
- [ ] 批量结算功能
- [ ] 结算撤销功能（仅pending状态）
- [ ] 银行转账集成

## 技术支持 (Support)

如有问题，请查看:
- API文件: `/api/api_worker_settlement.php`
- 数据库迁移: `/api/migrations_worker_settlement.sql`
- 测试脚本: `/api/test_settlement.php`
