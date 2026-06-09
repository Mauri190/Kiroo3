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

    // ===== MEMORY GAME =====
    const memoryItems = ['Motor', 'Rueda', 'Freno', 'Aceite', 'Batería', 'Radiador', 'Volante', 'Luces'];
    let memCards = [], flipped = [], matched = 0, attempts = 0;
    let timeoutId = null;

    const icons = {
        'Motor': 'bi-gear-fill',
        'Rueda': 'bi-circle',
        'Freno': 'bi-exclamation-circle',
        'Aceite': 'bi-droplet',
        'Batería': 'bi-battery-full',
        'Radiador': 'bi-thermometer-sun',
        'Volante': 'bi-circle-half',
        'Luces': 'bi-lightbulb'
    };

    function resetMemory() {
        if (timeoutId) clearTimeout(timeoutId);
        memCards = [...memoryItems, ...memoryItems];
        for (let i = memCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [memCards[i], memCards[j]] = [memCards[j], memCards[i]];
        }
        flipped = [];
        matched = 0;
        attempts = 0;
        document.getElementById('memoryAttempts').innerText = attempts;
        document.getElementById('memoryMatches').innerText = matched;
        // Ocultar modal de resultado si existe
        const existingModal = document.querySelector('.result-modal');
        if (existingModal) existingModal.remove();
        renderMemory();
    }

    function renderMemory() {
        const board = document.getElementById('memoryBoard');
        board.innerHTML = '';
        memCards.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.setAttribute('data-idx', idx);
            card.setAttribute('data-item', item);
            card.innerHTML = `<div class="memory-card-inner">
                <div class="memory-card-front"><i class="bi bi-question-lg"></i></div>
                <div class="memory-card-back"><i class="${icons[item]}"></i><span>${item}</span></div>
            </div>`;
            card.onclick = () => flipCard(idx, card);
            board.appendChild(card);
        });
    }

    function flipCard(idx, cardEl) {
        if (timeoutId) return;
        if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;
        if (flipped.length >= 2) return;
        
        cardEl.classList.add('flipped');
        flipped.push({ idx, cardEl, item: memCards[idx] });
        
        if (flipped.length === 2) {
            attempts++;
            document.getElementById('memoryAttempts').innerText = attempts;
            
            const first = flipped[0];
            const second = flipped[1];
            
            if (first.item === second.item) {
                // Match encontrado
                matched++;
                document.getElementById('memoryMatches').innerText = matched;
                first.cardEl.classList.add('matched');
                second.cardEl.classList.add('matched');
                flipped = [];
                
                if (matched === memoryItems.length) {
                    setTimeout(() => {
                        showWinModal();
                    }, 300);
                }
            } else {
                // No coincide, voltear de nuevo después de un tiempo
                timeoutId = setTimeout(() => {
                    first.cardEl.classList.remove('flipped');
                    second.cardEl.classList.remove('flipped');
                    flipped = [];
                    timeoutId = null;
                }, 800);
            }
        }
    }

    function showWinModal() {
        const modal = document.createElement('div');
        modal.className = 'result-modal';
        modal.innerHTML = `
            <div class="result-content">
                <i class="bi bi-trophy-fill"></i>
                <h3>🎉 ¡Felicidades!</h3>
                <p>Completaste el juego en <strong>${attempts}</strong> intentos</p>
                <button class="btn-red" onclick="closeModalAndReset()">Jugar de nuevo</button>
                <a href="gamificacion.html" class="btn-outline-red" style="display: inline-block; margin-top: 10px;">Volver a juegos</a>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function closeModalAndReset() {
        const modal = document.querySelector('.result-modal');
        if (modal) modal.remove();
        resetMemory();
    }

    // Inicializar autenticación y juego
    document.addEventListener('DOMContentLoaded', async () => {
        if (!await checkAuth()) return;
        resetMemory();
    });