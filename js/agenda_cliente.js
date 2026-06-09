// ========== VARIABLES GLOBALES ==========
let CURRENT_USER_ID = null;
let currentDate = new Date();
let eventsData = [];
let vehiclesData = [];
let eventModalInstance = null;

// ========== FUNCIONES DE UI ==========
function showToast(message, isError = false) {
    const toastElement = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMessage');
    toastBody.textContent = message;
    toastElement.classList.remove('bg-danger', 'bg-success');
    toastElement.classList.add(isError ? 'bg-danger' : 'bg-success');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

async function apiCall(action, data = {}) {
    try {
        const fd = new FormData();
        fd.append('action', action);
        Object.keys(data).forEach(k => {
            if (data[k] !== null && data[k] !== undefined) fd.append(k, data[k]);
        });
        const res = await fetch('api.php', { method: 'POST', body: fd });
        return await res.json();
    } catch(e) {
        return { success: false, message: 'Error de conexión' };
    }
}

function escapeHtml(t) {
    if (!t) return '';
    const div = document.createElement('div');
    div.textContent = t;
    return div.innerHTML;
}

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
        } else {
            window.location.href = 'login.html';
            return false;
        }
    } catch(e) {
        console.error('Auth error:', e);
        window.location.href = 'login.html';
        return false;
    }
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

// ========== EVENTOS ==========
async function loadEvents() {
    const result = await apiCall('get_events');
    if (result.success && result.events) {
        eventsData = result.events;
        renderCalendar();
        renderUpcomingEvents();
    } else {
        eventsData = [];
        renderCalendar();
        renderUpcomingEvents();
    }
}

async function loadVehicles() {
    const result = await apiCall('get_vehicles');
    if (result.success && result.vehicles) {
        vehiclesData = result.vehicles;
        updateVehicleSelect();
    }
}

