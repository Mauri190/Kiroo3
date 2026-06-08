    // ========== VARIABLES GLOBALES ==========
    let CURRENT_USER_ID = null;
    let CURRENT_USER_ROLE = null;
    let currentDate = new Date();
    let events = [];
    let vehicles = [];
    let eventModalInstance = null;

    // ========== USER AUTH & MENU ==========
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

    function applyUserUI(name, username, avatarUrl, role) {
        const firstName = (name || 'Mecánico').split(' ')[0];
        const initials = (name || 'M').charAt(0).toUpperCase();

        document.getElementById('headerUserName').textContent = firstName;
        document.getElementById('headerInitials').textContent = initials;
        document.getElementById('ddName').textContent = name || 'Mecánico';
        document.getElementById('ddInitials').textContent = initials;
        document.getElementById('ddUsername').textContent = username ? '@' + username : '';

        if (avatarUrl) setAvatarFromUrl(avatarUrl);
    }

    async function checkAuth() {
        try {
            const fd = new FormData();
            fd.append('action', 'check_auth');
            const res = await fetch('auth.php', { method: 'POST', body: fd });
            const data = await res.json();
            
            if (data.authenticated) {
                CURRENT_USER_ID = data.user_id;
                CURRENT_USER_ROLE = data.user_type;
                
                const isMechanic = (CURRENT_USER_ROLE === 'mecanico');
                
                if (!isMechanic) {
                    window.location.href = 'dashboard_cliente.html';
                    return false;
                }
                
                applyUserUI(data.full_name || data.username, data.username, null, CURRENT_USER_ROLE);
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
        } catch(e) { }
    }

    function toggleDropdown(btn) {
        const panel = btn.nextElementSibling;
        const isOpen = panel.classList.contains('open');
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('open'));
        if (!isOpen) panel.classList.add('open');
    }

    function toggleUserMenu(e) {
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

    async function logout() {
        try {
            const fd = new FormData();
            fd.append('action', 'logout');
            await fetch('auth.php', { method: 'POST', body: fd });
        } catch(e) {}
        window.location.href = 'login.html';
    }

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
            const response = await fetch('api.php', { method: 'POST', body: formData });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Error de conexión: ' + error.message };
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    // ========== AGENDA ==========
    async function loadVehicles() {
        const result = await apiCall('get_vehicles');
        if (result.success && result.vehicles) {
            vehicles = result.vehicles;
            const select = document.getElementById('eventVehicle');
            select.innerHTML = '<option value="" disabled selected>Seleccionar vehículo...</option>';
            vehicles.forEach(v => {
                select.innerHTML += `<option value="${v.id}">${escapeHtml(v.brand)} ${escapeHtml(v.model)} (${escapeHtml(v.plate_number)})</option>`;
            });
            if (vehicles.length === 0) {
                document.getElementById('vehicleWarning').style.display = 'block';
            } else {
                document.getElementById('vehicleWarning').style.display = 'none';
            }
        }
        return result.success ? result.vehicles : [];
    }

    async function loadEvents() {
        const result = await apiCall('get_events');
        if (result.success && result.events) {
            events = result.events;
            renderCalendar();
            renderUpcomingEvents();
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
        
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        document.getElementById('monthYearDisplay').innerHTML = `${monthNames[month]} ${year}`;
        
        const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        document.getElementById('calendarWeekdays').innerHTML = weekdays.map(day => `<div class="weekday">${day}</div>`).join('');
        
        let calendarHTML = '';
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        for (let i = 0; i < startDayOfWeek; i++) {
            calendarHTML += `<div class="calendar-day empty"></div>`;
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.event_date === dateStr);
            const hasEvents = dayEvents.length > 0;
            const isToday = dateStr === todayStr;
            
            calendarHTML += `
                <div class="calendar-day ${hasEvents ? 'has-event' : ''} ${isToday ? 'today' : ''}" onclick="openAddEventOnDate('${dateStr}')">
                    <div class="day-number">${day}</div>
                    ${hasEvents ? `<div class="day-events">${dayEvents.slice(0, 3).map(() => '<div class="event-dot"></div>').join('')}${dayEvents.length > 3 ? '<div class="event-dot"></div>' : ''}</div>` : ''}
                </div>
            `;
        }
        
        const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (startDayOfWeek + daysInMonth);
        for (let i = 0; i < remainingCells; i++) {
            calendarHTML += `<div class="calendar-day empty"></div>`;
        }
        
        document.getElementById('calendarDays').innerHTML = calendarHTML;
    }

    window.openAddEventOnDate = function(dateStr) {
        document.getElementById('eventDate').value = dateStr;
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventTime').value = '09:00';
        document.getElementById('eventType').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('editEventId').value = '';
        document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-calendar-plus"></i> Nuevo evento';
        document.getElementById('vehicleDetails').style.display = 'none';
        eventModalInstance.show();
    }

    function renderUpcomingEvents() {
        const container = document.getElementById('upcomingEventsContainer');
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        const upcomingEvents = events
            .filter(e => e.event_date >= todayStr)
            .sort((a, b) => a.event_date.localeCompare(b.event_date))
            .slice(0, 10);
        
        if (upcomingEvents.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fa-regular fa-calendar-xmark"></i><p>No hay eventos próximos</p><small>Haz clic en un día del calendario para agregar un evento</small></div>`;
            return;
        }
        
        const typeIcons = {
            mantenimiento: '🔧', reparacion: '⚙️', inspeccion: '📋',
            lavado: '🧼', cita_mecanico: '🧑‍🔧', otro: '📌'
        };
        
        container.innerHTML = `<div class="upcoming-events-list">` + upcomingEvents.map(e => {
            const dateFormatted = new Date(e.event_date + 'T12:00:00').toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            const icon = typeIcons[e.event_type] || '📌';
            const vehicleName = e.brand ? `${e.brand} ${e.model} (${e.plate_number})` : (e.vehicle_name || '');
            
            return `
                <div class="event-item">
                    <div class="event-info">
                        <div class="event-title">${icon} ${escapeHtml(e.title)}</div>
                        <div class="event-meta">
                            <span><i class="fa-regular fa-calendar"></i> ${dateFormatted}</span>
                            <span><i class="fa-regular fa-clock"></i> ${e.event_time || '--:--'}</span>
                            ${vehicleName ? `<span><i class="fa-solid fa-car"></i> ${escapeHtml(vehicleName)}</span>` : ''}
                        </div>
                        ${e.description ? `<div class="small text-muted mt-1">${escapeHtml(e.description)}</div>` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="edit-event-btn" onclick="editEvent(${e.id})" title="Editar"><i class="fa-solid fa-pencil"></i></button>
                        <button class="delete-event-btn" onclick="deleteEvent(${e.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('') + `</div>`;
    }

    async function saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const vehicleId = document.getElementById('eventVehicle').value;
        const eventType = document.getElementById('eventType').value;
        const description = document.getElementById('eventDescription').value.trim();
        const eventId = document.getElementById('editEventId').value;
        
        if (!title || !date || !time || !vehicleId || !eventType) {
            showToast('Completa todos los campos obligatorios', true);
            return;
        }
        
        const result = await apiCall('save_event', {
            event_id: eventId || null,
            title,
            event_date: date,
            event_time: time,
            vehicle_id: vehicleId,
            event_type: eventType,
            description
        });
        
        if (result.success) {
            showToast(eventId ? 'Evento actualizado' : 'Evento creado correctamente');
            eventModalInstance.hide();
            await loadEvents();
        } else {
            showToast(result.message || 'Error al guardar', true);
        }
    }

    window.editEvent = async function(eventId) {
        const event = events.find(e => e.id == eventId);
        if (!event) return;
        
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.event_date;
        document.getElementById('eventTime').value = event.event_time || '09:00';
        document.getElementById('eventVehicle').value = event.vehicle_id;
        document.getElementById('eventType').value = event.event_type;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('editEventId').value = event.id;
        document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Editar evento';
        document.getElementById('vehicleDetails').style.display = 'none';
        eventModalInstance.show();
    }

    window.deleteEvent = async function(eventId) {
        if (!confirm('¿Eliminar este evento permanentemente?')) return;
        
        const result = await apiCall('delete_event', { event_id: eventId });
        if (result.success) {
            showToast('Evento eliminado');
            await loadEvents();
        } else {
            showToast(result.message || 'Error al eliminar', true);
        }
    }

    function changeMonth(delta) {
        currentDate.setMonth(currentDate.getMonth() + delta);
        renderCalendar();
    }

    // ========== INICIALIZACIÓN ==========
    document.addEventListener('DOMContentLoaded', async () => {
        const isAuth = await checkAuth();
        if (!isAuth) return;
        
        eventModalInstance = new bootstrap.Modal(document.getElementById('eventModal'));
        
        await loadVehicles();
        await loadEvents();
        
        document.getElementById('prevMonthBtn').addEventListener('click', () => changeMonth(-1));
        document.getElementById('nextMonthBtn').addEventListener('click', () => changeMonth(1));
        document.getElementById('openAddEventBtn').addEventListener('click', () => {
            document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventTime').value = '09:00';
            document.getElementById('eventType').value = '';
            document.getElementById('eventDescription').value = '';
            document.getElementById('editEventId').value = '';
            document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-calendar-plus"></i> Nuevo evento';
            document.getElementById('vehicleDetails').style.display = 'none';
            eventModalInstance.show();
        });
        document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
        
        document.getElementById('eventVehicle').addEventListener('change', function() {
            const vehicleId = this.value;
            const vehicle = vehicles.find(v => v.id == vehicleId);
            const detailsDiv = document.getElementById('vehicleDetails');
            if (vehicle) {
                detailsDiv.innerHTML = `<i class="fa-solid fa-car"></i> ${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)} | ${escapeHtml(vehicle.plate_number)} | ${vehicle.year || 'Año no registrado'}`;
                detailsDiv.style.display = 'block';
            } else {
                detailsDiv.style.display = 'none';
            }
        });
    });