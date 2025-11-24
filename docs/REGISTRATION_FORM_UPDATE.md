# Customer Registration Form Update

## Date: 2025-11-24

## Changes Made

### Form Fields Updated

**BEFORE**:
- Name *
- Email *
- Contact *
- Company Name
- Requested Rate (RM per ton)

**AFTER**:
- Name *
- Email *
- Contact *
- **Location** (changed from "Company Name")
- **Acres** (changed from "Requested Rate")

---

## Database Changes

### New Columns Added to `customer_applications` table:

```sql
ALTER TABLE customer_applications
ADD COLUMN location VARCHAR(255) NULL AFTER contact,
ADD COLUMN acres DECIMAL(10,2) NULL AFTER location;
```

### Updated Table Structure:
| Field | Type | Null | Default |
|-------|------|------|---------|
| id | int(11) | NO | auto_increment |
| name | varchar(255) | NO | - |
| email | varchar(255) | NO | - |
| contact | varchar(255) | NO | - |
| **location** | **varchar(255)** | **YES** | **NULL** ✨ NEW |
| **acres** | **decimal(10,2)** | **YES** | **NULL** ✨ NEW |
| company_name | varchar(255) | YES | NULL |
| rate_requested | decimal(10,2) | YES | NULL |
| status | varchar(50) | NO | pending |
| rejection_reason | text | YES | NULL |
| submitted_at | timestamp | NO | current_timestamp() |
| reviewed_at | timestamp | YES | NULL |
| reviewed_by | varchar(100) | YES | NULL |

**Note**: `company_name` and `rate_requested` columns are kept for backwards compatibility but no longer used in the registration form.

---

## Files Modified

### 1. **register.html**

**Form Fields**:
```html
<!-- BEFORE -->
<div class="form-group">
  <label>Company Name</label>
  <input type="text" id="company_name" name="company_name" />
</div>

<div class="form-group">
  <label>Requested Rate (RM per ton)</label>
  <input type="number" id="rate_requested" name="rate_requested" />
</div>

<!-- AFTER -->
<div class="form-group">
  <label>Location</label>
  <input type="text" id="location" name="location" />
</div>

<div class="form-group">
  <label>Acres</label>
  <input type="number" id="acres" name="acres" step="0.01" min="0" />
</div>
```

**JavaScript**:
```javascript
// BEFORE
const formData = {
  name: ...,
  email: ...,
  contact: ...,
  company_name: ...,
  rate_requested: ...
};

// AFTER
const formData = {
  name: ...,
  email: ...,
  contact: ...,
  location: ...,
  acres: ...
};
```

---

### 2. **api/api_submit_application.php**

**Changes**:
- Added handling for `location` field
- Added handling for `acres` field
- Updated SQL INSERT statement
- Updated bind_param to include new fields

```php
// BEFORE
$stmt->bind_param("ssssd", $name, $email, $contact, $company_name, $rate_requested);

// AFTER
$stmt->bind_param("ssssdsd", $name, $email, $contact, $location, $acres, $company_name, $rate_requested);
```

---

### 3. **api/api_get_customer_applications.php**

**Changes**:
- Updated SELECT query to include `location` and `acres`

```php
// BEFORE
SELECT id, name, email, contact, company_name, rate_requested, ...

// AFTER
SELECT id, name, email, contact, location, acres, company_name, rate_requested, ...
```

---

### 4. **customer_applications.html**

**Application Cards** - Display in list view:
```javascript
// BEFORE
${app.company_name ? `<i data-lucide="building"></i> ${app.company_name}` : ''}
${app.rate_requested ? `<i data-lucide="dollar-sign"></i> RM ${app.rate_requested}` : ''}

// AFTER
${app.location ? `<i data-lucide="map-pin"></i> ${app.location}` : ''}
${app.acres ? `<i data-lucide="maximize"></i> ${app.acres} acres` : ''}
```

**Detail Modal** - Display in popup:
```javascript
// BEFORE
<label>Company Name</label>
<p>${app.company_name}</p>

<label>Requested Rate</label>
<p>RM ${app.rate_requested} per ton</p>

// AFTER
<label>Location</label>
<p>${app.location}</p>

<label>Acres</label>
<p>${app.acres} acres</p>
```

