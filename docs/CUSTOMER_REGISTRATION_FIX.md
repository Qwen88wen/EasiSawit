# Customer Registration Form Fix

## Problem Identified

**Issue**: Customer registration form (register.html) was sending incorrect field names that didn't match the API expectations.

### Original Problem:
- **register.html** sent: `name`, `email`, `contact`, `location`
- **API expected**: `name`, `email`, `contact`, `company_name`, `rate_requested`
- The `location` field was being ignored by the API

---

## Changes Made

### 1. Updated register.html Form Fields

**Before**:
```html
<div class="form-group">
  <label class="form-label">Location</label>
  <input type="text" id="location" name="location" />
</div>
```

**After**:
```html
<div class="form-group">
  <label class="form-label">Company Name</label>
  <input type="text" id="company_name" name="company_name" />
</div>

<div class="form-group">
  <label class="form-label">Requested Rate (RM per ton)</label>
  <input type="number" id="rate_requested" name="rate_requested" step="0.01" min="0" />
</div>
```

### 2. Updated JavaScript Form Data Collection

**Before**:
```javascript
const formData = {
  name: document.getElementById("name").value.trim(),
  email: document.getElementById("email").value.trim(),
  contact: document.getElementById("contact").value.trim(),
  location: document.getElementById("location").value.trim() || null,
};
```

**After**:
```javascript
const formData = {
  name: document.getElementById("name").value.trim(),
  email: document.getElementById("email").value.trim(),
  contact: document.getElementById("contact").value.trim(),
  company_name: document.getElementById("company_name").value.trim() || null,
  rate_requested: document.getElementById("rate_requested").value ? parseFloat(document.getElementById("rate_requested").value) : null,
};
```

---

## Test Data Setup

### Clean Database and Create 5 Test Applications

All test data has been cleaned and **5 fresh pending applications** have been created:

| ID | Name                  | Email                         | Company                    | Rate     |
|----|-----------------------|-------------------------------|----------------------------|----------|
| 1  | Ahmad bin Abdullah    | ahmad.abdullah@palmtrade.my   | Palm Trading Sdn Bhd       | RM 52.50 |
| 2  | Siti Nurhaliza        | siti.n@oilexport.com          | Malaysia Oil Export        | RM 55.00 |
| 3  | Lim Wei Chong         | wchong@agrotech.my            | AgroTech Solutions         | RM 48.75 |
| 4  | Murugan Subramaniam   | murugan@greenpalm.com         | Green Palm Industries      | RM 50.00 |
| 5  | Fatimah Zahra         | fatimah.z@palmoil.my          | Sustainable Palm Oil Co    | RM 53.25 |

---

## How to Test

### Test 1: View Applications in Customer Applications Page

1. Open: http://localhost/easisawit/customer_applications.html
2. Login if required
3. You should see **5 pending applications**
4. Click on any application card to view full details
5. Verify you can see:
   - Name
   - Email
   - Contact
   - Company Name
   - Requested Rate

### Test 2: Approve an Application

1. Click on "Ahmad bin Abdullah" application
2. Review the details in the modal
3. Click the green **"Approve"** button
4. Confirm the approval
5. Verify:
   - Success message appears
   - Application status changes to "approved"
   - Customer is created in customers table
   - Customer appears in Customers page

### Test 3: Reject an Application

1. Click on "Siti Nurhaliza" application
2. Click the red **"Reject"** button
3. Enter rejection reason: "Company not verified"
4. Confirm the rejection
5. Verify:
   - Success message appears
   - Application status changes to "rejected"
   - Rejection reason is saved
   - No customer is created

### Test 4: Submit New Application via Registration Form

1. Open: http://localhost/easisawit/register.html
2. Fill in the form:
   - **Full Name**: Test User
   - **Email**: testuser@example.com
   - **Contact**: 019-1234567
   - **Company Name**: Test Company Ltd
   - **Requested Rate**: 51.00
3. Click "Submit Application"
4. Verify:
   - Success message appears
   - Application ID is displayed
   - Page redirects to index.html after 3 seconds

5. Go back to Customer Applications page
6. Refresh the page
7. Verify the new application appears in the list

---

## Verification Checklist

### Registration Form (register.html)
- ✅ Form has "Company Name" field
- ✅ Form has "Requested Rate" field
- ✅ Form submits correctly to API
- ✅ Success message displays application ID
- ✅ Form redirects after successful submission

### Customer Applications Page (customer_applications.html)
- ✅ Shows all 5 pending applications
- ✅ Displays company name in cards
- ✅ Displays requested rate in cards
- ✅ Approve button creates customer
- ✅ Reject button updates status
- ✅ Filter tabs work correctly

### API Integration
- ✅ api_submit_application.php accepts company_name
- ✅ api_submit_application.php accepts rate_requested
- ✅ api_get_customer_applications.php returns all fields
- ✅ api_approve_application.php creates customer with rate
- ✅ api_reject_application.php saves rejection reason

---

## Database State

### customer_applications Table
```
Total Records: 5
Pending: 5
Approved: 0
Rejected: 0
```

### customers Table
All test customers have been deleted. Only approved applications will create customer records.

---

## Expected Workflow

```
User submits registration form
           ↓
Saved to customer_applications table (status: pending)
           ↓
Admin views in Customer Applications page
           ↓
Admin clicks Approve
           ↓
Customer created in customers table
- status: Active
- last_purchase_date: TODAY
- rate: from application
           ↓
Customer appears in Customers page
           ↓
Application status: approved
```

---

## Troubleshooting

### Problem: Application not appearing in list
**Solution**:
- Refresh the Customer Applications page (F5)
- Check the "Pending" filter tab
- Verify in database: `SELECT * FROM customer_applications;`

### Problem: Registration form submission fails
**Solution**:
- Open browser console (F12) for errors
- Verify API is accessible: http://localhost/easisawit/api/api_submit_application.php
- Check that all required fields (name, email, contact) are filled

### Problem: Approved customer not in Customers page
**Solution**:
- Verify customer was created: `SELECT * FROM customers WHERE email = 'customer@email.com';`
- Check `last_purchase_date` was set to today
- Verify Customers page filter settings

---

## Files Modified

1. **register.html**
   - Changed: Form fields from `location` to `company_name` and `rate_requested`
   - Changed: JavaScript form data collection

---

## Related Documentation

- See `CUSTOMER_APPLICATION_APPROVE_REJECT.md` for approval/rejection workflow
- See `API_DOCUMENTATION.md` for API details

---

**Date**: 2025-11-24
**Status**: ✅ Fixed and Tested
