/* ---------- DROPDOWNS DE NAVEGACIÓN ---------- */
function toggleDropdown(btn) {
    const panel = btn.nextElementSibling;
    const isOpen = panel.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) {
        panel.classList.add('open');
        btn.classList.add('active');
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.dropbtn').forEach(b => b.classList.remove('active'));
}

/* ---------- MENÚ DE USUARIO ---------- */
function toggleUserMenu(e) {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('open');
}

function closeUserMenu() {
    document.getElementById('userDropdown')?.classList.remove('open');
}

/* Cerrar al hacer clic fuera */
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown'))   closeAllDropdowns();
    if (!e.target.closest('#userMenuWrapper')) closeUserMenu();
});

/* ---------- HELPERS DE UI ---------- */
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
    const initials  = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('welcomeName',    firstName);
    set('headerUserName', firstName);
    set('headerInitials', initials);
    set('ddName',         name || 'Cliente');
    set('ddInitials',     initials);
    set('ddUsername',     username ? '@' + username : '');

    if (avatarUrl) setAvatarFromUrl(avatarUrl);
}

/* ---------- CARGA DE DATOS (con fallback a localStorage) ---------- */
async function loadUserData() {
    /* 1. Intentar con el servidor (auth.php) */
    try {
        const fd = new FormData();
        fd.append('action', 'check_auth');
        const res  = await fetch('auth.php', { method: 'POST', body: fd });
        const data = await res.json();

        if (data.authenticated) {
            applyUserUI(data.full_name || data.username, data.username, null);
            loadProfilePicture();
            return;
        }
        window.location.href = 'login.html';
        return;
    } catch (e) {
        /* Sin servidor disponible: usar localStorage / sessionStorage */
    }

    /* 2. Fallback a datos locales */
    try {
        const user = JSON.parse(
            localStorage.getItem('kiroo_user') ||
            sessionStorage.getItem('kiroo_user') ||
            '{}'
        );
        const name  = user.nombre || user.name || user.username || 'Cliente';
        const uname = user.username || user.email || '';
        applyUserUI(name, uname, user.avatar || null);
    } catch (err) {
        console.warn('Error cargando datos de usuario:', err);
    }
}

async function loadProfilePicture() {
    try {
        const fd = new FormData();
        fd.append('action', 'get_profile');
        const res  = await fetch('api.php', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success && data.profile?.profile_picture) {
            setAvatarFromUrl(data.profile.profile_picture);
        }
    } catch (e) { }
}

/* ---------- LOGOUT ---------- */
async function logout() {
    try {
        const fd = new FormData();
        fd.append('action', 'logout');
        await fetch('auth.php', { method: 'POST', body: fd });
    } catch (e) {}
    localStorage.removeItem('kiroo_user');
    sessionStorage.removeItem('kiroo_user');
    window.location.href = 'login.html';
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', loadUserData);