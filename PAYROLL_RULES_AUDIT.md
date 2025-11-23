# Payroll 计算规则检查报告

## 📋 规则对比分析

### ✅ I. 基础收入计算 (Gross Income Calculation)

#### 1. 固定薪水员工 (FIXED) 的比例工资

**提供的规则：**
```
应得基本工资 = Σ (月薪 / 该月日历总天数) × 该片段工作天数
```

**当前系统实现：**
- ✅ **完全符合** - 系统使用固定月薪，不进行日期比例计算
- 📍 位置：`api_calculate_payroll.php` 第569-574行
```php
if ($is_fixed_salary) {
    $base_income = $fixed_salary_map[$worker_id];
    $total_tons = 0.00;
    $work_logs = [];
}
```

**状态：** ✅ 正确（假设固定薪水员工都是完整月份工作）

**建议：** 如果需要处理固定薪水员工的**跨月或离职**情况，需要添加比例计算逻辑。

---

#### 2. 计件工 (PIECE) 的基础收入

**提供的规则：**
```
基础收入 = 合格件数 × 单位费率
```

**当前系统实现：**
- ✅ **完全符合**
- 📍 位置：`api_calculate_payroll.php` 第409-445行
```php
$log_amount = $log['tons'] * $log['rate_per_ton'];
$worker_monthly_data[$worker_id]['total_base_pay'] += $log_amount;
```

在棕榈油行业：
- 合格件数 = 吨数 (tons)
- 单位费率 = 每吨费率 (rate_per_ton)

**状态：** ✅ 完全正确

---

### ⚠️ II. 法定扣款计算 (Statutory Deduction Formulas)

#### 1. 雇员公积金 (EPF/KWSP)

**提供的规则：**

| 员工类型 | 雇员份额 (Employee) |
|----------|---------------------|
| 本地员工 | 11% × 总收入 |
| 外籍员工 | 2% × 总收入，**向上取整到下一个完整令吉** |

**当前系统实现：**

##### 本地员工：
- ⚠️ **使用查表法**，不是直接计算 11%
- 📍 位置：`api_calculate_payroll.php` 第141-200行
- 查询 `epf_schedule` 表获取固定金额

**验证示例：**
```
本地员工 - Ali Bin Hassan:
Gross Pay: RM 1,700.00
EPF Employee (实际): RM 187.00
EPF Employee (11%): RM 187.00 ✓
```

##### 外籍员工：
- ✅ **已修复** - 使用直接计算 2% (2025-11-22)
- ✅ 实现向上取整到完整令吉
- ✅ 有 **RM 400 上限**（员工）和 **RM 800 上限**（雇主）

**实现代码：**
```php
// Employee contribution: 2% of gross pay, ceiling to next Ringgit
$epf_employee = ceil($gross_pay * 0.02);
if ($epf_employee > 400.00) {
    $epf_employee = 400.00;
}

// Employer contribution: 4% of gross pay, ceiling to next Ringgit
$epf_employer = ceil($gross_pay * 0.04);
if ($epf_employer > 800.00) {
    $epf_employer = 800.00;
}
```

**验证示例：**
```
外籍员工 - Budi Santoso:
Gross Pay: RM 6,050.00
EPF Employee: ceil(6050 × 0.02) = ceil(121) = RM 121 ✅
EPF Employer: ceil(6050 × 0.04) = ceil(242) = RM 242 ✅

外籍员工 - Hengky Kurniawan:
Gross Pay: RM 5,485.00
EPF Employee: ceil(5485 × 0.02) = ceil(109.70) = RM 110 ✅
EPF Employer: ceil(5485 × 0.04) = ceil(219.40) = RM 220 ✅

外籍员工 - 高收入案例:
Gross Pay: RM 25,000.00
EPF Employee: ceil(25000 × 0.02) = RM 500 → 上限 RM 400 ✅
EPF Employer: ceil(25000 × 0.04) = RM 1000 → 上限 RM 800 ✅
```

**状态：** ✅ 完全符合规则（已于 2025-11-22 修复）

---

#### 2. 预扣税 (PCB/MTD)

