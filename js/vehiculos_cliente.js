    // ========== VARIABLES ==========
    let CURRENT_USER_ID = null;

    // ========== FUNCIONES DE UI ==========
    function showAlert(message, type = 'success') {
        const container = document.getElementById('alertContainer');
        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            if (container.firstChild) container.removeChild(container.firstChild);
        }, 4000);
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

    // ========== VEHÍCULOS ==========
    async function loadVehicles() {
        const container = document.getElementById('vehiclesList');
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando vehículos...</div>';
        
        const result = await apiCall('get_vehicles');
        
        if (result.success && result.vehicles && result.vehicles.length > 0) {
            container.innerHTML = result.vehicles.map(v => `
                <div class="vehicle-item">
                    <div class="vehicle-title">🚗 ${escapeHtml(v.brand)} ${escapeHtml(v.model)}</div>
                    <div class="vehicle-plate">📌 ${escapeHtml(v.plate_number)}</div>
                    <div class="vehicle-details">
                        ${v.year ? `📅 ${v.year} | ` : ''}
                        ${v.color ? `🎨 ${escapeHtml(v.color)} | ` : ''}
                        ${v.mileage ? `📏 ${parseInt(v.mileage).toLocaleString()} km` : ''}
                    </div>
                    ${v.notes ? `<div class="vehicle-details">📝 ${escapeHtml(v.notes)}</div>` : ''}
                    <div class="vehicle-actions">
                        <button class="btn btn-warning" onclick="editVehicle(${v.id})">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger" onclick="deleteVehicle(${v.id})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-car-side"></i>
                    <p>No tienes vehículos registrados</p>
                    <small>Completa el formulario para agregar tu primer vehículo</small>
                </div>
            `;
        }
    }

    function resetForm() {
        document.getElementById('vehicleId').value = '';
        document.getElementById('brand').value = '';
        document.getElementById('model').value = '';
        document.getElementById('plateNumber').value = '';
        document.getElementById('year').value = '';
        document.getElementById('mileage').value = '0';
        document.getElementById('color').value = '';
        document.getElementById('notes').value = '';
        document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Vehículo';
        document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Guardar Vehículo';
    }

    async function editVehicle(vehicleId) {
        const result = await apiCall('get_vehicles');
        if (result.success && result.vehicles) {
            const v = result.vehicles.find(x => x.id == vehicleId);
            if (v) {
                document.getElementById('vehicleId').value = v.id;
                document.getElementById('brand').value = v.brand || '';
                document.getElementById('model').value = v.model || '';
                document.getElementById('plateNumber').value = v.plate_number || '';
                document.getElementById('year').value = v.year || '';
                document.getElementById('mileage').value = v.mileage || '0';
                document.getElementById('color').value = v.color || '';
                document.getElementById('notes').value = v.notes || '';
                document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Vehículo';
                document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Actualizar Vehículo';
                
                // Scroll al formulario
                document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    async function deleteVehicle(vehicleId) {
        if (confirm('¿Estás seguro de eliminar este vehículo?')) {
            const result = await apiCall('delete_vehicle', { vehicle_id: vehicleId });
            if (result.success) {
                showAlert('Vehículo eliminado correctamente', 'success');
                loadVehicles();
                resetForm();
            } else {
                showAlert(result.message || 'Error al eliminar', 'danger');
            }
        }
    }

    async function saveVehicle(event) {
        event.preventDefault();
        
        const vehicleData = {
            vehicle_id: document.getElementById('vehicleId').value || null,
            brand: document.getElementById('brand').value.trim(),
            model: document.getElementById('model').value.trim(),
            plate_number: document.getElementById('plateNumber').value.trim(),
            year: document.getElementById('year').value || null,
            mileage: document.getElementById('mileage').value || '0',
            color: document.getElementById('color').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };
        
        if (!vehicleData.brand || !vehicleData.model || !vehicleData.plate_number) {
            showAlert('Marca, modelo y placa son obligatorios', 'danger');
            return;
        }
        
        const result = await apiCall('save_vehicle', vehicleData);
        
        if (result.success) {
            showAlert(vehicleData.vehicle_id ? 'Vehículo actualizado' : 'Vehículo registrado', 'success');
            resetForm();
            loadVehicles();
        } else {
            showAlert(result.message || 'Error al guardar', 'danger');
        }
    }

    // ========== LOGOUT & DROPDOWNS ==========
    async function logout() {
        try {
            const fd = new FormData();
            fd.append('action', 'logout');
            await fetch('auth.php', { method: 'POST', body: fd });
        } catch(e) {}
        window.location.href = 'login.html';
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

    // ========== INICIALIZACIÓN ==========
    document.addEventListener('DOMContentLoaded', async () => {
        const isAuth = await checkAuth();
        if (!isAuth) return;
        
        loadVehicles();
        
        // Event listeners
        document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);
        document.getElementById('newVehicleBtn').addEventListener('click', resetForm);
    });