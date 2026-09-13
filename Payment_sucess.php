<?php
// Connect to database
$conn = new mysqli("localhost", "root", "", "your_database_name");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get details from payment response (example)
$name = $_POST['name'];   // or from payment gateway response
$email = $_POST['email']; // must come from user/payment
$password = $_POST['password']; // you can generate random password or ask user

// Hash password before saving
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert user into database
$sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $name, $email, $hashedPassword);

if ($stmt->execute()) {
    echo "✅ Payment successful and user created. You can now login.";
    // Redirect to login page
    header("Location: login.html");
    exit();
} else {
    echo "❌ Error creating user: " . $conn->error;
}

$conn->close();
?>
