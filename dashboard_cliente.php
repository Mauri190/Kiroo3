<?php
require_once 'config.php';

if (!isLoggedIn()) {
    header('Location: login.html');
    exit;
}

if (getCurrentUserType() !== 'cliente') {
    header('Location: dashboard_mecanico.php');
    exit;
}

$user_id = getCurrentUserId();
$full_name = getCurrentUserFullName();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kiroo - Panel Cliente</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        :root { --primary-red: #d32f2f; --bg-dark: #121212; --bg-card: #1e1e1e; }
        body { background-color: var(--bg-dark); color: white; font-family: 'Segoe UI', sans-serif; }
        .navbar-kiroo { background: linear-gradient(135deg, var(--primary-red) 0%, #a12626 100%); padding: 0.8rem 2rem; }
        .content-card { background: var(--bg-card); border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px; overflow: hidden; }
        .card-header-custom { background: rgba(0,0,0,0.3); padding: 1rem 1.5rem; border-bottom: 1px solid #2c2c2c; font-weight: 600; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .btn-red { background-color: var(--primary-red); border: none; color: white; border-radius: 30px; padding: 8px 20px; transition: 0.2s; }
        .btn-red:hover { background-color: #b71c1c; color: white; }
        .btn-outline-red { border: 1px solid var(--primary-red); color: var(--primary-red); background: transparent; border-radius: 30px; padding: 6px 18px; }
        .btn-outline-red:hover { background-color: var(--primary-red); color: white; }
        .diagnostic-card, .appointment-card, .event-card { background: #2a2a2a; border-radius: 16px; padding: 1.2rem; margin-bottom: 1rem; border-left: 4px solid var(--primary-red); transition: transform 0.2s; }
        .diagnostic-card:hover, .appointment-card:hover { transform: translateX(5px); }
        .diagnostic-section { background: #1f1f1f; border-radius: 10px; padding: 0.8rem 1rem; margin-bottom: 0.6rem; border-left: 3px solid #444; }
        .diagnostic-section .section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
        .diagnostic-section .section-value { font-size: 0.92rem; color: #eee; }
        .badge-status { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; }
        .status-completado { background: #4caf50; color: white; }
        .status-pendiente { background: #ff9800; color: #000; }
        .status-confirmada { background: #2196f3; color: white; }
        .status-cancelada { background: #dc3545; color: white; }
        .tab-btn { background: transparent; border: none; color: #aaa; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; }
        .tab-btn.active { color: white; border-bottom-color: var(--primary-red); }

        /* ---- CHAT LAYOUT ---- */
        .chat-layout { display: flex; height: 520px; gap: 0; }
        .chat-sidebar { width: 260px; min-width: 220px; background: #161616; border-right: 1px solid #2c2c2c; display: flex; flex-direction: column; overflow: hidden; }
        .chat-sidebar-header { padding: 12px 14px; background: rgba(0,0,0,0.3); border-bottom: 1px solid #2c2c2c; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; }
        .chat-contact-list { flex: 1; overflow-y: auto; }
        .chat-contact-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; border-bottom: 1px solid #1e1e1e; transition: background 0.15s; }
        .chat-contact-item:hover, .chat-contact-item.active { background: #2a2a2a; }
        .chat-contact-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--primary-red); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: bold; flex-shrink: 0; }
        .chat-contact-info { flex: 1; min-width: 0; }
        .chat-contact-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-contact-preview { font-size: 0.72rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-unread-badge { background: var(--primary-red); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .chat-main-header { padding: 12px 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid #2c2c2c; font-weight: 600; font-size: 0.9rem; min-height: 48px; display: flex; align-items: center; gap: 10px; }
        .chat-messages-area { flex: 1; overflow-y: auto; padding: 15px; background: #1a1a1a; display: flex; flex-direction: column; }
        .chat-input-area { padding: 12px 14px; background: rgba(0,0,0,0.2); border-top: 1px solid #2c2c2c; }
        .chat-bubble { padding: 10px 15px; border-radius: 20px; margin-bottom: 10px; max-width: 75%; word-wrap: break-word; }
        .chat-sent { background: var(--primary-red); align-self: flex-end; }
        .chat-received { background: #333; align-self: flex-start; }
        .chat-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #555; font-size: 0.9rem; text-align: center; padding: 20px; }

        .modal-content { background-color: var(--bg-card); color: white; }
        .form-control, .form-select { background-color: #2c2c2c; border-color: #444; color: white; }
        .form-control:focus, .form-select:focus { background-color: #333; border-color: var(--primary-red); color: white; box-shadow: none; }
        .rating-stars { cursor: pointer; font-size: 1.5rem; }
        .rating-stars i { color: #555; transition: color 0.15s, transform 0.1s; }
        .rating-stars i:hover { transform: scale(1.15); }
        .vehicle-badge { background: #333; border-radius: 10px; padding: 3px 10px; font-size: 0.75rem; }
        .toast-notification { position: fixed; bottom: 20px; right: 20px; z-index: 9999; }
        .empty-state { text-align: center; padding: 2rem; color: #aaa; }
        .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }

        @media (max-width: 600px) {
            .chat-sidebar { width: 180px; min-width: 140px; }
        }
    </style>
</head>
<body>

<nav class="navbar navbar-dark navbar-kiroo">
    <div class="container-fluid">
        <a class="navbar-brand" href="index_cliente.html"><i class="fa-solid fa-car"></i> Kiroo Cliente</a>
        <div class="d-flex align-items-center gap-2">
            <span class="me-2"><i class="fa-regular fa-user"></i> <?php echo htmlspecialchars($full_name); ?></span>
            <a href="index_cliente.html" class="btn btn-sm btn-outline-light me-1"><i class="fa-solid fa-home"></i> Inicio</a>
            <button class="btn btn-sm btn-outline-light" onclick="logout()"><i class="fa-solid fa-sign-out-alt"></i> Salir</button>
        </div>
    </div>
</nav>

<div class="container my-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="fa-solid fa-tachometer-alt me-2"></i>Panel de Control</h2>
        <a href="index_cliente.html" class="btn btn-outline-red">
            <i class="fa-solid fa-arrow-left me-1"></i> Volver al inicio
        </a>
    </div>

    <ul class="nav nav-tabs border-0 mb-4" id="dashboardTabs">
        <li class="nav-item"><button class="tab-btn active" onclick="switchTab('diagnostics')"><i class="fa-solid fa-clipboard-check me-1"></i>Diagnósticos</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('appointments')"><i class="fa-solid fa-calendar-check me-1"></i>Mis Citas</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('vehicles')"><i class="fa-solid fa-car me-1"></i>Mis Vehículos</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('agenda')"><i class="fa-solid fa-calendar-alt me-1"></i>Mi Agenda</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('mechanics')"><i class="fa-solid fa-users-gear me-1"></i>Mecánicos</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('chat')"><i class="fa-solid fa-comments me-1"></i>Chat</button></li>
    </ul>

    <!-- TAB: DIAGNÓSTICOS -->
    <div id="tab-diagnostics" class="tab-content-panel">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-clipboard-check"></i> Diagnósticos Recibidos</span>
                <button class="btn btn-red btn-sm" onclick="loadDiagnostics()"><i class="fa-solid fa-refresh"></i> Actualizar</button>
            </div>
            <div class="p-3" id="diagnosticsList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando diagnósticos...</div>
            </div>
        </div>
    </div>

    <!-- TAB: CITAS -->
    <div id="tab-appointments" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-calendar-check"></i> Mis Citas</span>
                <button class="btn btn-red btn-sm" onclick="showNewAppointmentModal()"><i class="fa-solid fa-plus"></i> Solicitar Cita</button>
            </div>
            <div class="p-3" id="appointmentsList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando citas...</div>
            </div>
        </div>
    </div>

    <!-- TAB: VEHÍCULOS -->
    <div id="tab-vehicles" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-car"></i> Mis Vehículos</span>
                <button class="btn btn-red btn-sm" onclick="showVehicleModal()"><i class="fa-solid fa-plus"></i> Agregar Vehículo</button>
            </div>
            <div class="p-3" id="vehiclesList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando vehículos...</div>
            </div>
        </div>
    </div>

    <!-- TAB: AGENDA -->
    <div id="tab-agenda" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-calendar-alt"></i> Mi Agenda Personal</span>
                <button class="btn btn-red btn-sm" onclick="showEventModal()"><i class="fa-solid fa-plus"></i> Agregar Evento</button>
            </div>
            <div class="p-3" id="eventsList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando eventos...</div>
            </div>
        </div>
    </div>

    <!-- TAB: MECÁNICOS DISPONIBLES -->
    <div id="tab-mechanics" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-users-gear"></i> Mecánicos Disponibles</span>
                <button class="btn btn-red btn-sm" onclick="loadMechanics()"><i class="fa-solid fa-refresh"></i> Actualizar</button>
            </div>
            <div class="p-3" id="mechanicsList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando mecánicos...</div>
            </div>
        </div>
    </div>

    <!-- TAB: CHAT -->
    <div id="tab-chat" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-comments"></i> Chat con Mecánicos</span>
                <button class="btn btn-red btn-sm" onclick="openAddMechanicModal()">
                    <i class="fa-solid fa-user-plus"></i> Agregar Mecánico
                </button>
            </div>
            <div class="chat-layout">
                <!-- Sidebar con lista de conversaciones -->
                <div class="chat-sidebar">
                    <div class="chat-sidebar-header">
                        <span>Conversaciones</span>
                        <button class="btn btn-sm btn-red p-1 px-2" onclick="loadChatContacts()" title="Actualizar">
                            <i class="fa-solid fa-refresh" style="font-size:0.75rem;"></i>
                        </button>
                    </div>
                    <div class="chat-contact-list" id="chatContactList">
                        <div class="text-center text-muted p-3" style="font-size:0.8rem;">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                        </div>
                    </div>
                </div>
                <!-- Área principal del chat -->
                <div class="chat-main">
                    <div class="chat-main-header" id="chatMainHeader">
                        <i class="fa-solid fa-comment-slash text-muted"></i>
                        <span class="text-muted" style="font-size:0.85rem;">Selecciona una conversación</span>
                    </div>
                    <div class="chat-messages-area" id="chatMessages">
                        <div class="chat-empty-state">
                            <i class="fa-solid fa-comments fa-2x mb-3" style="color:#333;"></i>
                            <div>Selecciona un mecánico para chatear</div>
                            <div style="font-size:0.75rem; color:#444; margin-top:6px;">o agrega uno nuevo con el botón de arriba</div>
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <div class="input-group">
                            <input type="text" class="form-control" id="chatInput" placeholder="Escribe tu mensaje..." onkeypress="if(event.key==='Enter') sendMessage()">
                            <button class="btn btn-red" onclick="sendMessage()"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Vehículo -->
<div class="modal fade" id="vehicleModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="vehicleModalTitle"><i class="fa-solid fa-car"></i> Agregar Vehículo</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="vehicleId">
                <div class="mb-3"><label class="form-label">Marca *</label><input type="text" class="form-control" id="vehicleBrand" placeholder="Ej: Toyota"></div>
                <div class="mb-3"><label class="form-label">Modelo *</label><input type="text" class="form-control" id="vehicleModel" placeholder="Ej: Corolla"></div>
                <div class="mb-3"><label class="form-label">Número de Placa *</label><input type="text" class="form-control" id="vehiclePlate" placeholder="Ej: ABC-123"></div>
                <div class="mb-3"><label class="form-label">Año</label><input type="number" class="form-control" id="vehicleYear" placeholder="Ej: 2024" min="1900" max="2030"></div>
                <div class="mb-3"><label class="form-label">Kilometraje</label><input type="number" class="form-control" id="vehicleMileage" value="0"></div>
                <div class="mb-3"><label class="form-label">Color</label><input type="text" class="form-control" id="vehicleColor" placeholder="Ej: Rojo"></div>
                <div class="mb-3"><label class="form-label">Notas</label><textarea class="form-control" id="vehicleNotes" rows="2" placeholder="Notas adicionales..."></textarea></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-red" onclick="saveVehicle()"><i class="fa-solid fa-save"></i> Guardar</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Cita -->
<div class="modal fade" id="appointmentModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-calendar-plus"></i> Solicitar Cita</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="appointmentId">
                <div class="mb-3"><label class="form-label">Mecánico *</label><select class="form-select" id="appointmentMechanic" required><option value="">Seleccionar mecánico...</option></select></div>
                <div class="mb-3"><label class="form-label">Vehículo (opcional)</label><select class="form-select" id="appointmentVehicle"><option value="">Seleccionar vehículo...</option></select></div>
                <div class="mb-3"><label class="form-label">Fecha *</label><input type="date" class="form-control" id="appointmentDate" required></div>
                <div class="mb-3"><label class="form-label">Hora *</label><input type="time" class="form-control" id="appointmentTime" required></div>
                <div class="mb-3"><label class="form-label">Motivo / Notas</label><textarea class="form-control" id="appointmentNotes" rows="2" placeholder="Describe el motivo de tu cita..."></textarea></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-red" onclick="saveAppointment()"><i class="fa-solid fa-paper-plane"></i> Solicitar</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Evento -->
<div class="modal fade" id="eventModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="eventModalTitle"><i class="fa-solid fa-calendar-plus"></i> Agregar Evento</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="eventId">
                <div class="mb-3"><label class="form-label">Título *</label><input type="text" class="form-control" id="eventTitle" placeholder="Ej: Cambio de aceite"></div>
                <div class="mb-3"><label class="form-label">Fecha *</label><input type="date" class="form-control" id="eventDate"></div>
                <div class="mb-3"><label class="form-label">Hora *</label><input type="time" class="form-control" id="eventTime"></div>
                <div class="mb-3"><label class="form-label">Vehículo (opcional)</label><select class="form-select" id="eventVehicle"><option value="">Seleccionar vehículo...</option></select></div>
                <div class="mb-3">
                    <label class="form-label">Tipo de Evento</label>
                    <select class="form-select" id="eventType">
                        <option value="mantenimiento">🔧 Mantenimiento</option>
                        <option value="reparacion">⚙️ Reparación</option>
                        <option value="inspeccion">📋 Inspección</option>
                        <option value="lavado">🧼 Lavado</option>
                        <option value="cita_mecanico">🧑‍🔧 Cita con mecánico</option>
                        <option value="otro">📌 Otro</option>
                    </select>
                </div>
                <div class="mb-3"><label class="form-label">Descripción</label><textarea class="form-control" id="eventDescription" rows="2" placeholder="Detalles..."></textarea></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-red" onclick="saveEvent()"><i class="fa-solid fa-save"></i> Guardar</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Calificación -->
<div class="modal fade" id="ratingModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-star"></i> Calificar Diagnóstico</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
                <p>¿Qué te pareció el servicio de <strong id="ratingMechanicName"></strong>?</p>
                <div class="rating-stars my-3" id="ratingStars">
                    <i class="fa-regular fa-star fa-2x" onclick="setRating(1)"></i>
                    <i class="fa-regular fa-star fa-2x" onclick="setRating(2)"></i>
                    <i class="fa-regular fa-star fa-2x" onclick="setRating(3)"></i>
                    <i class="fa-regular fa-star fa-2x" onclick="setRating(4)"></i>
                    <i class="fa-regular fa-star fa-2x" onclick="setRating(5)"></i>
                </div>
                <textarea id="ratingComment" class="form-control mt-3" placeholder="Comentario (opcional)" rows="2"></textarea>
                <input type="hidden" id="ratingDiagnosticId">
                <input type="hidden" id="selectedRating" value="0">
                <button class="btn btn-red mt-3 w-100" onclick="submitRating()"><i class="fa-solid fa-paper-plane"></i> Enviar Calificación</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Agregar Mecánico al Chat -->
<div class="modal fade" id="addMechanicModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-user-plus"></i> Agregar Mecánico al Chat</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p class="text-muted small">Selecciona un mecánico para iniciar una conversación:</p>
                <div id="addMechanicList">
                    <div class="text-center text-muted p-3"><i class="fa-solid fa-spinner fa-spin"></i> Cargando mecánicos...</div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Toast -->
<div class="toast-notification" id="toastNotification" style="display: none;">
    <div class="text-white p-3 rounded shadow">
        <span id="toastMessage"></span>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
    const CURRENT_USER_ID = <?php echo $user_id; ?>;

    let currentMechanicId = null;
    let currentMechanicName = '';
    let vehicleModalInstance, appointmentModalInstance, eventModalInstance, ratingModalInstance, addMechanicModalInstance;
    let refreshInterval = null;
    let currentRating = 0;

    document.addEventListener('DOMContentLoaded', () => {
        vehicleModalInstance = new bootstrap.Modal(document.getElementById('vehicleModal'));
        appointmentModalInstance = new bootstrap.Modal(document.getElementById('appointmentModal'));
        eventModalInstance = new bootstrap.Modal(document.getElementById('eventModal'));
        ratingModalInstance = new bootstrap.Modal(document.getElementById('ratingModal'));
        addMechanicModalInstance = new bootstrap.Modal(document.getElementById('addMechanicModal'));

        loadDiagnostics();

        refreshInterval = setInterval(() => {
            const activeTab = document.querySelector('.tab-btn.active')?.textContent.toLowerCase() || '';
            if (activeTab.includes('diagnósticos')) loadDiagnostics();
            else if (activeTab.includes('citas')) loadAppointments();
            else if (activeTab.includes('chat') && currentMechanicId) loadChatMessages();
        }, 15000);
    });

    window.addEventListener('beforeunload', () => { if (refreshInterval) clearInterval(refreshInterval); });

    // ========== UTILIDADES ==========
    function showToast(message, isError = false) {
        const toast = document.getElementById('toastNotification');
        document.getElementById('toastMessage').innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-check-circle'} me-2"></i>${message}`;
        toast.style.backgroundColor = isError ? '#dc3545' : '#28a745';
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }

    async function apiCall(action, data = {}) {
        try {
            const formData = new FormData();
            formData.append('action', action);
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) formData.append(key, data[key]);
            });
            const response = await fetch('api.php', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Error de conexión: ' + error.message };
        }
    }

    function switchTab(tabName) {
        document.querySelectorAll('.tab-content-panel').forEach(t => t.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const panel = document.getElementById('tab-' + tabName);
        if (panel) panel.style.display = 'block';
        if (event && event.target) event.target.classList.add('active');
        switch(tabName) {
            case 'diagnostics': loadDiagnostics(); break;
            case 'appointments': loadAppointments(); break;
            case 'vehicles': loadVehicles(); break;
            case 'agenda': loadEvents(); break;
            case 'mechanics': loadMechanics(); break;
            case 'chat': loadChatContacts(); break;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // ========== DIAGNÓSTICOS ==========
    async function loadDiagnostics() {
        const container = document.getElementById('diagnosticsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando diagnósticos...</div>';
        const result = await apiCall('get_diagnostics');

        if (result.success && result.diagnostics && result.diagnostics.length > 0) {
            container.innerHTML = result.diagnostics.map(d => {
                const conditionClass = {
                    excelente: 'bg-success', bueno: 'bg-info',
                    regular: 'bg-warning text-dark', malo: 'bg-danger', critico: 'bg-dark border border-secondary'
                }[d.vehicle_condition] || 'bg-secondary';

                const conditionIcon = { excelente:'✅', bueno:'👍', regular:'⚠️', malo:'❌', critico:'🚨' }[d.vehicle_condition] || '—';

                const dateFormatted = new Date(d.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return `
                <div class="diagnostic-card">
                    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                        <div>
                            <strong style="font-size:1rem;">🔧 Diagnóstico #${d.id}</strong>
                            <div class="small text-muted mt-1">
                                📅 ${dateFormatted}
                            </div>
                            <div class="small mt-1">
                                👨‍🔧 <strong>${escapeHtml(d.mechanic_name || 'Mecánico')}</strong>
                                ${d.mechanic_specialty ? `<span class="text-muted"> — ${escapeHtml(d.mechanic_specialty)}</span>` : ''}
                                ${d.mechanic_workshop ? `<span class="text-muted"> | 🏪 ${escapeHtml(d.mechanic_workshop)}</span>` : ''}
                            </div>
                        </div>
                        <span class="badge-status status-completado">Completado</span>
                    </div>

                    ${d.vehicle_name ? `
                    <div class="diagnostic-section">
                        <div class="section-label">🚗 Vehículo</div>
                        <div class="section-value">${escapeHtml(d.vehicle_name)}
                            ${d.mileage ? `<span class="ms-2 text-muted small">📏 ${parseInt(d.mileage).toLocaleString()} km</span>` : ''}
                        </div>
                    </div>` : ''}

                    ${d.symptoms ? `
                    <div class="diagnostic-section">
                        <div class="section-label">🩺 Síntomas Reportados</div>
                        <div class="section-value">${escapeHtml(d.symptoms)}</div>
                    </div>` : ''}

                    <div class="diagnostic-section">
                        <div class="section-label">📋 Diagnóstico</div>
                        <div class="section-value">${escapeHtml(d.diagnosis)}</div>
                    </div>

                    <div class="diagnostic-section">
                        <div class="section-label">💡 Recomendaciones</div>
                        <div class="section-value">${escapeHtml(d.recommendation)}</div>
                    </div>

                    ${d.parts_needed ? `
                    <div class="diagnostic-section">
                        <div class="section-label">🔩 Piezas Necesarias</div>
                        <div class="section-value">${escapeHtml(d.parts_needed)}</div>
                    </div>` : ''}

                    ${d.additional_notes ? `
                    <div class="diagnostic-section">
                        <div class="section-label">📝 Notas Adicionales</div>
                        <div class="section-value">${escapeHtml(d.additional_notes)}</div>
                    </div>` : ''}

                    <div class="d-flex gap-2 flex-wrap mt-3 align-items-center">
                        ${d.vehicle_condition ? `<span class="badge ${conditionClass}">${conditionIcon} Estado: ${d.vehicle_condition}</span>` : ''}
                        ${d.estimated_cost ? `<span class="badge bg-info text-dark">💰 Costo estimado: $${parseFloat(d.estimated_cost).toFixed(2)}</span>` : ''}
                    </div>

                    <div class="mt-3">
                        ${(d.rated == 0 || d.rated === '0' || !d.rated) ?
                            `<button class="btn btn-sm btn-warning px-3 py-2" onclick="openRatingModal(${d.id}, '${escapeHtml(d.mechanic_name || 'Mecánico')}')">
                                <i class="fa-solid fa-star me-1"></i> Calificar este diagnóstico
                            </button>` :
                            `<div class="d-flex align-items-center gap-2 flex-wrap">
                                <span class="badge bg-success"><i class="fa-solid fa-check me-1"></i>Calificado</span>
                                <span class="text-warning" style="font-size:1.1rem;">${'★'.repeat(parseInt(d.rating) || 0)}${'☆'.repeat(5 - (parseInt(d.rating) || 0))}</span>
                                ${d.rating_comment ? `<small class="text-muted fst-italic">"${escapeHtml(d.rating_comment)}"</small>` : ''}
                            </div>`
                        }
                    </div>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-clipboard-check"></i>
                    <p>No has recibido ningún diagnóstico aún</p>
                    <small class="text-muted">Cuando un mecánico realice un diagnóstico de tu vehículo, aparecerá aquí</small><br>
                    <button class="btn btn-red btn-sm mt-2" onclick="switchTab('appointments')">
                        <i class="fa-solid fa-calendar-check"></i> Solicitar una cita
                    </button>
                </div>`;
        }
    }

    function renderStars(rating) {
        document.querySelectorAll('#ratingStars i').forEach((star, index) => {
            star.className = index < rating ? 'fa-solid fa-star fa-2x' : 'fa-regular fa-star fa-2x';
            star.style.color = index < rating ? '#ffc107' : '#555';
        });
    }

    function setRating(rating) {
        currentRating = rating;
        document.getElementById('selectedRating').value = rating;
        renderStars(rating);
    }

    function openRatingModal(diagnosticId, mechanicName) {
        document.getElementById('ratingDiagnosticId').value = diagnosticId;
        document.getElementById('ratingMechanicName').textContent = mechanicName;
        document.getElementById('ratingComment').value = '';
        currentRating = 0;
        document.getElementById('selectedRating').value = '0';
        renderStars(0);
        const stars = document.querySelectorAll('#ratingStars i');
        stars.forEach((star, index) => {
            star.onmouseover = () => renderStars(index + 1);
            star.onmouseout  = () => renderStars(currentRating);
            star.onclick     = () => setRating(index + 1);
        });
        ratingModalInstance.show();
    }

    async function submitRating() {
        const diagnosticId = document.getElementById('ratingDiagnosticId').value;
        const rating = parseInt(document.getElementById('selectedRating').value);
        const comment = document.getElementById('ratingComment').value.trim();
        if (rating === 0) { showToast('Por favor selecciona una calificación', true); return; }
        const result = await apiCall('rate_diagnostic', { diagnostic_id: diagnosticId, rating, comment });
        if (result.success) {
            showToast('¡Gracias por tu calificación!');
            ratingModalInstance.hide();
            loadDiagnostics();
        } else {
            showToast(result.message || 'Error al enviar calificación', true);
        }
    }

    // ========== CITAS ==========
    async function loadAppointments() {
        const container = document.getElementById('appointmentsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando citas...</div>';
        const result = await apiCall('get_appointments');

        if (result.success && result.appointments && result.appointments.length > 0) {
            container.innerHTML = result.appointments.map(a => {
                const statusClass = {
                    pendiente: 'status-pendiente', confirmada: 'status-confirmada',
                    completado: 'status-completado', cancelada: 'status-cancelada'
                }[a.status] || 'bg-secondary';

                const dateFormatted = new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
                });

                return `
                <div class="appointment-card">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                            <strong>📅 ${dateFormatted} — ${a.appointment_time}</strong>
                            <div class="small text-muted mt-1">👨‍🔧 Mecánico: <strong>${escapeHtml(a.mechanic_name || 'Por asignar')}</strong></div>
                            ${a.vehicle_brand ? `<div class="small text-muted">🚗 ${escapeHtml(a.vehicle_brand)} ${escapeHtml(a.vehicle_model)} (${escapeHtml(a.vehicle_plate)})</div>` : ''}
                            ${a.notes ? `<div class="small text-muted mt-1">📝 ${escapeHtml(a.notes)}</div>` : ''}
                        </div>
                        <span class="badge-status ${statusClass}">${a.status}</span>
                    </div>
                    ${a.diagnostic_id ?
                        `<div class="mt-2 small text-success"><i class="fa-solid fa-check-circle"></i> Diagnóstico disponible — <a href="javascript:void(0)" onclick="switchTab('diagnostics')" class="text-info">Ver Diagnóstico</a></div>` :
                        (a.status === 'completado' ? '<div class="mt-2 small text-warning"><i class="fa-solid fa-clock"></i> Esperando diagnóstico del mecánico</div>' : '')
                    }
                    ${(a.status === 'pendiente' || a.status === 'confirmada') ? `
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment(${a.id})">
                                <i class="fa-solid fa-ban"></i> Cancelar Cita
                            </button>
                        </div>` : ''
                    }
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <p>No tienes citas programadas</p>
                    <button class="btn btn-red btn-sm mt-2" onclick="showNewAppointmentModal()">
                        <i class="fa-solid fa-plus"></i> Solicitar Cita
                    </button>
                </div>`;
        }
    }

    async function showNewAppointmentModal() {
        const mechanicsResult = await apiCall('get_mechanics');
        const mechanicSelect = document.getElementById('appointmentMechanic');
        mechanicSelect.innerHTML = '<option value="">Seleccionar mecánico...</option>';
        if (mechanicsResult.success && mechanicsResult.mechanics) {
            mechanicsResult.mechanics.forEach(m => {
                mechanicSelect.innerHTML += `<option value="${m.id}">${escapeHtml(m.full_name)}${m.specialty ? ' - ' + escapeHtml(m.specialty) : ''}${m.workshop_name ? ' | ' + escapeHtml(m.workshop_name) : ''}</option>`;
            });
        }
        const vehiclesResult = await apiCall('get_vehicles');
        const vehicleSelect = document.getElementById('appointmentVehicle');
        vehicleSelect.innerHTML = '<option value="">Sin vehículo seleccionado...</option>';
        if (vehiclesResult.success && vehiclesResult.vehicles) {
            vehiclesResult.vehicles.forEach(v => {
                vehicleSelect.innerHTML += `<option value="${v.id}">${escapeHtml(v.brand)} ${escapeHtml(v.model)} - ${escapeHtml(v.plate_number)}</option>`;
            });
        }
        document.getElementById('appointmentId').value = '';
        document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentTime').value = '09:00';
        document.getElementById('appointmentNotes').value = '';
        appointmentModalInstance.show();
    }

    async function saveAppointment() {
        const mechanicId = document.getElementById('appointmentMechanic').value;
        const vehicleId = document.getElementById('appointmentVehicle').value;
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        const notes = document.getElementById('appointmentNotes').value.trim();
        if (!mechanicId) { showToast('Por favor selecciona un mecánico', true); return; }
        if (!date || !time) { showToast('Fecha y hora son obligatorias', true); return; }
        const result = await apiCall('save_appointment', { mechanic_id: mechanicId, vehicle_id: vehicleId, appointment_date: date, appointment_time: time, notes });
        if (result.success) {
            showToast('¡Cita solicitada correctamente!');
            appointmentModalInstance.hide();
            loadAppointments();
        } else {
            showToast(result.message || 'Error al solicitar cita', true);
        }
    }

    async function cancelAppointment(appointmentId) {
        if (confirm('¿Estás seguro de cancelar esta cita?')) {
            const result = await apiCall('cancel_appointment', { appointment_id: appointmentId });
            if (result.success) {
                showToast('Cita cancelada correctamente');
                loadAppointments();
            } else {
                showToast(result.message || 'Error al cancelar', true);
            }
        }
    }

    // ========== VEHÍCULOS ==========
    async function loadVehicles() {
        const container = document.getElementById('vehiclesList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
        const result = await apiCall('get_vehicles');
        if (result.success && result.vehicles && result.vehicles.length > 0) {
            container.innerHTML = result.vehicles.map(v => `
                <div class="diagnostic-card">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>🚗 ${escapeHtml(v.brand)} ${escapeHtml(v.model)}</strong>
                            <div class="small text-muted">📌 ${escapeHtml(v.plate_number)} | 📅 ${v.year || 'N/A'} | 📏 ${parseInt(v.mileage || 0).toLocaleString()} km</div>
                            ${v.color ? `<div class="small">🎨 ${escapeHtml(v.color)}</div>` : ''}
                            ${v.notes ? `<div class="small text-muted mt-1">📝 ${escapeHtml(v.notes)}</div>` : ''}
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-light" onclick="editVehicle(${v.id})"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteVehicle(${v.id})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>`).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-car"></i><p>No tienes vehículos registrados</p><button class="btn btn-red btn-sm mt-2" onclick="showVehicleModal()"><i class="fa-solid fa-plus"></i> Agregar</button></div>`;
        }
    }

    function showVehicleModal() {
        ['vehicleId','vehicleBrand','vehicleModel','vehiclePlate','vehicleYear','vehicleColor','vehicleNotes'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('vehicleMileage').value = '0';
        document.getElementById('vehicleModalTitle').innerHTML = '<i class="fa-solid fa-plus-circle"></i> Agregar Vehículo';
        vehicleModalInstance.show();
    }

    async function editVehicle(vehicleId) {
        const result = await apiCall('get_vehicles');
        if (result.success && result.vehicles) {
            const v = result.vehicles.find(x => x.id == vehicleId);
            if (v) {
                document.getElementById('vehicleId').value = v.id;
                document.getElementById('vehicleBrand').value = v.brand || '';
                document.getElementById('vehicleModel').value = v.model || '';
                document.getElementById('vehiclePlate').value = v.plate_number || '';
                document.getElementById('vehicleYear').value = v.year || '';
                document.getElementById('vehicleMileage').value = v.mileage || '0';
                document.getElementById('vehicleColor').value = v.color || '';
                document.getElementById('vehicleNotes').value = v.notes || '';
                document.getElementById('vehicleModalTitle').innerHTML = '<i class="fa-solid fa-edit"></i> Editar Vehículo';
                vehicleModalInstance.show();
            }
        }
    }

    async function saveVehicle() {
        const vehicleData = {
            vehicle_id: document.getElementById('vehicleId').value || null,
            brand: document.getElementById('vehicleBrand').value.trim(),
            model: document.getElementById('vehicleModel').value.trim(),
            plate_number: document.getElementById('vehiclePlate').value.trim(),
            year: document.getElementById('vehicleYear').value || null,
            mileage: document.getElementById('vehicleMileage').value || '0',
            color: document.getElementById('vehicleColor').value.trim(),
            notes: document.getElementById('vehicleNotes').value.trim()
        };
        if (!vehicleData.brand || !vehicleData.model || !vehicleData.plate_number) {
            showToast('Marca, modelo y placa son obligatorios', true); return;
        }
        const result = await apiCall('save_vehicle', vehicleData);
        if (result.success) {
            showToast(vehicleData.vehicle_id ? 'Vehículo actualizado' : 'Vehículo registrado');
            vehicleModalInstance.hide();
            loadVehicles();
        } else {
            showToast(result.message || 'Error al guardar', true);
        }
    }

    async function deleteVehicle(vehicleId) {
        if (confirm('¿Eliminar este vehículo?')) {
            const result = await apiCall('delete_vehicle', { vehicle_id: vehicleId });
            if (result.success) { showToast('Vehículo eliminado'); loadVehicles(); }
            else showToast(result.message || 'Error al eliminar', true);
        }
    }

    // ========== EVENTOS ==========
    async function loadEvents() {
        const container = document.getElementById('eventsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
        const result = await apiCall('get_events');
        if (result.success && result.events && result.events.length > 0) {
            const icons = { mantenimiento:'🔧', reparacion:'⚙️', inspeccion:'📋', lavado:'🧼', cita_mecanico:'🧑‍🔧', otro:'📌' };
            container.innerHTML = result.events.map(e => `
                <div class="event-card">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>${icons[e.event_type] || '📌'} ${escapeHtml(e.title)}</strong>
                            <div class="small text-muted">📅 ${new Date(e.event_date + 'T12:00:00').toLocaleDateString('es-ES', {weekday:'long',year:'numeric',month:'long',day:'numeric'})} — ${e.event_time}</div>
                            ${e.brand ? `<div class="small">🚗 ${escapeHtml(e.brand)} ${escapeHtml(e.model)} (${escapeHtml(e.plate_number)})</div>` : ''}
                            ${e.description ? `<div class="small text-muted mt-1">📝 ${escapeHtml(e.description)}</div>` : ''}
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-light" onclick="editEvent(${e.id})"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteEvent(${e.id})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>`).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-alt"></i><p>No tienes eventos programados</p><button class="btn btn-red btn-sm mt-2" onclick="showEventModal()"><i class="fa-solid fa-plus"></i> Agregar</button></div>`;
        }
    }

    async function showEventModal(eventId = null) {
        ['eventId','eventTitle','eventDescription'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('eventTime').value = '10:00';
        document.getElementById('eventType').value = 'otro';
        document.getElementById('eventModalTitle').innerHTML = '<i class="fa-solid fa-calendar-plus"></i> Agregar Evento';

        const vehiclesResult = await apiCall('get_vehicles');
        const sel = document.getElementById('eventVehicle');
        sel.innerHTML = '<option value="">Sin vehículo...</option>';
        if (vehiclesResult.success && vehiclesResult.vehicles) {
            vehiclesResult.vehicles.forEach(v => sel.innerHTML += `<option value="${v.id}">${escapeHtml(v.brand)} ${escapeHtml(v.model)} - ${escapeHtml(v.plate_number)}</option>`);
        }

        if (eventId) {
            const r = await apiCall('get_events');
            const ev = r.success && r.events ? r.events.find(e => e.id == eventId) : null;
            if (ev) {
                document.getElementById('eventId').value = ev.id;
                document.getElementById('eventTitle').value = ev.title;
                document.getElementById('eventDate').value = ev.event_date;
                document.getElementById('eventTime').value = ev.event_time;
                document.getElementById('eventType').value = ev.event_type;
                document.getElementById('eventDescription').value = ev.description || '';
                if (ev.vehicle_id) sel.value = ev.vehicle_id;
                document.getElementById('eventModalTitle').innerHTML = '<i class="fa-solid fa-edit"></i> Editar Evento';
            }
        }
        eventModalInstance.show();
    }

    async function editEvent(eventId) { await showEventModal(eventId); }

    async function saveEvent() {
        const eventData = {
            event_id: document.getElementById('eventId').value || null,
            title: document.getElementById('eventTitle').value.trim(),
            event_date: document.getElementById('eventDate').value,
            event_time: document.getElementById('eventTime').value,
            event_type: document.getElementById('eventType').value,
            description: document.getElementById('eventDescription').value.trim(),
            vehicle_id: document.getElementById('eventVehicle').value || null
        };
        if (!eventData.title || !eventData.event_date || !eventData.event_time) {
            showToast('Título, fecha y hora son obligatorios', true); return;
        }
        const result = await apiCall('save_event', eventData);
        if (result.success) { showToast(eventData.event_id ? 'Evento actualizado' : 'Evento creado'); eventModalInstance.hide(); loadEvents(); }
        else showToast(result.message || 'Error', true);
    }

    async function deleteEvent(eventId) {
        if (confirm('¿Eliminar este evento?')) {
            const result = await apiCall('delete_event', { event_id: eventId });
            if (result.success) { showToast('Evento eliminado'); loadEvents(); }
            else showToast(result.message || 'Error', true);
        }
    }

    // ========== MECÁNICOS ==========
    async function loadMechanics() {
        const container = document.getElementById('mechanicsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando mecánicos...</div>';
        const result = await apiCall('get_mechanics');

        if (result.success && result.mechanics && result.mechanics.length > 0) {
            container.innerHTML = result.mechanics.map(m => {
                const stars = m.rating > 0 ? '★'.repeat(Math.round(parseFloat(m.rating))) + '☆'.repeat(5 - Math.round(parseFloat(m.rating))) : 'Sin calificaciones';
                return `
                <div class="diagnostic-card">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong><i class="fa-solid fa-user-gear me-2"></i>${escapeHtml(m.full_name)}</strong>
                            <div class="small text-muted mt-1">📧 ${escapeHtml(m.email)}${m.phone ? ' | 📞 ' + escapeHtml(m.phone) : ''}</div>
                            <div class="small mt-1">🔧 <strong>${escapeHtml(m.specialty || 'Mecánica general')}</strong></div>
                            ${m.workshop_name ? `<div class="small">🏪 ${escapeHtml(m.workshop_name)}</div>` : ''}
                            ${m.experience_years ? `<div class="small">📅 ${m.experience_years} años de experiencia</div>` : ''}
                            <div class="small mt-1 text-warning">${stars}</div>
                        </div>
                        <div class="d-flex flex-column gap-2">
                            <button class="btn btn-sm btn-red" onclick="quickAppointment(${m.id})">
                                <i class="fa-solid fa-calendar-plus"></i> Solicitar Cita
                            </button>
                            <button class="btn btn-sm btn-outline-light" onclick="goToChat(${m.id}, '${escapeHtml(m.full_name)}')">
                                <i class="fa-solid fa-comment"></i> Chatear
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users-slash"></i><p>No hay mecánicos disponibles</p></div>`;
        }
    }

    async function quickAppointment(mechanicId) {
        await showNewAppointmentModal();
        document.getElementById('appointmentMechanic').value = mechanicId;
    }

    // Ir al chat con un mecánico específico (desde lista de mecánicos)
    function goToChat(mechanicId, mechanicName) {
        // Cambiar a tab chat
        document.querySelectorAll('.tab-content-panel').forEach(t => t.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-chat').style.display = 'block';
        document.querySelectorAll('.tab-btn').forEach(b => {
            if (b.textContent.includes('Chat')) b.classList.add('active');
        });
        // Cargar contactos y abrir chat con ese mecánico
        loadChatContacts().then(() => {
            openChat(mechanicId, mechanicName);
        });
    }

    // ========== CHAT ==========
    async function loadChatContacts() {
        const list = document.getElementById('chatContactList');
        list.innerHTML = '<div class="text-center text-muted p-3" style="font-size:0.8rem;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        const result = await apiCall('get_chat_contacts');
        if (result.success && result.contacts && result.contacts.length > 0) {
            list.innerHTML = result.contacts.map(c => {
                const initials = (c.full_name || 'M').charAt(0).toUpperCase();
                const preview = c.last_message ? (c.last_message.length > 30 ? c.last_message.substring(0, 30) + '...' : c.last_message) : 'Sin mensajes aún';
                const isActive = currentMechanicId == c.id ? 'active' : '';
                return `
                <div class="chat-contact-item ${isActive}" onclick="openChat(${c.id}, '${escapeHtml(c.full_name)}')">
                    <div class="chat-contact-avatar">${initials}</div>
                    <div class="chat-contact-info">
                        <div class="chat-contact-name">${escapeHtml(c.full_name)}</div>
                        <div class="chat-contact-preview">${escapeHtml(preview)}</div>
                    </div>
                    ${c.unread_count > 0 ? `<div class="chat-unread-badge">${c.unread_count}</div>` : ''}
                </div>`;
            }).join('');
        } else {
            list.innerHTML = `
                <div class="text-center p-3" style="font-size:0.78rem; color:#555;">
                    <i class="fa-solid fa-comment-slash mb-2 d-block" style="font-size:1.4rem;"></i>
                    Sin conversaciones aún.<br>Agrega un mecánico para empezar.
                </div>`;
        }
    }

    async function openAddMechanicModal() {
        addMechanicModalInstance.show();
        const list = document.getElementById('addMechanicList');
        list.innerHTML = '<div class="text-center text-muted p-3"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        const result = await apiCall('get_all_mechanics');
        if (result.success && result.mechanics && result.mechanics.length > 0) {
            list.innerHTML = result.mechanics.map(m => `
                <div class="d-flex align-items-center justify-content-between p-2 mb-1" style="background:#2a2a2a; border-radius:10px;">
                    <div>
                        <div style="font-size:0.88rem; font-weight:600;">${escapeHtml(m.full_name)}</div>
                        <div style="font-size:0.75rem; color:#888;">${escapeHtml(m.specialty || 'Mecánica general')}${m.workshop_name ? ' — ' + escapeHtml(m.workshop_name) : ''}</div>
                    </div>
                    <button class="btn btn-sm btn-red" onclick="selectMechanicForChat(${m.id}, '${escapeHtml(m.full_name)}')">
                        <i class="fa-solid fa-comment"></i> Chatear
                    </button>
                </div>`).join('');
        } else {
            list.innerHTML = '<div class="text-muted text-center p-3">No hay mecánicos disponibles</div>';
        }
    }

    function selectMechanicForChat(mechanicId, mechanicName) {
        addMechanicModalInstance.hide();
        openChat(mechanicId, mechanicName);
    }

    function openChat(mechanicId, mechanicName) {
        currentMechanicId = mechanicId;
        currentMechanicName = mechanicName;

        // Actualizar header
        const header = document.getElementById('chatMainHeader');
        const initials = (mechanicName || 'M').charAt(0).toUpperCase();
        header.innerHTML = `
            <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-red);display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;">${initials}</div>
            <span>${escapeHtml(mechanicName)}</span>`;

        // Marcar activo en sidebar
        document.querySelectorAll('.chat-contact-item').forEach(item => item.classList.remove('active'));
        const items = document.querySelectorAll('.chat-contact-item');
        items.forEach(item => {
            if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(mechanicId)) {
                item.classList.add('active');
            }
        });

        loadChatMessages();
    }

    async function loadChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!currentMechanicId) return;

        container.innerHTML = '<div class="chat-empty-state"><i class="fa-solid fa-spinner fa-spin fa-lg"></i></div>';
        const result = await apiCall('get_chat_messages', { other_user_id: currentMechanicId });

        if (result.success) {
            if (result.messages && result.messages.length > 0) {
                container.innerHTML = result.messages.map(m => `
                    <div class="chat-bubble ${m.sender_id == CURRENT_USER_ID ? 'chat-sent' : 'chat-received'}">
                        <div>${escapeHtml(m.message)}</div>
                        <small style="opacity:0.6;font-size:0.68rem;display:block;margin-top:4px;">${new Date(m.created_at).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'})}</small>
                    </div>`).join('');
            } else {
                container.innerHTML = '<div class="chat-empty-state"><i class="fa-solid fa-comment-dots fa-lg mb-2" style="color:#333;"></i><div>Sin mensajes aún. ¡Envía el primero!</div></div>';
            }
            container.scrollTop = container.scrollHeight;
            // Refrescar lista para actualizar previews y badges
            loadChatContacts();
        } else {
            container.innerHTML = '<div class="chat-empty-state text-danger">Error al cargar mensajes</div>';
        }
    }

    async function sendMessage() {
        const message = document.getElementById('chatInput').value.trim();
        if (!message) { showToast('Escribe un mensaje', true); return; }
        if (!currentMechanicId) { showToast('Selecciona un mecánico primero', true); return; }
        const result = await apiCall('send_message', { receiver_id: currentMechanicId, message });
        if (result.success) {
            document.getElementById('chatInput').value = '';
            loadChatMessages();
        } else {
            showToast(result.message || 'Error al enviar', true);
        }
    }

    // ========== LOGOUT ==========
    async function logout() {
        try {
            const formData = new FormData();
            formData.append('action', 'logout');
            await fetch('auth.php', { method: 'POST', body: formData });
        } catch(e) {}
        window.location.href = 'login.html';
    }
</script>
</body>
</html>