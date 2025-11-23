# EasiSawit - Agricultural Payroll System

## Complete Implementation Guide (With Track 2 Features)

---

## 📋 Quick Start Summary

### New Features Implemented (Track 2):

1. ✅ **Customer Archiving** - Auto-archive inactive customers (>15 days)
2. ✅ **Admin Authentication** - Secure login system with PHP sessions
3. ✅ **Customer Registration API** - Public endpoint for customer applications
4. ✅ **Archived Customer Management** - View and reactivate inactive customers

---

## 🔧 SETUP INSTRUCTIONS (XAMPP ONLY)

### Step 1: Install & Start XAMPP

1. Install XAMPP from [apachefriends.org](https://www.apachefriends.org)
2. Install to `C:\xampp` (default)
3. Open **XAMPP Control Panel** → Start **Apache** and **MySQL**

### Step 2: Copy Project Files

```
Copy: C:\Users\swima\Desktop\WAP assignment_1\WAP assignment_1\*
To:   C:\xampp\htdocs\easisawit\
```

### Step 3: Create Database

1. Open: `http://localhost/phpmyadmin`
2. Click **New** → Database name: `easisawit_db` → **Create**
3. Select `easisawit_db` → **SQL** tab
4. Copy entire content of `easisawit_db.sql`
5. Paste → **Go**
6. **Execute migrations.sql**: Import `api/migrations.sql` same way

### Step 4: Access Application

- **Admin Dashboard**: `http://localhost/easisawit/`
- **Login Page**: `http://localhost/easisawit/login.html`
- **Register as Customer**: `http://localhost/easisawit/register.html`

---

## 🔐 AUTHENTICATION SETUP

### Default Admin Credentials (For Testing)

```
Username: admin
Password: admin123
```

### Password Hash Information

- Algorithm: bcrypt (PHP `password_hash()`)
- Pre-hashed "admin123" included in migration
- To create new admin: Use PHP `password_hash("your_password", PASSWORD_BCRYPT)`

### Login Flow

1. User navigates to `login.html`
2. Submits credentials to `api/api_login.php`
3. Backend verifies against `admin_users` table
4. Sets PHP session variables
5. Redirects to `index.html` (dashboard)

---

## 📊 DATABASE CHANGES

### New Tables Created:

1. **admin_users** - Admin user accounts
2. **customer_applications** - Pending customer registrations
3. **activity_logs** - Audit trail

### Modified Tables:

1. **customers** - Added `last_purchase_date` (DATE column)

### Migration File

- Location: `api/migrations.sql`
- Execute in phpMyAdmin after creating base database

---

## 🛡️ SECURITY IMPLEMENTATION

### Protected APIs (Require Login)

All these endpoints now check session/authentication:

- ✅ `api_add_worker.php`
- ✅ `api_delete_worker.php`
- ✅ `api_update_worker.php`
- ✅ `api_add_worklog.php`
- ✅ `api_delete_worklog.php`
- ✅ `api_update_worklog.php`
- ✅ `api_add_customer.php`
- ✅ `api_delete_customer.php`
- ✅ `api_update_customer.php`
- ✅ `api_calculate_payroll.php`
- ✅ `api_get_customer.php` (Modified for filtering)
- ✅ `api_get_archived_customers.php` (New)
- ✅ `api_reactivate_customer.php` (New)

### Public APIs (No Login Required)

- 🌐 `api_submit_application.php` (New customer registration)
- 🌐 `api_get_worklogs.php` (Existing - left public)
- 🌐 `api_get_worker.php` (Existing - left public)

### Session Timeout

- Default: 30 minutes of inactivity
- Configurable in `check_auth.php`

---

## 🔄 NEW FEATURES DETAILED

### 1. Customer Archiving System

**How It Works:**

- When a work log is added → customer's `last_purchase_date` is set to today
- Active customers: `last_purchase_date` within last 15 days
- Archived customers: No activity for 15+ days (or NULL)

**API Endpoints:**

#### Get Active Customers (Protected)

```
GET: api/api_get_customer.php
Headers: Session cookie (automatic after login)
Response: Only customers active in last 15 days
```

#### Get Archived Customers (Protected)

```
GET: api/api_get_archived_customers.php
Headers: Session cookie (automatic after login)
Response: Inactive customers (15+ days without activity)
```

#### Reactivate Customer (Protected)

```
POST: api/api_reactivate_customer.php
Body: {
  "customer_id": 123
}
Response: {
  "message": "Customer reactivated successfully",
  "customer_id": 123,
  "last_purchase_date": "2025-11-16"
}
```

### 2. Customer Registration API (Public)

**Purpose**: Allow potential customers to register for approval

**Endpoint:**

```
POST: api/api_submit_application.php
(NO LOGIN REQUIRED)
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "contact": "016-123-4567",
  "company_name": "My Company (optional)",
  "rate_requested": 50.0
}
```

**Response:**

```json
{
  "message": "Application submitted successfully...",
  "application_id": 1,
  "email_sent": true/false
}
```

**Flow:**

1. Customer fills registration form (`register.html`)
2. Data sent to `api_submit_application.php`
3. Data stored in `customer_applications` table
4. HTML email sent to admin (if mail configured)
5. Admin reviews and approves/rejects manually
6. Approved customers moved to `customers` table

**Email Configuration:**

- Modify `$admin_email` in `api/api_submit_application.php` (line ~80)
- Default: `admin@easisawit.local`
- Requires mail server on server

### 3. Login System

**Files:**

- `login.html` - Login UI
- `api/api_login.php` - Login handler
- `api/api_logout.php` - Logout handler
- `api/check_auth.php` - Session middleware

**Session Variables:**

```php
$_SESSION['admin_user_id']    // User ID from database
$_SESSION['username']          // Username
$_SESSION['email']             // User email
$_SESSION['full_name']         // Full name
$_SESSION['role']              // User role (admin)
$_SESSION['last_activity']     // Last activity timestamp
```

---

## 🎯 TESTING CHECKLIST

### Test Login System

- [ ] Navigate to `http://localhost/easisawit/login.html`
- [ ] Login with `admin` / `admin123`
- [ ] Should redirect to dashboard
- [ ] Logout should clear session

### Test Customer Archiving

- [ ] Add work log → Customer `last_purchase_date` updates
- [ ] View active customers → Only recent ones shown
- [ ] Manually update `last_purchase_date` to old date in DB
- [ ] View archived customers → Old customer appears
- [ ] Reactivate customer → Moves back to active list

### Test Customer Registration

- [ ] Navigate to `http://localhost/easisawit/register.html`
- [ ] Fill form and submit
- [ ] Check `customer_applications` table in DB
- [ ] Email sent to admin (if mail configured)

### Test API Security

- [ ] Try accessing `api/api_add_worker.php` without login → Should get 401 error
- [ ] Try accessing `api/api_submit_application.php` without login → Should work (returns 400 if invalid data)

---

## ⚙️ CONFIGURATION

### Admin Email (For Customer Registrations)

**File**: `api/api_submit_application.php` (Line ~80)

```php
$admin_email = "your_email@example.com"; // Change this
```

### Session Timeout

**File**: `api/check_auth.php` (Line ~18)

```php
$session_timeout = 30 * 60; // 30 minutes in seconds
```

### 15-Day Archiving Period

**Files**:

- `api/api_get_customer.php` (Line ~19)
- `api/api_get_archived_customers.php` (Line ~20)

```sql
INTERVAL 15 DAY  -- Change the number to adjust period
```

---

## 📁 FILE STRUCTURE

```
C:\xampp\htdocs\easisawit\
├── index.html                          # Dashboard
├── login.html                          # Admin login (NEW)
├── register.html                       # Customer registration (NEW)
├── app_logic.js                        # React app logic
├── view_components.js
├── modal_components.js
├── app_components.js
├── translations.js
├── styles.css
├── api/
│   ├── db_connect.php
│   ├── check_auth.php                 # Session middleware (NEW)
│   ├── api_login.php                  # Login endpoint (NEW)
│   ├── api_logout.php                 # Logout endpoint (NEW)
│   ├── api_submit_application.php     # Registration (NEW)
│   ├── api_get_customer.php           # Updated with filtering
│   ├── api_get_archived_customers.php # New archiving API
│   ├── api_reactivate_customer.php    # New reactivation API
│   ├── api_add_worklog.php            # Updated to track last_purchase_date
│   ├── api_add_customer.php           # Now requires login
│   ├── api_delete_customer.php        # Now requires login
│   ├── api_update_customer.php        # Now requires login
│   ├── api_add_worker.php             # Now requires login
│   ├── api_delete_worker.php          # Now requires login
│   ├── api_update_worker.php          # Now requires login
│   ├── api_add_worklog.php            # Now requires login
│   ├── api_delete_worklog.php         # Now requires login
│   ├── api_update_worklog.php         # Now requires login
│   ├── api_calculate_payroll.php      # Now requires login
│   ├── api_worker.php
│   ├── api_get_worklogs.php
│   ├── api_get_price.php
│   ├── migrations.sql                 # Database migrations (NEW)
│   └── [other APIs...]
├── TCPDF/
│   └── [TCPDF library files]
└── easisawit_db.sql                  # Base database
```

---

## 🚀 WORKFLOW EXAMPLE

### Admin Workflow

1. Access `http://localhost/easisawit/login.html`
2. Login with admin credentials
3. Dashboard loads with authenticated session
4. Can add/edit workers, work logs, customers
5. Can view active customers
6. Can view and reactivate archived customers
7. Can generate payroll
8. Session expires after 30 minutes of inactivity

### Customer Registration Workflow

1. New customer visits `http://localhost/easisawit/register.html`
2. Fills application form
3. Clicks "Submit Application"
4. Data saved to `customer_applications` table
5. Admin notified via email
6. Admin reviews in database or admin panel
7. Admin moves approved customers to `customers` table manually

---

## 🐛 TROUBLESHOOTING

### Login Not Working

- Check `admin_users` table exists
- Verify admin account created in migrations
- Check session_start() not called twice

### Customers Not Filtering

- Verify `last_purchase_date` column exists
- Check database timezone matches PHP timezone
- Test query: `SELECT * FROM customers WHERE last_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 15 DAY);`

### Email Not Sending

- Windows may require SMTP configuration
- Edit PHP mail settings in `php.ini`
- Or use external SMTP library
- For testing, check database `customer_applications` table instead

### Session Timeout Issues

- Verify cookies enabled in browser
- Check `php.ini` session settings
- Try logging out and back in

---

## 📝 IMPORTANT NOTES

✅ **Backward Compatibility**: All existing functionality maintained
✅ **Database Safe**: Migrations only ADD, never DELETE data
✅ **Secure by Default**: All admin APIs protected
✅ **Flexible**: Can be extended easily
❌ **Email**: Requires mail server on Windows - manual approval OK for now

---

## 📞 SUPPORT

For issues or questions about the implementation, refer to:

- Code comments in each API file
- Database schema in `migrations.sql`
- Session info in `check_auth.php`

---

**Last Updated**: November 16, 2025
**Version**: 2.0 (With Security & Customer Archiving)
