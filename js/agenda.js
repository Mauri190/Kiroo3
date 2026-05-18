// Configuración
        const API_URL = 'api.php';
        
        let eventsList = [];
        let vehiclesArray = [];
        let currentDisplayDate = new Date();
        let editingEventId = null;
        let eventModalInstance;
        let toastInstance;
        let currentUser = null;

        // ========== VERIFICAR AUTENTICACIÓN ==========
        async function checkAuth() {
            try {
                const formData = new FormData();
                formData.append('action', 'check_auth');
                
                const response = await fetch('auth.php', {
                    method: 'POST',
                    body: formData
                });

                // Leer la respuesta como texto primero para detectar errores de PHP
                const rawText = await response.text();

                let data;
                try {
                    // Buscar JSON válido aunque PHP haya emitido warnings antes
                    const jsonStart = rawText.indexOf('{');
                    const jsonEnd = rawText.lastIndexOf('}');
                    if (jsonStart === -1 || jsonEnd === -1) {
                        throw new Error('No se encontró JSON en la respuesta');
                    }
                    data = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
                } catch (parseError) {
                    console.error('Error parseando respuesta auth.php:', rawText);
                    // No redirigir automáticamente si es un error de parseo;
                    // mostrar un aviso en lugar de rebotar al usuario al login
                    showAuthError('Error de servidor al verificar sesión. Recarga la página.');
                    return false;
                }

                console.log('Auth check:', data);
                
                if (data.authenticated) {
                    currentUser = data;
                    // Actualizar UI del usuario
                    const firstName = (data.full_name || data.username || 'Usuario').split(' ')[0];
                    document.getElementById('headerUserName').textContent = firstName;
                    document.getElementById('ddName').textContent = data.full_name || data.username;
                    document.getElementById('ddUsername').textContent = '@' + (data.username || '');
                    
                    const initials = (data.full_name || data.username || '?').charAt(0).toUpperCase();
                    document.getElementById('headerInitials').textContent = initials;
                    document.getElementById('ddInitials').textContent = initials;
                    
                    // Cargar foto de perfil
                    await loadProfilePicture();
                    
                    return true;
                } else {
                    // No autenticado → redirigir al login
                    window.location.href = 'login.html';
                    return false;
                }
            } catch (error) {
                // Error de red real (servidor caído, CORS, etc.)
                console.error('Error de red al verificar autenticación:', error);
                showAuthError('No se pudo conectar con el servidor. Verifica tu conexión.');
                return false;
            }
        }

        // Muestra un mensaje de error en la página en lugar de redirigir
        function showAuthError(msg) {
            document.body.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#1a1a1a;color:#fff;font-family:sans-serif;gap:1rem;">
                    <div style="font-size:3rem;">⚠️</div>
                    <div style="font-size:1.1rem;color:#ff6b6b;">${msg}</div>
                    <div style="display:flex;gap:1rem;margin-top:1rem;">
                        <button onclick="location.reload()" style="padding:0.6rem 1.4rem;background:#c62828;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:1rem;">Reintentar</button>
                        <a href="login.html" style="padding:0.6rem 1.4rem;background:#333;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:1rem;text-decoration:none;">Ir al Login</a>
                    </div>
                </div>`;
        }

        // ========== CARGAR FOTO DE PERFIL ==========
        async function loadProfilePicture() {
            try {
                const fd = new FormData();
                fd.append('action', 'get_profile');
                const res = await fetch('api.php', { method: 'POST', body: fd });
                const data = await res.json();

                if (data.success && data.profile && data.profile.profile_picture) {
                    const url = data.profile.profile_picture;
                    document.getElementById('headerAvatarIcon').style.display = 'none';
                    const img = document.getElementById('headerAvatarImg');
                    img.src = url; img.style.display = 'block';
                    document.getElementById('ddAvatarIcon').style.display = 'none';
                    const ddImg = document.getElementById('ddAvatarImg');
                    ddImg.src = url; ddImg.style.display = 'block';
                }
            } catch(e) { /* sin foto */ }
        }

        // ========== TOGGLE MENU ==========
        function toggleUserMenu(e) {
            e.stopPropagation();
            document.getElementById('userDropdown').classList.toggle('open');
        }

        document.addEventListener('click', function(e) {
            const wrapper = document.getElementById('userMenuWrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                document.getElementById('userDropdown').classList.remove('open');
            }
        });

        // ========== LOGOUT ==========
        async function logout() {
            try {
                const fd = new FormData();
                fd.append('action', 'logout');
                await fetch('auth.php', { method: 'POST', body: fd });
            } catch(e) {}
            window.location.href = 'login.html';
        }

        // ========== FUNCIONES DE API ==========
        async function loadVehiclesFromAPI() {
            try {
                const formData = new FormData();
                formData.append('action', 'get_vehicles');
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                console.log('Vehículos cargados:', data);
                
                if (data.success) {
                    vehiclesArray = data.vehicles || [];
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error cargando vehículos:', error);
                return false;
            }
        }

        async function loadEventsFromAPI() {
            try {
                const formData = new FormData();
                formData.append('action', 'get_events');
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                console.log('Eventos cargados:', data);
                
                if (data.success) {
                    eventsList = (data.events || []).map(event => ({
                        id: event.id.toString(),
                        title: event.title,
                        date: event.event_date,
                        time: event.event_time,
                        vehicleId: event.vehicle_id ? event.vehicle_id.toString() : null,
                        type: event.event_type,
                        description: event.description || '',
                        vehicleName: event.brand && event.model ? 
                            `${event.brand} ${event.model} (${event.plate_number || ''})` : 
                            'Vehículo no especificado',
                        brand: event.brand,
                        model: event.model,
                        plate_number: event.plate_number
                    }));
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error cargando eventos:', error);
                return false;
            }
        }

        async function saveEventToAPI(eventData, eventId = null) {
            try {
                const formData = new FormData();
                formData.append('action', 'save_event');
                formData.append('title', eventData.title);
                formData.append('event_date', eventData.date);
                formData.append('event_time', eventData.time);
                formData.append('event_type', eventData.type);
                formData.append('description', eventData.description || '');
                formData.append('vehicle_id', eventData.vehicleId || '');
                
                if (eventId) {
                    formData.append('event_id', eventId);
                }
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                
                return await response.json();
            } catch (error) {
                console.error('Error guardando evento:', error);
                return { success: false, message: 'Error de conexión' };
            }
        }

        async function deleteEventFromAPI(eventId) {
            try {
                const formData = new FormData();
                formData.append('action', 'delete_event');
                formData.append('event_id', eventId);
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData
                });
                
                return await response.json();
            } catch (error) {
                console.error('Error eliminando evento:', error);
                return { success: false, message: 'Error de conexión' };
            }
        }

        // ========== HELPERS ==========
        function showToast(message, isError = false) {
            const toastElement = document.getElementById('liveToast');
            const toastMessage = document.getElementById('toastMessage');
            toastMessage.textContent = message;
            
            if (isError) {
                toastElement.classList.add('bg-danger');
                toastElement.classList.remove('bg-success');
            } else {
                toastElement.classList.add('bg-success');
                toastElement.classList.remove('bg-danger');
            }
            
            if (!toastInstance) {
                toastInstance = new bootstrap.Toast(toastElement);
            }
            toastInstance.show();
        }

        function getVehicleById(vehicleId) {
            return vehiclesArray.find(v => String(v.id) === String(vehicleId));
        }

        function getVehicleNameById(vehicleId) {
            const v = getVehicleById(vehicleId);
            if (v) return `${v.brand || ''} ${v.model || ''} (${v.plate_number || ''})`.trim();
            return 'Vehículo no encontrado';
        }

        function getEventTypeLabel(type) {
            const types = {
                mantenimiento: '🔧 Mantenimiento',
                reparacion: '⚙️ Reparación',
                inspeccion: '📋 Inspección',
                lavado: '🧼 Lavado',
                cita_mecanico: '🧑‍🔧 Cita con mecánico',
                otro: '📌 Otro'
            };
            return types[type] || type;
        }

        function escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        function formatShortDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString + 'T12:00:00');
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        }

        // ========== MOSTRAR DETALLES DEL VEHÍCULO ==========
        window.showVehicleDetails = function() {
            const vehicleId = document.getElementById('eventVehicle').value;
            const detailsDiv = document.getElementById('vehicleDetails');
            
            if (!vehicleId) {
                detailsDiv.style.display = 'none';
                return;
            }
            
            const vehicle = getVehicleById(vehicleId);
            if (vehicle) {
                detailsDiv.style.display = 'block';
                detailsDiv.innerHTML = `
                    <strong>📋 Detalles del vehículo:</strong><br>
                    🚗 ${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}<br>
                    📌 Placa: ${escapeHtml(vehicle.plate_number)}<br>
                    📅 Año: ${vehicle.year || 'No especificado'}<br>
                    🔢 Kilometraje: ${vehicle.mileage ? Number(vehicle.mileage).toLocaleString() + ' km' : 'No especificado'}<br>
                    🎨 Color: ${vehicle.color || 'No especificado'}
                    ${vehicle.notes ? `<br>📝 Notas: ${escapeHtml(vehicle.notes)}` : ''}
                `;
            }
        };

        // ========== CARGAR SELECT DE VEHÍCULOS ==========
        async function loadVehiclesSelect() {
            await loadVehiclesFromAPI();
            
            const select = document.getElementById('eventVehicle');
            const warning = document.getElementById('vehicleWarning');
            const currentVal = select.value;

            select.innerHTML = '<option value="" disabled selected>Seleccionar vehículo...</option>';

            if (vehiclesArray.length === 0) {
                warning.style.display = 'block';
            } else {
                warning.style.display = 'none';
                vehiclesArray.forEach(veh => {
                    const option = document.createElement('option');
                    option.value = veh.id;
                    option.textContent = `${veh.brand || '?'} ${veh.model || '?'} (${veh.plate_number || '?'})`;
                    if (String(veh.id) === String(currentVal)) option.selected = true;
                    select.appendChild(option);
                });
            }
        }

        // ========== RENDER CALENDARIO ==========
        function renderCalendar() {
            const year = currentDisplayDate.getFullYear();
            const month = currentDisplayDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            let startWeekday = firstDayOfMonth.getDay();
            startWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            const todayYMD = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

            const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            document.getElementById('monthYearDisplay').innerHTML = `${monthNames[month]} ${year}`;

            let html = `<div class="calendar-grid">`;
            ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].forEach(d => { html += `<div class="cal-weekday">${d}</div>`; });

            for (let i = 0; i < startWeekday; i++) {
                html += `<div class="cal-day" style="background:transparent;cursor:default;"></div>`;
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const hasEvent = eventsList.some(ev => ev.date === dateStr);
                const isToday = (dateStr === todayYMD);
                let cls = 'cal-day';
                if (isToday) cls += ' current-day';
                if (hasEvent) cls += ' has-event';
                html += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
            }
            html += `</div>`;
            document.getElementById('calendarRoot').innerHTML = html;

            document.querySelectorAll('.cal-day[data-date]').forEach(el => {
                el.addEventListener('click', async () => {
                    const selectedDate = el.getAttribute('data-date');
                    editingEventId = null;
                    document.getElementById('eventFormModal').reset();
                    document.getElementById('editEventId').value = '';
                    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-calendar-plus"></i> Agregar evento';
                    document.getElementById('eventDate').value = selectedDate;
                    await loadVehiclesSelect();
                    eventModalInstance.show();
                });
            });
        }

        // ========== RENDER PRÓXIMOS EVENTOS ==========
        function renderUpcomingEvents() {
            const container = document.getElementById('upcomingEventsContainer');
            const todayStr = new Date().toISOString().split('T')[0];
            const nextMonthDate = new Date();
            nextMonthDate.setDate(nextMonthDate.getDate() + 30);
            const nextMonthStr = nextMonthDate.toISOString().split('T')[0];

            const upcoming = eventsList
                .filter(ev => ev.date >= todayStr && ev.date <= nextMonthStr)
                .sort((a, b) => a.date.localeCompare(b.date));

            if (upcoming.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="bi bi-calendar2-week"></i> No hay eventos programados<br><small>Haz clic en "+ Agregar" para crear uno</small></div>';
                return;
            }

            let html = '';
            upcoming.slice(0, 10).forEach(ev => {
                const formattedDate = formatShortDate(ev.date);
                const vehicleName = ev.vehicleName || getVehicleNameById(ev.vehicleId);
                html += `
                    <div class="event-item-card">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <div class="event-title-txt">${escapeHtml(ev.title)}</div>
                                <div class="event-meta"><i class="bi bi-calendar"></i> ${formattedDate} • ${ev.time}</div>
                                <div class="mt-1"><span class="badge-type">${getEventTypeLabel(ev.type)}</span> • 🚗 ${escapeHtml(vehicleName)}</div>
                                ${ev.description ? `<div class="small text-muted mt-2"><i class="bi bi-chat"></i> ${escapeHtml(ev.description.substring(0, 80))}${ev.description.length > 80 ? '...' : ''}</div>` : ''}
                            </div>
                            <div class="d-flex gap-1 ms-2">
                                <button class="btn btn-sm btn-outline-light edit-event-btn" data-id="${ev.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
                                <button class="btn btn-sm btn-outline-danger delete-event-btn" data-id="${ev.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
                            </div>
                        </div>
                    </div>`;
            });
            
            if (upcoming.length > 10) {
                html += `<div class="text-center text-muted small mt-2">+ ${upcoming.length - 10} eventos más...</div>`;
            }
            
            container.innerHTML = html;
            attachEventButtons();
        }

        function attachEventButtons() {
            document.querySelectorAll('.edit-event-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    const ev = eventsList.find(e => e.id === id);
                    if (!ev) return;
                    editingEventId = ev.id;
                    document.getElementById('eventTitle').value = ev.title;
                    document.getElementById('eventDate').value = ev.date;
                    document.getElementById('eventTime').value = ev.time;
                    document.getElementById('eventType').value = ev.type;
                    document.getElementById('eventDescription').value = ev.description || '';
                    document.getElementById('editEventId').value = ev.id;
                    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil-square"></i> Editar evento';
                    await loadVehiclesSelect();
                    setTimeout(() => {
                        document.getElementById('eventVehicle').value = ev.vehicleId;
                        showVehicleDetails();
                    }, 100);
                    eventModalInstance.show();
                });
            });
            
            document.querySelectorAll('.delete-event-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-id');
                    if (confirm('¿Eliminar este evento permanentemente?')) {
                        const result = await deleteEventFromAPI(id);
                        if (result.success) {
                            showToast('Evento eliminado correctamente');
                            await refreshAllUI();
                        } else {
                            showToast(result.message || 'Error al eliminar evento', true);
                        }
                    }
                });
            });
        }

        // ========== GUARDAR EVENTO ==========
        async function saveEventHandler() {
            const title = document.getElementById('eventTitle').value.trim();
            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime').value;
            const vehicleId = document.getElementById('eventVehicle').value;
            const type = document.getElementById('eventType').value;
            const description = document.getElementById('eventDescription').value.trim();
            const editId = document.getElementById('editEventId').value;

            if (!title || !date || !time || !vehicleId || !type) {
                showToast('Por favor completa todos los campos obligatorios (*)', true);
                return;
            }

            const eventData = { title, date, time, vehicleId, type, description };
            const result = await saveEventToAPI(eventData, editId || null);
            
            if (result.success) {
                showToast(editId ? 'Evento actualizado correctamente' : 'Evento guardado correctamente');
                await refreshAllUI();
                eventModalInstance.hide();
                document.getElementById('eventFormModal').reset();
                document.getElementById('editEventId').value = '';
                editingEventId = null;
            } else {
                showToast(result.message || 'Error al guardar evento', true);
            }
        }

        async function refreshAllUI() {
            await Promise.all([loadVehiclesFromAPI(), loadEventsFromAPI()]);
            renderCalendar();
            renderUpcomingEvents();
        }

        // ========== INICIALIZACIÓN ==========
        document.addEventListener('DOMContentLoaded', async () => {
            // Verificar autenticación primero
            const isAuth = await checkAuth();
            if (!isAuth) return;
            
            eventModalInstance = new bootstrap.Modal(document.getElementById('eventModal'));
            
            await refreshAllUI();
            await loadVehiclesSelect();

            document.getElementById('prevMonthBtn').addEventListener('click', () => {
                currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
                renderCalendar();
            });
            
            document.getElementById('nextMonthBtn').addEventListener('click', () => {
                currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
                renderCalendar();
            });

            document.getElementById('openAddEventBtn').addEventListener('click', async () => {
                editingEventId = null;
                document.getElementById('eventFormModal').reset();
                document.getElementById('editEventId').value = '';
                document.getElementById('modalTitle').innerHTML = '<i class="bi bi-calendar-plus"></i> Nuevo evento';
                document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
                await loadVehiclesSelect();
                eventModalInstance.show();
            });

            document.getElementById('saveEventBtn').addEventListener('click', saveEventHandler);
        });