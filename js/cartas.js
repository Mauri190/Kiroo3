    // ===== USER AUTH & MENU =====
    let CURRENT_USER_ID = null;

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
        } catch(e) {}
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

    // Inicializar autenticación
    checkAuth();