function updateVehicleSelect() {
    const select = document.getElementById('eventVehicle');
    const warning = document.getElementById('vehicleWarning');
    
    if (vehiclesData.length === 0) {
        select.innerHTML = '<option value="" disabled selected>No hay vehículos registrados</option>';
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
        select.innerHTML = '<option value="" disabled selected>Seleccionar vehículo...</option>';
        vehiclesData.forEach(v => {
            select.innerHTML += `<option value="${v.id}">${escapeHtml(v.brand)} ${escapeHtml(v.model)} - ${escapeHtml(v.plate_number)}</option>`;
        });
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('monthYearDisplay').innerHTML = `${monthNames[month]} ${year}`;
    
    let calendarHtml = '<div class="calendar-weekdays">';
    const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    weekdays.forEach(day => { calendarHtml += `<div>${day}</div>`; });
    calendarHtml += '</div><div class="calendar-days">';
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    for (let i = 0; i < startDayOfWeek; i++) {
        const prevDay = prevMonthLastDay - startDayOfWeek + i + 1;
        calendarHtml += `<div class="calendar-day other-month">${prevDay}</div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEvent = eventsData.some(e => e.event_date === dateStr);
        const isToday = dateStr === todayStr;
        
        let classes = 'calendar-day';
        if (hasEvent) classes += ' has-event';
        if (isToday) classes += ' today';
        
        calendarHtml += `<div class="${classes}" onclick="selectDate('${dateStr}')">
            ${day}
            ${hasEvent ? '<div class="event-indicator"></div>' : ''}
        </div>`;
    }
    
    const totalCells = 42;
    const cellsUsed = startDayOfWeek + daysInMonth;
    const remainingDays = totalCells - cellsUsed;
    for (let i = 1; i <= remainingDays; i++) {
        calendarHtml += `<div class="calendar-day other-month">${i}</div>`;
    }
    
    calendarHtml += '</div>';
    document.getElementById('calendarRoot').innerHTML = calendarHtml;
}

window.selectDate = function(dateStr) {
    document.getElementById('eventDate').value = dateStr;
    openEventModal();
}

function renderUpcomingEvents() {
    const container = document.getElementById('upcomingEventsContainer');
    const today = new Date().toISOString().split('T')[0];
    const futureEvents = eventsData
        .filter(e => e.event_date >= today)
        .sort((a, b) => a.event_date.localeCompare(b.event_date))
        .slice(0, 10);
    
    if (futureEvents.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-calendar2-x"></i><p>No hay eventos próximos</p><small>Agrega un evento con el botón +</small></div>';
        return;
    }
    
    const icons = { mantenimiento:'🔧', reparacion:'⚙️', inspeccion:'📋', lavado:'🧼', cita_mecanico:'🧑‍🔧', otro:'📌' };
    
    container.innerHTML = futureEvents.map(e => {
        const dateFormatted = new Date(e.event_date + 'T12:00:00').toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        return `
            <div class="event-item">
                <div class="event-title">${icons[e.event_type] || '📌'} ${escapeHtml(e.title)}</div>
                <div class="event-date">📅 ${dateFormatted} — ${e.event_time}</div>
                ${e.brand ? `<div class="event-date">🚗 ${escapeHtml(e.brand)} ${escapeHtml(e.model)} (${escapeHtml(e.plate_number)})</div>` : ''}
                ${e.description ? `<div class="event-date">📝 ${escapeHtml(e.description)}</div>` : ''}
                <div class="event-actions">
                    <button class="btn-outline-red-sm" onclick="editEvent(${e.id})"><i class="bi bi-pencil"></i> Editar</button>
                    <button class="btn-outline-red-sm" onclick="deleteEvent(${e.id})"><i class="bi bi-trash"></i> Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function openEventModal(eventId = null) {
    if (eventId) {
        const event = eventsData.find(e => e.id == eventId);
        if (event) {
            document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil-square"></i> Editar evento';
            document.getElementById('editEventId').value = event.id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.event_date;
            document.getElementById('eventTime').value = event.event_time;
            document.getElementById('eventType').value = event.event_type;
            document.getElementById('eventDescription').value = event.description || '';
            if (event.vehicle_id) {
                document.getElementById('eventVehicle').value = event.vehicle_id;
            }
        }
    } else {
        document.getElementById('modalTitle').innerHTML = '<i class="bi bi-calendar-plus"></i> Nuevo evento';
        document.getElementById('editEventId').value = '';
        document.getElementById('eventTitle').value = '';
        if (!document.getElementById('eventDate').value) {
            document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
        }
        document.getElementById('eventTime').value = '10:00';
        document.getElementById('eventType').value = '';
        document.getElementById('eventDescription').value = '';
    }
    eventModalInstance.show();
}

window.editEvent = function(eventId) {
    openEventModal(eventId);
}

async function saveEvent() {
    const eventData = {
        event_id: document.getElementById('editEventId').value || null,
        title: document.getElementById('eventTitle').value.trim(),
        event_date: document.getElementById('eventDate').value,
        event_time: document.getElementById('eventTime').value,
        event_type: document.getElementById('eventType').value,
        description: document.getElementById('eventDescription').value.trim(),
        vehicle_id: document.getElementById('eventVehicle').value || null
    };
    
    if (!eventData.title || !eventData.event_date || !eventData.event_time || !eventData.event_type) {
        showToast('Completa todos los campos obligatorios', true);
        return;
    }
    
    const result = await apiCall('save_event', eventData);
    if (result.success) {
        showToast(eventData.event_id ? 'Evento actualizado' : 'Evento creado');
        eventModalInstance.hide();
        loadEvents();
    } else {
        showToast(result.message || 'Error al guardar', true);
    }
}

window.deleteEvent = async function(eventId) {
    if (confirm('¿Eliminar este evento?')) {
        const result = await apiCall('delete_event', { event_id: eventId });
        if (result.success) {
            showToast('Evento eliminado');
            loadEvents();
        } else {
            showToast(result.message || 'Error al eliminar', true);
        }
    }
}

// ========== NAVEGACIÓN DEL CALENDARIO ==========
function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// ========== LOGOUT & DROPDOWNS ==========
window.logout = async function() {
    try {
        const fd = new FormData();
        fd.append('action', 'logout');
        await fetch('auth.php', { method: 'POST', body: fd });
    } catch(e) {}
    window.location.href = 'login.html';
}

window.toggleDropdown = function(btn) {
    const panel = btn.nextElementSibling;
    const isOpen = panel.classList.contains('open');
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('open'));
    if (!isOpen) panel.classList.add('open');
}

window.toggleUserMenu = function(e) {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('open');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('open'));
    }
    if (!e.target.closest('#userMenuWrapper')) {
        document.getElementById('userDropdown')?.classList.remove('open');
    }
});

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await checkAuth();
    if (!isAuth) return;
    
    eventModalInstance = new bootstrap.Modal(document.getElementById('eventModal'));
    
    await loadVehicles();
    await loadEvents();
    
    document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
    document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);
    document.getElementById('openAddEventBtn').addEventListener('click', () => openEventModal());
    document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
});