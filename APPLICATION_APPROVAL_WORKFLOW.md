# Application Approval Workflow - 完整实施

## ✅ 已完成的更新

当在 Applications 页面审批（Approve）一个申请时，该顾客会**自动添加到 Customers & Rates**。

### 审批流程

1. **从 Applications 获取数据**
2. **验证邮箱不重复**
3. **创建 Customer 记录**
4. **更新 Application 状态为 'approved'**
5. **记录审批信息**（reviewed_at, reviewed_by）

### 字段映射

| customer_applications | → | customers | 说明 |
|----------------------|---|-----------|------|
| `name` | → | `name` | 客户名字 |
| `email` | → | `email` | 邮箱地址 |
| `contact` | → | `contact` | 联系电话 |
| `location` | → | `remark2` | 位置（Location） |
| `acres` | → | `acres` | 面积 |
| `company_name` | → | `company_name` | 公司名称 |
| `rate_requested` | → | `rate` | 费率 |
| - | → | `status` | 自动设置为 'Active' |
| - | → | `last_purchase_date` | 自动设置为今天 |
| - | → | `remark` | Service Area (可为 NULL) |

## 实际测试结果

### 测试案例
**Application #10:**
```
Name: Ahmad bin Abdullah
Email: ahmad.abdullah@palmtrade.my
Contact: 012-3456789
Location: NULL
Acres: NULL
Company: Palm Trading Sdn Bhd
Rate Requested: 52.50
Status: pending
```

**审批后创建的 Customer #255:**
```
Name: Ahmad bin Abdullah
Email: ahmad.abdullah@palmtrade.my
Contact: 012-3456789
Acres: NULL
Company Name: Palm Trading Sdn Bhd         ← ✓ 已复制
Rate: 52.50                                ← ✓ 已复制 (from rate_requested)
Remark (Service Area): NULL                ← 可为空
Remark2 (Location): NULL
Status: Active                             ← ✓ 自动设置
Last Purchase Date: 2025-11-24            ← ✓ 设置为今天
```

### 验证步骤

✅ **步骤 1：检查 Application**
```sql
SELECT * FROM customer_applications WHERE status = 'pending';
```

✅ **步骤 2：审批 Application**
- 通过 UI：在 Applications 页面点击 "Approve"
- 通过 API：POST 到 `api/api_approve_application.php`

✅ **步骤 3：验证 Customer 已创建**
```sql
SELECT * FROM customers WHERE email = 'ahmad.abdullah@palmtrade.my';
```

✅ **步骤 4：验证 Application 状态已更新**
```sql
SELECT status, reviewed_at, reviewed_by
FROM customer_applications
WHERE email = 'ahmad.abdullah@palmtrade.my';
```

## API 端点详情

### POST /api/api_approve_application.php

**请求：**
```json
{
  "application_id": 10
}
```

**流程：**
1. 验证 application_id
2. 获取申请详情
3. 检查邮箱是否已在 customers 表中
4. 如果不存在，创建新客户：
   ```sql
   INSERT INTO customers (
     name,
     email,
     contact,
     acres,
     company_name,
     rate,
     remark2,
     status,
     last_purchase_date
   ) VALUES (
     ?, ?, ?, ?, ?, ?, ?,
     'Active',
     CURDATE()
   )
   ```
5. 更新申请状态：
   ```sql
   UPDATE customer_applications
   SET status = 'approved',
       reviewed_at = NOW(),
       reviewed_by = ?
   WHERE id = ?
   ```

**响应（成功）：**
```json
{
  "message": "Application approved successfully. Customer has been created.",
  "customer_id": 255,
  "application_id": 10
}
```

**响应（失败 - 邮箱已存在）：**
```json
{
  "message": "Customer with this email already exists"
}
```

## 前端集成

### Applications View (React)

在 `view_components.js` 的 `ApplicationsView` 组件中：

```javascript
const handleUpdateStatus = async (id, newStatus) => {
  const isApprove = newStatus === 'approved';

  // 调用正确的 API
  const apiUrl = isApprove
    ? 'api/api_approve_application.php'   // ← 创建 customer
    : 'api/api_reject_application.php';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_id: id })
  });

  if (response.ok) {
    showToast('Application approved successfully!', 'success');
    loadApplications(); // 刷新列表
  }
};
```

### 用户操作流程

1. 登录系统
2. 导航到 Applications 页面：`http://localhost/easisawit/index.html#applications`
3. 查看 Pending 申请
4. 点击申请卡片查看详情
5. 点击 "Approve" 按钮
6. 系统自动：
   - 创建 Customer 记录
   - 设置 status = 'Active'
   - 设置 last_purchase_date = 今天
   - 更新 Application status = 'approved'
7. 导航到 Customers 页面验证：`http://localhost/easisawit/index.html#customers`
8. 新客户立即出现在列表中

## 自动设置的字段

### status = 'Active'
- 新客户自动激活
- 立即可用于业务操作

### last_purchase_date = TODAY
- 设置为审批当天
- 确保客户在 Customers 页面可见
- 符合业务逻辑（新客户即将开始交易）

### remark (Service Area)
- 可以为 NULL
- 后续可以在 Customers 页面编辑
- 不强制要求

## 错误处理

### 1. 邮箱已存在
```
错误消息：Customer with this email already exists
解决方案：检查现有客户，或使用不同的邮箱
```

### 2. 申请已处理
```
错误消息：Application not found or already processed
解决方案：刷新页面，确认申请状态
```

### 3. 必填字段缺失
```
错误消息：Failed to create customer
解决方案：确保申请包含 name, email, rate_requested
```

## 数据完整性

### Transaction 保护
```php
$conn->begin_transaction();
try {
    // 1. 获取申请
    // 2. 检查重复
    // 3. 创建客户
    // 4. 更新申请状态
    $conn->commit();
} catch (Exception $e) {
    $conn->rollback();
    throw $e;
}
```

### 优势
- ✅ 全部成功或全部失败
- ✅ 不会出现部分数据
- ✅ 保证数据一致性

## 测试脚本

### 1. 查看工作流程
```bash
php test_approve_workflow.php
```

### 2. 直接测试审批
```bash
php test_approve_direct.php
```

## 总结

✅ **审批流程已完全自动化！**

当您在 Applications 页面审批一个申请时：
1. ✅ 自动创建 Customer 记录
2. ✅ 复制所有相关字段
3. ✅ 设置状态为 Active
4. ✅ 设置 last_purchase_date 为今天
5. ✅ 更新 Application 状态
6. ✅ 记录审批信息
7. ✅ 使用 Transaction 确保数据完整性

**客户立即出现在 Customers & Rates 页面，可以开始使用！**
