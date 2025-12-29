# EasiSawit CRUD Operations Documentation
# EasiSawit CRUD 操作文档

This document provides a comprehensive overview of all CRUD (Create, Read, Update, Delete) operations in the EasiSawit application.

本文档提供了 EasiSawit 应用程序中所有 CRUD（创建、读取、更新、删除）操作的全面概述。

---

## Table of Contents / 目录

1. [CREATE Operations / 创建操作](#1-create-operations--创建操作)
   - [1.1 Add Customer / 添加客户](#11-add-customer--添加客户)
   - [1.2 Add Worker / 添加工人](#12-add-worker--添加工人)
   - [1.3 Add Work Log / 添加工作日志](#13-add-work-log--添加工作日志)
2. [READ Operations / 读取操作](#2-read-operations--读取操作)
   - [2.1 Get Customers / 获取客户列表](#21-get-customers--获取客户列表)
   - [2.2 Get Workers / 获取工人列表](#22-get-workers--获取工人列表)
   - [2.3 Get Work Logs / 获取工作日志](#23-get-work-logs--获取工作日志)
3. [UPDATE Operations / 更新操作](#3-update-operations--更新操作)
   - [3.1 Update Customer / 更新客户](#31-update-customer--更新客户)
   - [3.2 Update Worker / 更新工人](#32-update-worker--更新工人)
   - [3.3 Update Work Log / 更新工作日志](#33-update-work-log--更新工作日志)
4. [DELETE Operations / 删除操作](#4-delete-operations--删除操作)
   - [4.1 Delete Customer / 删除客户](#41-delete-customer--删除客户)
   - [4.2 Delete Worker / 删除工人](#42-delete-worker--删除工人)
   - [4.3 Delete Work Log / 删除工作日志](#43-delete-work-log--删除工作日志)

---

# 1. CREATE Operations / 创建操作

## 1.1 Add Customer / 添加客户

### File Location / 文件位置
`api/api_add_customer.php`

### HTTP Method / HTTP 方法
`POST`

### Code Snippet / 代码片段

**Lines 16-25: Input Validation / 输入验证**
```php
if (
    !isset($data->name) ||
    !isset($data->rate) ||
    !isset($data->notes) ||
    trim($data->notes) === ''
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add customer. Name, rate, and notes are required."));
    die();
}
```

**Lines 37-62: Duplicate Check / 重复检查**
```php
$exact_check_sql = "SELECT id FROM customers WHERE name = ? AND (contact = ? OR (contact IS NULL AND ? IS NULL)) AND notes = ? AND (additional_notes = ? OR (additional_notes IS NULL AND ? IS NULL))";
$exact_check_stmt = $conn->prepare($exact_check_sql);
$exact_check_stmt->bind_param("ssssss", $data->name, $contact, $contact, $notes, $additional_notes, $additional_notes);
$exact_check_stmt->execute();
$exact_result = $exact_check_stmt->get_result();

if ($exact_result->num_rows > 0) {
    http_response_code(409);
    echo json_encode(array(
        "message" => "This customer already exists with the same name, contact, and notes. Cannot add duplicate.",
        "error" => "DUPLICATE_CUSTOMER"
    ));
    die();
}
```

**Lines 64-78: INSERT Statement / 插入语句**
```php
$sql = "INSERT INTO customers (name, contact, acres, rate, notes, additional_notes, last_purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param(
    "ssddsss",
    $data->name,
    $contact,
    $acres,
    $data->rate,
    $notes,
    $additional_notes,
    $today
);
```

### Explanation / 说明

**English:**
This function adds a new customer to the database. It first validates that required fields (name, rate, notes) are provided. Then it checks if an exact duplicate customer already exists by comparing name, contact, notes, and additional_notes. If no duplicate is found, it inserts the new customer record with today's date as the last purchase date. The function uses prepared statements to prevent SQL injection attacks.

**中文:**
此功能用于向数据库添加新客户。它首先验证是否提供了必填字段（姓名、费率、备注）。然后通过比较姓名、联系方式、备注和附加备注来检查是否已存在完全相同的客户。如果没有发现重复项，则插入新的客户记录，并将今天的日期设为最后购买日期。该功能使用预处理语句来防止 SQL 注入攻击。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive POST Request             │
│    接收 POST 请求                    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Parse JSON Input Data            │
│    解析 JSON 输入数据                │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Required fields│
         │ present?       │
         │ 必填字段存在?   │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Check for Duplicate │
│ Error         │ │ 检查重复            │
│ 返回400错误   │ └──────────┬──────────┘
└───────────────┘            │
                             ▼
                    ┌────────────────┐
                    │ Duplicate      │
                    │ exists?        │
                    │ 存在重复?      │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌───────────────┐ ┌───────────────────┐
          │ Return 409    │ │ Execute INSERT    │
          │ Conflict      │ │ 执行插入语句      │
          │ 返回409冲突   │ └─────────┬─────────┘
          └───────────────┘           │
                                      ▼
                             ┌────────────────┐
                             │ Insert         │
                             │ successful?    │
                             │ 插入成功?      │
                             └───────┬────────┘
                                     │
                            ┌──YES───┴───NO──┐
                            │                │
                            ▼                ▼
                   ┌───────────────┐ ┌───────────────┐
                   │ Return 201    │ │ Return 503    │
                   │ Created       │ │ Error         │
                   │ 返回201创建   │ │ 返回503错误   │
                   └───────┬───────┘ └───────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  END / 结束   │
                   └───────────────┘
```

---

## 1.2 Add Worker / 添加工人

### File Location / 文件位置
`api/api_add_worker.php`

### HTTP Method / HTTP 方法
`POST`

### Code Snippet / 代码片段

**Lines 21-30: Input Validation / 输入验证**
```php
if (
    !isset($data->name) ||
    !isset($data->type) ||
    !isset($data->status)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add worker. Incomplete data."));
    die();
}
```

**Lines 51-68: Duplicate Check Logic / 重复检查逻辑**
```php
$duplicate_check_sql = "";
if ($data->type === 'Local' && !empty($epf)) {
    $duplicate_check_sql = "SELECT id FROM workers WHERE name = ? AND epf = ? AND type = 'Local'";
    $check_stmt = $conn->prepare($duplicate_check_sql);
    $check_stmt->bind_param("ss", $data->name, $epf);
} else if ($data->type === 'Foreign' && !empty($permit)) {
    $duplicate_check_sql = "SELECT id FROM workers WHERE name = ? AND permit = ? AND type = 'Foreign'";
    $check_stmt = $conn->prepare($duplicate_check_sql);
    $check_stmt->bind_param("ss", $data->name, $permit);
} else {
    $duplicate_check_sql = "SELECT id FROM workers WHERE name = ? AND type = ?";
    $check_stmt = $conn->prepare($duplicate_check_sql);
    $check_stmt->bind_param("ss", $data->name, $data->type);
}
```

**Lines 97-118: INSERT Statement / 插入语句**
```php
$sql = "INSERT INTO workers (name, type, epf, permit, status, identity_number, identity_type, age, marital_status, children_count, spouse_working, zakat_monthly) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "sssssssisiid",
    $data->name,
    $data->type,
    $epf,
    $permit,
    $data->status,
    $identity_number,
    $identity_type,
    $age,
    $marital_status,
    $children_count,
    $spouse_working,
    $zakat_monthly
);
```

### Explanation / 说明

**English:**
This function adds a new worker to the database. It validates that required fields (name, type, status) are present. The function handles two types of workers: Local (requires EPF number) and Foreign (requires permit number). Before inserting, it checks for duplicates based on worker type - for Local workers it checks name+EPF, for Foreign workers it checks name+permit. The function also captures demographic information like age, marital status, children count, and zakat contributions.

**中文:**
此功能用于向数据库添加新工人。它验证必填字段（姓名、类型、状态）是否存在。该功能处理两种类型的工人：本地工人（需要 EPF 号码）和外籍工人（需要许可证号码）。在插入之前，它根据工人类型检查重复项——对于本地工人，检查姓名+EPF；对于外籍工人，检查姓名+许可证。该功能还捕获人口统计信息，如年龄、婚姻状况、子女数量和天课（Zakat）缴纳。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive POST Request             │
│    接收 POST 请求                    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Parse JSON Input Data            │
│    解析 JSON 输入数据                │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ name, type,    │
         │ status present?│
         │ 必填字段存在?   │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Determine Worker    │
│ Error         │ │ Type                │
│ 返回400错误   │ │ 确定工人类型        │
└───────────────┘ └──────────┬──────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
     ┌────────────────┐            ┌────────────────┐
     │ Local Worker   │            │ Foreign Worker │
     │ Check: name+EPF│            │ Check: name+   │
     │ 本地:姓名+EPF  │            │ permit         │
     └───────┬────────┘            │ 外籍:姓名+许可证│
             │                     └───────┬────────┘
             └──────────┬──────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │ Duplicate      │
               │ exists?        │
               │ 存在重复?      │
               └───────┬────────┘
                       │
              ┌───YES──┴──NO───┐
              │                │
              ▼                ▼
     ┌───────────────┐ ┌───────────────────┐
     │ Return 409    │ │ Execute INSERT    │
     │ Conflict      │ │ with all fields   │
     │ 返回409冲突   │ │ 执行插入所有字段  │
     └───────────────┘ └─────────┬─────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │ Insert         │
                        │ successful?    │
                        │ 插入成功?      │
                        └───────┬────────┘
                                │
                       ┌──YES───┴───NO──┐
                       │                │
                       ▼                ▼
              ┌───────────────┐ ┌───────────────┐
              │ Return 201    │ │ Return 503    │
              │ Created       │ │ Error         │
              │ 返回201创建   │ │ 返回503错误   │
              └───────┬───────┘ └───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  END / 结束   │
              └───────────────┘
```

---

## 1.3 Add Work Log / 添加工作日志

### File Location / 文件位置
`api/api_add_worklog.php`

### HTTP Method / HTTP 方法
`POST`

### Code Snippet / 代码片段

**Lines 22-31: Input Validation / 输入验证**
```php
if (
    !isset($data->log_date) ||
    !isset($data->worker_id) ||
    !isset($data->customer_id) ||
    !isset($data->tons)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to add work log. Incomplete data."));
    die();
}
```

**Lines 33-47: Future Date Validation / 未来日期验证**
```php
date_default_timezone_set('Asia/Kuala_Lumpur');
$today = date('Y-m-d');
$log_date = $data->log_date;

if ($log_date > $today) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Operation failed: Work log date cannot be later than current date.",
        "error" => "FUTURE_DATE_NOT_ALLOWED",
        "log_date" => $log_date,
        "current_date" => $today
    ));
    die();
}
```

**Lines 50-60: INSERT Statement / 插入语句**
```php
$sql = "INSERT INTO work_logs (log_date, worker_id, customer_id, tons) VALUES (?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "siid",
    $data->log_date,
    $data->worker_id,
    $data->customer_id,
    $data->tons
);
```

**Lines 63-72: Update Customer's Last Purchase Date / 更新客户最后购买日期**
```php
if ($stmt->execute()) {
    $today = date('Y-m-d');
    $update_sql = "UPDATE customers SET last_purchase_date = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);

    if ($update_stmt) {
        $update_stmt->bind_param("si", $today, $data->customer_id);
        $update_stmt->execute();
        $update_stmt->close();
    }
}
```

### Explanation / 说明

**English:**
This function records a work log entry that tracks which worker performed work for which customer and how many tons of palm fruit were harvested. It validates all required fields and ensures that the log date is not in the future (using Malaysia timezone UTC+8). After successfully inserting the work log, it automatically updates the customer's `last_purchase_date` to today's date, which keeps the customer active in the system.

**中文:**
此功能记录工作日志条目，用于追踪哪个工人为哪个客户工作以及收获了多少吨棕榈果。它验证所有必填字段，并确保日志日期不是未来日期（使用马来西亚时区 UTC+8）。成功插入工作日志后，它会自动将客户的 `last_purchase_date` 更新为今天的日期，从而使客户在系统中保持活跃状态。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive POST Request             │
│    接收 POST 请求                    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Parse JSON Input Data            │
│    解析 JSON 输入数据                │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ All required   │
         │ fields present?│
         │ 所有必填字段?  │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Set Malaysia TZ     │
│ Error         │ │ 设置马来西亚时区    │
│ 返回400错误   │ └──────────┬──────────┘
└───────────────┘            │
                             ▼
                    ┌────────────────┐
                    │ log_date >     │
                    │ today?         │
                    │ 日期在未来?    │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌───────────────┐ ┌───────────────────┐
          │ Return 400    │ │ Execute INSERT    │
          │ Future date   │ │ into work_logs    │
          │ error         │ │ 插入工作日志      │
          │ 返回未来日期  │ └─────────┬─────────┘
          │ 错误          │           │
          └───────────────┘           ▼
                             ┌────────────────┐
                             │ Insert         │
                             │ successful?    │
                             │ 插入成功?      │
                             └───────┬────────┘
                                     │
                            ┌──YES───┴───NO──┐
                            │                │
                            ▼                ▼
                   ┌───────────────┐ ┌───────────────┐
                   │ UPDATE        │ │ Return 503    │
                   │ customer's    │ │ Error         │
                   │ last_purchase │ │ 返回503错误   │
                   │ _date         │ └───────────────┘
                   │ 更新客户最后  │
                   │ 购买日期      │
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Return 201    │
                   │ Created       │
                   │ 返回201创建   │
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  END / 结束   │
                   └───────────────┘
```

---

# 2. READ Operations / 读取操作

## 2.1 Get Customers / 获取客户列表

### File Location / 文件位置
`api/api_get_customer.php`

### HTTP Method / HTTP 方法
`GET`

### Code Snippet / 代码片段

**Lines 21-25: SELECT Statement for Active Customers / 查询活跃客户的SELECT语句**
```php
$sql = "SELECT id, name, rate, contact, acres, remark, remark2, last_purchase_date FROM customers
        WHERE last_purchase_date IS NOT NULL
        AND last_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        ORDER BY last_purchase_date DESC";
$result = $conn->query($sql);
```

**Lines 27-36: Result Processing / 结果处理**
```php
if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
    }
    $result->free();
}
```

### Explanation / 说明

**English:**
This function retrieves all active customers from the database. A customer is considered "active" if their `last_purchase_date` is within the last 14 days. The results are ordered by the most recent purchase date first. This logic helps separate active customers from archived/inactive ones, allowing the UI to display them in different sections.

**中文:**
此功能从数据库中检索所有活跃客户。如果客户的 `last_purchase_date`（最后购买日期）在过去 14 天内，则该客户被视为"活跃"客户。结果按最近购买日期排序。此逻辑有助于将活跃客户与存档/非活跃客户分开，使用户界面可以在不同部分显示它们。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive GET Request              │
│    接收 GET 请求                     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Connect to Database              │
│    连接数据库                        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Execute SELECT Query             │
│    Filter: last_purchase_date       │
│    >= 14 days ago                   │
│    执行SELECT查询                   │
│    过滤：最后购买日期>=14天前       │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Results found? │
         │ 有结果?        │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return empty  │ │ Loop through rows   │
│ array []      │ │ 循环遍历行          │
│ 返回空数组    │ └──────────┬──────────┘
└───────┬───────┘            │
        │                    ▼
        │           ┌─────────────────────┐
        │           │ Add each customer   │
        │           │ to array            │
        │           │ 将每个客户添加到数组│
        │           └──────────┬──────────┘
        │                      │
        └──────────┬───────────┘
                   │
                   ▼
          ┌─────────────────────┐
          │ Return JSON array   │
          │ with HTTP 200       │
          │ 返回JSON数组        │
          │ HTTP 200            │
          └─────────┬───────────┘
                    │
                    ▼
           ┌───────────────┐
           │  END / 结束   │
           └───────────────┘
```

---

## 2.2 Get Workers / 获取工人列表

### File Location / 文件位置
`api/api_worker.php`

### HTTP Method / HTTP 方法
`GET`

### Code Snippet / 代码片段

**Line 17: SELECT Statement / SELECT语句**
```php
$sql = "SELECT id, name, identity_number, identity_type, type, age, epf, permit, status, marital_status, children_count, spouse_working, zakat_monthly FROM workers";
```

**Lines 20-31: Result Processing / 结果处理**
```php
if ($result instanceof mysqli_result) {
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $workers[] = $row;
        }
    }
    $result->free();
} else {
    // Return empty list with 200 to avoid frontend failing before tables are created
}
```

### Explanation / 说明

**English:**
This function retrieves all workers from the database with their complete demographic information. The query fetches personal details like identity number, type (Local/Foreign), age, EPF number (for local workers), permit (for foreign workers), status, marital status, children count, spouse working status, and monthly zakat contributions. The function gracefully handles cases where the table may not exist yet.

**中文:**
此功能从数据库中检索所有工人及其完整的人口统计信息。查询获取个人详细信息，如身份证号码、类型（本地/外籍）、年龄、EPF 号码（本地工人）、许可证（外籍工人）、状态、婚姻状况、子女数量、配偶工作状态和每月天课缴纳。该功能优雅地处理表可能尚不存在的情况。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive GET Request              │
│    接收 GET 请求                     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Connect to Database              │
│    连接数据库                        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Execute SELECT * from workers    │
│    执行 SELECT * from workers       │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Query          │
         │ successful?    │
         │ 查询成功?      │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return empty  │ │ Loop through rows   │
│ array []      │ │ 循环遍历行          │
│ (graceful)    │ └──────────┬──────────┘
│ 返回空数组    │            │
└───────┬───────┘            ▼
        │           ┌─────────────────────┐
        │           │ Build workers array │
        │           │ 构建工人数组        │
        │           └──────────┬──────────┘
        │                      │
        └──────────┬───────────┘
                   │
                   ▼
          ┌─────────────────────┐
          │ Return JSON array   │
          │ with HTTP 200       │
          │ 返回JSON数组        │
          │ HTTP 200            │
          └─────────┬───────────┘
                    │
                    ▼
           ┌───────────────┐
           │  END / 结束   │
           └───────────────┘
```

---

## 2.3 Get Work Logs / 获取工作日志

### File Location / 文件位置
`api/api_get_worklogs.php`

### HTTP Method / HTTP 方法
`GET`

### Code Snippet / 代码片段

**Lines 15-32: SELECT with JOIN / 带JOIN的SELECT语句**
```php
$sql = "SELECT
            wl.id,
            wl.log_date,
            wl.worker_id,
            wl.customer_id,
            w.name AS worker_name,
            c.name AS customer_name,
            wl.tons,
            c.rate AS rate_per_ton,
            (wl.tons * c.rate) AS earnings
        FROM
            work_logs wl
        JOIN
            workers w ON wl.worker_id = w.id
        JOIN
            customers c ON wl.customer_id = c.id
        ORDER BY
            wl.log_date DESC";
```

### Explanation / 说明

**English:**
This function retrieves all work logs with enriched data by joining three tables: `work_logs`, `workers`, and `customers`. It returns the log date, worker name, customer name, tons harvested, rate per ton (from customer table), and calculated earnings (tons × rate). This follows 3NF normalization principles where the rate is stored only in the customers table and calculated at query time. Results are ordered by the most recent date first.

**中文:**
此功能通过连接三个表（`work_logs`、`workers` 和 `customers`）来检索所有带有丰富数据的工作日志。它返回日志日期、工人姓名、客户姓名、收获吨数、每吨费率（来自客户表）和计算的收益（吨数 × 费率）。这遵循第三范式（3NF）规范化原则，其中费率仅存储在客户表中，并在查询时计算。结果按最近日期排序。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive GET Request              │
│    接收 GET 请求                     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Connect to Database              │
│    连接数据库                        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Execute SELECT with JOINs        │
│    work_logs + workers + customers  │
│    执行带JOIN的SELECT               │
│    工作日志 + 工人 + 客户           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Calculate earnings:              │
│    tons × rate_per_ton              │
│    计算收益：吨数 × 每吨费率        │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Results found? │
         │ 有结果?        │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return empty  │ │ Build logs array    │
│ array []      │ │ with enriched data  │
│ 返回空数组    │ │ 构建带丰富数据的    │
└───────┬───────┘ │ 日志数组            │
        │         └──────────┬──────────┘
        │                    │
        └──────────┬─────────┘
                   │
                   ▼
          ┌─────────────────────┐
          │ Return JSON array   │
          │ with HTTP 200       │
          │ 返回JSON数组        │
          │ HTTP 200            │
          └─────────┬───────────┘
                    │
                    ▼
           ┌───────────────┐
           │  END / 结束   │
           └───────────────┘
```

---

# 3. UPDATE Operations / 更新操作

## 3.1 Update Customer / 更新客户

### File Location / 文件位置
`api/api_update_customer.php`

### HTTP Method / HTTP 方法
`PUT` or `POST`

### Code Snippet / 代码片段

**Lines 17-25: Input Validation / 输入验证**
```php
if (
    !isset($data->id) ||
    !isset($data->name) ||
    !isset($data->rate)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update customer. Name and rate are required."));
    die();
}
```

**Lines 27-36: Field Sanitization / 字段清理**
```php
$contact = isset($data->contact) && $data->contact !== '' ? $data->contact : null;
$acres = isset($data->acres) && $data->acres !== '' && $data->acres !== null ? floatval($data->acres) : null;
$remark = isset($data->remark) ? trim($data->remark) : null;
$remark2 = isset($data->remark2) ? trim($data->remark2) : null;

if ($contact === '') $contact = null;
if ($remark === '') $remark = null;
if ($remark2 === '') $remark2 = null;
```

**Lines 41-54: UPDATE Statement / UPDATE语句**
```php
$sql = "UPDATE customers SET name = ?, contact = ?, acres = ?, rate = ?, remark = ?, remark2 = ? WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ssddssi",
    $data->name,
    $contact,
    $acres,
    $data->rate,
    $remark,
    $remark2,
    $data->id
);
```

**Lines 56-65: Response with Change Flag / 带变更标志的响应**
```php
if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array("message" => "Customer was updated.", "changed" => true));
    } else {
        http_response_code(200);
        echo json_encode(array("message" => "No changes were made to the customer.", "changed" => false));
    }
}
```

### Explanation / 说明

**English:**
This function updates an existing customer's information. It validates that required fields (id, name, rate) are provided and sanitizes optional fields by converting empty strings to NULL. After executing the update, it checks `affected_rows` to determine if actual changes were made. The response includes a `changed` flag that tells the frontend whether the data was actually modified - this helps the UI decide whether to refresh the display.

**中文:**
此功能更新现有客户的信息。它验证是否提供了必填字段（id、姓名、费率），并通过将空字符串转换为 NULL 来清理可选字段。执行更新后，它检查 `affected_rows` 以确定是否进行了实际更改。响应包含一个 `changed` 标志，告诉前端数据是否真正被修改——这有助于用户界面决定是否刷新显示。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive PUT/POST Request         │
│    接收 PUT/POST 请求               │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Parse JSON Input Data            │
│    解析 JSON 输入数据                │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ id, name, rate │
         │ present?       │
         │ 必填字段存在?  │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Sanitize optional   │
│ Error         │ │ fields              │
│ 返回400错误   │ │ (empty → NULL)      │
└───────────────┘ │ 清理可选字段        │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Execute UPDATE      │
                  │ Statement           │
                  │ 执行UPDATE语句      │
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ affected_rows  │
                    │ > 0?           │
                    │ 影响行数>0?    │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌───────────────┐ ┌───────────────┐
          │ Return 200    │ │ Return 200    │
          │ changed: true │ │ changed: false│
          │ 返回已更改    │ │ 返回无更改    │
          └───────┬───────┘ └───────┬───────┘
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                  ┌───────────────┐
                  │  END / 结束   │
                  └───────────────┘
```

---

## 3.2 Update Worker / 更新工人

### File Location / 文件位置
`api/api_update_worker.php`

### HTTP Method / HTTP 方法
`PUT` or `POST`

### Code Snippet / 代码片段

**Lines 18-30: Input Validation / 输入验证**
```php
if (
    !isset($data->id) ||
    !isset($data->name) ||
    !isset($data->type) ||
    !isset($data->status)
) {
    http_response_code(400);
    echo json_encode([
        "message" => "Unable to update worker. Incomplete data.",
        "received_data" => $data
    ]);
    exit();
}
```

**Lines 50-63: UPDATE Statement / UPDATE语句**
```php
$sql = "UPDATE workers SET name = ?, type = ?, epf = ?, permit = ?, status = ?, identity_number = ?, identity_type = ?, age = ?, marital_status = ?, children_count = ?, spouse_working = ?, zakat_monthly = ? WHERE id = ?";
$stmt = $conn->prepare($sql);

$stmt->bind_param("sssssssisiidi", $name, $type, $epf, $permit, $status, $identity_number, $identity_type, $age, $marital_status, $children_count, $spouse_working, $zakat_monthly, $id);
```

### Explanation / 说明

**English:**
This function updates an existing worker's information including all demographic fields. It requires the worker ID, name, type, and status. Optional fields like EPF, permit, identity number, age, marital status, children count, spouse working status, and zakat amount are handled with proper null checks. The function returns a `changed` flag to indicate whether the data was actually modified.

**中文:**
此功能更新现有工人的信息，包括所有人口统计字段。它需要工人 ID、姓名、类型和状态。可选字段如 EPF、许可证、身份证号码、年龄、婚姻状况、子女数量、配偶工作状态和天课金额都进行了适当的空值检查。该功能返回一个 `changed` 标志，以指示数据是否真正被修改。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive PUT/POST Request         │
│    接收 PUT/POST 请求               │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ id, name, type,│
         │ status present?│
         │ 必填字段存在?  │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Process optional    │
│ with received │ │ fields with null    │
│ data          │ │ handling            │
│ 返回400错误   │ │ 处理可选字段空值    │
└───────────────┘ └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Prepare UPDATE      │
                  │ with 12 fields      │
                  │ 准备12字段的UPDATE  │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Execute UPDATE      │
                  │ 执行UPDATE          │
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ affected_rows  │
                    │ > 0?           │
                    │ 影响行数>0?    │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌───────────────┐ ┌───────────────┐
          │ Return 200    │ │ Return 200    │
          │ changed: true │ │ changed: false│
          │ 返回已更改    │ │ 返回无更改    │
          └───────┬───────┘ └───────┬───────┘
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                  ┌───────────────┐
                  │  END / 结束   │
                  └───────────────┘
```

---

## 3.3 Update Work Log / 更新工作日志

### File Location / 文件位置
`api/api_update_worklog.php`

### HTTP Method / HTTP 方法
`PUT` or `POST`

### Code Snippet / 代码片段

**Lines 16-26: Input Validation / 输入验证**
```php
if (
    !isset($data->id) ||
    !isset($data->log_date) ||
    !isset($data->worker_id) ||
    !isset($data->customer_id) ||
    !isset($data->tons)
) {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to update work log. Incomplete data."));
    die();
}
```

**Lines 28-42: Future Date Validation / 未来日期验证**
```php
date_default_timezone_set('Asia/Kuala_Lumpur');
$today = date('Y-m-d');
$log_date = $data->log_date;

if ($log_date > $today) {
    http_response_code(400);
    echo json_encode(array(
        "message" => "Operation failed: Work log date cannot be later than current date.",
        "error" => "FUTURE_DATE_NOT_ALLOWED"
    ));
    die();
}
```

**Lines 45-56: UPDATE Statement / UPDATE语句**
```php
$sql = "UPDATE work_logs SET log_date = ?, worker_id = ?, customer_id = ?, tons = ? WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "siidi",
    $data->log_date,
    $data->worker_id,
    $data->customer_id,
    $data->tons,
    $data->id
);
```

### Explanation / 说明

**English:**
This function updates an existing work log entry. It validates all required fields and ensures the log date is not in the future using Malaysia timezone (UTC+8). The update modifies the log date, worker assignment, customer assignment, and tons harvested. Similar to other update functions, it returns a `changed` flag indicating whether actual modifications were made to the database.

**中文:**
此功能更新现有的工作日志条目。它验证所有必填字段，并使用马来西亚时区（UTC+8）确保日志日期不是未来日期。更新修改日志日期、工人分配、客户分配和收获吨数。与其他更新功能类似，它返回一个 `changed` 标志，指示是否对数据库进行了实际修改。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive PUT/POST Request         │
│    接收 PUT/POST 请求               │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ All required   │
         │ fields present?│
         │ 所有必填字段?  │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Set Malaysia TZ     │
│ Error         │ │ 设置马来西亚时区    │
│ 返回400错误   │ └──────────┬──────────┘
└───────────────┘            │
                             ▼
                    ┌────────────────┐
                    │ log_date >     │
                    │ today?         │
                    │ 日期在未来?    │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌───────────────┐ ┌───────────────────┐
          │ Return 400    │ │ Execute UPDATE    │
          │ Future date   │ │ 执行UPDATE        │
          │ error         │ └─────────┬─────────┘
          │ 返回未来日期  │           │
          │ 错误          │           ▼
          └───────────────┘  ┌────────────────┐
                             │ affected_rows  │
                             │ > 0?           │
                             │ 影响行数>0?    │
                             └───────┬────────┘
                                     │
                            ┌──YES───┴───NO──┐
                            │                │
                            ▼                ▼
                   ┌───────────────┐ ┌───────────────┐
                   │ Return 200    │ │ Return 200    │
                   │ changed: true │ │ changed: false│
                   │ 返回已更改    │ │ 返回无更改    │
                   └───────┬───────┘ └───────┬───────┘
                           │                 │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌───────────────┐
                           │  END / 结束   │
                           └───────────────┘
```

---

# 4. DELETE Operations / 删除操作

## 4.1 Delete Customer / 删除客户

### File Location / 文件位置
`api/api_delete_customer.php`

### HTTP Method / HTTP 方法
`DELETE`

### Code Snippet / 代码片段

**Lines 14-20: ID Validation / ID验证**
```php
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid customer ID provided."));
    die();
}
```

**Lines 22-26: DELETE Statement / DELETE语句**
```php
$sql = "DELETE FROM customers WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param("i", $id);
```

**Lines 28-39: Execute and Response / 执行和响应**
```php
if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array("message" => "Customer was deleted."));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Customer not found with ID {$id}."));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to delete customer."));
}
```

### Explanation / 说明

**English:**
This function permanently deletes a customer from the database. The customer ID is passed as a URL query parameter (e.g., `?id=123`). The function validates that the ID is a positive integer using `intval()` for security. After executing the delete, it checks `affected_rows` - if greater than 0, the delete was successful; if 0, the customer was not found. This provides accurate feedback to the frontend.

**中文:**
此功能从数据库中永久删除客户。客户 ID 作为 URL 查询参数传递（例如 `?id=123`）。该功能使用 `intval()` 验证 ID 是否为正整数，以确保安全性。执行删除后，它检查 `affected_rows`——如果大于 0，则删除成功；如果为 0，则未找到客户。这为前端提供了准确的反馈。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive DELETE Request           │
│    URL: ?id=123                     │
│    接收DELETE请求                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Extract ID from $_GET            │
│    Convert to integer               │
│    从$_GET提取ID                    │
│    转换为整数                       │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ ID > 0?        │
         │ ID有效?        │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Prepare DELETE      │
│ Invalid ID    │ │ Statement           │
│ 返回400无效ID │ │ 准备DELETE语句      │
└───────────────┘ └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Execute DELETE      │
                  │ 执行DELETE          │
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Execute        │
                    │ successful?    │
                    │ 执行成功?      │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌────────────────┐ ┌───────────────┐
          │ affected_rows  │ │ Return 503    │
          │ > 0?           │ │ Error         │
          │ 影响行数>0?    │ │ 返回503错误   │
          └───────┬────────┘ └───────────────┘
                  │
         ┌──YES───┴───NO──┐
         │                │
         ▼                ▼
┌───────────────┐ ┌───────────────┐
│ Return 200    │ │ Return 404    │
│ Deleted       │ │ Not Found     │
│ 返回200已删除 │ │ 返回404未找到 │
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌───────────────┐
        │  END / 结束   │
        └───────────────┘
```

---

## 4.2 Delete Worker / 删除工人

### File Location / 文件位置
`api/api_delete_worker.php`

### HTTP Method / HTTP 方法
`DELETE`

### Code Snippet / 代码片段

**Lines 15-25: ID Validation / ID验证**
```php
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid worker ID provided."));
    die();
}
```

**Lines 27-34: DELETE Statement / DELETE语句**
```php
$sql = "DELETE FROM workers WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param("i", $id);
```

**Lines 36-52: Execute and Response / 执行和响应**
```php
if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array("message" => "Worker was deleted."));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Worker not found with ID {$id}."));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to delete worker."));
}
```

### Explanation / 说明

**English:**
This function permanently removes a worker from the database. The worker ID is provided via URL query parameter. It uses `intval()` to ensure the ID is a valid positive integer, preventing SQL injection. The function provides three possible responses: 200 (successfully deleted), 404 (worker not found), or 503 (database error). This pattern ensures the frontend always receives meaningful feedback.

**中文:**
此功能从数据库中永久删除工人。工人 ID 通过 URL 查询参数提供。它使用 `intval()` 确保 ID 是有效的正整数，防止 SQL 注入。该功能提供三种可能的响应：200（成功删除）、404（未找到工人）或 503（数据库错误）。此模式确保前端始终收到有意义的反馈。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive DELETE Request           │
│    URL: ?id=123                     │
│    接收DELETE请求                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Extract ID from $_GET['id']      │
│    Use intval() for security        │
│    从$_GET['id']提取ID              │
│    使用intval()确保安全             │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ ID > 0?        │
         │ ID有效?        │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Prepare DELETE      │
│ Invalid ID    │ │ from workers        │
│ 返回400无效ID │ │ 准备DELETE语句      │
└───────────────┘ └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Bind ID parameter   │
                  │ Execute DELETE      │
                  │ 绑定ID参数          │
                  │ 执行DELETE          │
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Execute        │
                    │ successful?    │
                    │ 执行成功?      │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌────────────────┐ ┌───────────────┐
          │ affected_rows  │ │ Return 503    │
          │ > 0?           │ │ DB Error      │
          │ 影响行数>0?    │ │ 返回503错误   │
          └───────┬────────┘ └───────────────┘
                  │
         ┌──YES───┴───NO──┐
         │                │
         ▼                ▼
┌───────────────┐ ┌───────────────┐
│ Return 200    │ │ Return 404    │
│ "Worker was   │ │ "Worker not   │
│ deleted"      │ │ found"        │
│ 返回200已删除 │ │ 返回404未找到 │
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌───────────────┐
        │  END / 结束   │
        └───────────────┘
```

---

## 4.3 Delete Work Log / 删除工作日志

### File Location / 文件位置
`api/api_delete_worklog.php`

### HTTP Method / HTTP 方法
`DELETE`

### Code Snippet / 代码片段

**Lines 14-20: ID Validation / ID验证**
```php
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(array("message" => "Invalid work log ID provided."));
    die();
}
```

**Lines 22-26: DELETE Statement / DELETE语句**
```php
$sql = "DELETE FROM work_logs WHERE id = ?";

$stmt = $conn->prepare($sql);

$stmt->bind_param("i", $id);
```

**Lines 28-39: Execute and Response / 执行和响应**
```php
if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array("message" => "Work log was deleted."));
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Work log not found with ID {$id}."));
    }
} else {
    http_response_code(503);
    echo json_encode(array("message" => "Unable to delete work log."));
}
```

### Explanation / 说明

**English:**
This function deletes a work log entry from the database. The pattern is identical to the other delete operations - it extracts the ID from the URL query parameter, validates it's a positive integer, executes the DELETE query using a prepared statement, and returns appropriate HTTP status codes (200 for success, 404 if not found, 503 for errors). This maintains consistency across all delete operations in the API.

**中文:**
此功能从数据库中删除工作日志条目。其模式与其他删除操作相同——它从 URL 查询参数中提取 ID，验证其为正整数，使用预处理语句执行 DELETE 查询，并返回适当的 HTTP 状态代码（200 表示成功，404 表示未找到，503 表示错误）。这保持了 API 中所有删除操作的一致性。

### Flowchart / 流程图

```
┌─────────────────────────────────────┐
│         START / 开始                │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Receive DELETE Request           │
│    URL: ?id=123                     │
│    接收DELETE请求                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    Extract ID from $_GET['id']      │
│    Use intval() for security        │
│    从$_GET['id']提取ID              │
│    使用intval()确保安全             │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ ID > 0?        │
         │ ID有效?        │
         └───────┬────────┘
                 │
        ┌────NO─┴─YES────┐
        │                │
        ▼                ▼
┌───────────────┐ ┌─────────────────────┐
│ Return 400    │ │ Prepare DELETE      │
│ Invalid ID    │ │ from work_logs      │
│ 返回400无效ID │ │ 准备DELETE语句      │
└───────────────┘ └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Bind ID parameter   │
                  │ Execute DELETE      │
                  │ 绑定ID参数          │
                  │ 执行DELETE          │
                  └──────────┬──────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Execute        │
                    │ successful?    │
                    │ 执行成功?      │
                    └───────┬────────┘
                            │
                   ┌───YES──┴──NO───┐
                   │                │
                   ▼                ▼
          ┌────────────────┐ ┌───────────────┐
          │ affected_rows  │ │ Return 503    │
          │ > 0?           │ │ DB Error      │
          │ 影响行数>0?    │ │ 返回503错误   │
          └───────┬────────┘ └───────────────┘
                  │
         ┌──YES───┴───NO──┐
         │                │
         ▼                ▼
┌───────────────┐ ┌───────────────┐
│ Return 200    │ │ Return 404    │
│ "Work log was │ │ "Work log not │
│ deleted"      │ │ found"        │
│ 返回200已删除 │ │ 返回404未找到 │
└───────┬───────┘ └───────┬───────┘
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌───────────────┐
        │  END / 结束   │
        └───────────────┘
```

---

# Summary Table / 总结表

| Operation 操作 | Entity 实体 | File 文件 | HTTP Method HTTP方法 | Key Lines 关键行 |
|----------------|-------------|-----------|----------------------|-------------------|
| **CREATE** |
| Add Customer 添加客户 | customers | api_add_customer.php | POST | 65-78 |
| Add Worker 添加工人 | workers | api_add_worker.php | POST | 97-118 |
| Add Work Log 添加工作日志 | work_logs | api_add_worklog.php | POST | 50-60 |
| **READ** |
| Get Customers 获取客户 | customers | api_get_customer.php | GET | 21-24 |
| Get Workers 获取工人 | api_worker.php | GET | 17 |
| Get Work Logs 获取工作日志 | work_logs | api_get_worklogs.php | GET | 15-32 |
| **UPDATE** |
| Update Customer 更新客户 | customers | api_update_customer.php | PUT/POST | 41-54 |
| Update Worker 更新工人 | workers | api_update_worker.php | PUT/POST | 51-63 |
| Update Work Log 更新工作日志 | work_logs | api_update_worklog.php | PUT/POST | 45-56 |
| **DELETE** |
| Delete Customer 删除客户 | customers | api_delete_customer.php | DELETE | 22-26 |
| Delete Worker 删除工人 | workers | api_delete_worker.php | DELETE | 28-34 |
| Delete Work Log 删除工作日志 | work_logs | api_delete_worklog.php | DELETE | 22-26 |

---

# Security Features / 安全特性

All CRUD operations in EasiSawit implement the following security measures:

EasiSawit 中的所有 CRUD 操作都实施了以下安全措施：

1. **Prepared Statements / 预处理语句**: All SQL queries use parameterized queries to prevent SQL injection attacks.
   所有 SQL 查询都使用参数化查询来防止 SQL 注入攻击。

2. **Input Validation / 输入验证**: Required fields are validated before processing.
   在处理之前验证必填字段。

3. **Authentication / 身份验证**: Protected endpoints include `check_auth.php` for session verification.
   受保护的端点包含 `check_auth.php` 用于会话验证。

4. **Type Casting / 类型转换**: IDs are converted to integers using `intval()` for security.
   使用 `intval()` 将 ID 转换为整数以确保安全。

5. **Duplicate Detection / 重复检测**: CREATE operations check for existing records before insertion.
   CREATE 操作在插入前检查是否存在现有记录。

6. **Proper HTTP Status Codes / 正确的HTTP状态码**: Appropriate status codes are returned (200, 201, 400, 404, 409, 503).
   返回适当的状态码（200、201、400、404、409、503）。

---

*Document generated on: 2025-12-29*
*文档生成日期：2025-12-29*
