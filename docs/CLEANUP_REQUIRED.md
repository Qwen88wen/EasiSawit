# Manual Cleanup Required

## Debug Files to Remove (Before Fresh Database Setup)

The following temporary files were created during troubleshooting and should be manually deleted before going to production:

### In `/api/` directory:

```
- api_generat_report.php          (OLD TYPO - replaced by api_generate_report.php)
- debug_password.php              (Password verification debugger)
- fix_admin_password.php          (Hash generator script)
- recreate_admin.php              (Admin recreation script)
- setup_admin.php                 (Automatic setup script)
- check_admin_user.php            (Diagnostic script)
```

### In root directory:

```
- login_tester.html               (Interactive testing UI)
```

## Why These Need Removal

These files were created during the initial login troubleshooting phase when investigating the password hash mismatch issue. They are **not part of the production codebase** and should be removed for:

1. **Security**: No debug code in production
2. **Clarity**: Cleaner codebase without development artifacts
3. **Maintenance**: Reduced confusion about which files are production code
4. **Professional**: Clean project structure

## How to Remove

### Via File Explorer (Easiest)

1. Open `c:\Users\swima\Desktop\xampp\htdocs\easisawit\api\`
2. Select each file listed above
3. Delete them

### Via Command Line (PowerShell)

```powershell
Remove-Item "c:\Users\swima\Desktop\xampp\htdocs\easisawit\api\api_generat_report.php" -Force
Remove-Item "c:\Users\swima\Desktop\xampp\htdocs\easisawit\api\debug_password.php" -Force
Remove-Item "c:\Users\swima\Desktop\xampp\htdocs\easisawit\api\fix_admin_password.php" -Force
Remove-Item "c:\Users\swima\Desktop\xampp\htdocs\easisawit\api\recreate_admin.php" -Force
Remove-Item "c:\Users\swima\Desktop\xampp\htdocs\easisawit\api\setup_admin.php" -Force
Remove-Item "c:\Users\swima\Desktop\xampp\htdocs\easisawit\api\check_admin_user.php" -Force
Remove-Item "c:\Users\swima\Desktop\xampp\htdocs\easisawit\login_tester.html" -Force
```

## Files to Keep ✅

All other files in the project should be retained:

### API Files (Keep All)

- api_add_customer.php
- api_add_worker.php
- api_add_worklog.php
- api_calculate_payroll.php
- api_delete_customer.php
- api_delete_worker.php
- api_delete_worklog.php
- api_generate_management_report.php
- api_generate_payslips.php
- **api_generate_report.php** (NEW - replaces typo file)
- api_get_archived_customers.php
- api_get_customer.php
- api_get_price.php
- api_get_worklogs.php
- api_login.php
- api_logout.php
- api_reactivate_customer.php
- api_submit_application.php
- api_update_customer.php
- api_update_worker.php
- api_update_worklog.php
- api_worker.php
- check_auth.php
- db_connect.php

### Database Files (Keep All)

- easisawit_db.sql
- migrations.sql
- price_cache.json

### Frontend Files (Keep All)

- index.html
- login.html
- register.html
- app_logic.js
- app_components.js
- modal_components.js
- view_components.js
- translations.js
- styles.css

### Documentation Files (Keep All)

- SETUP_GUIDE.md
- COMPREHENSIVE_BUG_AUDIT.md
- AUDIT_COMPLETION_SUMMARY.md
- This file (CLEANUP_REQUIRED.md)

---

## Verification

After cleanup, your project structure should look like:

```
easisawit/
├── api/
│   ├── api_add_customer.php
│   ├── api_add_worker.php
│   ├── ... (all production API files)
│   ├── api_generate_report.php        ✅ (CORRECT - no typo)
│   ├── check_auth.php
│   ├── db_connect.php
│   ├── easisawit_db.sql
│   ├── migrations.sql
│   └── price_cache.json
├── TCPDF/
│   └── (TCPDF library files)
├── index.html
├── login.html
├── register.html
├── app_logic.js
├── app_components.js
├── modal_components.js
├── view_components.js
├── translations.js
├── styles.css
├── SETUP_GUIDE.md
├── COMPREHENSIVE_BUG_AUDIT.md
└── AUDIT_COMPLETION_SUMMARY.md
```

**Note**: The following should NOT appear:

- ❌ api_generat_report.php
- ❌ debug_password.php
- ❌ fix_admin_password.php
- ❌ recreate_admin.php
- ❌ setup_admin.php
- ❌ check_admin_user.php
- ❌ login_tester.html

---

## Next Steps After Cleanup

1. ✅ Delete files listed above
2. ✅ Verify no debug files remain
3. Follow **AUDIT_COMPLETION_SUMMARY.md** for fresh database setup
4. Ready for production deployment!

---

**Important**: Complete this cleanup before going to production.
