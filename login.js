    // ====================== ESTADO DE LA APLICACIÓN ======================
    let currentUserType = 'cliente'; // 'cliente' o 'mecanico'

    // Elementos del DOM
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const warningDiv = document.getElementById('warningMessage');
    const warningText = document.getElementById('warningText');
    const loginForm = document.getElementById('loginForm');
    const formTitle = document.getElementById('formTitle');
    const badgeTextSpan = document.getElementById('badgeText');
    const registerClientLink = document.getElementById('registerClientLink');
    const registerMechanicLink = document.getElementById('registerMechanicLink');
    const tabs = document.querySelectorAll('.account-tab');

    // Funciones UI
    function showError(msg) {
        errorText.textContent = msg;
        errorDiv.classList.add('show');
        warningDiv.classList.remove('show');
    }

    function showWarning(msg) {
        warningText.textContent = msg;
        warningDiv.classList.add('show');
        errorDiv.classList.remove('show');
    }

    function hideMessages() {
        errorDiv.classList.remove('show');
        warningDiv.classList.remove('show');
    }

    // Actualizar la interfaz según el tipo de cuenta seleccionado (cliente/mecánico)
    function updateUIForUserType() {
        if (currentUserType === 'cliente') {
            formTitle.innerHTML = 'Iniciar Sesión como Cliente';
            badgeTextSpan.innerHTML = '🔧 Acceso clientes: citas, historial, diagnósticos, talleres';
            registerClientLink.style.fontWeight = 'bold';
            registerMechanicLink.style.fontWeight = 'normal';
        } else {
            formTitle.innerHTML = 'Iniciar Sesión como Mecánico';
            badgeTextSpan.innerHTML = '⚙️ Acceso mecánicos: gestión de citas, diagnósticos, clientes asignados';
            registerClientLink.style.fontWeight = 'normal';
            registerMechanicLink.style.fontWeight = 'bold';
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

    // Función que ejecuta el login llamando a auth.php
    async function performLogin(username, password, userType) {
        // Creamos FormData y enviamos acción 'login' junto con el username, password y user_type
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('username', username);
        formData.append('password', password);
        formData.append('user_type', userType);

        try {
            const response = await fetch('auth.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                // Redirigir según lo que devuelva el backend
                if (result.redirect) {
                    window.location.href = result.redirect;
                } else {
                    // fallback inteligente: según userType redirigir a los nuevos index
                    if (currentUserType === 'cliente') {
                        window.location.href = 'index_cliente.html';
                    } else {
                        window.location.href = 'index_mecanico.html';
                    }
                }
            } else {
                // Verificar si es un error de tipo de cuenta
                if (result.message && result.message.includes('Tu cuenta es de tipo')) {
                    showWarning(result.message);
                    
                    // Cambiar automáticamente a la pestaña correcta
                    if (result.message.includes('Mecánico')) {
                        if (currentUserType !== 'mecanico') {
                            currentUserType = 'mecanico';
                            updateUIForUserType();
                        }
                    } else if (result.message.includes('Cliente')) {
                        if (currentUserType !== 'cliente') {
                            currentUserType = 'cliente';
                            updateUIForUserType();
                        }
                    }
                } else {
                    showError(result.message || 'Credenciales incorrectas. Verifica tus datos.');
                }
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            showError('Error de conexión con el servidor. Intenta nuevamente más tarde.');
        }
    }

    // Evento submit del formulario
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideMessages();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showError('Por favor completa todos los campos (usuario y contraseña).');
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Ingresando...';
        submitBtn.disabled = true;

        await performLogin(username, password, currentUserType);

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });

    // Cambio entre pestañas: cliente / mecánico
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const selectedType = this.getAttribute('data-type');
            if (selectedType === currentUserType) return;
            currentUserType = selectedType;
            // Limpiar mensajes al cambiar de rol
            hideMessages();
            // Limpiar campos para mejorar UX
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            updateUIForUserType();
        });
    });

    // Enlaces de registro: redirigen a las páginas de registro correspondientes
    registerClientLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'registro_cliente.html';
    });

    registerMechanicLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'registro_mecanico.html';
    });

    // Inicializar UI con tipo por defecto: cliente
    updateUIForUserType();

    // Permitir iniciar sesión con Enter en cualquier campo
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('password').focus();
        }
    });

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });