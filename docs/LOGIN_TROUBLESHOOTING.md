# EasiSawit Admin Login Troubleshooting Guide

## Problem: "Invalid username or password" error

This guide will help you fix the login issue by ensuring the admin user is properly set up in the database.

## Quick Fix (Recommended)

### Step 1: Run the Setup Script

Visit this URL in your browser:

```
http://localhost/easisawit/api/setup_admin.php
```

You should see a JSON response like:

```json
{
  "status": "Creating admin_users table...",
  "table_created": true,
  "admin_user_created": true,
  "username": "admin",
  "password": "admin123",
  "email": "admin@easisawit.local",
  "all_admin_users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@easisawit.local",
      "full_name": "Administrator",
      "is_active": 1
    }
  ],
  "success": true
}
```

### Step 2: Clear Browser Cache

Before logging in again, clear your browser's session storage:

- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "Cookies and other site data"
- Choose "All time"
- Click "Clear data"

### Step 3: Log In

Go to: `http://localhost/easisawit/login.html`

**Default Credentials:**

- **Username:** `admin`
- **Password:** `admin123`

---

## Manual Setup (If Script Doesn't Work)

### Option A: Using phpMyAdmin

1. Open phpMyAdmin: `http://localhost/phpmyadmin/`
2. Select the `easisawit_db` database
3. Go to **SQL** tab
4. Copy and paste the following SQL:

```sql
-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'admin',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO `admin_users`
(`username`, `password`, `email`, `full_name`, `role`, `is_active`)
VALUES
('admin', '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36CMQn1a', 'admin@easisawit.local', 'Administrator', 'admin', 1);
```

5. Click "Go" to execute
6. You should see success messages

### Option B: Using Command Line (MySQL)

```bash
mysql -u root -p easisawit_db < api/migrations.sql
```

Then run the setup script:

```bash
php api/setup_admin.php
```

---

## Verifying the Setup

### Check 1: Verify Table Exists

Visit: `http://localhost/easisawit/api/check_admin_user.php`

You should see a JSON response showing all admin users.

### Check 2: Test Login API

Use a tool like Postman or cURL:

```bash
curl -X POST http://localhost/easisawit/api/api_login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected response (200 OK):

```json
{
  "message": "Login successful",
  "username": "admin",
  "full_name": "Administrator",
  "email": "admin@easisawit.local"
}
```

---

## Troubleshooting

### Issue: Still getting "Invalid username or password"

**Possible Causes:**

1. **Database Connection Failed**

   - Check if MySQL is running (XAMPP Control Panel → MySQL should be green)
   - Verify `db_connect.php` has correct credentials
   - Default: host=localhost, username=root, password=(empty), database=easisawit_db

2. **admin_users Table Doesn't Exist**

   - Run `setup_admin.php`
   - OR manually execute the SQL in phpMyAdmin

3. **No Admin User in Database**

   - Run `setup_admin.php`
   - OR manually insert the admin user using the SQL above

4. **Password Hash Mismatch**
   - The password field stores bcrypt hashes
   - Do NOT try to update it manually with a plain text password
   - Use the setup script which handles hashing correctly

### Issue: setup_admin.php shows an error

Check the browser console for detailed error messages. Common errors:

- **"Connection failed"** → MySQL is not running
- **"Access denied"** → Wrong database credentials in `db_connect.php`
- **"Duplicate entry"** → Admin user already exists (this is OK, try logging in)

### Issue: Can access login page but button doesn't work

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Look for any JavaScript errors
4. Check the **Network** tab to see if api_login.php requests are failing

---

## Creating Additional Admin Users

Once the default admin is working, you can create more admin users via the API or directly in phpMyAdmin:

**Via SQL:**

```sql
INSERT INTO `admin_users`
(`username`, `password`, `email`, `full_name`, `role`, `is_active`)
VALUES
('newadmin', PASSWORD_BCRYPT_HASH_HERE, 'newadmin@easisawit.local', 'New Admin', 'admin', 1);
```

**Note:** You must use PHP's `password_hash()` function to create the bcrypt hash. Never store plain text passwords.

---

## Session Configuration

- **Session Timeout:** 30 minutes of inactivity
- **Session Storage:** PHP server-side sessions
- **Browser Storage:** sessionStorage flag (isLoggedIn)

If you're still logged in but the site doesn't recognize it:

1. Clear cookies/cache (Ctrl+Shift+Delete)
2. Close and reopen the browser
3. Log in again

---

## Still Having Issues?

1. **Check API Status:**

   ```
   http://localhost/easisawit/api/check_admin_user.php
   ```

2. **Check Database Connection:**
   Create a file `test_db.php` with:

   ```php
   <?php include 'api/db_connect.php'; echo "Connected!"; ?>
   ```

3. **Check PHP Version:**
   Create a file `info.php` with:
   ```php
   <?php phpinfo(); ?>
   ```
   Ensure PHP version ≥ 7.0 (password_hash function required)

---

## Contact & Support

For more detailed information, see:

- `SETUP_GUIDE.md` - Full system setup
- `BUG_REPORT.md` - Known issues
- `FIXES_APPLIED.md` - Recent fixes applied
