    // ===== CARGAR DATOS DE USUARIO =====
    async function loadUserData() {
        try {
            const fd = new FormData();
            fd.append('action', 'check_auth');
            const res = await fetch('auth.php', { method: 'POST', body: fd });
            const data = await res.json();

            if (!data.authenticated) {
                window.location.href = 'login.html';
                return;
            }

            // Nombre de bienvenida
            const firstName = (data.full_name || data.username || 'Usuario').split(' ')[0];
            document.getElementById('welcomeName').textContent = firstName;
            document.getElementById('headerUserName').textContent = firstName;
            document.getElementById('ddName').textContent = data.full_name || data.username;
            document.getElementById('ddUsername').textContent = '@' + (data.username || '');

            const initials = (data.full_name || data.username || '?').charAt(0).toUpperCase();
            document.getElementById('headerInitials').textContent = initials;
            document.getElementById('ddInitials').textContent = initials;

            // Cargar foto de perfil si existe
            loadProfilePicture();

        } catch(e) {
            console.error('Error cargando datos:', e);
        }
    }

    async function loadProfilePicture() {
        try {
            const fd = new FormData();
            fd.append('action', 'get_profile');
            const res = await fetch('api.php', { method: 'POST', body: fd });
            const data = await res.json();

            if (data.success && data.profile && data.profile.profile_picture) {
                const url = data.profile.profile_picture;
                // Header
                document.getElementById('headerAvatarIcon').style.display = 'none';
                const img = document.getElementById('headerAvatarImg');
                img.src = url; img.style.display = 'block';
                // Dropdown
                document.getElementById('ddAvatarIcon').style.display = 'none';
                const ddImg = document.getElementById('ddAvatarImg');
                ddImg.src = url; ddImg.style.display = 'block';
            }
        } catch(e) { /* sin foto */ }
    }

    // ===== TOGGLE DROPDOWN =====
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

    // ===== LOGOUT =====
    async function logout() {
        try {
            const fd = new FormData();
            fd.append('action', 'logout');
            await fetch('auth.php', { method: 'POST', body: fd });
        } catch(e) {}
        window.location.href = 'login.html';
    }

    // Iniciar
    loadUserData();