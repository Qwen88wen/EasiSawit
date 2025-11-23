#!/usr/bin/env python3
"""
Worker Settlement Calculation Module
Version: 2.0
Date: November 22, 2025

This module provides functions to calculate final settlement for workers
with comprehensive validation checks.
"""

from datetime import datetime
from typing import Dict, Any, Optional


def calculate_final_settlement_v2(
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
    epf_rate: float = 0.11,  # Employee EPF contribution rate
    socso_rate: float = 0.005,  # Employee SOCSO contribution rate
    eis_rate: float = 0.002,  # Employee EIS contribution rate
    apply_epf: bool = True,
    apply_socso: bool = True,
    apply_eis: bool = True,
) -> Dict[str, Any]:
    """
    Calculate final settlement for a worker with comprehensive validation.

    Args:
        worker_type: Type of worker ('FIXED', 'PIECE', 'HOURLY', 'DAILY')
        settlement_start_date: Start date of settlement period (YYYY-MM-DD)
        settlement_end_date: End date of settlement period (YYYY-MM-DD)
        days_worked_in_period: Number of days worked (for FIXED workers)
        total_units_produced: Total units/tons produced (for PIECE workers)
        hourly_rate: Hourly rate for HOURLY workers
        daily_rate: Daily rate for DAILY workers
        piece_rate: Rate per unit/ton for PIECE workers
        base_salary: Base monthly salary for FIXED workers
        allowances: Total allowances amount
        deductions: Total deductions amount
        epf_rate: EPF employee contribution rate (default: 11%)
        socso_rate: SOCSO employee contribution rate (default: 0.5%)
        eis_rate: EIS employee contribution rate (default: 0.2%)
        apply_epf: Whether to apply EPF deduction
        apply_socso: Whether to apply SOCSO deduction
        apply_eis: Whether to apply EIS deduction

    Returns:
        Dictionary with settlement calculation results or error information

        Success format:
        {
            'status': 'success',
            'gross_pay': float,
            'epf_employee': float,
            'socso_employee': float,
            'eis_employee': float,
            'total_deductions': float,
            'net_pay': float,
            'settlement_period': str,
            'calculation_details': dict
        }

        Error format:
        {
            'status': 'error',
            'message': str
        }
    """

    # ========================================================================
    # CRITICAL VALIDATIONS (All in English)
    # ========================================================================

    # Validation 1: Future Period Check
    try:
        start_date = datetime.strptime(settlement_start_date, '%Y-%m-%d')
        end_date = datetime.strptime(settlement_end_date, '%Y-%m-%d')
        current_date = datetime.now()

        if start_date > current_date:
            return {
                'status': 'error',
                'message': 'Settlement start date cannot be in the future'
            }

        if end_date > current_date:
            return {
                'status': 'error',
                'message': 'Settlement end date cannot be in the future'
            }

        if start_date > end_date:
            return {
                'status': 'error',
                'message': 'Settlement start date cannot be after end date'
            }

    except ValueError as e:
        return {
            'status': 'error',
            'message': f'Invalid date format. Please use YYYY-MM-DD format. Error: {str(e)}'
        }

    # Validation 2: Fixed Salary Zero Working Hours
    if worker_type == 'FIXED':
        if days_worked_in_period == 0:
            return {
                'status': 'error',
                'message': 'No valid working hours recorded for fixed salary employee'
            }

        if base_salary <= 0:
            return {
                'status': 'error',
                'message': 'Base salary must be greater than zero for fixed salary employee'
            }

    # Validation 3: Piece Worker Zero Production
    if worker_type == 'PIECE':
        if total_units_produced == 0:
            return {
                'status': 'error',
                'message': 'Total production quantity is zero for piece-rate worker'
            }

        if piece_rate <= 0:
            return {
                'status': 'error',
                'message': 'Piece rate must be greater than zero'
            }

    # Additional Validations for other worker types
    if worker_type == 'HOURLY':
        if days_worked_in_period == 0:
            return {
                'status': 'error',
                'message': 'No working hours recorded for hourly worker'
            }
        if hourly_rate <= 0:
            return {
                'status': 'error',
                'message': 'Hourly rate must be greater than zero'
            }

    if worker_type == 'DAILY':
        if days_worked_in_period == 0:
            return {
                'status': 'error',
                'message': 'No working days recorded for daily-rate worker'
            }
        if daily_rate <= 0:
            return {
                'status': 'error',
                'message': 'Daily rate must be greater than zero'
            }

    # Validate worker type
    valid_types = ['FIXED', 'PIECE', 'HOURLY', 'DAILY']
    if worker_type not in valid_types:
        return {
            'status': 'error',
            'message': f'Invalid worker type. Must be one of: {", ".join(valid_types)}'
        }

    # ========================================================================
    # CALCULATION
    # ========================================================================

    gross_pay = 0.0
    calculation_details = {}

    # Calculate gross pay based on worker type
    if worker_type == 'FIXED':
        # Prorated salary based on days worked
        total_days_in_period = (end_date - start_date).days + 1
        gross_pay = (base_salary / total_days_in_period) * days_worked_in_period
        calculation_details = {
            'worker_type': 'Fixed Salary',
            'base_salary': base_salary,
            'days_worked': days_worked_in_period,
            'total_days_in_period': total_days_in_period,
            'prorated_salary': gross_pay
        }

    elif worker_type == 'PIECE':
        # Piece-rate calculation
        gross_pay = total_units_produced * piece_rate
        calculation_details = {
            'worker_type': 'Piece Rate',
            'total_units_produced': total_units_produced,
            'piece_rate': piece_rate,
            'calculated_pay': gross_pay
        }

    elif worker_type == 'HOURLY':
        # Hourly rate calculation (assuming days_worked_in_period represents hours)
        gross_pay = days_worked_in_period * hourly_rate
        calculation_details = {
            'worker_type': 'Hourly Rate',
            'hours_worked': days_worked_in_period,
            'hourly_rate': hourly_rate,
            'calculated_pay': gross_pay
        }

    elif worker_type == 'DAILY':
        # Daily rate calculation
        gross_pay = days_worked_in_period * daily_rate
        calculation_details = {
            'worker_type': 'Daily Rate',
            'days_worked': days_worked_in_period,
            'daily_rate': daily_rate,
            'calculated_pay': gross_pay
        }

    # Add allowances
    gross_pay += allowances

    # ========================================================================
    # STATUTORY DEDUCTIONS
    # ========================================================================

    epf_employee = 0.0
    socso_employee = 0.0
    eis_employee = 0.0

    if apply_epf:
        epf_employee = gross_pay * epf_rate

    if apply_socso:
        socso_employee = gross_pay * socso_rate

    if apply_eis:
        eis_employee = gross_pay * eis_rate

    # Total deductions
    total_deductions = epf_employee + socso_employee + eis_employee + deductions

    # Net pay
    net_pay = gross_pay - total_deductions

    # Ensure net pay is not negative
    if net_pay < 0:
        return {
            'status': 'error',
            'message': f'Net pay cannot be negative (Gross: {gross_pay:.2f}, Deductions: {total_deductions:.2f})'
        }

    # ========================================================================
    # RETURN RESULT
    # ========================================================================

    settlement_period = f"{settlement_start_date} to {settlement_end_date}"

    return {
        'status': 'success',
        'gross_pay': round(gross_pay, 2),
        'allowances': round(allowances, 2),
        'epf_employee': round(epf_employee, 2),
        'socso_employee': round(socso_employee, 2),
        'eis_employee': round(eis_employee, 2),
        'other_deductions': round(deductions, 2),
        'total_deductions': round(total_deductions, 2),
        'net_pay': round(net_pay, 2),
        'settlement_period': settlement_period,
        'calculation_details': calculation_details,
        'breakdown': {
            'base_calculation': calculation_details,
            'statutory_contributions': {
                'epf': {
                    'rate': f"{epf_rate * 100}%",
                    'amount': round(epf_employee, 2)
                },
                'socso': {
                    'rate': f"{socso_rate * 100}%",
                    'amount': round(socso_employee, 2)
                },
                'eis': {
                    'rate': f"{eis_rate * 100}%",
                    'amount': round(eis_employee, 2)
                }
            }
        }
    }


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("Worker Settlement Calculation - Test Cases")
    print("=" * 80)

    # Test Case 1: Fixed Salary Worker
    print("\n--- Test Case 1: Fixed Salary Worker ---")
    result1 = calculate_final_settlement_v2(
        worker_type='FIXED',
        settlement_start_date='2025-11-01',
        settlement_end_date='2025-11-22',
        days_worked_in_period=20,
        base_salary=3000.00,
        allowances=200.00,
        deductions=50.00
    )
    print(f"Status: {result1['status']}")
    if result1['status'] == 'success':
        print(f"Gross Pay: RM {result1['gross_pay']}")
        print(f"Net Pay: RM {result1['net_pay']}")
    else:
        print(f"Error: {result1['message']}")

    # Test Case 2: Piece Rate Worker
    print("\n--- Test Case 2: Piece Rate Worker ---")
    result2 = calculate_final_settlement_v2(
        worker_type='PIECE',
        settlement_start_date='2025-11-01',
        settlement_end_date='2025-11-22',
        total_units_produced=150.5,
        piece_rate=45.00,
        apply_epf=False,
        apply_socso=False,
        apply_eis=False
    )
    print(f"Status: {result2['status']}")
    if result2['status'] == 'success':
        print(f"Gross Pay: RM {result2['gross_pay']}")
        print(f"Net Pay: RM {result2['net_pay']}")
    else:
        print(f"Error: {result2['message']}")

    # Test Case 3: Future Date Error
    print("\n--- Test Case 3: Future Date Validation ---")
    result3 = calculate_final_settlement_v2(
        worker_type='FIXED',
        settlement_start_date='2026-01-01',
        settlement_end_date='2026-01-31',
        days_worked_in_period=20,
        base_salary=3000.00
    )
    print(f"Status: {result3['status']}")
    print(f"Message: {result3['message']}")

    # Test Case 4: Zero Working Hours Error
    print("\n--- Test Case 4: Zero Working Hours Validation ---")
    result4 = calculate_final_settlement_v2(
        worker_type='FIXED',
        settlement_start_date='2025-11-01',
        settlement_end_date='2025-11-22',
        days_worked_in_period=0,
        base_salary=3000.00
    )
    print(f"Status: {result4['status']}")
    print(f"Message: {result4['message']}")

    # Test Case 5: Zero Production Error
    print("\n--- Test Case 5: Zero Production Validation ---")
    result5 = calculate_final_settlement_v2(
        worker_type='PIECE',
        settlement_start_date='2025-11-01',
        settlement_end_date='2025-11-22',
        total_units_produced=0,
        piece_rate=45.00
    )
    print(f"Status: {result5['status']}")
    print(f"Message: {result5['message']}")

    print("\n" + "=" * 80)
    print("Test completed!")
    print("=" * 80)
