# EasiSawit - Palm Oil Industry Payroll Management System

**Version**: 2.0
**Last Updated**: November 22, 2025

---

## 📋 Overview

EasiSawit is a comprehensive web-based payroll management system designed specifically for the palm oil industry. It streamlines worker management, work log tracking, customer relations, and payroll calculations with multi-language support and an intuitive interface.

---

## ✨ Features

### Core Functionality

#### 1. **Dashboard** 📊
- Real-time statistics and KPIs
- Recent activity feed
- Quick access to all modules

#### 2. **Worker Management** 👷
- Add, edit, and manage workers (Local & Foreign)
- Track worker details (EPF, permit numbers, marital status, etc.)
- Active/Inactive status management
- Worker settlement tracking

#### 3. **Work Logs** 📝
- Daily work log entry
- Track tons harvested per worker
- Customer-specific rates
- Advanced filtering and search

#### 4. **Customer Management** 🤝
- Customer registration and profile management
- Rate management per customer
- Archive/Reactivate customers
- Customer profitability analysis

#### 5. **Payroll Processing** 💰
- Automated payroll calculation
- EPF, SOCSO, EIS contributions (local workers)
- PCB/MTD tax calculations
- PDF payslip generation
- Support for local and foreign workers

#### 6. **Management Reports** 📈
- Performance analytics
- Worker ranking by productivity
- Customer profitability analysis
- New workers and customers tracking
- Date range filtering
- Export capabilities

### Additional Features

- **Multi-Language Support**: English, Bahasa Melayu, 中文
- **Theme Support**: Light and Dark modes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Secure Authentication**: Session-based login with password encryption
- **Activity Logging**: Track system activities in real-time

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Lucide Icons** - Icon library
- **Babel Standalone** - JSX transformation

### Backend
- **PHP 7.4+** - Server-side logic
- **MySQL 5.7+** - Database
- **TCPDF** - PDF generation

### Server
- **Apache** - Web server
- **XAMPP** - Development environment

---

## 📦 Installation

### Prerequisites
- XAMPP (or similar Apache + MySQL + PHP stack)
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Setup Steps

1. **Clone/Copy Project**
   ```bash
   # Copy project to XAMPP htdocs directory
   cp -r easisawit /xampp/htdocs/
   ```

2. **Database Setup**
   ```bash
   # Import database schema
   mysql -u root < easisawit_db.sql
   ```

3. **Configure Database Connection**
   Edit `api/db_connect.php` with your database credentials:
   ```php
   $servername = "localhost";
   $username = "root";
   $password = "";
   $dbname = "easisawit_db";
   ```

4. **Create Admin User**
   ```sql
   INSERT INTO admin_users (username, password_hash)
   VALUES ('admin', '$2y$10$[bcrypt_hash_here]');
   ```

5. **Start Apache & MySQL**
   - Open XAMPP Control Panel
   - Start Apache and MySQL services

6. **Access Application**
   ```
   http://localhost/easisawit/
   ```

---

## 🚀 Usage

### Login
- Default URL: `http://localhost/easisawit/login.html`
- Use your admin credentials

### Main Dashboard
- Navigate using the sidebar menu
- Switch language using the dropdown (top-right)
- Toggle theme with the sun/moon icon

### Adding Workers
1. Go to **Workers** tab
2. Click **Add New Worker**
3. Fill in details (name, type, EPF/permit, etc.)
4. Submit

### Recording Work Logs
1. Go to **Work Logs** tab
2. Click **Log New Work**
3. Select worker, customer, enter tons and rate
4. Submit

### Running Payroll
1. Go to **Payroll** tab
2. Select month, year, and worker type
3. Click **Run Calculation**
4. Review summary
5. Click **Download All Payslips** to generate PDF

### Generating Reports
1. Go to **Management Report** tab
2. Select date range
3. View statistics, rankings, and analytics
4. Export as needed

---

## 📁 Project Structure

```
easisawit/
├── api/                      # Backend API endpoints
│   ├── api_login.php
│   ├── api_calculate_payroll.php
│   ├── api_generate_report.php
│   └── ...
├── docs/                     # Documentation files
│   ├── SETUP_GUIDE.md
│   ├── MANAGEMENT_REPORT_FEATURE.md
│   └── ...
├── TCPDF/                    # PDF library
├── app_components.js         # React UI components (Navigation, Sidebar)
├── app_logic.js              # Main application logic
├── view_components.js        # View components (Dashboard, Workers, etc.)
├── modal_components.js       # Modal dialogs
├── translations.js           # Multi-language translations
├── styles.css                # Custom styles
├── index.html               # Main application page
├── login.html               # Login page
├── register.html            # Customer registration
├── easisawit_db.sql         # Database schema
└── README.md                # This file
```

---

## 🔐 Security Features

- **Password Encryption**: Bcrypt hashing with salt
- **SQL Injection Protection**: Prepared statements for all queries
- **Session Management**: 30-minute timeout with automatic cleanup
- **CORS Headers**: Properly configured for API security
- **Input Validation**: Client and server-side validation

---

## 🌍 Multi-Language Support

The system supports three languages:

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Complete |
| Bahasa Melayu | `ms` | ✅ Complete |
| 中文 (Chinese) | `zh` | ✅ Complete |

To add a new language:
1. Edit `translations.js`
2. Add translation object for your language code
3. Update language selector in Navigation component

---

## 📊 Database Schema

### Main Tables
- `admin_users` - System administrators
- `workers` - Worker information
- `customers` - Customer information
- `work_logs` - Daily work records
- `payroll_runs` - Payroll calculation history
- `payroll_payslips` - Individual payslips
- `worker_settlements` - Worker settlement tracking
- `activity_logs` - System activity audit trail

For detailed schema, see `easisawit_db.sql`

---

## 🐛 Troubleshooting

### Common Issues

**Login Not Working**
- Check database connection in `api/db_connect.php`
- Verify admin user exists in `admin_users` table
- Check browser console for errors

**PDF Download Not Working**
- Ensure TCPDF library is in project root
- Check PHP error logs
- Verify write permissions on temp directory

**Payroll Calculation Errors**
- Verify work logs exist for selected period
- Check EPF/SOCSO schedules are populated
- Review PHP error logs

For more troubleshooting guides, see `docs/` directory.

---

## 📖 Documentation

Detailed documentation is available in the `docs/` directory:

- **Setup Guide**: `docs/SETUP_GUIDE.md`
- **Management Report**: `docs/MANAGEMENT_REPORT_FEATURE.md`
- **Worker Settlement**: `docs/WORKER_SETTLEMENT_GUIDE.md`
- **Bug Reports**: `docs/BUG_REPORT.md`
- **Audit Reports**: `docs/COMPREHENSIVE_BUG_AUDIT.md`

---

## 🤝 Contributing

This is a proprietary project for palm oil industry management. For feature requests or bug reports, please contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 👥 Support

For technical support or questions:
- Check documentation in `docs/` directory
- Review troubleshooting guides
- Contact system administrator

---

## 🔄 Version History

### Version 2.0 (November 22, 2025)
- ✨ Added Management Report with analytics
- ✨ New workers and customers tracking
- ✨ Enhanced UI with 6-column statistics grid
- 🐛 Fixed download payslips API typo
- 🐛 Fixed component loading issues
- 📝 Reorganized documentation

### Version 1.0
- Initial release
- Core worker, customer, and payroll management
- Multi-language support
- PDF payslip generation

---

**Built with ❤️ for the Palm Oil Industry**
