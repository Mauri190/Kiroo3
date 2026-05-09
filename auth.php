<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    switch($action) {
        case 'register_cliente':
            handleRegisterCliente();
            break;
        case 'register_mecanico':
            handleRegisterMecanico();
            break;
        case 'login':
            handleLogin();
            break;
        case 'logout':
            handleLogout();
            break;
        case 'check_auth':
            handleCheckAuth();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
}

function handleRegisterCliente() {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $fullName = trim($_POST['full_name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $vehicleInfo = trim($_POST['vehicle_info'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    // Validaciones
    if (empty($username) || empty($email) || empty($fullName) || empty($phone) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
        return;
    }
    
    if ($password !== $confirmPassword) {
        echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden']);
        return;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Email no válido']);
        return;
    }
    
    try {
        $pdo = getDBConnection();
        
        // Verificar si el usuario o email ya existen
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'El usuario o email ya existen']);
            return;
        }
        
        // Crear nuevo usuario cliente
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, user_type, full_name, phone) VALUES (?, ?, ?, 'cliente', ?, ?)");
        $stmt->execute([$username, $email, $password_hash, $fullName, $phone]);
        
        $userId = $pdo->lastInsertId();
        
        // Si se proporcionó información del vehículo, crear vehículo
        if (!empty($vehicleInfo)) {
            // Parsear información del vehículo (formato simple)
            $parts = explode(' ', $vehicleInfo, 3);
            $brand = $parts[0] ?? '';
            $model = $parts[1] ?? '';
            $plateNumber = $parts[2] ?? '';
            
            if (!empty($brand) && !empty($model)) {
                $stmt = $pdo->prepare("INSERT INTO vehicles (user_id, brand, model, plate_number) VALUES (?, ?, ?, ?)");
                $stmt->execute([$userId, $brand, $model, $plateNumber]);
            }
        }
        
        // Iniciar sesión automáticamente
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;
        $_SESSION['user_type'] = 'cliente';
        $_SESSION['full_name'] = $fullName;
        
        echo json_encode(['success' => true, 'message' => 'Registro exitoso', 'redirect' => 'index_cliente.html']);
        
    } catch(PDOException $e) {
        error_log("Error en registro cliente: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
}

function handleRegisterMecanico() {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $fullName = trim($_POST['full_name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $specialty = trim($_POST['specialty'] ?? '');
    $workshopName = trim($_POST['workshop_name'] ?? '');
    $experience = intval($_POST['experience'] ?? 0);
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    // Validaciones
    if (empty($username) || empty($email) || empty($fullName) || empty($phone) || empty($specialty) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos obligatorios deben ser llenados']);
        return;
    }
    
    if ($password !== $confirmPassword) {
        echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden']);
        return;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Email no válido']);
        return;
    }
    
    try {
        $pdo = getDBConnection();
        
        // Verificar si el usuario o email ya existen
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'El usuario o email ya existen']);
            return;
        }
        
        // Crear nuevo usuario mecánico
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, user_type, full_name, phone, specialty, workshop_name, experience_years) VALUES (?, ?, ?, 'mecanico', ?, ?, ?, ?, ?)");
        $stmt->execute([$username, $email, $password_hash, $fullName, $phone, $specialty, $workshopName, $experience]);
        
        $userId = $pdo->lastInsertId();
        
        // Iniciar sesión automáticamente
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;
        $_SESSION['user_type'] = 'mecanico';
        $_SESSION['full_name'] = $fullName;
        
        echo json_encode(['success' => true, 'message' => 'Registro exitoso', 'redirect' => 'index_mecanico.html']);
        
    } catch(PDOException $e) {
        error_log("Error en registro mecánico: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    }
}

function handleLogin() {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $user_type_requested = trim($_POST['user_type'] ?? ''); // 'cliente' o 'mecanico'
    
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son obligatorios']);
        return;
    }
    
    try {
        $pdo = getDBConnection();
        
        $stmt = $pdo->prepare("SELECT id, username, email, password_hash, user_type, full_name FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            // VERIFICACIÓN DEL TIPO DE USUARIO
            if (!empty($user_type_requested) && $user['user_type'] !== $user_type_requested) {
                // El usuario existe pero está intentando iniciar sesión con el tipo equivocado
                $tipo_real = $user['user_type'] === 'cliente' ? 'Cliente' : 'Mecánico';
                $tipo_intentado = $user_type_requested === 'cliente' ? 'Cliente' : 'Mecánico';
                echo json_encode([
                    'success' => false, 
                    'message' => "Tu cuenta es de tipo {$tipo_real}. Por favor selecciona la opción {$tipo_real} para iniciar sesión."
                ]);
                return;
            }
            
            // Actualizar último login
            $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['user_type'] = $user['user_type'];
            $_SESSION['full_name'] = $user['full_name'];
            
            // REDIRECCIÓN A LOS NUEVOS INDEX SEGÚN TIPO
            $redirect = $user['user_type'] === 'cliente' ? 'index_cliente.html' : 'index_mecanico.html';
            
            echo json_encode([
                'success' => true, 
                'message' => 'Inicio de sesión exitoso', 
                'redirect' => $redirect,
                'user_type' => $user['user_type']
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
        }
        
    } catch(PDOException $e) {
        error_log("Error en login: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error del servidor']);
    }
}

function handleLogout() {
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
}

function handleCheckAuth() {
    if (isLoggedIn()) {
        echo json_encode([
            'authenticated' => true,
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'user_type' => $_SESSION['user_type'],
            'full_name' => $_SESSION['full_name']
        ]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
}
?>