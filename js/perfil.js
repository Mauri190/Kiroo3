        // Variables globales
        let USER_TYPE = 'cliente';
        let BACK_URL = 'index_cliente.html';

        // ===== INICIAR =====
        document.addEventListener('DOMContentLoaded', function() {
            checkSession();
        });

        // ===== VERIFICAR SESIÓN =====
        async function checkSession() {
            try {
                const fd = new FormData();
                fd.append('action', 'check_auth');
                const res = await fetch('auth.php', { method: 'POST', body: fd });
                const data = await res.json();

                if (!data.authenticated) {
                    window.location.href = 'login.html';
                    return;
                }

                USER_TYPE = data.user_type;
                BACK_URL = USER_TYPE === 'mecanico' ? 'index_mecanico.html' : 'index_cliente.html';

                // Configurar UI según tipo de usuario
                configurarUI();
                // Actualizar menú de usuario
                actualizarMenuUsuario(data);
                // Cargar perfil
                loadProfile();
            } catch(e) {
                console.error('Error verificando sesión:', e);
            }
        }

        // ===== CONFIGURAR UI SEGÚN TIPO =====
        function configurarUI() {
            const cardHero = document.getElementById('cardHero');
            const editIcon = document.getElementById('editIcon');
            const btnSave = document.getElementById('btnSave');
            const heroRole = document.getElementById('heroRole');
            const ddRoleText = document.getElementById('ddRoleText');
            const ddPanelLink = document.getElementById('ddPanelLink');
            const ddPanelIcon = document.getElementById('ddPanelIcon');
            const ddPanelText = document.getElementById('ddPanelText');
            const ddAppointmentsLink = document.getElementById('ddAppointmentsLink');
            const ddAvatarIcon = document.getElementById('ddAvatarIcon');
            const ddAvatarImg = document.getElementById('ddAvatarImg');

            if (USER_TYPE === 'mecanico') {
                cardHero.classList.add('mecanico');
                editIcon.style.color = '#ff9800';
                btnSave.classList.add('mecanico');
                heroRole.innerHTML = '🔧 Mecánico';
                ddRoleText.textContent = 'Mecánico';
                ddRoleText.classList.add('mecanico-role');
                ddPanelLink.href = 'dashboard_mecanico.php';
                ddPanelIcon.className = 'fa-solid fa-wrench';
                ddPanelText.textContent = 'Panel Mecánico';
                ddAppointmentsLink.href = 'dashboard_mecanico.php?tab=appointments';
                ddAvatarIcon.classList.add('mecanico');
                ddAvatarImg.classList.add('mecanico');

                // Mostrar campos de mecánico
                document.getElementById('mecanicoFields').style.display = 'block';
            } else {
                heroRole.innerHTML = '🚗 Cliente';
                ddRoleText.textContent = 'Cliente';
                ddPanelLink.href = 'dashboard_cliente.php';
                ddPanelIcon.className = 'fa-solid fa-tachometer-alt';
                ddPanelText.textContent = 'Panel Cliente';
                ddAppointmentsLink.href = 'dashboard_cliente.php?tab=appointments';
            }
        }

        // ===== ACTUALIZAR MENÚ DE USUARIO EN HEADER =====
        function actualizarMenuUsuario(data) {
            const fullName = data.full_name || data.username || 'Usuario';
            const username = data.username || '';
            const initial = fullName.charAt(0).toUpperCase();

            document.getElementById('headerUserName').textContent = fullName;
            document.getElementById('headerInitials').textContent = initial;
            document.getElementById('ddName').textContent = fullName;
            document.getElementById('ddUsername').textContent = '@' + username;
            document.getElementById('ddInitials').textContent = initial;

            // Cargar foto de perfil en el menú
            loadHeaderProfilePicture();
        }

        // ===== CARGAR FOTO DE PERFIL EN HEADER =====
        async function loadHeaderProfilePicture() {
            try {
                const fd = new FormData();
                fd.append('action', 'get_profile');
                const res = await fetch('api.php', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.success && data.profile && data.profile.profile_picture) {
                    document.getElementById('headerAvatarIcon').style.display = 'none';
                    document.getElementById('headerAvatarImg').style.display = 'block';
                    document.getElementById('headerAvatarImg').src = data.profile.profile_picture;

                    document.getElementById('ddAvatarIcon').style.display = 'none';
                    document.getElementById('ddAvatarImg').style.display = 'block';
                    document.getElementById('ddAvatarImg').src = data.profile.profile_picture;
                }
            } catch(e) {}
        }

        // ===== CARGAR PERFIL =====
        async function loadProfile() {
            try {
                const fd = new FormData();
                fd.append('action', 'get_profile');
                const res = await fetch('api.php', { method: 'POST', body: fd });
                const data = await res.json();
                if (!data.success) return;

                const p = data.profile;

                // Hero
                document.getElementById('heroName').textContent = p.full_name || '—';
                document.getElementById('heroUsername').textContent = '@' + (p.username || '');

                // Iniciales o foto
                if (p.profile_picture) {
                    document.getElementById('avatarInitials').style.display = 'none';
                    const img = document.getElementById('avatarImg');
                    img.src = p.profile_picture + '?t=' + Date.now();
                    img.style.display = 'block';
                } else {
                    document.getElementById('avatarInitials').style.display = 'flex';
                    document.getElementById('avatarImg').style.display = 'none';
                    document.getElementById('avatarInitials').textContent =
                        (p.full_name || p.username || '?').charAt(0).toUpperCase();
                }

                // Rating (mecánico)
                if (USER_TYPE === 'mecanico' && parseFloat(p.rating) > 0) {
                    document.getElementById('heroRating').style.display = 'block';
                    document.getElementById('ratingValue').textContent = parseFloat(p.rating).toFixed(2);
                } else {
                    document.getElementById('heroRating').style.display = 'none';
                }

                // Info grid
                setVal('infoFullName', p.full_name);
                setVal('infoUsername', p.username ? '@' + p.username : null);
                setVal('infoEmail', p.email);
                setVal('infoPhone', p.phone);
                setVal('infoType', USER_TYPE === 'mecanico' ? '🔧 Mecánico' : '🚗 Cliente');

                if (p.created_at) {
                    const d = new Date(p.created_at);
                    document.getElementById('infoSince').textContent =
                        d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                }

                // Sección mecánico
                if (USER_TYPE === 'mecanico') {
                    document.getElementById('mecanicoSection').style.display = 'block';
                    document.getElementById('mecanicoFields').style.display = 'block';
                    setVal('infoSpecialty', p.specialty);
                    setVal('infoWorkshop', p.workshop_name);
                    setVal('infoExperience', p.experience_years ? p.experience_years + ' años' : null);
                    setVal('infoRating', p.rating > 0 ?
                        '★'.repeat(Math.round(parseFloat(p.rating))) + ' (' + parseFloat(p.rating).toFixed(2) +
                        '/5)' :
                        'Sin calificaciones aún');

                    document.getElementById('editSpecialty').value = p.specialty || '';
                    document.getElementById('editWorkshop').value = p.workshop_name || '';
                    document.getElementById('editExperience').value = p.experience_years || '';
                } else {
                    document.getElementById('mecanicoSection').style.display = 'none';
                    document.getElementById('mecanicoFields').style.display = 'none';
                }

                // Formulario común
                document.getElementById('editFullName').value = p.full_name || '';
                document.getElementById('editPhone').value = p.phone || '';
                document.getElementById('editUsername').value = p.username || '';
                document.getElementById('editEmail').value = p.email || '';

                // Actualizar header
                actualizarMenuUsuario({
                    full_name: p.full_name,
                    username: p.username,
                    user_type: USER_TYPE
                });

            } catch(e) {
                console.error('Error cargando perfil:', e);
            }
        }

        function setVal(id, val) {
            const el = document.getElementById(id);
            if (!el) return;
            if (val && String(val).trim()) {
                el.textContent = val;
                el.classList.remove('empty');
            } else {
                el.textContent = 'No especificado';
                el.classList.add('empty');
            }
        }

        // ===== GUARDAR PERFIL =====
        async function saveProfile() {
            const fullName = document.getElementById('editFullName').value.trim();
            if (!fullName) {
                showToast('El nombre completo es obligatorio', false);
                return;
            }

            const fd = new FormData();
            fd.append('action', 'update_profile');
            fd.append('full_name', fullName);
            fd.append('phone', document.getElementById('editPhone').value.trim());

            if (USER_TYPE === 'mecanico') {
                fd.append('specialty', document.getElementById('editSpecialty').value);
                fd.append('workshop_name', document.getElementById('editWorkshop').value.trim());
                fd.append('experience_years', document.getElementById('editExperience').value || '0');
            }

            try {
                const res = await fetch('api.php', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.success) {
                    showToast('¡Perfil actualizado correctamente!', true);
                    loadProfile();
                } else {
                    showToast(data.message || 'Error al guardar', false);
                }
            } catch(e) {
                showToast('Error de conexión', false);
            }
        }

        // ===== SUBIR FOTO =====
        async function uploadPhoto(input) {
            const file = input.files[0];
            if (!file) return;

            const maxMB = 3;
            if (file.size > maxMB * 1024 * 1024) {
                showToast('La imagen no puede superar ' + maxMB + 'MB', false);
                input.value = '';
                return;
            }

            const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowed.includes(file.type)) {
                showToast('Formato no válido. Usa JPG, PNG, GIF o WEBP', false);
                input.value = '';
                return;
            }

            // Preview inmediato
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('avatarInitials').style.display = 'none';
                const img = document.getElementById('avatarImg');
                img.src = e.target.result;
                img.style.display = 'block';
            };
            reader.readAsDataURL(file);

            // Subir al servidor
            document.getElementById('uploadProgress').classList.add('visible');

            const fd = new FormData();
            fd.append('action', 'upload_profile_picture');
            fd.append('profile_picture', file);

            try {
                const res = await fetch('api.php', { method: 'POST', body: fd });
                const data = await res.json();
                document.getElementById('uploadProgress').classList.remove('visible');

                if (data.success) {
                    showToast('¡Foto de perfil actualizada!', true);
                    const img = document.getElementById('avatarImg');
                    img.src = data.photo_url + '?t=' + Date.now();
                    // Actualizar header
                    loadHeaderProfilePicture();
                } else {
                    showToast(data.message || 'Error al subir la foto', false);
                    loadProfile();
                }
            } catch(e) {
                document.getElementById('uploadProgress').classList.remove('visible');
                showToast('Error de conexión al subir la foto', false);
            }

            input.value = '';
        }

        // ===== USER MENU DROPDOWN =====
        function toggleUserMenu(event) {
            event.stopPropagation();
            document.getElementById('userDropdown').classList.toggle('open');
        }
        document.addEventListener('click', function(event) {
            const dropdown = document.getElementById('userDropdown');
            const wrapper = document.getElementById('userMenuWrapper');
            if (dropdown.classList.contains('open') && !wrapper.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        });

        // ===== TOAST =====
        let toastTimeout;

        function showToast(message, success = true) {
            const toast = document.getElementById('toastMsg');
            const icon = toast.querySelector('.t-icon');
            document.getElementById('toastText').textContent = message;
            toast.className = 'toast-custom ' + (success ? 'success' : 'error');
            icon.className = 'fa-solid ' + (success ? 'fa-check-circle' : 'fa-circle-exclamation') + ' t-icon';
            toast.classList.add('show');
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
        }

        // ===== LOGOUT =====
        async function logout() {
            try {
                const fd = new FormData();
                fd.append('action', 'logout');
                await fetch('auth.php', { method: 'POST', body: fd });
            } catch(e) {}
            window.location.href = 'login.html';
        }