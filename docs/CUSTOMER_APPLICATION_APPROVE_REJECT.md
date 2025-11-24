# Customer Application Approve/Reject Feature

## Overview

The Customer Applications page allows administrators to review and process customer registration requests. Each application can be **approved** (creating a new customer) or **rejected** (with an optional reason).

---

## How to Access

1. Navigate to: **http://localhost/easisawit/customer_applications.html**
2. Login with admin credentials if required
3. You will see the Customer Applications dashboard

---

## Page Features

### 1. **Filter Tabs**
Located at the top of the page:
- **All Applications** - Shows all applications
- **Pending** - Shows only pending applications (yellow badge)
- **Approved** - Shows only approved applications (green badge)
- **Rejected** - Shows only rejected applications (red badge)

### 2. **Statistics Cards**
Displays quick metrics:
- Total Applications
- Pending Review (yellow)
- Approved (green)
- Rejected (red)

### 3. **Application Cards**
Each application is displayed as a card showing:
- Name
- Email
- Contact number
- Company name (if provided)
- Requested rate (if provided)
- Status badge
- Application date

---

## How to Approve an Application

### Step-by-Step:

1. **Find the Application**
   - Click on the "Pending" filter to see only pending applications
   - Locate the application you want to approve

2. **View Details**
   - Click on the application card
   - A modal will open showing full details:
     - Full Name
     - Email Address
     - Contact Number
     - Company Name (if any)
     - Requested Rate (if any)
     - Application Date

3. **Click Approve**
   - At the bottom of the modal, click the green **"Approve"** button
   - A confirmation dialog will appear

4. **Confirm**
   - Click "OK" to confirm the approval
   - Or "Cancel" to go back

5. **Result**
   - Success message appears
   - Modal closes automatically
   - Application list refreshes
   - Application status changes to "Approved"

### What Happens When You Approve:

✅ **Customer Created**
- A new record is added to the `customers` table
- Customer information copied from application
- Status set to 'Active'
- Last purchase date set to today
- Customer appears immediately in the Customers page

✅ **Application Updated**
- Status changed to 'approved'
- Reviewed timestamp recorded
- Reviewer name recorded (your username)

✅ **Customer Visibility**
- Customer appears in the Customers page
- Can be assigned work logs
- Can be managed like any other customer

---

## How to Reject an Application

### Step-by-Step:

1. **Find the Application**
   - Click on the "Pending" filter
   - Locate the application you want to reject

2. **View Details**
   - Click on the application card
   - Review the application details

3. **Click Reject**
   - At the bottom of the modal, click the red **"Reject"** button
   - A confirmation dialog will appear

4. **Enter Rejection Reason (Optional)**
   - A prompt will ask for a rejection reason
   - You can:
     - Enter a reason (e.g., "Does not meet requirements")
     - Leave it empty and click OK
     - Click Cancel to abort

5. **Confirm**
   - Click "OK" after entering reason (or leaving it empty)
   - Or "Cancel" to go back

6. **Result**
   - Success message appears
   - Modal closes automatically
   - Application list refreshes
   - Application status changes to "Rejected"

### What Happens When You Reject:

✅ **Application Updated**
- Status changed to 'rejected'
- Rejection reason saved (if provided)
- Reviewed timestamp recorded
- Reviewer name recorded (your username)

❌ **No Customer Created**
- No customer record is created
- Application remains in the applications table for record-keeping

---

## Viewing Approved/Rejected Applications

### Approved Applications
1. Click the "Approved" filter tab
2. View all approved applications
3. Click on any card to see:
   - Original application details
   - Approval timestamp
   - Reviewer name
   - ✅ Green "Approved" badge

### Rejected Applications
1. Click the "Rejected" filter tab
2. View all rejected applications
3. Click on any card to see:
   - Original application details
   - Rejection reason (if provided)
   - Rejection timestamp
   - Reviewer name
   - ❌ Red "Rejected" badge

---

## Important Notes

### ⚠️ Email Uniqueness
- Each customer email must be unique
- If you try to approve an application with an email that already exists in the customers table:
  - Approval will fail
  - Error message will be displayed
  - You should reject the application instead

### ⚠️ Cannot Undo
- Once approved, a customer is created
- Once rejected, the application is marked as rejected
- These actions **cannot be undone** through the UI
- Database changes would be required to reverse

### ✅ Best Practices
1. **Review carefully** before approving/rejecting
2. **Always provide a reason** when rejecting
3. **Check for duplicate emails** before approving
4. **Filter by Pending** to focus on new applications
5. **Review Approved** periodically to ensure correct processing

---

## Technical Details

### APIs Used

#### Get Applications
- **Endpoint**: `api/api_get_customer_applications.php`
- **Method**: GET
- **Auth**: Required
- **Returns**: Array of applications

#### Approve Application
- **Endpoint**: `api/api_approve_application.php`
- **Method**: POST
- **Auth**: Required
- **Body**: `{ "application_id": 123 }`
- **Returns**: `{ "message": "...", "customer_id": 456 }`

#### Reject Application
- **Endpoint**: `api/api_reject_application.php`
- **Method**: POST
- **Auth**: Required
- **Body**: `{ "application_id": 123, "rejection_reason": "..." }`
- **Returns**: `{ "message": "...", "application_id": 123 }`

### Database Tables

#### customer_applications
- Stores all application submissions
- Fields: id, name, email, contact, company_name, rate_requested, status, rejection_reason, submitted_at, reviewed_at, reviewed_by

#### customers
- Stores approved customers only
- Fields: id, name, email, contact, rate, status, last_purchase_date, created_at, updated_at

---

## Troubleshooting

### Problem: Applications not loading
**Solution**:
- Check if you're logged in
- Refresh the page (F5)
- Check browser console for errors

### Problem: Approve button not working
**Solution**:
- Ensure the application status is "pending"
- Check if email already exists in customers table
- Check browser console for errors

### Problem: Customer not appearing in Customers page after approval
**Solution**:
- Verify `last_purchase_date` was set to today
- Check the Customers page filter settings
- Refresh the Customers page

### Problem: Can't find approved/rejected applications
**Solution**:
- Use the filter tabs at the top
- Click "Approved" or "Rejected" to see those applications

---

## Example Workflow

### Scenario: New Customer Application

1. **Customer submits application** through public form
   - Name: John Doe
   - Email: john@example.com
   - Contact: 012-3456789
   - Company: Palm Oil Trading Co
   - Rate Requested: RM 55.00

2. **Admin receives application**
   - Opens Customer Applications page
   - Sees new pending application
   - Statistics show "Pending Review: 1"

3. **Admin reviews application**
   - Clicks on "John Doe" card
   - Reviews all details
   - Decides to approve

4. **Admin approves**
   - Clicks green "Approve" button
   - Confirms approval
   - Success message: "Application approved successfully. Customer has been created."

5. **Result**
   - John Doe is now in the customers table
   - Status: Active
   - Last Purchase Date: 2025-11-24
   - Appears in Customers page
   - Can be assigned work logs

6. **Verification**
   - Admin opens Customers page
   - Sees "John Doe" in the list
   - Can click to edit customer details if needed

---

## Related Documentation

- See `SETUP_GUIDE.md` for initial setup
- See `API_DOCUMENTATION.md` for API details
- See `DATABASE_SCHEMA.md` for table structures

---

**Last Updated**: 2025-11-24
**Version**: 1.0
