# Python Settlement Calculation API

**File**: `calculate_settlement.py`
**Version**: 2.0
**Date**: November 22, 2025

---

## Overview

This module provides a comprehensive settlement calculation function with built-in validation checks. All validation messages are in English for international compatibility.

---

## Function Signature

```python
calculate_final_settlement_v2(
    worker_type: str,
    settlement_start_date: str,
    settlement_end_date: str,
    days_worked_in_period: int = 0,
    total_units_produced: float = 0.0,
    hourly_rate: float = 0.0,
    daily_rate: float = 0.0,
    piece_rate: float = 0.0,
    base_salary: float = 0.0,
    allowances: float = 0.0,
    deductions: float = 0.0,
    epf_rate: float = 0.11,
    socso_rate: float = 0.005,
    eis_rate: float = 0.002,
    apply_epf: bool = True,
    apply_socso: bool = True,
    apply_eis: bool = True,
) -> Dict[str, Any]
```

---

## Critical Validations (All in English)

### 1. Future Period Check ⏰

**Validation**: Settlement dates cannot be in the future

```python
# Error Examples:
{
    'status': 'error',
    'message': 'Settlement start date cannot be in the future'
}

{
    'status': 'error',
    'message': 'Settlement end date cannot be in the future'
}

{
    'status': 'error',
    'message': 'Settlement start date cannot be after end date'
}
```

### 2. Fixed Salary Zero Working Hours 🕐

**Validation**: FIXED workers must have valid working hours

```python
# Error Example:
{
    'status': 'error',
    'message': 'No valid working hours recorded for fixed salary employee'
}
```

### 3. Piece Worker Zero Production 📦

**Validation**: PIECE workers must have production quantity > 0

```python
# Error Example:
{
    'status': 'error',
    'message': 'Total production quantity is zero for piece-rate worker'
}
```

---

## Worker Types

| Type | Description | Required Parameters |
|------|-------------|---------------------|
| `FIXED` | Fixed monthly salary | `base_salary`, `days_worked_in_period` |
| `PIECE` | Piece-rate (per unit/ton) | `total_units_produced`, `piece_rate` |
| `HOURLY` | Hourly rate | `days_worked_in_period` (as hours), `hourly_rate` |
| `DAILY` | Daily rate | `days_worked_in_period`, `daily_rate` |

---

## Usage Examples

### Example 1: Fixed Salary Worker

```python
from calculate_settlement import calculate_final_settlement_v2

result = calculate_final_settlement_v2(
    worker_type='FIXED',
    settlement_start_date='2025-11-01',
    settlement_end_date='2025-11-22',
    days_worked_in_period=20,
    base_salary=3000.00,
    allowances=200.00,
    deductions=50.00
)

if result['status'] == 'success':
    print(f"Net Pay: RM {result['net_pay']}")
else:
    print(f"Error: {result['message']}")
```

**Expected Output**:
```
Net Pay: RM 2534.78
```

### Example 2: Piece Rate Worker (Foreign Worker - No EPF/SOCSO)

```python
result = calculate_final_settlement_v2(
    worker_type='PIECE',
    settlement_start_date='2025-11-01',
    settlement_end_date='2025-11-22',
    total_units_produced=150.5,  # tons
    piece_rate=45.00,           # RM per ton
    apply_epf=False,
    apply_socso=False,
    apply_eis=False
)

if result['status'] == 'success':
    print(f"Gross Pay: RM {result['gross_pay']}")
    print(f"Net Pay: RM {result['net_pay']}")
```

**Expected Output**:
```
Gross Pay: RM 6772.5
Net Pay: RM 6772.5
```

### Example 3: Validation Error - Future Date

```python
result = calculate_final_settlement_v2(
    worker_type='FIXED',
    settlement_start_date='2026-01-01',  # Future date
    settlement_end_date='2026-01-31',
    days_worked_in_period=20,
    base_salary=3000.00
)

# Returns error
print(result)
```

**Output**:
```python
{
    'status': 'error',
    'message': 'Settlement start date cannot be in the future'
}
```

### Example 4: Validation Error - Zero Working Hours

```python
result = calculate_final_settlement_v2(
    worker_type='FIXED',
    settlement_start_date='2025-11-01',
    settlement_end_date='2025-11-22',
    days_worked_in_period=0,  # Zero hours!
    base_salary=3000.00
)

# Returns error
print(result)
```

