<?php
require_once 'config.php';

if (!isLoggedIn()) {
    header('Location: login.html');
    exit;
}

if (getCurrentUserType() !== 'mecanico') {
    header('Location: dashboard_cliente.php');
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
    <title>Kiroo - Panel Mecánico</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        :root { --primary-red: #d32f2f; --bg-dark: #121212; --bg-card: #1e1e1e; --mech-orange: #ff9800; }
        body { background-color: var(--bg-dark); color: white; font-family: 'Segoe UI', sans-serif; }
        .navbar-kiroo { background: linear-gradient(135deg, var(--mech-orange) 0%, #e65100 100%); padding: 0.8rem 2rem; }
        .content-card { background: var(--bg-card); border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 25px; overflow: hidden; }
        .card-header-custom { background: rgba(0,0,0,0.3); padding: 1rem 1.5rem; border-bottom: 1px solid #2c2c2c; font-weight: 600; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
        .btn-orange { background-color: var(--mech-orange); border: none; color: white; border-radius: 30px; padding: 8px 20px; transition: 0.2s; }
        .btn-orange:hover { background-color: #e65100; color: white; }
        .btn-outline-orange { border: 1px solid var(--mech-orange); color: var(--mech-orange); background: transparent; border-radius: 30px; padding: 6px 18px; }
        .btn-outline-orange:hover { background-color: var(--mech-orange); color: white; }
        .appointment-card, .diagnostic-card { background: #2a2a2a; border-radius: 16px; padding: 1.2rem; margin-bottom: 1rem; border-left: 4px solid var(--mech-orange); transition: transform 0.2s; }
        .appointment-card:hover, .diagnostic-card:hover { transform: translateX(5px); }
        .diagnostic-section { background: #1f1f1f; border-radius: 10px; padding: 0.8rem 1rem; margin-bottom: 0.6rem; border-left: 3px solid #555; }
        .diagnostic-section .section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
        .diagnostic-section .section-value { font-size: 0.92rem; color: #eee; }
        .badge-status { padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; }
        .status-completado { background: #4caf50; color: white; }
        .status-pendiente { background: #ff9800; color: #000; }
        .status-confirmada { background: #2196f3; color: white; }
        .status-cancelada { background: #dc3545; color: white; }
        .tab-btn { background: transparent; border: none; color: #aaa; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; }
        .tab-btn.active { color: white; border-bottom-color: var(--mech-orange); }

        /* ---- CHAT LAYOUT ---- */
        .chat-layout { display: flex; height: 520px; gap: 0; }
        .chat-sidebar { width: 260px; min-width: 220px; background: #161616; border-right: 1px solid #2c2c2c; display: flex; flex-direction: column; overflow: hidden; }
        .chat-sidebar-header { padding: 12px 14px; background: rgba(0,0,0,0.3); border-bottom: 1px solid #2c2c2c; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; }
        .chat-contact-list { flex: 1; overflow-y: auto; }
        .chat-contact-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; cursor: pointer; border-bottom: 1px solid #1e1e1e; transition: background 0.15s; }
        .chat-contact-item:hover, .chat-contact-item.active { background: #2a2a2a; }
        .chat-contact-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--mech-orange); display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: bold; flex-shrink: 0; color: #111; }
        .chat-contact-info { flex: 1; min-width: 0; }
        .chat-contact-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-contact-preview { font-size: 0.72rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-unread-badge { background: var(--mech-orange); color: #111; border-radius: 50%; width: 18px; height: 18px; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold; }
        .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .chat-main-header { padding: 12px 16px; background: rgba(0,0,0,0.2); border-bottom: 1px solid #2c2c2c; font-weight: 600; font-size: 0.9rem; min-height: 48px; display: flex; align-items: center; gap: 10px; }
        .chat-messages-area { flex: 1; overflow-y: auto; padding: 15px; background: #1a1a1a; display: flex; flex-direction: column; }
        .chat-input-area { padding: 12px 14px; background: rgba(0,0,0,0.2); border-top: 1px solid #2c2c2c; }
        .chat-bubble { padding: 10px 15px; border-radius: 20px; margin-bottom: 10px; max-width: 75%; word-wrap: break-word; }
        .chat-sent { background: var(--mech-orange); color: #111; align-self: flex-end; }
        .chat-received { background: #333; align-self: flex-start; }
        .chat-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #555; font-size: 0.9rem; text-align: center; padding: 20px; }

        .modal-content { background-color: var(--bg-card); color: white; }
        .form-control, .form-select { background-color: #2c2c2c; border-color: #444; color: white; }
        .form-control:focus, .form-select:focus { background-color: #333; border-color: var(--mech-orange); color: white; box-shadow: none; }
        .condition-btn { background: #333; border: 2px solid transparent; color: #ccc; border-radius: 10px; padding: 8px 16px; cursor: pointer; transition: 0.2s; margin: 3px; }
        .condition-btn.active-excelente { background: #1b5e20; border-color: #4caf50; color: white; }
        .condition-btn.active-bueno { background: #0d47a1; border-color: #2196f3; color: white; }
        .condition-btn.active-regular { background: #bf360c; border-color: #ff9800; color: white; }
        .condition-btn.active-malo { background: #7f0000; border-color: #ef5350; color: white; }
        .condition-btn.active-critico { background: #4a148c; border-color: #ce93d8; color: white; }
        .empty-state { text-align: center; padding: 2rem; color: #aaa; }
        .empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
        .toast-notification { position: fixed; bottom: 20px; right: 20px; z-index: 9999; }

        @media (max-width: 600px) {
            .chat-sidebar { width: 180px; min-width: 140px; }
        }
    </style>
</head>
<body>

<nav class="navbar navbar-dark navbar-kiroo">
    <div class="container-fluid">
        <a class="navbar-brand" href="index_mecanico.html"><i class="fa-solid fa-wrench"></i> Kiroo Mecánico</a>
        <div class="d-flex align-items-center gap-2">
            <span class="me-2"><i class="fa-regular fa-user"></i> <?php echo htmlspecialchars($full_name); ?></span>
            <a href="index_mecanico.html" class="btn btn-sm btn-outline-light me-1"><i class="fa-solid fa-home"></i> Inicio</a>
            <button class="btn btn-sm btn-outline-light" onclick="logout()"><i class="fa-solid fa-sign-out-alt"></i> Salir</button>
        </div>
    </div>
</nav>

<div class="container my-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="fa-solid fa-wrench me-2"></i>Panel de Control — Mecánico</h2>
        <a href="index_mecanico.html" class="btn btn-outline-orange">
            <i class="fa-solid fa-arrow-left me-1"></i> Volver
        </a>
    </div>

    <ul class="nav nav-tabs border-0 mb-4">
        <li class="nav-item"><button class="tab-btn active" onclick="switchTab('appointments')"><i class="fa-solid fa-calendar-check me-1"></i>Citas</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('new-diagnostic')"><i class="fa-solid fa-stethoscope me-1"></i>Nuevo Diagnóstico</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('diagnostics')"><i class="fa-solid fa-clipboard-check me-1"></i>Diagnósticos</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('clients')"><i class="fa-solid fa-users me-1"></i>Clientes</button></li>
        <li class="nav-item"><button class="tab-btn" onclick="switchTab('chat')"><i class="fa-solid fa-comments me-1"></i>Chat</button></li>
    </ul>

    <!-- TAB: CITAS -->
    <div id="tab-appointments" class="tab-content-panel">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-calendar-check"></i> Citas Asignadas</span>
                <button class="btn btn-orange btn-sm" onclick="showNewAppointmentModal()"><i class="fa-solid fa-plus"></i> Nueva Cita</button>
            </div>
            <div class="p-3" id="appointmentsList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando citas...</div>
            </div>
        </div>
    </div>

    <!-- TAB: NUEVO DIAGNÓSTICO -->
    <div id="tab-new-diagnostic" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-stethoscope"></i> Realizar Nuevo Diagnóstico</span>
            </div>
            <div class="p-4">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Cliente *</label>
                        <select class="form-select" id="diagnosticClientId" required onchange="onClientSelected()">
                            <option value="">Seleccionar cliente...</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Vehículo del Cliente</label>
                        <input type="text" class="form-control" id="diagnosticVehicleName" placeholder="Ej: Toyota Corolla (ABC-123)">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Cita asociada (opcional)</label>
                        <select class="form-select" id="diagnosticAppointmentId">
                            <option value="">Sin cita asociada</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Kilometraje</label>
                        <input type="number" class="form-control" id="diagnosticMileage" placeholder="Kilómetros actuales">
                    </div>
                    <div class="col-12">
                        <label class="form-label">Síntomas reportados</label>
                        <textarea class="form-control" id="diagnosticSymptoms" rows="2" placeholder="Síntomas que reporta el cliente..."></textarea>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Estado general del vehículo *</label>
                        <div class="d-flex gap-2 flex-wrap" id="conditionBtns">
                            <button type="button" class="condition-btn" data-condition="excelente" onclick="selectCondition('excelente')">✅ Excelente</button>
                            <button type="button" class="condition-btn" data-condition="bueno" onclick="selectCondition('bueno')">👍 Bueno</button>
                            <button type="button" class="condition-btn active-regular" data-condition="regular" onclick="selectCondition('regular')">⚠️ Regular</button>
                            <button type="button" class="condition-btn" data-condition="malo" onclick="selectCondition('malo')">❌ Malo</button>
                            <button type="button" class="condition-btn" data-condition="critico" onclick="selectCondition('critico')">🚨 Crítico</button>
                        </div>
                        <input type="hidden" id="diagnosticCondition" value="regular">
                    </div>
                    <div class="col-12">
                        <label class="form-label">Diagnóstico detallado *</label>
                        <textarea class="form-control" id="diagnosisText" rows="4" placeholder="Describe el diagnóstico completo del vehículo..." required></textarea>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Recomendaciones *</label>
                        <textarea class="form-control" id="recommendationText" rows="3" placeholder="Recomendaciones para el cliente..." required></textarea>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Piezas necesarias</label>
                        <input type="text" class="form-control" id="partsNeeded" placeholder="Ej: Pastillas de freno, filtro de aceite...">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Costo estimado ($)</label>
                        <input type="number" class="form-control" id="estimatedCost" step="0.01" placeholder="0.00">
                    </div>
                    <div class="col-12">
                        <label class="form-label">Notas adicionales</label>
                        <textarea class="form-control" id="additionalNotes" rows="2" placeholder="Cualquier otra información relevante..."></textarea>
                    </div>
                </div>
                <button class="btn btn-orange w-100 mt-4" onclick="submitDiagnostic()">
                    <i class="fa-solid fa-paper-plane me-2"></i> Enviar Diagnóstico al Cliente
                </button>
            </div>
        </div>
    </div>

    <!-- TAB: DIAGNÓSTICOS REALIZADOS -->
    <div id="tab-diagnostics" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-clipboard-check"></i> Historial de Diagnósticos</span>
                <button class="btn btn-orange btn-sm" onclick="loadDiagnostics()"><i class="fa-solid fa-refresh"></i> Actualizar</button>
            </div>
            <div class="p-3" id="myDiagnosticsList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando diagnósticos...</div>
            </div>
        </div>
    </div>

    <!-- TAB: CLIENTES -->
    <div id="tab-clients" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-users"></i> Mis Clientes</span>
                <button class="btn btn-orange btn-sm" onclick="loadClients()"><i class="fa-solid fa-refresh"></i> Actualizar</button>
            </div>
            <div class="p-3" id="clientsList">
                <div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando clientes...</div>
            </div>
        </div>
    </div>

    <!-- TAB: CHAT -->
    <div id="tab-chat" class="tab-content-panel" style="display:none;">
        <div class="content-card">
            <div class="card-header-custom">
                <span><i class="fa-solid fa-comments"></i> Chat con Clientes</span>
                <button class="btn btn-orange btn-sm" onclick="openAddClientModal()">
                    <i class="fa-solid fa-user-plus"></i> Agregar Cliente
                </button>
            </div>
            <div class="chat-layout">
                <!-- Sidebar -->
                <div class="chat-sidebar">
                    <div class="chat-sidebar-header">
                        <span>Conversaciones</span>
                        <button class="btn btn-sm btn-orange p-1 px-2" onclick="loadChatContacts()" title="Actualizar">
                            <i class="fa-solid fa-refresh" style="font-size:0.75rem;"></i>
                        </button>
                    </div>
                    <div class="chat-contact-list" id="chatContactList">
                        <div class="text-center text-muted p-3" style="font-size:0.8rem;">
                            <i class="fa-solid fa-spinner fa-spin"></i>
                        </div>
                    </div>
                </div>
                <!-- Área principal -->
                <div class="chat-main">
                    <div class="chat-main-header" id="chatMainHeader">
                        <i class="fa-solid fa-comment-slash text-muted"></i>
                        <span class="text-muted" style="font-size:0.85rem;">Selecciona una conversación</span>
                    </div>
                    <div class="chat-messages-area" id="chatMessages">
                        <div class="chat-empty-state">
                            <i class="fa-solid fa-comments fa-2x mb-3" style="color:#333;"></i>
                            <div>Selecciona un cliente para chatear</div>
                            <div style="font-size:0.75rem; color:#444; margin-top:6px;">o agrega uno nuevo con el botón de arriba</div>
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <div class="input-group">
                            <input type="text" class="form-control" id="chatInput" placeholder="Escribe tu mensaje..." onkeypress="if(event.key==='Enter') sendMessage()">
                            <button class="btn btn-orange" onclick="sendMessage()"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Nueva Cita -->
<div class="modal fade" id="appointmentModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-calendar-plus"></i> Crear Nueva Cita</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="newAppointmentId">
                <div class="mb-3"><label class="form-label">Cliente *</label><select class="form-select" id="newAppointmentClientId" required><option value="">Seleccionar cliente...</option></select></div>
                <div class="mb-3"><label class="form-label">Fecha *</label><input type="date" class="form-control" id="newAppointmentDate" required></div>
                <div class="mb-3"><label class="form-label">Hora *</label><input type="time" class="form-control" id="newAppointmentTime" required></div>
                <div class="mb-3"><label class="form-label">Notas</label><textarea class="form-control" id="newAppointmentNotes" rows="2" placeholder="Detalles de la cita..."></textarea></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-orange" onclick="createAppointment()"><i class="fa-solid fa-save"></i> Crear Cita</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Agregar Cliente al Chat -->
<div class="modal fade" id="addClientModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-user-plus"></i> Agregar Cliente al Chat</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <p class="text-muted small">Selecciona un cliente para iniciar una conversación:</p>
                <div id="addClientList">
                    <div class="text-center text-muted p-3"><i class="fa-solid fa-spinner fa-spin"></i></div>
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

    let appointmentModalInstance, addClientModalInstance;
    let currentClientId = null;
    let currentClientName = '';
    let refreshInterval = null;

    document.addEventListener('DOMContentLoaded', () => {
        appointmentModalInstance = new bootstrap.Modal(document.getElementById('appointmentModal'));
        addClientModalInstance = new bootstrap.Modal(document.getElementById('addClientModal'));

        loadAppointments();
        loadClientsForDiagnostic();

        refreshInterval = setInterval(() => {
            const activeTab = document.querySelector('.tab-btn.active')?.textContent.toLowerCase() || '';
            if (activeTab.includes('citas')) loadAppointments();
            else if (activeTab.includes('diagnósticos') && !activeTab.includes('nuevo')) loadDiagnostics();
            else if (activeTab.includes('chat') && currentClientId) loadChatMessages();
        }, 15000);
    });

    window.addEventListener('beforeunload', () => { if (refreshInterval) clearInterval(refreshInterval); });

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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
            case 'appointments': loadAppointments(); break;
            case 'diagnostics': loadDiagnostics(); break;
            case 'clients': loadClients(); break;
            case 'new-diagnostic': loadClientsForDiagnostic(); break;
            case 'chat': loadChatContacts(); break;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
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
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

                return `
                <div class="appointment-card">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                            <strong>📅 ${dateFormatted} — ${a.appointment_time}</strong>
                            <div class="small mt-1">👤 Cliente: <strong>${escapeHtml(a.client_name || 'Cliente')}</strong></div>
                            ${a.client_phone ? `<div class="small text-muted">📞 ${escapeHtml(a.client_phone)}</div>` : ''}
                            ${a.vehicle_brand ? `<div class="small text-muted">🚗 ${escapeHtml(a.vehicle_brand)} ${escapeHtml(a.vehicle_model)} (${escapeHtml(a.vehicle_plate)})</div>` : ''}
                            ${a.notes ? `<div class="small text-muted mt-1">📝 ${escapeHtml(a.notes)}</div>` : ''}
                        </div>
                        <span class="badge-status ${statusClass}">${a.status}</span>
                    </div>
                    <div class="mt-2 d-flex gap-2 flex-wrap">
                        ${a.status === 'pendiente' ?
                            `<button class="btn btn-sm btn-outline-light" onclick="confirmAppointment(${a.id})">
                                <i class="fa-solid fa-check"></i> Confirmar
                            </button>` : ''
                        }
                        ${a.status !== 'completado' && a.status !== 'cancelada' ?
                            `<button class="btn btn-sm btn-orange" onclick="goToDiagnostic(${a.id}, ${a.client_id}, '${escapeHtml(a.client_name || '')}')">
                                <i class="fa-solid fa-stethoscope"></i> Diagnosticar
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment(${a.id})">
                                <i class="fa-solid fa-ban"></i> Cancelar
                            </button>` : ''
                        }
                        ${a.diagnostic_id ? `<span class="badge bg-success ms-1"><i class="fa-solid fa-check"></i> Diagnosticado</span>` : ''}
                    </div>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>No tienes citas asignadas</p></div>`;
        }
    }

    async function confirmAppointment(appointmentId) {
        const result = await apiCall('update_appointment_status', { appointment_id: appointmentId, status: 'confirmada' });
        if (result.success) { showToast('Cita confirmada'); loadAppointments(); }
        else showToast(result.message || 'Error', true);
    }

    async function cancelAppointment(appointmentId) {
        if (confirm('¿Cancelar esta cita?')) {
            const result = await apiCall('cancel_appointment', { appointment_id: appointmentId });
            if (result.success) { showToast('Cita cancelada'); loadAppointments(); }
            else showToast(result.message || 'Error', true);
        }
    }

    async function showNewAppointmentModal() {
        const clientsResult = await apiCall('get_all_clients');
        const clientSelect = document.getElementById('newAppointmentClientId');
        clientSelect.innerHTML = '<option value="">Seleccionar cliente...</option>';
        if (clientsResult.success && clientsResult.clients && clientsResult.clients.length > 0) {
            clientsResult.clients.forEach(c => {
                clientSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.full_name)} — ${escapeHtml(c.email)}</option>`;
            });
        }
        document.getElementById('newAppointmentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('newAppointmentTime').value = '09:00';
        document.getElementById('newAppointmentNotes').value = '';
        appointmentModalInstance.show();
    }

    async function createAppointment() {
        const clientId = document.getElementById('newAppointmentClientId').value;
        const date = document.getElementById('newAppointmentDate').value;
        const time = document.getElementById('newAppointmentTime').value;
        const notes = document.getElementById('newAppointmentNotes').value.trim();
        if (!clientId || !date || !time) { showToast('Cliente, fecha y hora son obligatorios', true); return; }
        const result = await apiCall('save_appointment', { client_id: clientId, appointment_date: date, appointment_time: time, notes });
        if (result.success) {
            showToast('Cita creada correctamente');
            appointmentModalInstance.hide();
            loadAppointments();
        } else showToast(result.message || 'Error', true);
    }

    // ========== DIAGNÓSTICOS ==========
    async function loadClientsForDiagnostic() {
        const result = await apiCall('get_all_clients');
        const clientSelect = document.getElementById('diagnosticClientId');
        clientSelect.innerHTML = '<option value="">Seleccionar cliente...</option>';
        if (result.success && result.clients && result.clients.length > 0) {
            result.clients.forEach(c => {
                clientSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.full_name)} — ${escapeHtml(c.email)}</option>`;
            });
        }
    }

    async function onClientSelected() {
        const clientId = document.getElementById('diagnosticClientId').value;
        if (!clientId) return;
        const result = await apiCall('get_appointments');
        const appointmentSelect = document.getElementById('diagnosticAppointmentId');
        appointmentSelect.innerHTML = '<option value="">Sin cita asociada</option>';
        if (result.success && result.appointments) {
            result.appointments
                .filter(a => a.client_id == clientId && a.status !== 'completado' && a.status !== 'cancelada')
                .forEach(a => {
                    appointmentSelect.innerHTML += `<option value="${a.id}">${a.appointment_date} — ${a.appointment_time} (${a.status})</option>`;
                });
        }
    }

    function selectCondition(condition) {
        document.getElementById('diagnosticCondition').value = condition;
        document.querySelectorAll('.condition-btn').forEach(btn => {
            btn.className = 'condition-btn';
            if (btn.dataset.condition === condition) btn.classList.add('active-' + condition);
        });
    }

    async function submitDiagnostic() {
        const clientId = document.getElementById('diagnosticClientId').value;
        const diagnosis = document.getElementById('diagnosisText').value.trim();
        const recommendation = document.getElementById('recommendationText').value.trim();
        if (!clientId) { showToast('Selecciona un cliente', true); return; }
        if (!diagnosis || !recommendation) { showToast('Diagnóstico y recomendaciones son obligatorios', true); return; }

        const result = await apiCall('save_diagnostic', {
            client_id: clientId,
            appointment_id: document.getElementById('diagnosticAppointmentId').value || null,
            vehicle_name: document.getElementById('diagnosticVehicleName').value.trim(),
            mileage: document.getElementById('diagnosticMileage').value || null,
            symptoms: document.getElementById('diagnosticSymptoms').value.trim(),
            diagnosis,
            recommendation,
            vehicle_condition: document.getElementById('diagnosticCondition').value,
            parts_needed: document.getElementById('partsNeeded').value.trim(),
            estimated_cost: document.getElementById('estimatedCost').value || null,
            additional_notes: document.getElementById('additionalNotes').value.trim()
        });

        if (result.success) {
            showToast('¡Diagnóstico enviado correctamente!');
            ['diagnosisText','recommendationText','diagnosticSymptoms','diagnosticVehicleName','diagnosticMileage','partsNeeded','estimatedCost','additionalNotes'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('diagnosticCondition').value = 'regular';
            document.querySelectorAll('.condition-btn').forEach(btn => btn.className = 'condition-btn');
            document.querySelector('.condition-btn[data-condition="regular"]')?.classList.add('active-regular');
            loadAppointments();
            switchTab('diagnostics');
        } else showToast(result.message || 'Error', true);
    }

    function goToDiagnostic(appointmentId, clientId, clientName) {
        document.getElementById('diagnosticClientId').value = clientId;
        onClientSelected();
        setTimeout(() => {
            document.getElementById('diagnosticAppointmentId').value = appointmentId;
            switchTab('new-diagnostic');
        }, 500);
    }

    async function loadDiagnostics() {
        const container = document.getElementById('myDiagnosticsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
        const result = await apiCall('get_diagnostics');

        if (result.success && result.diagnostics && result.diagnostics.length > 0) {
            const conditionClass = { excelente:'bg-success', bueno:'bg-info', regular:'bg-warning text-dark', malo:'bg-danger', critico:'bg-dark border border-secondary' };
            const conditionIcon = { excelente:'✅', bueno:'👍', regular:'⚠️', malo:'❌', critico:'🚨' };

            container.innerHTML = result.diagnostics.map(d => {
                const dateFormatted = new Date(d.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const cls = conditionClass[d.vehicle_condition] || 'bg-secondary';
                const icon = conditionIcon[d.vehicle_condition] || '—';

                return `
                <div class="diagnostic-card">
                    <div class="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                        <div>
                            <strong>👤 ${escapeHtml(d.client_name)}</strong>
                            <div class="small text-muted mt-1">📅 ${dateFormatted}</div>
                            ${d.client_phone ? `<div class="small text-muted">📞 ${escapeHtml(d.client_phone)}</div>` : ''}
                        </div>
                        <span class="badge-status status-completado">Completado</span>
                    </div>

                    ${d.vehicle_name ? `
                    <div class="diagnostic-section">
                        <div class="section-label">🚗 Vehículo</div>
                        <div class="section-value">${escapeHtml(d.vehicle_name)}${d.mileage ? `<span class="ms-2 text-muted small">📏 ${parseInt(d.mileage).toLocaleString()} km</span>` : ''}</div>
                    </div>` : ''}

                    ${d.symptoms ? `
                    <div class="diagnostic-section">
                        <div class="section-label">🩺 Síntomas</div>
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
                        ${d.vehicle_condition ? `<span class="badge ${cls}">${icon} Estado: ${d.vehicle_condition}</span>` : ''}
                        ${d.estimated_cost ? `<span class="badge bg-info text-dark">💰 $${parseFloat(d.estimated_cost).toFixed(2)}</span>` : ''}
                    </div>

                    ${d.rated ?
                        `<div class="mt-2 small d-flex align-items-center gap-2 flex-wrap">
                            <span class="text-warning">${'★'.repeat(d.rating || 0)}${'☆'.repeat(5 - (d.rating || 0))}</span>
                            <span>Calificación: ${d.rating}/5</span>
                            ${d.rating_comment ? `<small class="text-muted fst-italic">"${escapeHtml(d.rating_comment)}"</small>` : ''}
                        </div>` :
                        '<div class="mt-2 small text-muted">⏳ Pendiente de calificación</div>'
                    }
                </div>`;
            }).join('');
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-clipboard"></i><p>No has realizado diagnósticos aún</p></div>`;
        }
    }

    // ========== CLIENTES ==========
    async function loadClients() {
        const container = document.getElementById('clientsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando clientes...</div>';
        const result = await apiCall('get_my_clients');

        if (result.success && result.clients && result.clients.length > 0) {
            container.innerHTML = result.clients.map(c => `
                <div class="diagnostic-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong><i class="fa-regular fa-user me-2"></i>${escapeHtml(c.full_name)}</strong>
                            <div class="small text-muted mt-1">📧 ${escapeHtml(c.email)}${c.phone ? ' | 📞 ' + escapeHtml(c.phone) : ''}</div>
                            <div class="small text-muted">📅 Cliente desde: ${new Date(c.created_at).toLocaleDateString('es-ES')}</div>
                        </div>
                        <div class="d-flex flex-column gap-2">
                            <button class="btn btn-sm btn-orange" onclick="quickDiagnostic(${c.id})">
                                <i class="fa-solid fa-stethoscope"></i> Diagnosticar
                            </button>
                            <button class="btn btn-sm btn-outline-light" onclick="goToChat(${c.id}, '${escapeHtml(c.full_name)}')">
                                <i class="fa-solid fa-comment"></i> Chat
                            </button>
                            <button class="btn btn-sm btn-outline-light" onclick="quickAppointmentForClient(${c.id})">
                                <i class="fa-solid fa-calendar-plus"></i> Crear Cita
                            </button>
                        </div>
                    </div>
                </div>`).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-users-slash"></i>
                    <p>No tienes clientes aún</p>
                    <small class="text-muted">Cuando un cliente agende una cita o inicies un chat, aparecerá aquí</small>
                </div>`;
        }
    }

    function quickDiagnostic(clientId) {
        document.getElementById('diagnosticClientId').value = clientId;
        onClientSelected();
        switchTab('new-diagnostic');
    }

    async function quickAppointmentForClient(clientId) {
        await showNewAppointmentModal();
        document.getElementById('newAppointmentClientId').value = clientId;
    }

    // Ir al chat desde lista de clientes
    function goToChat(clientId, clientName) {
        document.querySelectorAll('.tab-content-panel').forEach(t => t.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-chat').style.display = 'block';
        document.querySelectorAll('.tab-btn').forEach(b => {
            if (b.textContent.includes('Chat')) b.classList.add('active');
        });
        loadChatContacts().then(() => openChat(clientId, clientName));
    }

    // ========== CHAT ==========
    async function loadChatContacts() {
        const list = document.getElementById('chatContactList');
        list.innerHTML = '<div class="text-center text-muted p-3" style="font-size:0.8rem;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        const result = await apiCall('get_chat_contacts');
        if (result.success && result.contacts && result.contacts.length > 0) {
            list.innerHTML = result.contacts.map(c => {
                const initials = (c.full_name || 'C').charAt(0).toUpperCase();
                const preview = c.last_message ? (c.last_message.length > 30 ? c.last_message.substring(0, 30) + '...' : c.last_message) : 'Sin mensajes aún';
                const isActive = currentClientId == c.id ? 'active' : '';
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
                    Sin conversaciones.<br>Agrega un cliente para empezar.
                </div>`;
        }
    }

    async function openAddClientModal() {
        addClientModalInstance.show();
        const list = document.getElementById('addClientList');
        list.innerHTML = '<div class="text-center text-muted p-3"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        const result = await apiCall('get_all_clients');
        if (result.success && result.clients && result.clients.length > 0) {
            list.innerHTML = result.clients.map(c => `
                <div class="d-flex align-items-center justify-content-between p-2 mb-1" style="background:#2a2a2a; border-radius:10px;">
                    <div>
                        <div style="font-size:0.88rem; font-weight:600;">${escapeHtml(c.full_name)}</div>
                        <div style="font-size:0.75rem; color:#888;">${escapeHtml(c.email)}${c.phone ? ' — 📞 ' + escapeHtml(c.phone) : ''}</div>
                    </div>
                    <button class="btn btn-sm btn-orange" onclick="selectClientForChat(${c.id}, '${escapeHtml(c.full_name)}')">
                        <i class="fa-solid fa-comment"></i> Chatear
                    </button>
                </div>`).join('');
        } else {
            list.innerHTML = '<div class="text-muted text-center p-3">No hay clientes disponibles</div>';
        }
    }

    function selectClientForChat(clientId, clientName) {
        addClientModalInstance.hide();
        openChat(clientId, clientName);
    }

    function openChat(clientId, clientName) {
        currentClientId = clientId;
        currentClientName = clientName;

        const header = document.getElementById('chatMainHeader');
        const initials = (clientName || 'C').charAt(0).toUpperCase();
        header.innerHTML = `
            <div style="width:32px;height:32px;border-radius:50%;background:var(--mech-orange);display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;color:#111;">${initials}</div>
            <span>${escapeHtml(clientName)}</span>`;

        document.querySelectorAll('.chat-contact-item').forEach(item => item.classList.remove('active'));

        loadChatMessages();
    }

    async function loadChatMessages() {
        const container = document.getElementById('chatMessages');
        if (!currentClientId) return;

        container.innerHTML = '<div class="chat-empty-state"><i class="fa-solid fa-spinner fa-spin fa-lg"></i></div>';
        const result = await apiCall('get_chat_messages', { other_user_id: currentClientId });

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
            loadChatContacts();
        }
    }

    async function sendMessage() {
        const message = document.getElementById('chatInput').value.trim();
        if (!message) { showToast('Escribe un mensaje', true); return; }
        if (!currentClientId) { showToast('Selecciona un cliente primero', true); return; }
        const result = await apiCall('send_message', { receiver_id: currentClientId, message });
        if (result.success) {
            document.getElementById('chatInput').value = '';
            loadChatMessages();
        } else showToast(result.message || 'Error al enviar', true);
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