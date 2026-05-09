<?php
// Configuración de la base de datos para kirooo_db
define('DB_HOST', 'localhost');
define('DB_NAME', 'kirooo_db');  // Cambiado a kirooo_db
define('DB_USER', 'root');
define('DB_PASS', '');

// Iniciar sesión si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Conexión a la base de datos
function getDBConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch(PDOException $e) {
        error_log('Error de conexión a la base de datos: ' . $e->getMessage());
        die(json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos']));
    }
}

// Verificar si el usuario está autenticado
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Obtener ID del usuario actual
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

// Obtener tipo de usuario actual
function getCurrentUserType() {
    return $_SESSION['user_type'] ?? null;
}

// Obtener nombre de usuario actual
function getCurrentUsername() {
    return $_SESSION['username'] ?? null;
}

// Obtener nombre completo del usuario actual
function getCurrentUserFullName() {
    return $_SESSION['full_name'] ?? 'Usuario';
}

// Redirigir según tipo de usuario
function redirectBasedOnUserType() {
    if (!isLoggedIn()) {
        header('Location: login.html');
        exit;
    }
    
    $userType = getCurrentUserType();
    if ($userType === 'cliente') {
        header('Location: dashboard_cliente.php');
    } elseif ($userType === 'mecanico') {
        header('Location: dashboard_mecanico.php');
    } else {
        header('Location: login.html');
    }
    exit;
}
?>