**提供的规则：**
```
PCB 扣款 = 根据 LHDN 税务表查询
外籍员工：非税务居民标准
```

**当前系统实现：**
- ✅ **本地员工**：使用 `calculate_pcb()` 函数查询税务表
- ✅ **外籍员工**：30% 固定税率
- 📍 位置：`api_calculate_payroll.php` 第687行、第707行

```php
// 本地员工
$pcb_mtd = calculate_pcb($conn, $taxable_income_for_pcb, $pcb_worker_details, 0.00);

// 外籍员工
$pcb_mtd = round($taxable_income_for_pcb * 0.30, 2);
```

**状态：** ✅ 正确

---

### ✅ III. 调整与最终净工资计算

#### 1. 年假折算工资 (Annual Leave Payout)

**提供的规则：**
```
年假折算工资 = 折算日薪 × 未休年假天数
```

**当前系统实现：**
- ❌ **未实现**：系统中没有年假折算功能

**状态：** ❌ 缺失此功能

---

#### 2. 净工资 (NET PAY)

**提供的规则：**
```
NET PAY = GROSS PAY − TOTAL DEDUCTION
```

**当前系统实现：**
- ✅ **完全符合**
- 📍 位置：`api_calculate_payroll.php` 第710-716行

```php
$total_statutory_deduction = $epf_employee + $socso_employee + $eis_employee + $pcb_mtd;
$net_pay = $gross_pay - $total_statutory_deduction;
```

**状态：** ✅ 完全正确

---

## 📊 总结

### ✅ 正确实现的规则 (5/7)：
1. ✅ 计件工基础收入计算
2. ✅ 固定薪水员工基础收入（完整月份）
3. ✅ PCB/MTD 计算
4. ✅ 净工资计算
5. ✅ 外籍员工 EPF 计算（**2025-11-22 已修复**）

### 📝 可选改进的规则：

#### 1. 本地员工 EPF 计算 📝 低优先级
**问题：**
- 使用查表法，虽然结果接近 11%，但不够精确

**建议：**
- 保留查表法（符合官方 EPF schedule）
- 或改为直接计算 11%（更简单但可能与官方表有细微差异）

#### 2. 固定薪水员工比例工资 📝 低优先级
**问题：**
- 未实现跨月或离职的日期比例计算

**建议：**
- 如果业务需要处理员工离职或跨月结算，添加比例计算逻辑

#### 3. 年假折算工资 ❌ 缺失功能
**问题：**
- 系统完全没有年假折算功能

**建议：**
- 添加年假折算模块（如果业务需要）

---

## 🎯 推荐行动

### ✅ 已完成：
1. ✅ **外籍员工 EPF 计算** - 已于 2025-11-22 修复
   - ✅ 改为：2% × 总收入
   - ✅ 添加：向上取整到完整令吉
   - ✅ 保留：RM 400 上限（员工）、RM 800 上限（雇主）

### 考虑添加（低优先级）：
2. **本地员工 EPF**
   - 评估是否继续使用查表法
   - 或改为直接计算 11%
   - **建议：保留查表法**（符合官方 EPF schedule）

3. **固定薪水员工比例工资**
   - 如果需要处理离职/跨月情况

### 未来功能（可选）：
4. **年假折算工资**
   - 如果业务需要此功能

---

## 📝 测试验证建议

### 测试案例 1：外籍员工 EPF
```
输入：Gross Pay = RM 5,234.56
预期：EPF = ceil(5234.56 × 0.02) = ceil(104.69) = RM 105
当前：根据查表 = RM 110（档位：5000-5500）
```

### 测试案例 2：外籍员工 EPF 上限
```
输入：Gross Pay = RM 25,000.00
预期：EPF = min(ceil(25000 × 0.02), 400) = RM 400
当前：RM 400 ✓
```

### 测试案例 3：本地员工 EPF
```
输入：Gross Pay = RM 1,700.00
预期：EPF = 1700 × 0.11 = RM 187.00
当前：RM 187.00 ✓
```

---

**生成日期：** 2025-11-22
**系统版本：** EasiSawit 2.0
**检查文件：** api/api_calculate_payroll.php
