<?php
include 'db_connect.php';

$username = 'newadmin';
$plain_password = 'YourPassword123';
$email = 'admin@example.com';
$full_name = 'Admin Name';
$role = 'admin';

$hashed_password = password_hash($plain_password, PASSWORD_BCRYPT);

$sql = "INSERT INTO admin_users (username, password, email, full_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, 1)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $username, $hashed_password, $email, $full_name, $role);

if ($stmt->execute()) {
    echo "Admin added successfully!";
} else {
    echo "Error: " . $conn->error;
}

$stmt->close();
$conn->close();
?>
