    // ========== VARIABLES GLOBALES ==========
    let CURRENT_USER_ID = null;
    let currentMechanicId = null;
    let currentMechanicName = '';
    let vehicleModal, appointmentModal, eventModal, ratingModal, addMechanicModal;
    let refreshInterval = null;
    let currentRating = 0;

    // ========== FUNCIONES DE UI ==========
    function showToast(msg, isError = false) {
        const toast = document.getElementById('toastNotification');
        const toastMsg = document.getElementById('toastMessage');
        toastMsg.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-check-circle'} me-2"></i>${msg}`;
        toast.querySelector('div').className = isError ? 'bg-danger text-white p-3 rounded shadow' : 'bg-success text-white p-3 rounded shadow';
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }

    async function apiCall(action, data = {}) {
        try {
            const fd = new FormData();
            fd.append('action', action);
            Object.keys(data).forEach(k => { if (data[k] !== null && data[k] !== undefined) fd.append(k, data[k]); });
            const res = await fetch('api.php', { method: 'POST', body: fd });
            return await res.json();
        } catch(e) { return { success: false, message: 'Error de conexión' }; }
    }

    function escapeHtml(t) { if (!t) return ''; const div = document.createElement('div'); div.textContent = t; return div.innerHTML; }

    // ========== FUNCIONES DE AVATAR ==========
    function setAvatarFromUrl(url) {
        ['headerAvatarImg', 'ddAvatarImg'].forEach(id => {
            const img = document.getElementById(id);
            if (img) { img.src = url; img.style.display = 'block'; }
        });
        ['headerAvatarIcon', 'ddAvatarIcon'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    function applyUserUI(name, username, avatarUrl) {
        const firstName = (name || 'Cliente').split(' ')[0];
        const initials = (name || '?').charAt(0).toUpperCase();

        document.getElementById('headerUserName').textContent = firstName;
        document.getElementById('headerInitials').textContent = initials;
        document.getElementById('ddName').textContent = name || 'Cliente';
        document.getElementById('ddInitials').textContent = initials;
        document.getElementById('ddUsername').textContent = username ? '@' + username : '';

        if (avatarUrl) setAvatarFromUrl(avatarUrl);
    }

    // ========== AUTENTICACIÓN ==========
    async function checkAuth() {
        try {
            const fd = new FormData();
            fd.append('action', 'check_auth');
            const res = await fetch('auth.php', { method: 'POST', body: fd });
            const data = await res.json();
            
            if (data.authenticated) {
                CURRENT_USER_ID = data.id;
                applyUserUI(data.full_name || data.username, data.username, null);
                await loadProfilePicture();
                return true;
            }
            window.location.href = 'login.html';
            return false;
        } catch(e) { window.location.href = 'login.html'; return false; }
    }

    async function loadProfilePicture() {
        try {
            const fd = new FormData();
            fd.append('action', 'get_profile');
            const res = await fetch('api.php', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.success && data.profile && data.profile.profile_picture) {
                setAvatarFromUrl(data.profile.profile_picture);
            }
        } catch(e) { /* sin foto */ }
    }

    // ========== FUNCIÓN PARA RENDERIZAR ESTRELLAS ==========
    function renderStars(rating) {
        if (!rating || rating === 0) return '<span class="text-muted">Sin calificaciones</span>';
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating % 1) >= 0.5;
        for (let i = 0; i < fullStars; i++) stars += '<i class="fa-solid fa-star"></i>';
        if (hasHalfStar) stars += '<i class="fa-solid fa-star-half-alt"></i>';
        for (let i = stars.length; i < 5; i++) stars += '<i class="fa-regular fa-star"></i>';
        return `<div class="rating-stars">${stars}</div>`;
    }

    // ========== TABS ==========
    function switchTab(tabName) {
        document.querySelectorAll('.tab-content-panel').forEach(t => t.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-' + tabName).style.display = 'block';
        event.target.classList.add('active');
        if (tabName === 'diagnostics') loadDiagnostics();
        else if (tabName === 'appointments') loadAppointments();
        else if (tabName === 'vehicles') loadVehicles();
        else if (tabName === 'agenda') loadEvents();
        else if (tabName === 'mechanics') loadMechanics();
        else if (tabName === 'chat') loadChatContacts();
    }

    // ========== DIAGNÓSTICOS ==========
    async function loadDiagnostics() {
        const container = document.getElementById('diagnosticsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
        const res = await apiCall('get_diagnostics');
        if (res.success && res.diagnostics?.length) {
            container.innerHTML = res.diagnostics.map(d => {
                const rated = d.rated == 1 || d.rated === true;
                return `
                <div class="diagnostic-card">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div><strong>🔧 Diagnóstico #${d.id}</strong><div class="small text-muted">📅 ${new Date(d.created_at).toLocaleDateString()}</div></div>
                        <span class="badge-status status-completado">Completado</span>
                    </div>
                    <div class="mt-2 small"><strong>👨‍🔧 ${escapeHtml(d.mechanic_name || 'Mecánico')}</strong></div>
                    ${d.diagnosis ? `<div class="diagnostic-section mt-2"><div class="section-label">Diagnóstico</div><div class="section-value">${escapeHtml(d.diagnosis)}</div></div>` : ''}
                    ${d.recommendation ? `<div class="diagnostic-section"><div class="section-label">Recomendación</div><div class="section-value">${escapeHtml(d.recommendation)}</div></div>` : ''}
                    <div class="mt-3">
                        ${!rated ? 
                            `<button class="btn-red btn-sm" onclick='openRatingModal(${d.id}, "${escapeHtml(d.mechanic_name)}")'><i class="fa-solid fa-star"></i> Calificar este diagnóstico</button>` : 
                            `<div class="d-flex align-items-center gap-2 flex-wrap"><span class="badge bg-success"><i class="fa-solid fa-check"></i> Calificado</span>${d.rating ? renderStars(parseFloat(d.rating)) : ''}</div>`
                        }
                    </div>
                </div>`;
            }).join('');
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-clipboard-check"></i><p>No hay diagnósticos</p></div>';
        }
    }

    function openRatingModal(diagnosticId, mechanicName) {
        document.getElementById('ratingDiagnosticId').value = diagnosticId;
        document.getElementById('ratingMechanicName').textContent = mechanicName;
        currentRating = 0;
        document.getElementById('selectedRating').value = '0';
        const stars = document.querySelectorAll('#ratingStars i');
        stars.forEach((star, i) => {
            star.className = 'fa-regular fa-star';
            star.style.fontSize = '1.8rem';
        });
        ratingModal.show();
    }
    
    function setRating(r) {
        currentRating = r;
        document.getElementById('selectedRating').value = r;
        const stars = document.querySelectorAll('#ratingStars i');
        stars.forEach((star, i) => {
            star.className = i < r ? 'fa-solid fa-star' : 'fa-regular fa-star';
            star.style.fontSize = '1.8rem';
        });
    }
    
    async function submitRating() {
        const rating = parseInt(document.getElementById('selectedRating').value);
        if (!rating) { showToast('Selecciona una calificación', true); return; }
        const res = await apiCall('rate_diagnostic', { 
            diagnostic_id: document.getElementById('ratingDiagnosticId').value, 
            rating, 
            comment: document.getElementById('ratingComment').value 
        });
        if (res.success) {
            showToast('Gracias por calificar');
            ratingModal.hide();
            loadDiagnostics();
        } else showToast(res.message || 'Error', true);
    }

    // ========== CITAS ==========
    async function loadAppointments() {
        const container = document.getElementById('appointmentsList');
        container.innerHTML = '<div class="text-center text-muted p-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>';
        const res = await apiCall('get_appointments');
        if (res.success && res.appointments?.length) {
            container.innerHTML = res.appointments.map(a => `<div class="appointment-card"><div class="d-flex justify-content-between"><div><strong>📅 ${a.appointment_date} - ${a.appointment_time}</strong><div class="small">👨‍🔧 ${escapeHtml(a.mechanic_name)}</div></div><span class="badge-status status-${a.status}">${a.status}</span></div></div>`).join('');
        } else { container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>No hay citas</p><button class="btn-red btn-sm" onclick="showNewAppointmentModal()">Solicitar</button></div>'; }
    }
    
    async function showNewAppointmentModal() { 
        const m = await apiCall('get_mechanics'); 
        const sel = document.getElementById('appointmentMechanic'); 
        sel.innerHTML = '<option value="">Seleccionar...</option>'; 
        if(m.success && m.mechanics) m.mechanics.forEach(mec => sel.innerHTML += `<option value="${mec.id}">${escapeHtml(mec.full_name)}</option>`); 
        const v = await apiCall('get_vehicles'); 
        const vSel = document.getElementById('appointmentVehicle'); 
        vSel.innerHTML = '<option value="">Sin vehículo</option>'; 
        if(v.success && v.vehicles) v.vehicles.forEach(veh => vSel.innerHTML += `<option value="${veh.id}">${escapeHtml(veh.brand)} ${escapeHtml(veh.model)}</option>`); 
        document.getElementById('appointmentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentTime').value = '09:00';
        appointmentModal.show(); 
    }
    
    async function saveAppointment() { 
        const res = await apiCall('save_appointment', { 
            mechanic_id: document.getElementById('appointmentMechanic').value, 
            vehicle_id: document.getElementById('appointmentVehicle').value, 
            appointment_date: document.getElementById('appointmentDate').value, 
            appointment_time: document.getElementById('appointmentTime').value, 
            notes: document.getElementById('appointmentNotes').value 
        }); 
        if(res.success) { showToast('Cita solicitada'); appointmentModal.hide(); loadAppointments(); } 
        else showToast(res.message || 'Error', true); 
    }

    // ========== VEHÍCULOS ==========
    async function loadVehicles() { 
        const res = await apiCall('get_vehicles'); 
        const container = document.getElementById('vehiclesList'); 
        if(res.success && res.vehicles?.length) { 
            container.innerHTML = res.vehicles.map(v => `<div class="diagnostic-card"><div class="d-flex justify-content-between"><div><strong>${escapeHtml(v.brand)} ${escapeHtml(v.model)}</strong><div class="small">${escapeHtml(v.plate_number)}</div></div><button class="btn-red btn-sm" onclick="deleteVehicle(${v.id})"><i class="fa-solid fa-trash"></i></button></div></div>`).join(''); 
        } else { container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-car"></i><p>Sin vehículos</p><button class="btn-red btn-sm" onclick="showVehicleModal()">Agregar</button></div>'; } 
    }
    
    function showVehicleModal() { 
        document.getElementById('vehicleId').value = ''; 
        document.getElementById('vehicleBrand').value = ''; 
        document.getElementById('vehicleModel').value = ''; 
        document.getElementById('vehiclePlate').value = ''; 
        document.getElementById('vehicleYear').value = '';
        document.getElementById('vehicleMileage').value = '0';
        document.getElementById('vehicleColor').value = '';
        document.getElementById('vehicleNotes').value = '';
        vehicleModal.show(); 
    }
    
    async function saveVehicle() { 
        const res = await apiCall('save_vehicle', { 
            vehicle_id: document.getElementById('vehicleId').value || null,
            brand: document.getElementById('vehicleBrand').value, 
            model: document.getElementById('vehicleModel').value, 
            plate_number: document.getElementById('vehiclePlate').value, 
            year: document.getElementById('vehicleYear').value, 
            mileage: document.getElementById('vehicleMileage').value, 
            color: document.getElementById('vehicleColor').value,
            notes: document.getElementById('vehicleNotes').value
        }); 
        if(res.success) { showToast('Vehículo guardado'); vehicleModal.hide(); loadVehicles(); } 
        else showToast(res.message || 'Error', true); 
    }
    
    async function deleteVehicle(id) { if(confirm('¿Eliminar?')) { const res = await apiCall('delete_vehicle', { vehicle_id: id }); if(res.success) { showToast('Eliminado'); loadVehicles(); } } }

    // ========== EVENTOS ==========
    async function loadEvents() { 
        const res = await apiCall('get_events'); 
        const container = document.getElementById('eventsList'); 
        if(res.success && res.events?.length) { 
            container.innerHTML = res.events.map(e => `<div class="event-card"><div><strong>${escapeHtml(e.title)}</strong><div class="small">📅 ${e.event_date} ${e.event_time}</div></div></div>`).join(''); 
        } else { container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-alt"></i><p>Sin eventos</p><button class="btn-red btn-sm" onclick="showEventModal()">Agregar</button></div>'; } 
    }
    
    function showEventModal() { 
        document.getElementById('eventId').value = ''; 
        document.getElementById('eventTitle').value = ''; 
        document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('eventTime').value = '10:00';
        document.getElementById('eventType').value = 'otro';
        document.getElementById('eventDescription').value = '';
        eventModal.show(); 
    }
    
    async function saveEvent() { 
        const res = await apiCall('save_event', { 
            event_id: document.getElementById('eventId').value || null,
            title: document.getElementById('eventTitle').value, 
            event_date: document.getElementById('eventDate').value, 
            event_time: document.getElementById('eventTime').value, 
            event_type: document.getElementById('eventType').value, 
            description: document.getElementById('eventDescription').value, 
            vehicle_id: document.getElementById('eventVehicle').value 
        }); 
        if(res.success) { showToast('Evento guardado'); eventModal.hide(); loadEvents(); } 
        else showToast(res.message || 'Error', true); 
    }

    // ========== MECÁNICOS (con estrellas) ==========
    async function loadMechanics() { 
        const res = await apiCall('get_mechanics'); 
        const container = document.getElementById('mechanicsList'); 
        if(res.success && res.mechanics?.length) { 
            container.innerHTML = res.mechanics.map(m => {
                const rating = m.rating ? parseFloat(m.rating) : 0;
                return `<div class="mechanic-card">
                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div>
                            <strong><i class="fa-solid fa-user-gear"></i> ${escapeHtml(m.full_name)}</strong>
                            <div class="small text-muted">🔧 ${escapeHtml(m.specialty || 'Mecánica general')}</div>
                            <div class="mt-1">${renderStars(rating)}</div>
                            ${m.workshop_name ? `<div class="small text-muted mt-1">🏪 ${escapeHtml(m.workshop_name)}</div>` : ''}
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn-red btn-sm" onclick="quickAppointment(${m.id})"><i class="fa-solid fa-calendar-plus"></i> Cita</button>
                            <button class="btn-outline-red btn-sm" onclick="openChatTab(${m.id}, '${escapeHtml(m.full_name)}')"><i class="fa-solid fa-comment"></i> Chat</button>
                        </div>
                    </div>
                </div>`;
            }).join(''); 
        } else { container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-users-slash"></i><p>No hay mecánicos</p></div>'; } 
    }
    
    function quickAppointment(id) { showNewAppointmentModal(); setTimeout(() => { document.getElementById('appointmentMechanic').value = id; }, 100); }
    
    function openChatTab(mechanicId, mechanicName) {
        switchTab('chat');
        setTimeout(() => openChat(mechanicId, mechanicName), 100);
    }

    // ========== CHAT ==========
    async function loadChatContacts() { 
        const res = await apiCall('get_chat_contacts'); 
        const list = document.getElementById('chatContactList'); 
        if(res.success && res.contacts?.length) { 
            list.innerHTML = res.contacts.map(c => `<div class="chat-contact-item" onclick="openChat(${c.id}, '${escapeHtml(c.full_name)}')"><div class="chat-contact-avatar">${(c.full_name || 'M').charAt(0)}</div><div class="chat-contact-info"><div class="chat-contact-name">${escapeHtml(c.full_name)}</div><div class="chat-contact-preview">${escapeHtml(c.last_message || 'Sin mensajes')}</div></div></div>`).join(''); 
        } else { list.innerHTML = '<div class="text-center p-3">Sin conversaciones</div>'; } 
    }
    
    function openChat(mechanicId, mechanicName) { 
        currentMechanicId = mechanicId; 
        currentMechanicName = mechanicName; 
        document.getElementById('chatMainHeader').innerHTML = `<div class="chat-contact-avatar" style="width:32px;height:32px;">${mechanicName.charAt(0)}</div><span>${escapeHtml(mechanicName)}</span>`; 
        loadChatMessages(); 
    }
    
    async function loadChatMessages() { 
        const container = document.getElementById('chatMessages'); 
        if(!currentMechanicId) return; 
        const res = await apiCall('get_chat_messages', { other_user_id: currentMechanicId }); 
        if(res.success && res.messages?.length) { 
            container.innerHTML = res.messages.map(m => `<div class="chat-bubble ${m.sender_id == CURRENT_USER_ID ? 'chat-sent' : 'chat-received'}"><div>${escapeHtml(m.message)}</div><small>${new Date(m.created_at).toLocaleTimeString()}</small></div>`).join(''); 
            container.scrollTop = container.scrollHeight; 
        } else { container.innerHTML = '<div class="chat-empty-state"><i class="fa-solid fa-comment-dots"></i><div>Sin mensajes</div></div>'; } 
    }
    
    async function sendMessage() { 
        const msg = document.getElementById('chatInput').value.trim(); 
        if(!msg || !currentMechanicId) return; 
        const res = await apiCall('send_message', { receiver_id: currentMechanicId, message: msg }); 
        if(res.success) { document.getElementById('chatInput').value = ''; loadChatMessages(); loadChatContacts(); } 
        else showToast('Error al enviar', true); 
    }
    
    async function openAddMechanicModal() { 
        const res = await apiCall('get_all_mechanics'); 
        const list = document.getElementById('addMechanicList'); 
        if(res.success && res.mechanics?.length) { 
            list.innerHTML = res.mechanics.map(m => `<div class="d-flex justify-content-between p-2 mb-1" style="background:#1a1a1a; border-radius:10px;"><div><strong>${escapeHtml(m.full_name)}</strong><div class="small text-muted">${escapeHtml(m.specialty || '')}</div></div><button class="btn-red btn-sm" onclick="selectMechanicForChat(${m.id}, '${escapeHtml(m.full_name)}')">Chatear</button></div>`).join(''); 
        } else { list.innerHTML = '<div class="text-muted p-3">No hay mecánicos</div>'; } 
        addMechanicModal.show(); 
    }
    
    function selectMechanicForChat(id, name) { addMechanicModal.hide(); openChat(id, name); switchTab('chat'); }

    // ========== LOGOUT & DROPDOWNS ==========
    async function logout() { try { const fd = new FormData(); fd.append('action', 'logout'); await fetch('auth.php', { method: 'POST', body: fd }); } catch(e) {} window.location.href = 'login.html'; }
    
    function toggleDropdown(btn) { const panel = btn.nextElementSibling; const isOpen = panel.classList.contains('open'); document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('open')); if(!isOpen) panel.classList.add('open'); }
    
    function toggleUserMenu(e) { e.stopPropagation(); document.getElementById('userDropdown').classList.toggle('open'); }
    
    document.addEventListener('click', function(e) { 
        if(!e.target.closest('.dropdown')) document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('open')); 
        if(!e.target.closest('#userMenuWrapper')) document.getElementById('userDropdown')?.classList.remove('open'); 
    });

    // ========== INIT ==========
    document.addEventListener('DOMContentLoaded', async () => {
        if(!await checkAuth()) return;
        
        vehicleModal = new bootstrap.Modal(document.getElementById('vehicleModal'));
        appointmentModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
        eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
        ratingModal = new bootstrap.Modal(document.getElementById('ratingModal'));
        addMechanicModal = new bootstrap.Modal(document.getElementById('addMechanicModal'));
        
        loadDiagnostics();
        
        refreshInterval = setInterval(() => { 
            const active = document.querySelector('.tab-btn.active')?.innerText || ''; 
            if(active.includes('Diagnósticos')) loadDiagnostics(); 
            else if(active.includes('Citas')) loadAppointments(); 
            else if(active.includes('Chat') && currentMechanicId) loadChatMessages(); 
        }, 15000);
    });
    
    window.addEventListener('beforeunload', () => { if(refreshInterval) clearInterval(refreshInterval); });