<?php
$host = "localhost";      // database server
$user = "root";           // MySQL username (XAMPP default is root)
$pass = "";               // MySQL password (leave empty in XAMPP unless you set one)
$db   = "arrowtechz_db";  // your database name

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}
?>
