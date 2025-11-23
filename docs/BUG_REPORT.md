# EasiSawit System - Bug Report

**Date**: November 16, 2025  
**Status**: Critical Issues Found

---

## Summary

Found **6 bugs** across the system affecting authentication, logout functionality, login navigation, and data integrity. Most are **CRITICAL** and should be fixed immediately.

---

## 🔴 CRITICAL BUGS

### Bug #1: Logout Button Non-Functional (CRITICAL)

**Location**: `index.html` (Navigation component in `app_logic.js`)  
**Severity**: CRITICAL - Users cannot log out  
**Issue**: The logout button in the Navigation bar is not connected to any handler function.

**Code**:

```javascript
<button className="flex items-center space-x-1 bg-emerald-600 px-2 sm:px-3 py-2 rounded hover:bg-emerald-800 transition">
  <i data-lucide="log-out" style={{ width: 16, height: 16 }}></i>
  <span className="text-xs sm:text-sm hidden sm:inline">{t.logout}</span>
</button>
```

**Impact**:

- Users cannot logout from the dashboard
- Session remains active indefinitely
- Security risk: No way to terminate sessions properly

**Fix Required**: Add `onClick` handler to call logout function

```javascript
<button onClick={handleLogout} className="flex items-center space-x-1 bg-emerald-600 px-2 sm:px-3 py-2 rounded hover:bg-emerald-800 transition">
```

---

### Bug #2: Missing Logout Handler Function (CRITICAL)

**Location**: `app_logic.js` (EasiSawit component)  
**Severity**: CRITICAL - Logout functionality not implemented  
**Issue**: No `handleLogout` function exists in the component to clear session and redirect user.

**Impact**:

- Cannot logout properly
- No session termination
- User stays authenticated even after browser close (due to PHP session persistence)

**Fix Required**: Add logout handler:

```javascript
const handleLogout = useCallback(async () => {
  try {
    const response = await fetch(`${API_URL}/api_logout.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      sessionStorage.clear();
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("Error logging out");
  }
}, [API_URL]);
```

---

### Bug #3: Login Page Missing Redirect Logic (CRITICAL)

**Location**: `login.html`  
**Severity**: CRITICAL - Authentication bypass vulnerability  
**Issue**: The login page stores login status in `sessionStorage` but does NOT check if user is already logged in. Any user can access `login.html` directly even if already authenticated.

**Current Code**:

```javascript
// No check for existing session/authentication
```

**Impact**:

- Security vulnerability: Users can re-login multiple times
- No protection against session hijacking
- Confusing UX if already logged-in user revisits login page

**Fix Required**: Add session check on page load:

```javascript
// Add this before the login form in login.html
<script>
  // Check if already logged in
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = 'index.html';
  }
</script>
```

---

### Bug #4: No Session Verification on Dashboard Load (HIGH)

**Location**: `app_logic.js` (EasiSawit component - useEffect hook)  
**Severity**: HIGH - Unauthenticated users can access dashboard  
**Issue**: The dashboard (`index.html`) does NOT verify if user is logged in. Any user can access it directly by typing URL.

**Impact**:

- Unauthenticated access possible
- No route protection
- APIs will reject requests but UI is still accessible

**Fix Required**: Add session verification on app load:

```javascript
useEffect(() => {
  // Verify session with backend before loading app
  if (!sessionStorage.getItem("isLoggedIn")) {
    // Check with server
    fetch(`${API_URL}/check_auth.php`)
      .then((res) => {
        if (!res.ok) {
          window.location.href = "login.html";
        }
      })
      .catch(() => {
        window.location.href = "login.html";
      });
  }
}, []);
```

---

### Bug #5: Missing "last_purchase_date" Column Initialization (HIGH)

**Location**: Database schema (during customer creation)  
**Severity**: HIGH - New customers excluded from active list  
**Issue**: When adding a new customer via `api_add_customer.php`, the `last_purchase_date` column is NOT initialized. This causes new customers to be excluded from the active customer list (which requires `last_purchase_date IS NOT NULL AND last_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)`).

**Code (api_add_customer.php)**:

```php
$sql = "INSERT INTO customers (name, contact, rate) VALUES (?, ?, ?)";
// ❌ last_purchase_date is NOT set, defaults to NULL
```

**Impact**:

- New customers don't appear in the active customer list
- Workaround needed: Admin must manually add work log first
- Inconsistent data state

**Fix Required**: Initialize `last_purchase_date` to today:

```php
$sql = "INSERT INTO customers (name, contact, rate, last_purchase_date) VALUES (?, ?, ?, ?)";
$today = date('Y-m-d');
$stmt->bind_param("ssds", $data->name, $contact, $data->rate, $today);
```

---

### Bug #6: Misleading Error Message in Logout Handler (MEDIUM)

**Location**: `api_logout.php`  
**Severity**: MEDIUM - UX issue, confusing user  
**Issue**: `api_logout.php` uses `session_destroy()` which may fail silently on some PHP configurations. No error checking is performed.

**Code**:

```php
session_unset();
session_destroy(); // May fail silently