**Output**:
```python
{
    'status': 'error',
    'message': 'No valid working hours recorded for fixed salary employee'
}
```

### Example 5: Validation Error - Zero Production

```python
result = calculate_final_settlement_v2(
    worker_type='PIECE',
    settlement_start_date='2025-11-01',
    settlement_end_date='2025-11-22',
    total_units_produced=0,  # Zero production!
    piece_rate=45.00
)

# Returns error
print(result)
```

**Output**:
```python
{
    'status': 'error',
    'message': 'Total production quantity is zero for piece-rate worker'
}
```

---

## Success Response Format

```python
{
    'status': 'success',
    'gross_pay': 2927.27,
    'allowances': 200.00,
    'epf_employee': 321.82,
    'socso_employee': 14.64,
    'eis_employee': 5.85,
    'other_deductions': 50.00,
    'total_deductions': 392.49,
    'net_pay': 2534.78,
    'settlement_period': '2025-11-01 to 2025-11-22',
    'calculation_details': {
        'worker_type': 'Fixed Salary',
        'base_salary': 3000.00,
        'days_worked': 20,
        'total_days_in_period': 22,
        'prorated_salary': 2727.27
    },
    'breakdown': {
        'base_calculation': { ... },
        'statutory_contributions': {
            'epf': {'rate': '11.0%', 'amount': 321.82},
            'socso': {'rate': '0.5%', 'amount': 14.64},
            'eis': {'rate': '0.2%', 'amount': 5.85}
        }
    }
}
```

---

## Error Response Format

```python
{
    'status': 'error',
    'message': 'Error description in English'
}
```

---

## Running Tests

To run the built-in test cases:

```bash
python calculate_settlement.py
```

This will run 5 test cases covering:
1. ✅ Successful fixed salary calculation
2. ✅ Successful piece rate calculation
3. ❌ Future date validation error
4. ❌ Zero working hours error
5. ❌ Zero production error

---

## Integration with PHP Backend

To integrate this Python function with the PHP backend:

### Option 1: CLI Integration

```php
<?php
// PHP code to call Python function
$worker_type = 'PIECE';
$start_date = '2025-11-01';
$end_date = '2025-11-22';
$units = 150.5;
$rate = 45.00;

$command = "python calculate_settlement.py " .
    "--worker-type=$worker_type " .
    "--start-date=$start_date " .
    "--end-date=$end_date " .
    "--units=$units " .
    "--rate=$rate";

$result = shell_exec($command);
$data = json_decode($result, true);

if ($data['status'] == 'success') {
    echo "Net Pay: RM " . $data['net_pay'];
} else {
    echo "Error: " . $data['message'];
}
?>
```

### Option 2: Create Python API Wrapper

Add CLI argument parsing to `calculate_settlement.py` to accept parameters from command line.

---

## Validation Summary

| Validation | Worker Type | Error Message |
|------------|-------------|---------------|
| Future start date | All | `Settlement start date cannot be in the future` |
| Future end date | All | `Settlement end date cannot be in the future` |
| Start > End | All | `Settlement start date cannot be after end date` |
| Zero hours | FIXED | `No valid working hours recorded for fixed salary employee` |
| Zero base salary | FIXED | `Base salary must be greater than zero for fixed salary employee` |
| Zero production | PIECE | `Total production quantity is zero for piece-rate worker` |
| Zero piece rate | PIECE | `Piece rate must be greater than zero` |
| Invalid type | All | `Invalid worker type. Must be one of: FIXED, PIECE, HOURLY, DAILY` |
| Negative net pay | All | `Net pay cannot be negative (Gross: X, Deductions: Y)` |

---

## Notes

- All monetary values are rounded to 2 decimal places
- Default EPF rate: 11% (employee contribution)
- Default SOCSO rate: 0.5% (employee contribution)
- Default EIS rate: 0.2% (employee contribution)
- For foreign workers, set `apply_epf=False`, `apply_socso=False`, `apply_eis=False`

---

## Version History

### Version 2.0 (November 22, 2025)
- ✨ Added comprehensive validation with English error messages
- ✨ Support for multiple worker types (FIXED, PIECE, HOURLY, DAILY)
- ✨ Detailed calculation breakdown in response
- ✨ Built-in test cases
- 🔒 Validation for future dates, zero hours, zero production

---

**Author**: EasiSawit Development Team
**License**: Proprietary
