<?php
/**
 * Security Headers
 * Include this file at the top of all API endpoints for enhanced security
 * Usage: include 'security_headers.php';
 */

// Prevent MIME type sniffing
header("X-Content-Type-Options: nosniff");

// Prevent clickjacking attacks by not allowing the page to be embedded in frames
header("X-Frame-Options: DENY");

// Enable built-in XSS protection in browsers
header("X-XSS-Protection: 1; mode=block");

// Control how much referrer information should be included with requests
header("Referrer-Policy: strict-origin-when-cross-origin");

// Note: These headers enhance security but don't interfere with existing functionality
// They work alongside your CORS headers and other existing headers
?>
