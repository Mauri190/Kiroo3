    // Estado actual del tipo de cuenta
    let currentUserType = 'cliente'; // 'cliente' o 'mecanico'

    // Elementos del DOM
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const registerForm = document.getElementById('registerForm');
    const formTitle = document.getElementById('formTitle');
    const formIcon = document.getElementById('formIcon');
    const clientFields = document.getElementById('clientFields');
    const mechanicFields = document.getElementById('mechanicFields');
    const infoText = document.getElementById('infoText');
    const tabs = document.querySelectorAll('.account-tab');
    const registerCard = document.getElementById('registerCard');

    // Elementos de formulario
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const vehicleInfoInput = document.getElementById('vehicleInfo');
    const specialtySelect = document.getElementById('specialty');
    const workshopNameInput = document.getElementById('workshopName');
    const experienceInput = document.getElementById('experience');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    function showError(msg) {
        errorText.textContent = msg;
        errorDiv.classList.add('show');
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }

    function hideError() {
        errorDiv.classList.remove('show');
    }

    // Actualizar UI según tipo de cuenta seleccionado
    function updateUIForUserType() {
        if (currentUserType === 'cliente') {
            formTitle.innerHTML = 'Registro de Cliente';
            formIcon.style.color = '#2196f3';
            formIcon.className = 'fa-solid fa-user-plus fa-2x';
            clientFields.style.display = 'block';
            mechanicFields.style.display = 'none';
            infoText.innerHTML = 'Podrás agregar más vehículos y gestionar tu historial desde tu panel de cliente';
            
            // Quitar required de campos de mecánico
            specialtySelect.removeAttribute('required');
            workshopNameInput.removeAttribute('required');
            experienceInput.removeAttribute('required');
            
            // Poner required a campos de cliente (solo vehicleInfo es opcional)
            vehicleInfoInput.removeAttribute('required');
            
            registerCard.classList.remove('mechanic-focus');
            registerCard.classList.add('client-focus');
        } else {
            formTitle.innerHTML = 'Registro de Mecánico';
            formIcon.style.color = '#ff9800';
            formIcon.className = 'fa-solid fa-wrench fa-2x';
            clientFields.style.display = 'none';
            mechanicFields.style.display = 'block';
            infoText.innerHTML = 'Tu perfil será visible para los clientes que busquen mecánicos de confianza';
            
            // Poner required a campos de mecánico
            specialtySelect.setAttribute('required', 'required');
            
            // Quitar required de campos de cliente
            vehicleInfoInput.removeAttribute('required');
            
            registerCard.classList.remove('client-focus');
            registerCard.classList.add('mechanic-focus');
        }

        // Actualizar clase activa en tabs
        tabs.forEach(tab => {
            const tabType = tab.getAttribute('data-type');
            if (tabType === currentUserType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    // Validar formulario según tipo
    function validateForm() {
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const fullName = fullNameInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!username || !email || !fullName || !phone || !password) {
            showError('Por favor completa todos los campos obligatorios.');
            return false;
        }

        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden.');
            return false;
        }

        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres.');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Ingresa un correo electrónico válido.');
            return false;
        }

        // Validaciones específicas para mecánico
        if (currentUserType === 'mecanico') {
            const specialty = specialtySelect.value;
            if (!specialty) {
                showError('Por favor selecciona tu especialidad.');
                return false;
            }
        }

        return true;
    }

    // Enviar registro al backend
    async function submitRegistration() {
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const fullName = fullNameInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Creando cuenta...';
        submitBtn.disabled = true;

        try {
            let formData = new FormData();
            
            if (currentUserType === 'cliente') {
                const vehicleInfo = vehicleInfoInput.value.trim();
                formData.append('action', 'register_cliente');
                formData.append('vehicle_info', vehicleInfo);
            } else {
                const specialty = specialtySelect.value;
                const workshopName = workshopNameInput.value.trim();
                const experience = experienceInput.value;
                formData.append('action', 'register_mecanico');
                formData.append('specialty', specialty);
                formData.append('workshop_name', workshopName);
                formData.append('experience', experience);
            }

            formData.append('username', username);
            formData.append('email', email);
            formData.append('full_name', fullName);
            formData.append('phone', phone);
            formData.append('password', password);
            formData.append('confirm_password', password);

            const response = await fetch('auth.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = result.redirect;
            } else {
                showError(result.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión. Intenta nuevamente.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Evento submit del formulario
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();

        if (validateForm()) {
            await submitRegistration();
        }
    });

    // Cambio entre pestañas: cliente / mecánico
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const selectedType = this.getAttribute('data-type');
            if (selectedType === currentUserType) return;
            currentUserType = selectedType;
            hideError();
            // Limpiar campos al cambiar de tipo
            usernameInput.value = '';
            emailInput.value = '';
            fullNameInput.value = '';
            phoneInput.value = '';
            vehicleInfoInput.value = '';
            specialtySelect.value = '';
            workshopNameInput.value = '';
            experienceInput.value = '';
            passwordInput.value = '';
            confirmPasswordInput.value = '';
            updateUIForUserType();
        });
    });

    // Inicializar UI
    updateUIForUserType();