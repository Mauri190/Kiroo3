// ===== KIROO - register.js =====

document.addEventListener('DOMContentLoaded', function () {

    // ─── Estado ───────────────────────────────────────────────────────
    let currentUserType = 'cliente';

    // ─── Referencias DOM ──────────────────────────────────────────────
    const errorDiv            = document.getElementById('errorMessage');
    const errorText           = document.getElementById('errorText');
    const registerForm        = document.getElementById('registerForm');
    const formTitle           = document.getElementById('formTitle');
    const formIcon            = document.getElementById('formIcon');
    const clientFields        = document.getElementById('clientFields');
    const mechanicFields      = document.getElementById('mechanicFields');
    const infoText            = document.getElementById('infoText');
    const tabs                = document.querySelectorAll('.account-tab');
    const registerCard        = document.getElementById('registerCard');

    const usernameInput       = document.getElementById('username');
    const emailInput          = document.getElementById('email');
    const fullNameInput       = document.getElementById('fullName');
    const phoneInput          = document.getElementById('phone');
    const vehicleInfoInput    = document.getElementById('vehicleInfo');
    const specialtySelect     = document.getElementById('specialty');
    const workshopNameInput   = document.getElementById('workshopName');
    const experienceInput     = document.getElementById('experience');
    const passwordInput       = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword'); // ← corregido
    const submitBtn           = document.getElementById('submitBtn');

    // ─── Mensajes de error ────────────────────────────────────────────
    function showError(msg) {
        errorText.textContent = msg;
        errorDiv.style.display = 'flex';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { errorDiv.style.display = 'none'; }, 6000);
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    // ─── Actualizar UI según tipo ──────────────────────────────────────
    function updateUIForUserType() {
        if (currentUserType === 'cliente') {
            formTitle.textContent  = 'Registro de Cliente';
            formIcon.className     = 'fa-solid fa-user-plus fa-2x';
            formIcon.style.color   = 'var(--kiroo-red, #d32f2f)';
            clientFields.style.display   = 'block';
            mechanicFields.style.display = 'none';
            infoText.textContent   = 'Podrás agregar más vehículos y gestionar tu historial desde tu panel de cliente';
            specialtySelect.removeAttribute('required');
            registerCard.classList.remove('mechanic-focus');
            registerCard.classList.add('client-focus');
        } else {
            formTitle.textContent  = 'Registro de Mecánico';
            formIcon.className     = 'fa-solid fa-wrench fa-2x';
            formIcon.style.color   = '#ff9800';
            clientFields.style.display   = 'none';
            mechanicFields.style.display = 'block';
            infoText.textContent   = 'Tu perfil será visible para los clientes que busquen mecánicos de confianza';
            specialtySelect.setAttribute('required', 'required');
            registerCard.classList.remove('client-focus');
            registerCard.classList.add('mechanic-focus');
        }

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-type') === currentUserType);
        });
    }

    // ─── Validación ───────────────────────────────────────────────────
    function validateForm() {
        const username        = usernameInput.value.trim();
        const email           = emailInput.value.trim();
        const fullName        = fullNameInput.value.trim();
        const phone           = phoneInput.value.trim();
        const password        = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value; // ← campo real

        if (!username || !email || !fullName || !phone || !password) {
            showError('Por favor completa todos los campos obligatorios.');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Ingresa un correo electrónico válido.');
            return false;
        }

        if (password.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres.');
            return false;
        }

        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden.');
            return false;
        }

        if (currentUserType === 'mecanico' && !specialtySelect.value) {
            showError('Por favor selecciona tu especialidad.');
            return false;
        }

        return true;
    }

    // ─── Envío al servidor ────────────────────────────────────────────
    async function submitRegistration() {
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML  = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Creando cuenta...';
        submitBtn.disabled   = true;

        const formData = new FormData();

        // Campos comunes
        formData.append('username',         usernameInput.value.trim());
        formData.append('email',            emailInput.value.trim());
        formData.append('full_name',        fullNameInput.value.trim());
        formData.append('phone',            phoneInput.value.trim());
        formData.append('password',         passwordInput.value);
        formData.append('confirm_password', confirmPasswordInput.value); // ← campo real, no duplicado

        // Campos según tipo
        if (currentUserType === 'cliente') {
            formData.append('action',       'register_cliente');
            formData.append('vehicle_info', vehicleInfoInput.value.trim());
        } else {
            formData.append('action',        'register_mecanico');
            formData.append('specialty',     specialtySelect.value);
            formData.append('workshop_name', workshopNameInput.value.trim());
            formData.append('experience',    experienceInput.value || '0');
        }

        try {
            const response = await fetch('auth.php', {
                method: 'POST',
                body: formData
            });

            // Leer como texto primero para detectar respuestas no-JSON
            const rawText = await response.text();
            let result;

            try {
                result = JSON.parse(rawText);
            } catch {
                console.error('Respuesta inesperada del servidor:', rawText);
                showError('Error del servidor. Revisa la consola (F12) para más detalles.');
                resetBtn(originalHTML);
                return;
            }

            if (result.success) {
                submitBtn.innerHTML    = '<i class="fa-solid fa-check me-2"></i>¡Cuenta creada!';
                submitBtn.style.background = '#2e7d32';

                // Redirigir según tipo — usa redirect del servidor o fallback manual
                setTimeout(() => {
                    const destino = result.redirect
                        ? result.redirect
                        : (currentUserType === 'cliente' ? 'index_cliente.html' : 'index_mecanico.html');
                    window.location.href = destino;
                }, 800);

            } else {
                showError(result.message || 'Error al crear la cuenta.');
                resetBtn(originalHTML);
            }

        } catch (networkError) {
            console.error('Error de red:', networkError);
            showError('No se pudo conectar con el servidor. Verifica tu conexión.');
            resetBtn(originalHTML);
        }
    }

    function resetBtn(html) {
        submitBtn.innerHTML        = html;
        submitBtn.disabled         = false;
        submitBtn.style.background = '';
    }

    // ─── Eventos ──────────────────────────────────────────────────────
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError();
        if (validateForm()) {
            await submitRegistration();
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tipo = this.getAttribute('data-type');
            if (tipo === currentUserType) return;
            currentUserType = tipo;
            hideError();

            // Limpiar todos los campos al cambiar de pestaña
            [usernameInput, emailInput, fullNameInput, phoneInput,
             vehicleInfoInput, workshopNameInput, experienceInput,
             passwordInput, confirmPasswordInput].forEach(el => el.value = '');
            specialtySelect.value = '';

            updateUIForUserType();
        });
    });

    // ─── Inicializar ──────────────────────────────────────────────────
    updateUIForUserType();

}); // fin DOMContentLoaded