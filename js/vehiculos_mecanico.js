    // ========== VARIABLES GLOBALES ==========
    let CURRENT_USER_ID = null;
    let CURRENT_USER_ROLE = null;
    let vehicles = [];
    let selectedVehicleId = null;

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
    function showAlert(message, type = 'success') {
        const container = document.getElementById('alertContainer');
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
            <span>${message}</span>
            <span class="close-alert" onclick="this.parentElement.remove()">&times;</span>
        `;
        container.appendChild(alertDiv);
        setTimeout(() => {
            if (alertDiv.parentElement) alertDiv.remove();
        }, 5000);
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

    function formatDate(dateString) {
        if (!dateString) return 'No disponible';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // ========== VEHÍCULOS ==========
    async function loadVehicles() {
        const container = document.getElementById('vehiclesList');
        container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando vehículos...</div>';
        
        const result = await apiCall('get_vehicles');
        
        if (result.success && result.vehicles) {
            vehicles = result.vehicles;
            renderVehiclesList();
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-car-side"></i><p>No se pudieron cargar los vehículos</p><small>${result.message || 'Error desconocido'}</small></div>`;
        }
    }

    function renderVehiclesList() {
        const container = document.getElementById('vehiclesList');
        
        if (vehicles.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-car-side"></i><p>No tienes vehículos registrados</p><small>Agrega un vehículo usando el formulario</small></div>`;
            return;
        }
        
        container.innerHTML = vehicles.map(vehicle => {
            const isSelected = selectedVehicleId == vehicle.id;
            return `
            <div class="vehicle-card" style="${isSelected ? 'border-left-color: #ffaa00;' : ''}" id="vehicle-${vehicle.id}">
                <div class="vehicle-header">
                    <div class="vehicle-title">
                        <i class="fa-solid fa-car"></i> ${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}
                    </div>
                    <div class="vehicle-plate">${escapeHtml(vehicle.plate_number)}</div>
                </div>
                <div class="vehicle-details">
                    <div class="detail-item">
                        <div class="detail-label">Año</div>
                        <div class="detail-value">${vehicle.year || 'No especificado'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Kilometraje</div>
                        <div class="detail-value">${vehicle.mileage ? parseInt(vehicle.mileage).toLocaleString() + ' km' : 'No especificado'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Color</div>
                        <div class="detail-value">${vehicle.color || 'No especificado'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Registrado</div>
                        <div class="detail-value">${formatDate(vehicle.created_at)}</div>
                    </div>
                </div>
                ${vehicle.notes ? `
                <div class="detail-item" style="margin-top: 10px; background: #0f0f0f; padding: 8px; border-radius: 8px;">
                    <div class="detail-label">Notas</div>
                    <div class="detail-value" style="font-size: 0.8rem;">${escapeHtml(vehicle.notes)}</div>
                </div>
                ` : ''}
                <div class="vehicle-actions">
                    <button class="btn-edit" onclick="editVehicle(${vehicle.id})">
                        <i class="fa-solid fa-pencil"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteVehicle(${vehicle.id})">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    async function saveVehicle(event) {
        event.preventDefault();
        
        const vehicleId = document.getElementById('vehicleId').value;
        const brand = document.getElementById('brand').value.trim();
        const model = document.getElementById('model').value.trim();
        const plateNumber = document.getElementById('plateNumber').value.trim();
        const year = document.getElementById('year').value;
        const mileage = document.getElementById('mileage').value;
        const color = document.getElementById('color').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        if (!brand || !model || !plateNumber) {
            showAlert('Marca, modelo y placa son obligatorios', 'error');
            return;
        }
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        
        const result = await apiCall('save_vehicle', {
            vehicle_id: vehicleId || null,
            brand,
            model,
            plate_number: plateNumber,
            year: year || null,
            mileage: mileage || 0,
            color,
            notes
        });
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Vehículo';
        
        if (result.success) {
            showAlert(vehicleId ? 'Vehículo actualizado correctamente' : 'Vehículo registrado correctamente', 'success');
            resetForm();
            await loadVehicles();
        } else {
            showAlert(result.message || 'Error al guardar', 'error');
        }
    }

    window.editVehicle = async function(vehicleId) {
        const vehicle = vehicles.find(v => v.id == vehicleId);
        if (!vehicle) return;
        
        document.getElementById('vehicleId').value = vehicle.id;
        document.getElementById('brand').value = vehicle.brand;
        document.getElementById('model').value = vehicle.model;
        document.getElementById('plateNumber').value = vehicle.plate_number;
        document.getElementById('year').value = vehicle.year || '';
        document.getElementById('mileage').value = vehicle.mileage || 0;
        document.getElementById('color').value = vehicle.color || '';
        document.getElementById('notes').value = vehicle.notes || '';
        
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Editar Vehículo';
        document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Actualizar Vehículo';
        
        selectedVehicleId = vehicleId;
        renderVehiclesList();
        
        document.querySelector('.two-columns').scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteVehicle = async function(vehicleId) {
        const vehicle = vehicles.find(v => v.id == vehicleId);
        if (!confirm(`¿Eliminar el vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})?`)) return;
        
        const result = await apiCall('delete_vehicle', { vehicle_id: vehicleId });
        
        if (result.success) {
            showAlert('Vehículo eliminado correctamente', 'success');
            if (document.getElementById('vehicleId').value == vehicleId) {
                resetForm();
            }
            await loadVehicles();
        } else {
            showAlert(result.message || 'Error al eliminar', 'error');
        }
    };

    function resetForm() {
        document.getElementById('vehicleForm').reset();
        document.getElementById('vehicleId').value = '';
        document.getElementById('brand').value = '';
        document.getElementById('model').value = '';
        document.getElementById('plateNumber').value = '';
        document.getElementById('year').value = '';
        document.getElementById('mileage').value = '0';
        document.getElementById('color').value = '';
        document.getElementById('notes').value = '';
        
        document.getElementById('formTitle').innerHTML = '<i class="fa-solid fa-plus-circle"></i> Nuevo Vehículo';
        document.getElementById('submitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Guardar Vehículo';
        
        selectedVehicleId = null;
        renderVehiclesList();
    }

    // ========== INICIALIZACIÓN ==========
    document.addEventListener('DOMContentLoaded', async () => {
        const isAuth = await checkAuth();
        if (!isAuth) return;
        
        await loadVehicles();
        
        document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);
        document.getElementById('newVehicleBtn').addEventListener('click', resetForm);
    });