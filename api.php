<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$user_id = getCurrentUserId();
$user_type = getCurrentUserType();
$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {
    $pdo = getDBConnection();
    
    switch($action) {
        // ===== VEHÍCULOS =====
        case 'get_vehicles':
            $stmt = $pdo->prepare("SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$user_id]);
            echo json_encode(['success' => true, 'vehicles' => $stmt->fetchAll()]);
            break;
            
        case 'save_vehicle':
            $brand = $_POST['brand'] ?? '';
            $model = $_POST['model'] ?? '';
            $plateNumber = $_POST['plate_number'] ?? '';
            $year = $_POST['year'] ?? null;
            $mileage = $_POST['mileage'] ?? 0;
            $color = $_POST['color'] ?? '';
            $notes = $_POST['notes'] ?? '';
            $vehicle_id = $_POST['vehicle_id'] ?? null;
            
            if (empty($brand) || empty($model) || empty($plateNumber)) {
                echo json_encode(['success' => false, 'message' => 'Marca, modelo y placa son obligatorios']);
                exit;
            }
            
            if ($vehicle_id) {
                $checkStmt = $pdo->prepare("SELECT id FROM vehicles WHERE id = ? AND user_id = ?");
                $checkStmt->execute([$vehicle_id, $user_id]);
                if (!$checkStmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Vehículo no encontrado o no autorizado']);
                    exit;
                }
                $stmt = $pdo->prepare("UPDATE vehicles SET brand=?, model=?, plate_number=?, year=?, mileage=?, color=?, notes=?, updated_at=NOW() WHERE id=? AND user_id=?");
                $stmt->execute([$brand, $model, $plateNumber, $year, $mileage, $color, $notes, $vehicle_id, $user_id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO vehicles (user_id, brand, model, plate_number, year, mileage, color, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$user_id, $brand, $model, $plateNumber, $year, $mileage, $color, $notes]);
            }
            echo json_encode(['success' => true, 'message' => 'Vehículo guardado correctamente']);
            break;
            
        case 'delete_vehicle':
            $vehicle_id = $_POST['vehicle_id'] ?? 0;
            $checkStmt = $pdo->prepare("SELECT id FROM vehicles WHERE id = ? AND user_id = ?");
            $checkStmt->execute([$vehicle_id, $user_id]);
            if (!$checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Vehículo no encontrado o no autorizado']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM vehicles WHERE id=? AND user_id=?");
            $stmt->execute([$vehicle_id, $user_id]);
            echo json_encode(['success' => true, 'message' => 'Vehículo eliminado correctamente']);
            break;
            
        // ===== CITAS =====
        case 'get_appointments':
            if ($user_type === 'cliente') {
                $stmt = $pdo->prepare("
                    SELECT a.*, u.full_name as mechanic_name, u.email as mechanic_email, u.phone as mechanic_phone,
                           v.brand as vehicle_brand, v.model as vehicle_model, v.plate_number as vehicle_plate
                    FROM appointments a 
                    JOIN users u ON u.id = a.mechanic_id 
                    LEFT JOIN vehicles v ON v.id = a.vehicle_id
                    WHERE a.client_id = ? 
                    ORDER BY a.appointment_date DESC, a.appointment_time DESC
                ");
                $stmt->execute([$user_id]);
            } else {
                $stmt = $pdo->prepare("
                    SELECT a.*, u.full_name as client_name, u.email as client_email, u.phone as client_phone,
                           v.brand as vehicle_brand, v.model as vehicle_model, v.plate_number as vehicle_plate
                    FROM appointments a 
                    JOIN users u ON u.id = a.client_id 
                    LEFT JOIN vehicles v ON v.id = a.vehicle_id
                    WHERE a.mechanic_id = ? 
                    ORDER BY a.appointment_date ASC, a.appointment_time ASC
                ");
                $stmt->execute([$user_id]);
            }
            echo json_encode(['success' => true, 'appointments' => $stmt->fetchAll()]);
            break;
            
        case 'save_appointment':
            $client_id = $user_type === 'cliente' ? $user_id : ($_POST['client_id'] ?? 0);
            $mechanic_id = $user_type === 'mecanico' ? $user_id : ($_POST['mechanic_id'] ?? 0);
            $appointment_date = $_POST['appointment_date'] ?? '';
            $appointment_time = $_POST['appointment_time'] ?? '';
            $notes = $_POST['notes'] ?? '';
            $vehicle_id = $_POST['vehicle_id'] ?? null;
            $appointment_id = $_POST['appointment_id'] ?? null;
            
            if (empty($appointment_date) || empty($appointment_time)) {
                echo json_encode(['success' => false, 'message' => 'Fecha y hora son obligatorias']);
                exit;
            }
            if (empty($client_id) || empty($mechanic_id)) {
                echo json_encode(['success' => false, 'message' => 'Cliente y mecánico son obligatorios']);
                exit;
            }
            
            if ($appointment_id) {
                $checkStmt = $pdo->prepare("SELECT id FROM appointments WHERE id = ? AND (client_id = ? OR mechanic_id = ?)");
                $checkStmt->execute([$appointment_id, $user_id, $user_id]);
                if (!$checkStmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Cita no encontrada o no autorizada']);
                    exit;
                }
                $stmt = $pdo->prepare("UPDATE appointments SET appointment_date=?, appointment_time=?, notes=?, vehicle_id=?, updated_at=NOW() WHERE id=? AND (client_id=? OR mechanic_id=?)");
                $stmt->execute([$appointment_date, $appointment_time, $notes, $vehicle_id, $appointment_id, $user_id, $user_id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO appointments (client_id, mechanic_id, appointment_date, appointment_time, notes, vehicle_id) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$client_id, $mechanic_id, $appointment_date, $appointment_time, $notes, $vehicle_id]);
            }
            echo json_encode(['success' => true, 'message' => 'Cita guardada correctamente']);
            break;
            
        case 'update_appointment_status':
            $appointment_id = $_POST['appointment_id'] ?? 0;
            $status = $_POST['status'] ?? '';
            
            if (!in_array($status, ['pendiente', 'confirmada', 'completado', 'cancelada'])) {
                echo json_encode(['success' => false, 'message' => 'Estado no válido']);
                exit;
            }
            $stmt = $pdo->prepare("UPDATE appointments SET status=?, updated_at=NOW() WHERE id=? AND (mechanic_id=? OR client_id=?)");
            $stmt->execute([$status, $appointment_id, $user_id, $user_id]);
            echo json_encode(['success' => true, 'message' => 'Estado actualizado correctamente']);
            break;
            
        case 'delete_appointment':
            $appointment_id = $_POST['appointment_id'] ?? 0;
            $stmt = $pdo->prepare("DELETE FROM appointments WHERE id=? AND (client_id=? OR mechanic_id=?)");
            $stmt->execute([$appointment_id, $user_id, $user_id]);
            echo json_encode(['success' => true, 'message' => 'Cita eliminada correctamente']);
            break;

        // NUEVO: Cancelar cita (cambia estado a cancelada en vez de eliminar)
        case 'cancel_appointment':
            $appointment_id = $_POST['appointment_id'] ?? 0;
            $stmt = $pdo->prepare("UPDATE appointments SET status='cancelada', updated_at=NOW() WHERE id=? AND (client_id=? OR mechanic_id=?)");
            $stmt->execute([$appointment_id, $user_id, $user_id]);
            echo json_encode(['success' => true, 'message' => 'Cita cancelada correctamente']);
            break;
            
        // ===== DIAGNÓSTICOS =====
        case 'get_diagnostics':
            if ($user_type === 'cliente') {
                $stmt = $pdo->prepare("
                    SELECT d.*, u.full_name as mechanic_name, u.email as mechanic_email, u.phone as mechanic_phone,
                           u.specialty as mechanic_specialty, u.workshop_name as mechanic_workshop
                    FROM diagnostics d 
                    JOIN users u ON u.id = d.mechanic_id 
                    WHERE d.client_id = ? 
                    ORDER BY d.created_at DESC
                ");
                $stmt->execute([$user_id]);
            } else {
                $stmt = $pdo->prepare("
                    SELECT d.*, u.full_name as client_name, u.email as client_email, u.phone as client_phone
                    FROM diagnostics d 
                    JOIN users u ON u.id = d.client_id 
                    WHERE d.mechanic_id = ? 
                    ORDER BY d.created_at DESC
                ");
                $stmt->execute([$user_id]);
            }
            echo json_encode(['success' => true, 'diagnostics' => $stmt->fetchAll()]);
            break;
            
        case 'save_diagnostic':
            $client_id = $_POST['client_id'] ?? 0;
            $appointment_id = $_POST['appointment_id'] ?? null;
            $vehicle_name = $_POST['vehicle_name'] ?? '';
            $mileage = $_POST['mileage'] ?? null;
            $symptoms = $_POST['symptoms'] ?? '';
            $diagnosis = $_POST['diagnosis'] ?? '';
            $recommendation = $_POST['recommendation'] ?? '';
            $vehicle_condition = $_POST['vehicle_condition'] ?? 'regular';
            $parts_needed = $_POST['parts_needed'] ?? '';
            $estimated_cost = $_POST['estimated_cost'] ?? null;
            $additional_notes = $_POST['additional_notes'] ?? '';
            
            if (empty($client_id) || empty($diagnosis) || empty($recommendation)) {
                echo json_encode(['success' => false, 'message' => 'Cliente, diagnóstico y recomendaciones son obligatorios']);
                exit;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO diagnostics (client_id, mechanic_id, appointment_id, vehicle_name, mileage, symptoms, diagnosis, recommendation, vehicle_condition, parts_needed, estimated_cost, additional_notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$client_id, $user_id, $appointment_id ?: null, $vehicle_name, $mileage ?: null, $symptoms, $diagnosis, $recommendation, $vehicle_condition, $parts_needed, $estimated_cost ?: null, $additional_notes]);
            
            $diagnostic_id = $pdo->lastInsertId();
            
            if ($appointment_id) {
                $stmt2 = $pdo->prepare("UPDATE appointments SET status='completado', diagnostic_id=? WHERE id=?");
                $stmt2->execute([$diagnostic_id, $appointment_id]);
            }
            
            echo json_encode(['success' => true, 'diagnostic_id' => $diagnostic_id, 'message' => 'Diagnóstico guardado correctamente']);
            break;
            
        case 'rate_diagnostic':
            $diagnostic_id = $_POST['diagnostic_id'] ?? 0;
            $rating = intval($_POST['rating'] ?? 0);
            $comment = $_POST['comment'] ?? '';
            
            if ($rating < 1 || $rating > 5) {
                echo json_encode(['success' => false, 'message' => 'Calificación inválida']);
                exit;
            }
            
            $checkStmt = $pdo->prepare("SELECT id, mechanic_id FROM diagnostics WHERE id = ? AND client_id = ?");
            $checkStmt->execute([$diagnostic_id, $user_id]);
            $diagnostic = $checkStmt->fetch();
            
            if (!$diagnostic) {
                echo json_encode(['success' => false, 'message' => 'Diagnóstico no encontrado o no autorizado']);
                exit;
            }
            
            $stmt = $pdo->prepare("UPDATE diagnostics SET rating=?, rating_comment=?, rated=TRUE WHERE id=? AND client_id=?");
            $stmt->execute([$rating, $comment, $diagnostic_id, $user_id]);
            
            $avgStmt = $pdo->prepare("SELECT AVG(rating) as avg_rating FROM diagnostics WHERE mechanic_id = ? AND rated = TRUE");
            $avgStmt->execute([$diagnostic['mechanic_id']]);
            $avg = $avgStmt->fetch();
            
            if ($avg && $avg['avg_rating']) {
                $updateMechStmt = $pdo->prepare("UPDATE users SET rating = ? WHERE id = ?");
                $updateMechStmt->execute([round($avg['avg_rating'], 2), $diagnostic['mechanic_id']]);
            }
            
            echo json_encode(['success' => true, 'message' => 'Calificación enviada correctamente']);
            break;
            
        // ===== EVENTOS/AGENDA =====
        case 'get_events':
            $stmt = $pdo->prepare("
                SELECT e.*, v.brand, v.model, v.plate_number 
                FROM events e 
                LEFT JOIN vehicles v ON v.id = e.vehicle_id 
                WHERE e.user_id = ? 
                ORDER BY e.event_date ASC, e.event_time ASC
            ");
            $stmt->execute([$user_id]);
            echo json_encode(['success' => true, 'events' => $stmt->fetchAll()]);
            break;
            
        case 'save_event':
            $title = $_POST['title'] ?? '';
            $event_date = $_POST['event_date'] ?? '';
            $event_time = $_POST['event_time'] ?? '';
            $event_type = $_POST['event_type'] ?? 'otro';
            $description = $_POST['description'] ?? '';
            $vehicle_id = $_POST['vehicle_id'] ?? null;
            $event_id = $_POST['event_id'] ?? null;
            
            if (empty($title) || empty($event_date) || empty($event_time)) {
                echo json_encode(['success' => false, 'message' => 'Título, fecha y hora son obligatorios']);
                exit;
            }
            
            if ($event_id) {
                $checkStmt = $pdo->prepare("SELECT id FROM events WHERE id = ? AND user_id = ?");
                $checkStmt->execute([$event_id, $user_id]);
                if (!$checkStmt->fetch()) {
                    echo json_encode(['success' => false, 'message' => 'Evento no encontrado o no autorizado']);
                    exit;
                }
                $stmt = $pdo->prepare("UPDATE events SET title=?, event_date=?, event_time=?, event_type=?, description=?, vehicle_id=?, updated_at=NOW() WHERE id=? AND user_id=?");
                $stmt->execute([$title, $event_date, $event_time, $event_type, $description, $vehicle_id, $event_id, $user_id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO events (user_id, title, event_date, event_time, event_type, description, vehicle_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$user_id, $title, $event_date, $event_time, $event_type, $description, $vehicle_id]);
            }
            echo json_encode(['success' => true, 'message' => 'Evento guardado correctamente']);
            break;
            
        case 'delete_event':
            $event_id = $_POST['event_id'] ?? 0;
            $checkStmt = $pdo->prepare("SELECT id FROM events WHERE id = ? AND user_id = ?");
            $checkStmt->execute([$event_id, $user_id]);
            if (!$checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Evento no encontrado o no autorizado']);
                exit;
            }
            $stmt = $pdo->prepare("DELETE FROM events WHERE id=? AND user_id=?");
            $stmt->execute([$event_id, $user_id]);
            echo json_encode(['success' => true, 'message' => 'Evento eliminado correctamente']);
            break;
            
        // ===== CHAT =====
        case 'get_chat_messages':
            $other_user_id = $_POST['other_user_id'] ?? 0;
            
            if (empty($other_user_id)) {
                echo json_encode(['success' => false, 'message' => 'Usuario no especificado']);
                exit;
            }
            
            $client_id = $user_type === 'cliente' ? $user_id : $other_user_id;
            $mechanic_id = $user_type === 'mecanico' ? $user_id : $other_user_id;
            
            $stmt = $pdo->prepare("
                SELECT cm.*, sender.full_name as sender_name
                FROM chat_messages cm
                JOIN users sender ON sender.id = cm.sender_id
                WHERE (cm.client_id = ? AND cm.mechanic_id = ?)
                ORDER BY cm.created_at ASC
            ");
            $stmt->execute([$client_id, $mechanic_id]);
            
            // Marcar mensajes como leídos
            $updateStmt = $pdo->prepare("UPDATE chat_messages SET is_read=TRUE WHERE client_id=? AND mechanic_id=? AND sender_id!=?");
            $updateStmt->execute([$client_id, $mechanic_id, $user_id]);
            
            echo json_encode(['success' => true, 'messages' => $stmt->fetchAll()]);
            break;

        // NUEVO: Obtener lista de contactos de chat (conversaciones existentes + disponibles para agregar)
        case 'get_chat_contacts':
            if ($user_type === 'cliente') {
                // Mecánicos con quienes ya hay mensajes
                $stmt = $pdo->prepare("
                    SELECT DISTINCT u.id, u.full_name, u.specialty, u.workshop_name,
                           (SELECT COUNT(*) FROM chat_messages cm2 WHERE cm2.client_id = ? AND cm2.mechanic_id = u.id AND cm2.is_read = 0 AND cm2.sender_id != ?) as unread_count,
                           (SELECT cm3.message FROM chat_messages cm3 WHERE cm3.client_id = ? AND cm3.mechanic_id = u.id ORDER BY cm3.created_at DESC LIMIT 1) as last_message,
                           (SELECT cm4.created_at FROM chat_messages cm4 WHERE cm4.client_id = ? AND cm4.mechanic_id = u.id ORDER BY cm4.created_at DESC LIMIT 1) as last_message_time
                    FROM users u
                    INNER JOIN chat_messages cm ON cm.mechanic_id = u.id AND cm.client_id = ?
                    WHERE u.user_type = 'mecanico' AND u.is_active = 1
                    ORDER BY last_message_time DESC
                ");
                $stmt->execute([$user_id, $user_id, $user_id, $user_id, $user_id]);
            } else {
                // Clientes con quienes ya hay mensajes
                $stmt = $pdo->prepare("
                    SELECT DISTINCT u.id, u.full_name, u.phone,
                           (SELECT COUNT(*) FROM chat_messages cm2 WHERE cm2.mechanic_id = ? AND cm2.client_id = u.id AND cm2.is_read = 0 AND cm2.sender_id != ?) as unread_count,
                           (SELECT cm3.message FROM chat_messages cm3 WHERE cm3.mechanic_id = ? AND cm3.client_id = u.id ORDER BY cm3.created_at DESC LIMIT 1) as last_message,
                           (SELECT cm4.created_at FROM chat_messages cm4 WHERE cm4.mechanic_id = ? AND cm4.client_id = u.id ORDER BY cm4.created_at DESC LIMIT 1) as last_message_time
                    FROM users u
                    INNER JOIN chat_messages cm ON cm.client_id = u.id AND cm.mechanic_id = ?
                    WHERE u.user_type = 'cliente' AND u.is_active = 1
                    ORDER BY last_message_time DESC
                ");
                $stmt->execute([$user_id, $user_id, $user_id, $user_id, $user_id]);
            }
            echo json_encode(['success' => true, 'contacts' => $stmt->fetchAll()]);
            break;
            
        case 'send_message':
            $receiver_id = $_POST['receiver_id'] ?? 0;
            $message = trim($_POST['message'] ?? '');
            
            if (empty($message)) {
                echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
                exit;
            }
            if (empty($receiver_id)) {
                echo json_encode(['success' => false, 'message' => 'Destinatario no especificado']);
                exit;
            }
            
            $client_id = $user_type === 'cliente' ? $user_id : $receiver_id;
            $mechanic_id = $user_type === 'mecanico' ? $user_id : $receiver_id;
            
            $stmt = $pdo->prepare("INSERT INTO chat_messages (client_id, mechanic_id, sender_id, message) VALUES (?, ?, ?, ?)");
            $stmt->execute([$client_id, $mechanic_id, $user_id, $message]);
            echo json_encode(['success' => true, 'message' => 'Mensaje enviado correctamente']);
            break;
            
        // ===== MECÁNICOS =====
        case 'get_mechanics':
            $stmt = $pdo->prepare("
                SELECT id, username, email, full_name, phone, specialty, workshop_name, experience_years, rating 
                FROM users 
                WHERE user_type = 'mecanico' AND is_active = 1 
                ORDER BY full_name ASC
            ");
            $stmt->execute();
            echo json_encode(['success' => true, 'mechanics' => $stmt->fetchAll()]);
            break;
            
        // ===== CLIENTES PARA MECÁNICOS =====
        case 'get_my_clients':
            if ($user_type !== 'mecanico') {
                echo json_encode(['success' => false, 'message' => 'No autorizado']);
                exit;
            }
            // Clientes con citas o mensajes con este mecánico
            $stmt = $pdo->prepare("
                SELECT DISTINCT u.id, u.username, u.email, u.full_name, u.phone, u.created_at
                FROM users u 
                WHERE u.user_type = 'cliente' AND u.is_active = 1
                AND (
                    EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = u.id AND a.mechanic_id = ?)
                    OR EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.client_id = u.id AND cm.mechanic_id = ?)
                )
                ORDER BY u.full_name ASC
            ");
            $stmt->execute([$user_id, $user_id]);
            $clients = $stmt->fetchAll();
            echo json_encode(['success' => true, 'clients' => $clients]);
            break;

        // NUEVO: Todos los clientes disponibles (para que el mecánico pueda agregar al chat)
        case 'get_all_clients':
            if ($user_type !== 'mecanico') {
                echo json_encode(['success' => false, 'message' => 'No autorizado']);
                exit;
            }
            $stmt = $pdo->prepare("
                SELECT id, username, email, full_name, phone, created_at
                FROM users 
                WHERE user_type = 'cliente' AND is_active = 1 
                ORDER BY full_name ASC
            ");
            $stmt->execute();
            echo json_encode(['success' => true, 'clients' => $stmt->fetchAll()]);
            break;

        // NUEVO: Todos los mecánicos disponibles para que el cliente pueda agregar al chat
        case 'get_all_mechanics':
            $stmt = $pdo->prepare("
                SELECT id, username, email, full_name, phone, specialty, workshop_name, experience_years, rating 
                FROM users 
                WHERE user_type = 'mecanico' AND is_active = 1 
                ORDER BY full_name ASC
            ");
            $stmt->execute();
            echo json_encode(['success' => true, 'mechanics' => $stmt->fetchAll()]);
            break;
            
        // ===== PERFIL =====
        case 'get_profile':
            $stmt = $pdo->prepare("SELECT id, username, email, full_name, phone, user_type, specialty, workshop_name, experience_years, rating, created_at, profile_picture FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            echo json_encode(['success' => true, 'profile' => $stmt->fetch()]);
            break;
            
        case 'update_profile':
            $full_name = $_POST['full_name'] ?? '';
            $phone = $_POST['phone'] ?? '';
            
            if (empty($full_name)) {
                echo json_encode(['success' => false, 'message' => 'Nombre completo es obligatorio']);
                exit;
            }
            
            if ($user_type === 'mecanico') {
                $specialty = $_POST['specialty'] ?? '';
                $workshop_name = $_POST['workshop_name'] ?? '';
                $experience_years = intval($_POST['experience_years'] ?? 0);
                $stmt = $pdo->prepare("UPDATE users SET full_name=?, phone=?, specialty=?, workshop_name=?, experience_years=?, updated_at=NOW() WHERE id=?");
                $stmt->execute([$full_name, $phone, $specialty, $workshop_name, $experience_years, $user_id]);
            } else {
                $stmt = $pdo->prepare("UPDATE users SET full_name=?, phone=?, updated_at=NOW() WHERE id=?");
                $stmt->execute([$full_name, $phone, $user_id]);
            }
            
            $_SESSION['full_name'] = $full_name;
            echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);
            break;

        // ===== FOTO DE PERFIL =====
        case 'upload_profile_picture':
            if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
                echo json_encode(['success' => false, 'message' => 'No se recibió ninguna imagen o hubo un error']);
                exit;
            }

            $file = $_FILES['profile_picture'];
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedTypes)) {
                echo json_encode(['success' => false, 'message' => 'Solo se permiten imágenes JPG, PNG, GIF o WEBP']);
                exit;
            }

            if ($file['size'] > 3 * 1024 * 1024) {
                echo json_encode(['success' => false, 'message' => 'La imagen no puede superar 3MB']);
                exit;
            }

            $uploadDir = 'uploads/profiles/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Borrar foto anterior si existe
            $prevStmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
            $prevStmt->execute([$user_id]);
            $prevUser = $prevStmt->fetch();
            if ($prevUser && $prevUser['profile_picture'] && file_exists($prevUser['profile_picture'])) {
                unlink($prevUser['profile_picture']);
            }

            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = $uploadDir . 'user_' . $user_id . '_' . time() . '.' . strtolower($ext);

            if (!move_uploaded_file($file['tmp_name'], $filename)) {
                echo json_encode(['success' => false, 'message' => 'Error al guardar la imagen']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE users SET profile_picture=?, updated_at=NOW() WHERE id=?");
            $stmt->execute([$filename, $user_id]);

            echo json_encode(['success' => true, 'message' => 'Foto actualizada correctamente', 'photo_url' => $filename]);
            break;
            
        // ===== LOGOUT =====
        case 'logout':
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
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida: ' . $action]);
    }
    
} catch(PDOException $e) {
    error_log("API Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}
?>