---

### 5. **check_applications.php**

**Table Columns**:
```html
<!-- BEFORE -->
<th>Company</th>
<th>Rate</th>

<!-- AFTER -->
<th>Location</th>
<th>Acres</th>
```

**Table Data**:
```php
// BEFORE
<td><?php echo $app['company_name'] ?? 'N/A'; ?></td>
<td><?php echo $app['rate_requested'] ? 'RM ' . $app['rate_requested'] : 'N/A'; ?></td>

// AFTER
<td><?php echo $app['location'] ?? 'N/A'; ?></td>
<td><?php echo $app['acres'] ? $app['acres'] . ' acres' : 'N/A'; ?></td>
```

---

## Testing Results

### Test Application Created:
```
ID: 9
Name: Test New Fields User
Email: newfields@test.com
Contact: 019-1234567
Location: Johor Bahru ✅
Acres: 150.75 ✅
Status: pending
```

### Verification:
- ✅ Form displays new fields correctly
- ✅ Form submits successfully with new fields
- ✅ Data saves to database correctly
- ✅ Customer Applications page displays new fields
- ✅ Check Applications page displays new fields
- ✅ Detail modal shows new fields

---

## Current Applications

### With New Fields:
| ID | Name | Location | Acres | Status |
|----|------|----------|-------|--------|
| 9 | Test New Fields User | Johor Bahru | 150.75 | pending |

### Old Applications (before update):
| ID | Name | Company Name | Rate | Status |
|----|------|--------------|------|--------|
| 1-7 | Various | N/A | N/A | pending |

---

## How to Use

### For Customers (Public Registration):

1. Open: **http://localhost/easisawit/register.html**
2. Fill in the form:
   - **Name** * (required)
   - **Email** * (required)
   - **Contact** * (required)
   - **Location** (optional) - e.g., "Johor Bahru", "Selangor"
   - **Acres** (optional) - e.g., 100, 150.5
3. Submit application
4. Receive confirmation with Application ID

### For Admins (Review Applications):

1. Login to admin panel
2. Open: **http://localhost/easisawit/customer_applications.html**
3. View applications with Location and Acres information
4. Click on any application to see full details
5. Approve or reject as needed

---

## Migration Notes

### Backwards Compatibility:
- Old columns (`company_name`, `rate_requested`) are **kept** in the database
- Existing applications will show "N/A" for new fields
- New applications will show "N/A" for old fields
- No data loss or migration required

### Old Data:
- Applications submitted before this update will have:
  - `location` = NULL
  - `acres` = NULL
  - May have `company_name` and/or `rate_requested` values

### New Data:
- Applications submitted after this update will have:
  - `location` = user input or NULL
  - `acres` = user input or NULL
  - `company_name` = NULL (not collected anymore)
  - `rate_requested` = NULL (not collected anymore)

---

## Field Descriptions

### Location
- **Type**: Text (VARCHAR 255)
- **Purpose**: Geographic location of the customer's farm/plantation
- **Example**: "Johor Bahru", "Kuala Lumpur", "Penang"
- **Optional**: Yes

### Acres
- **Type**: Decimal (10,2)
- **Purpose**: Size of the customer's farm/plantation in acres
- **Example**: 100.00, 150.75, 250.50
- **Optional**: Yes
- **Validation**: Must be positive number, allows 2 decimal places

---

## Testing Checklist

- ✅ Database table updated with new columns
- ✅ Registration form displays new fields
- ✅ Form submission works with new fields
- ✅ API accepts and saves new fields
- ✅ Customer Applications page shows new fields in cards
- ✅ Customer Applications page shows new fields in detail modal
- ✅ Check Applications page displays new fields
- ✅ Old applications still display correctly (with N/A for new fields)
- ✅ New applications display correctly
- ✅ Approve functionality still works
- ✅ Reject functionality still works

---

## Related Files

- `register.html` - Customer registration form
- `api/api_submit_application.php` - Submission API
- `api/api_get_customer_applications.php` - Get applications API
- `customer_applications.html` - Admin review page
- `check_applications.php` - Debug/verification page

---

**Status**: ✅ Complete and Tested
**Last Updated**: 2025-11-24
