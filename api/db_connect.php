<?php
// db_connect.php

$servername = "localhost"; // Or your database server
$username = "root";        // Your MySQL username
$password = "";            // Your MySQL password
$dbname = "easisawit_db";  // The database we just created

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to utf8
$conn->set_charset("utf8");

?>