echo json_encode(array("message" => "Logout successful")); // Always says success
```

**Impact**:

- Session may not be destroyed but API says success
- Confusing user experience
- Silent failures not reported

**Fix Required**: Add error checking:

```php
session_unset();
$destroy_result = session_destroy();

if ($destroy_result === false) {
    http_response_code(500);
    echo json_encode(array(
        "message" => "Failed to destroy session",
        "error" => "Session destruction failed"
    ));
} else {
    http_response_code(200);
    echo json_encode(array("message" => "Logout successful"));
}
```

---

## ⚠️ MEDIUM SEVERITY ISSUES

### Issue #7: No Password Reset Functionality

**Location**: `login.html` (line with "Forgot password?" link)  
**Severity**: MEDIUM - Non-functional link  
**Issue**: "Forgot password?" link points to `#` (no destination)

**Impact**:

- Users with forgotten passwords have no recovery option
- Dead link in UI

---

### Issue #8: Email Configuration Hardcoded

**Location**: `api_submit_application.php` (line ~80)  
**Severity**: MEDIUM - Configuration issue  
**Issue**: Admin email is hardcoded as `admin@easisawit.local` which likely won't receive emails

**Impact**:

- Customer registration emails go nowhere
- Admin never notified of new applications

---

### Issue #9: No API Response Validation After Login

**Location**: `login.html` - JavaScript login handler  
**Severity**: MEDIUM - Potential security issue  
**Issue**: After login redirect, no verification that user is actually authenticated on the backend

**Impact**:

- Could be session timing issue
- User might be redirected to dashboard but session already expired

---

## 📋 MINOR/INFORMATIONAL ISSUES

### Issue #10: Typo in API Filename

**Location**: File system  
**File**: `api_generat_report.php` should be `api_generate_report.php`  
**Severity**: LOW - Confusing

### Issue #11: Missing Mobile Logout Button Text

**Location**: Navigation component  
**Severity**: LOW - UX issue  
**Issue**: On mobile screens, logout button label is hidden, only icon shows

---

## 🔧 RECOMMENDED FIXES (Priority Order)

### Phase 1 - CRITICAL (Fix Immediately)

1. ✅ Add `handleLogout` function to `app_logic.js`
2. ✅ Add onClick handler to logout button
3. ✅ Add session check redirect in `login.html`
4. ✅ Initialize `last_purchase_date` in `api_add_customer.php`

### Phase 2 - HIGH (Fix Soon)

5. ✅ Add session verification on dashboard load
6. ✅ Add error checking in `api_logout.php`

### Phase 3 - MEDIUM (Fix When Convenient)

7. ✅ Implement password reset functionality
8. ✅ Fix email configuration
9. ✅ Fix `api_generat_report.php` typo

---

## 📊 Bug Statistics

- **Critical**: 4 bugs
- **High**: 2 bugs
- **Medium**: 3 bugs
- **Low**: 2 issues
- **Total**: 11 issues found

---

## ✅ Tests to Run After Fixes

- [ ] Login with admin/admin123 → should work
- [ ] Click logout button → should redirect to login
- [ ] Visit login.html while logged in → should redirect to dashboard
- [ ] Try accessing index.html while not logged in → should redirect to login
- [ ] Add new customer → should appear in active list immediately
- [ ] Verify session timeout works after 30 minutes
- [ ] Test on mobile → logout button should be visible

---

**Prepared by**: Code Analysis System  
**Last Updated**: November 16, 2025
