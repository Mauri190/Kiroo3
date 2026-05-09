        // Configuración de la API
        const API_URL = 'api.php';
        
        // Variables globales
        let vehicles = [];
        let selectedVehicleId = null;

        // Elementos del DOM
        const vehicleForm = document.getElementById('vehicleForm');
        const vehiclesList = document.getElementById('vehiclesList');
        const submitBtn = document.getElementById('submitBtn');
        const formTitle = document.getElementById('formTitle');
        const alertContainer = document.getElementById('alertContainer');
        const vehicleIdInput = document.getElementById('vehicleId');

        // Campos del formulario
        const brandInput = document.getElementById('brand');
        const modelInput = document.getElementById('model');
        const plateNumberInput = document.getElementById('plateNumber');
        const yearInput = document.getElementById('year');
        const mileageInput = document.getElementById('mileage');
        const colorInput = document.getElementById('color');
        const notesInput = document.getElementById('notes');

        // Cargar vehículos al iniciar
        document.addEventListener('DOMContentLoaded', () => {
            loadVehicles();
            setupEventListeners();
        });

        function setupEventListeners() {
            // Enviar formulario
            vehicleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await saveVehicle();
            });

            // Botón nuevo vehículo
            document.getElementById('newVehicleBtn').addEventListener('click', () => {
                clearForm();
                formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Vehículo';
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Vehículo';
            });
        }

        // Mostrar alertas
        function showAlert(message, type = 'success') {
            const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
            const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            
            alertContainer.innerHTML = `
                <div class="alert ${alertClass}">
                    <i class="fas ${icon}"></i> ${message}
                </div>
            `;
            
            setTimeout(() => {
                alertContainer.innerHTML = '';
            }, 5000);
        }

        // Cargar vehículos desde la API
        async function loadVehicles() {
            try {
                vehiclesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando vehículos...</div>';
                
                const formData = new FormData();
                formData.append('action', 'get_vehicles');
                
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const data = await response.json();
                console.log('Vehículos cargados:', data); // Debug
                
                if (data.success) {
                    vehicles = data.vehicles || [];
                    renderVehiclesList();
                } else {
                    throw new Error(data.message || 'Error al cargar vehículos');
                }
            } catch (error) {
                console.error('Error:', error);
                vehiclesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error al cargar vehículos</p>
                        <p style="font-size: 0.8rem; margin-top: 10px;">${error.message}</p>
                        <button class="btn btn-secondary" onclick="loadVehicles()" style="margin-top: 15px;">
                            <i class="fas fa-redo"></i> Reintentar
                        </button>
                    </div>
                `;
            }
        }

        // Renderizar lista de vehículos
        function renderVehiclesList() {
            if (vehicles.length === 0) {
                vehiclesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-car"></i>
                        <p>No tienes vehículos registrados</p>
                        <p style="font-size: 0.8rem; margin-top: 10px; color: #888;">
                            Registra tu primer vehículo usando el formulario
                        </p>
                    </div>
                `;
                return;
            }

            let html = '';
            vehicles.forEach(vehicle => {
                const isSelected = selectedVehicleId == vehicle.id;
                html += `
                    <div class="vehicle-card ${isSelected ? 'selected' : ''}" id="vehicle-${vehicle.id}">
                        <div class="vehicle-header">
                            <div class="vehicle-title">
                                ${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}
                            </div>
                            <div class="vehicle-plate">
                                ${escapeHtml(vehicle.plate_number)}
                            </div>
                        </div>
                        
                        <div class="vehicle-details">
                            <div class="detail-item">
                                <div class="detail-label">Año</div>
                                <div class="detail-value">${vehicle.year || 'No especificado'}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Kilometraje</div>
                                <div class="detail-value">${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : 'No especificado'}</div>
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
                            <div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                                <div class="detail-label">Notas</div>
                                <div style="color: #ccc; font-size: 0.85rem; margin-top: 5px;">
                                    ${escapeHtml(vehicle.notes)}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="vehicle-actions">
                            <button class="btn-action btn-edit" onclick="editVehicle(${vehicle.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-action btn-delete" onclick="deleteVehicle(${vehicle.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                `;
            });
            
            vehiclesList.innerHTML = html;
        }

        // Formatear fecha
        function formatDate(dateString) {
            if (!dateString) return 'No disponible';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        // Escapar HTML
        function escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        // Guardar vehículo
        async function saveVehicle() {
            const vehicleData = {
                brand: brandInput.value.trim(),
                model: modelInput.value.trim(),
                plateNumber: plateNumberInput.value.trim(),
                year: yearInput.value.trim() || '',
                mileage: mileageInput.value.trim() || '0',
                color: colorInput.value.trim(),
                notes: notesInput.value.trim()
            };

            // Validaciones
            if (!vehicleData.brand) {
                showAlert('La marca es obligatoria', 'error');
                brandInput.focus();
                return;
            }
            if (!vehicleData.model) {
                showAlert('El modelo es obligatorio', 'error');
                modelInput.focus();
                return;
            }
            if (!vehicleData.plateNumber) {
                showAlert('El número de placa es obligatorio', 'error');
                plateNumberInput.focus();
                return;
            }

            try {
                const formData = new FormData();
                formData.append('action', 'save_vehicle');
                formData.append('brand', vehicleData.brand);
                formData.append('model', vehicleData.model);
                formData.append('plate_number', vehicleData.plateNumber);
                formData.append('year', vehicleData.year);
                formData.append('mileage', vehicleData.mileage);
                formData.append('color', vehicleData.color);
                formData.append('notes', vehicleData.notes);

                const vehicleId = vehicleIdInput.value;
                if (vehicleId) {
                    formData.append('vehicle_id', vehicleId);
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();
                console.log('Respuesta guardar:', data); // Debug

                if (data.success) {
                    showAlert(vehicleId ? 'Vehículo actualizado correctamente' : 'Vehículo registrado correctamente');
                    clearForm();
                    await loadVehicles();
                } else {
                    showAlert(data.message || 'Error al guardar vehículo', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión al guardar', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Vehículo';
            }
        }

        // Editar vehículo
        window.editVehicle = function(vehicleId) {
            const vehicle = vehicles.find(v => v.id == vehicleId);
            if (!vehicle) {
                showAlert('Vehículo no encontrado', 'error');
                return;
            }

            vehicleIdInput.value = vehicle.id;
            brandInput.value = vehicle.brand || '';
            modelInput.value = vehicle.model || '';
            plateNumberInput.value = vehicle.plate_number || '';
            yearInput.value = vehicle.year || '';
            mileageInput.value = vehicle.mileage || '';
            colorInput.value = vehicle.color || '';
            notesInput.value = vehicle.notes || '';

            formTitle.innerHTML = '<i class="fas fa-edit"></i> Editar Vehículo';
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Vehículo';
            
            // Scroll al formulario
            document.querySelector('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Resaltar el vehículo seleccionado
            selectedVehicleId = vehicleId;
            renderVehiclesList();
        };

        // Eliminar vehículo
        window.deleteVehicle = async function(vehicleId) {
            const vehicle = vehicles.find(v => v.id == vehicleId);
            if (!vehicle) return;

            if (!confirm(`¿Estás seguro de eliminar el vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})?`)) {
                return;
            }

            try {
                const formData = new FormData();
                formData.append('action', 'delete_vehicle');
                formData.append('vehicle_id', vehicleId);

                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();
                console.log('Respuesta eliminar:', data); // Debug

                if (data.success) {
                    showAlert('Vehículo eliminado correctamente');
                    
                    // Limpiar formulario si se estaba editando este vehículo
                    if (vehicleIdInput.value == vehicleId) {
                        clearForm();
                    }
                    
                    await loadVehicles();
                } else {
                    showAlert(data.message || 'Error al eliminar vehículo', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error de conexión al eliminar', 'error');
            }
        };

        // Limpiar formulario
        function clearForm() {
            vehicleIdInput.value = '';
            brandInput.value = '';
            modelInput.value = '';
            plateNumberInput.value = '';
            yearInput.value = '';
            mileageInput.value = '';
            colorInput.value = '';
            notesInput.value = '';
            selectedVehicleId = null;
            formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Nuevo Vehículo';
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Vehículo';
        }