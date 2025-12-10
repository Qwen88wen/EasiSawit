# EasiSawit

A web-based payroll management system for agricultural businesses, designed specifically for palm oil plantation operations in Malaysia.

## What is EasiSawit?

EasiSawit is a complete payroll and worker management system that helps agricultural companies manage their workers， customers, track daily work output, and calculate monthly salaries with all the required Malaysian government deductions.

## Main Features

### Worker Management
- Add and manage worker information
- Support for both local Malaysian and foreign workers
- Track identity documents via (NRIC, passport, work permits)
- Record personal details like marital status and family information
- Manage worker status (active or inactive)

### Customer Management
- Keep track of customers and their palm oil acres unit
- Store contact information and service areas
- Set custom rates per ton for each customer
- View customer work history

### Daily Work Tracking
- Record daily work output for each worker
- Track tonnage of palm oil (CPO) harvested
- Link work entries to specific customers
- Calculate earnings based on work done

### Payroll System
- Automatic calculation of Malaysian statutory deductions:
  - EPF (Employee Provident Fund)
  - SOCSO (Social Security Organization)
  - EIS (Employment Insurance Scheme)
  - PCB (Monthly tax)
- Support for different worker types (local and foreign)
- Generate monthly payroll runs
- Create detailed payslips for each worker in pdf format 
- Access historical payroll records

### Reports
- View management reports for payroll analysis
- Track worker activity logs

### Customer Applications
- Allow customers to submit applications
- Review and approve or reject applications
- Track application status

# technology stack
### Frontend
- HTML and CSS for page layout
- React for interactive user interface
- Tailwind CSS for styling
- JavaScript for client-side logic

### Backend
- PHP for server-side processing
- MySQL database for data storage
- RESTful API for communication between frontend and backend

### Additional Tools
- TCPDF library for PDF generation
- Bcrypt for secure password storage

## Database

The system uses 13 main tables:
- admin_users: Administrator accounts
- workers: Employee records
- customers: Customer/farm information
- work_logs: Daily work entries
- payroll_runs: Monthly payroll batches
- payroll_payslips: Individual payslips
- payslip_items: Detailed deduction breakdown
- fixed_salaries: Base salary settings
- manual_allowances: Extra allowances
- allowance_types: Types of allowances
- epf_schedule: EPF contribution rates
- socso_eis_schedule: SOCSO and EIS rates
- socso_foreign_schedule: Foreign worker SOCSO rates

## Installation

1. Install XAMPP on your computer
2. Copy the project folder to `C:\xampp\htdocs\easisawit`
3. Start Apache and MySQL in XAMPP
4. Open phpMyAdmin (http://localhost/phpmyadmin)
5. Create a new database called `easisawit_db`
6. Import the file `easisawit_db.sql` into the database
7. Open your browser and go to http://localhost/easisawit

## Default Login

After installation, you can log in with the admin account created in the database.

## How to Use

1. Log in as administrator
2. Add workers and their information
3. Add customers and set their rates
4. Record daily work logs for each worker
5. Run monthly payroll to calculate salaries
6. Generate and print payslips
7. View reports for management

## System Requirements

- XAMPP (Apache + MySQL + PHP)
- PHP version 8.0 or higher
- MySQL or MariaDB database
- Modern web browser (Chrome, Firefox, Edge)

## Security Features

- Encrypted password storage
- Session-based authentication
- Protected API endpoints
- SQL injection prevention
- Automatic logout on inactivity

## Who Should Use This?

This system is designed for:
- Palm oil plantation companies
- Agricultural businesses with both local and foreign workers
- Companies that need to comply with Malaysian labor laws
- HR departments managing worker payroll
- Farm managers tracking daily productivity

## File Structure

- `index.html` - Main application page
- `login.html` - Login page
- `api/` - Backend PHP files for all operations
- `TCPDF/` - PDF generation library
- `*.js` - JavaScript files for application logic
- `easisawit_db.sql` - Database setup file

## Support

For issues or questions, please contact the system administrator.

## License

Private use only.
