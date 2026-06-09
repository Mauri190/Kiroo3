    // ===== USER AUTH & MENU =====
    let CURRENT_USER_ID = null;
    let currentUserRole = 'mecanico';

    function setAvatarFromUrl(url) {
        // Header
        const headerImg = document.getElementById('headerAvatarImg');
        const headerIcon = document.getElementById('headerAvatarIcon');
        if (headerImg && url) {
            headerImg.src = url;
            headerImg.style.display = 'block';
            if (headerIcon) headerIcon.style.display = 'none';
        }
        // Dropdown
        const ddImg = document.getElementById('ddAvatarImg');
        const ddIcon = document.getElementById('ddAvatarIcon');
        if (ddImg && url) {
            ddImg.src = url;
            ddImg.style.display = 'block';
            if (ddIcon) ddIcon.style.display = 'none';
        }
        // Perfil avatar
        const avatarImg = document.getElementById('avatarImg');
        const avatarInitials = document.getElementById('avatarInitials');
        if (avatarImg && url) {
            avatarImg.src = url;
            avatarImg.style.display = 'block';
            if (avatarInitials) avatarInitials.style.display = 'none';
        }
    }

    function applyUserUI(name, username, avatarUrl) {
        const firstName = (name || 'Mecánico').split(' ')[0];
        const initials = (name || '?').charAt(0).toUpperCase();

        document.getElementById('headerUserName').textContent = firstName;
        document.getElementById('headerInitials').textContent = initials;
        document.getElementById('ddName').textContent = name || 'Mecánico';
        document.getElementById('ddInitials').textContent = initials;
        document.getElementById('ddUsername').textContent = username ? '@' + username : '';
        document.getElementById('ddRoleText').textContent = 'Mecánico';

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
                currentUserRole = data.user_type || 'mecanico';
                applyUserUI(data.full_name || data.username, data.username, null);
                await loadProfileData();
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

    async function loadProfileData() {
        try {
            const fd = new FormData();
            fd.append('action', 'get_profile');
            const res = await fetch('api.php', { method: 'POST', body: fd });
            const data = await res.json();
            
            if (data.success && data.profile) {
                const p = data.profile;
                
                // Hero info
                document.getElementById('heroName').textContent = p.full_name || p.username || 'Usuario';
                document.getElementById('heroRole').textContent = 'Mecánico';
                document.getElementById('heroUsername').textContent = '@' + (p.username || '');
                if (p.rating) document.getElementById('ratingValue').textContent = parseFloat(p.rating).toFixed(1);
                else document.getElementById('ratingValue').textContent = '0.0';
                
                // Info personal
                document.getElementById('infoFullName').textContent = p.full_name || '—';
                document.getElementById('infoUsername').textContent = p.username || '—';
                document.getElementById('infoEmail').textContent = p.email || '—';
                document.getElementById('infoPhone').textContent = p.phone || '—';
                document.getElementById('infoSince').textContent = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';
                document.getElementById('infoType').textContent = p.user_type === 'mecanico' ? 'Mecánico' : 'Cliente';
                
                // Info profesional - usar workshop_name que es como viene del backend
                document.getElementById('infoSpecialty').textContent = p.specialty || 'No especificada';
                document.getElementById('infoWorkshop').textContent = p.workshop_name || 'No registrado';
                document.getElementById('infoExperience').textContent = p.experience_years ? p.experience_years + ' años' : '—';
                document.getElementById('infoRating').textContent = p.rating ? p.rating + ' ★' : 'Sin calificar';
                
                // Editar campos
                document.getElementById('editFullName').value = p.full_name || '';
                document.getElementById('editPhone').value = p.phone || '';
                document.getElementById('editUsername').value = p.username || '';
                document.getElementById('editEmail').value = p.email || '';
                document.getElementById('editSpecialty').value = p.specialty || '';
                document.getElementById('editWorkshopName').value = p.workshop_name || '';
                document.getElementById('editExperience').value = p.experience_years || '';
                
                // Avatar iniciales
                const initials = (p.full_name || p.username || 'U').charAt(0).toUpperCase();
                const avatarInitialsSpan = document.getElementById('avatarInitials');
                if (avatarInitialsSpan) {
                    avatarInitialsSpan.textContent = initials;
                    avatarInitialsSpan.style.display = 'block';
                }
                
                if (p.profile_picture) {
                    setAvatarFromUrl(p.profile_picture);
                }
            }
        } catch(e) {
            console.error('Error loading profile:', e);
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

    async function saveProfile() {
        const fullName = document.getElementById('editFullName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const specialty = document.getElementById('editSpecialty').value;
        const workshop_name = document.getElementById('editWorkshopName').value.trim();
        const experience_years = document.getElementById('editExperience').value;
        
        if (!fullName) {
            showToast('El nombre completo es obligatorio', true);
            return;
        }
        
        try {
            const fd = new FormData();
            fd.append('action', 'update_profile');
            fd.append('full_name', fullName);
            fd.append('phone', phone);
            fd.append('specialty', specialty);
            fd.append('workshop_name', workshop_name);  // CORREGIDO: workshop_name
            fd.append('experience_years', experience_years);
            
            const res = await fetch('api.php', { method: 'POST', body: fd });
            const data = await res.json();
            
            if (data.success) {
                showToast('Perfil actualizado correctamente');
                loadProfileData();
                // Actualizar header
                const firstName = fullName.split(' ')[0];
                document.getElementById('headerUserName').textContent = firstName;
                document.getElementById('ddName').textContent = fullName;
                document.getElementById('heroName').textContent = fullName;
            } else {
                showToast(data.message || 'Error al actualizar', true);
            }
        } catch(e) {
            console.error('Save error:', e);
            showToast('Error de conexión', true);
        }
    }

    async function uploadPhoto(input) {
        const file = input.files[0];
        if (!file) return;
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Formato no válido. Usa JPG, PNG, GIF o WEBP', true);
            return;
        }
        
        if (file.size > 3 * 1024 * 1024) {
            showToast('La imagen no puede superar los 3MB', true);
            return;
        }
        
        const progressSpan = document.getElementById('uploadProgress');
        progressSpan.style.display = 'block';
        
        try {
            const fd = new FormData();
            fd.append('action', 'upload_profile_picture');  // CORREGIDO: upload_profile_picture
            fd.append('profile_picture', file);             // CORREGIDO: profile_picture
            
            const res = await fetch('api.php', { method: 'POST', body: fd });
            const data = await res.json();
            
            progressSpan.style.display = 'none';
            
            if (data.success && data.photo_url) {
                setAvatarFromUrl(data.photo_url);
                showToast('Foto de perfil actualizada');
            } else {
                showToast(data.message || 'Error al subir la foto', true);
            }
        } catch(e) {
            progressSpan.style.display = 'none';
            console.error('Upload error:', e);
            showToast('Error de conexión', true);
        }
        
        input.value = '';
    }

    function showToast(message, isError = false) {
        let toast = document.getElementById('toastMsg');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toastMsg';
            toast.className = 'toast-custom';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.className = 'toast-custom' + (isError ? ' error' : '');
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
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

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
        checkAuth();
        
        // Evento para input de foto
        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
            photoInput.addEventListener('change', function(e) {
                uploadPhoto(this);
            });
        }
    });