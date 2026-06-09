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

    // ===== WORD SEARCH GAME =====
    const words = [
        { word: "MOTOR", found: false },
        { word: "FRENO", found: false },
        { word: "ACEITE", found: false },
        { word: "BATERIA", found: false },
        { word: "RUEDA", found: false },
        { word: "RADIADOR", found: false },
        { word: "VOLANTE", found: false }
    ];

    let grid = [];
    let gridSize = 12;
    let selectionStart = null;
    let currentSelection = [];
    let isDragging = false;
    let timerInterval = null;
    let timeSeconds = 300; // 5 minutos

    function generateGrid() {
        // Inicializar grid vacío
        grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
        
        // Colocar palabras
        for (const w of words) {
            if (w.found) continue;
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const direction = Math.floor(Math.random() * 8); // 0-7: horizontal, vertical, diagonal
                const row = Math.floor(Math.random() * gridSize);
                const col = Math.floor(Math.random() * gridSize);
                
                let canPlace = true;
                const wordLen = w.word.length;
                
                for (let i = 0; i < wordLen; i++) {
                    let newRow = row, newCol = col;
                    if (direction === 0) newCol = col + i; // derecha
                    else if (direction === 1) newCol = col - i; // izquierda
                    else if (direction === 2) newRow = row + i; // abajo
                    else if (direction === 3) newRow = row - i; // arriba
                    else if (direction === 4) { newRow = row + i; newCol = col + i; } // diagonal abajo-derecha
                    else if (direction === 5) { newRow = row + i; newCol = col - i; } // diagonal abajo-izquierda
                    else if (direction === 6) { newRow = row - i; newCol = col + i; } // diagonal arriba-derecha
                    else if (direction === 7) { newRow = row - i; newCol = col - i; } // diagonal arriba-izquierda
                    
                    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
                        canPlace = false;
                        break;
                    }
                    if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== w.word[i]) {
                        canPlace = false;
                        break;
                    }
                }
                
                if (canPlace) {
                    for (let i = 0; i < wordLen; i++) {
                        let newRow = row, newCol = col;
                        if (direction === 0) newCol = col + i;
                        else if (direction === 1) newCol = col - i;
                        else if (direction === 2) newRow = row + i;
                        else if (direction === 3) newRow = row - i;
                        else if (direction === 4) { newRow = row + i; newCol = col + i; }
                        else if (direction === 5) { newRow = row + i; newCol = col - i; }
                        else if (direction === 6) { newRow = row - i; newCol = col + i; }
                        else if (direction === 7) { newRow = row - i; newCol = col - i; }
                        grid[newRow][newCol] = w.word[i];
                    }
                    placed = true;
                }
                attempts++;
            }
            if (!placed) {
                // Fallback: colocar en posición aleatoria
                for (let i = 0; i < w.word.length; i++) {
                    let placed2 = false;
                    while (!placed2) {
                        const row = Math.floor(Math.random() * gridSize);
                        const col = Math.floor(Math.random() * gridSize);
                        if (grid[row][col] === '') {
                            grid[row][col] = w.word[i];
                            placed2 = true;
                        }
                    }
                }
            }
        }
        
        // Rellenar espacios vacíos con letras aleatorias
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (grid[i][j] === '') {
                    grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    function renderGrid() {
        const container = document.getElementById('wordsearchGrid');
        container.style.gridTemplateColumns = `repeat(${gridSize}, minmax(35px, 60px))`;
        container.innerHTML = '';
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'wordsearch-cell';
                cell.textContent = grid[i][j];
                cell.dataset.row = i;
                cell.dataset.col = j;
                
                // Verificar si la celda pertenece a una palabra encontrada
                const isFound = isCellInFoundWord(i, j);
                if (isFound) {
                    cell.classList.add('found');
                }
                
                // Eventos para ratón
                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    startSelection(i, j);
                });
                cell.addEventListener('mouseenter', () => {
                    if (isDragging && selectionStart) {
                        continueSelection(i, j);
                    }
                });
                cell.addEventListener('mouseup', () => endSelection());
                
                // Eventos táctiles para móvil
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const target = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (target && target.classList.contains('wordsearch-cell')) {
                        const row = parseInt(target.dataset.row);
                        const col = parseInt(target.dataset.col);
                        startSelection(row, col);
                    }
                });
                cell.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const target = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (target && target.classList.contains('wordsearch-cell') && isDragging && selectionStart) {
                        const row = parseInt(target.dataset.row);
                        const col = parseInt(target.dataset.col);
                        continueSelection(row, col);
                    }
                });
                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    endSelection();
                });
                
                container.appendChild(cell);
            }
        }
    }
    
    function isCellInFoundWord(row, col) {
        for (const word of words) {
            if (word.found && word.positions) {
                for (const pos of word.positions) {
                    if (pos.row === row && pos.col === col) return true;
                }
            }
        }
        return false;
    }
    
    function startSelection(row, col) {
        const cell = document.querySelector(`.wordsearch-cell[data-row='${row}'][data-col='${col}']`);
        if (cell.classList.contains('found')) return;
        
        selectionStart = { row, col };
        currentSelection = [{ row, col }];
        isDragging = true;
        updateSelectionHighlight();
    }
    
    function continueSelection(row, col) {
        if (!selectionStart) return;
        
        const cell = document.querySelector(`.wordsearch-cell[data-row='${row}'][data-col='${col}']`);
        if (cell.classList.contains('found')) return;
        
        // Calcular dirección
        const deltaRow = Math.sign(row - selectionStart.row);
        const deltaCol = Math.sign(col - selectionStart.col);
        
        // Si es el mismo punto
        if (deltaRow === 0 && deltaCol === 0) {
            currentSelection = [{ row: selectionStart.row, col: selectionStart.col }];
        } else {
            // Seleccionar en línea recta
            currentSelection = [];
            let currentRow = selectionStart.row;
            let currentCol = selectionStart.col;
            
            while (true) {
                currentSelection.push({ row: currentRow, col: currentCol });
                if (currentRow === row && currentCol === col) break;
                currentRow += deltaRow;
                currentCol += deltaCol;
                if (currentRow < 0 || currentRow >= gridSize || currentCol < 0 || currentCol >= gridSize) break;
            }
        }
        
        updateSelectionHighlight();
    }
    
    function updateSelectionHighlight() {
        // Limpiar selección anterior
        document.querySelectorAll('.wordsearch-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Marcar nueva selección
        for (const pos of currentSelection) {
            const cell = document.querySelector(`.wordsearch-cell[data-row='${pos.row}'][data-col='${pos.col}']`);
            if (cell && !cell.classList.contains('found')) {
                cell.classList.add('selected');
            }
        }
    }
    
    function endSelection() {
        if (!isDragging) return;
        isDragging = false;
        
        if (currentSelection.length > 0) {
            checkWord();
        }
        
        // Limpiar selección visual
        document.querySelectorAll('.wordsearch-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
        selectionStart = null;
        currentSelection = [];
    }
    
    function checkWord() {
        const selectedWord = currentSelection.map(pos => grid[pos.row][pos.col]).join('');
        const selectedWordReverse = selectedWord.split('').reverse().join('');
        
        let foundWord = null;
        for (const word of words) {
            if (!word.found && (word.word === selectedWord || word.word === selectedWordReverse)) {
                foundWord = word;
                break;
            }
        }
        
        if (foundWord) {
            foundWord.found = true;
            foundWord.positions = [...currentSelection];
            
            // Marcar celdas como encontradas
            for (const pos of currentSelection) {
                const cell = document.querySelector(`.wordsearch-cell[data-row='${pos.row}'][data-col='${pos.col}']`);
                if (cell) {
                    cell.classList.add('found');
                    cell.classList.remove('selected');
                }
            }
            
            updateWordsList();
            
            const foundCount = words.filter(w => w.found).length;
            document.getElementById('wordsFound').textContent = foundCount;
            
            if (foundCount === words.length) {
                finishGame();
            } else {
                showToast(`✅ ¡Correcto! Encontraste "${foundWord.word}"`, false);
            }
        } else {
            if (currentSelection.length > 1) {
                showToast('❌ No es una palabra válida. Sigue buscando.', true);
            }
        }
    }
    
    function updateWordsList() {
        const container = document.getElementById('wordsearchWords');
        container.innerHTML = words.map(w => 
            `<div class="word-badge ${w.found ? 'found' : ''}">
                <i class="bi ${w.found ? 'bi-check-circle-fill' : 'bi-circle'}"></i> ${w.word}
            </div>`
        ).join('');
    }
    
    function showWordsearchHint() {
        // Buscar primera palabra no encontrada
        const pendingWord = words.find(w => !w.found);
        if (pendingWord) {
            showToast(`💡 Busca la palabra: "${pendingWord.word}"`, false);
        } else {
            showToast('🎉 Ya encontraste todas las palabras', false);
        }
    }
    
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (timeSeconds <= 0) {
                clearInterval(timerInterval);
                showToast('⏰ Se acabó el tiempo. Reinicia el juego.', true);
            } else {
                timeSeconds--;
                const minutes = Math.floor(timeSeconds / 60);
                const seconds = timeSeconds % 60;
                document.getElementById('wordsearchTimer').textContent = 
                    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    function finishGame() {
        if (timerInterval) clearInterval(timerInterval);
        document.getElementById('wordsearchContainer').style.display = 'none';
        document.getElementById('wordsearchResults').style.display = 'block';
        showToast('🎉 ¡Felicidades! Completaste la sopa de letras', false);
    }
    
    function resetWordSearch() {
        if (timerInterval) clearInterval(timerInterval);
        
        // Resetear palabras
        for (const w of words) {
            w.found = false;
            delete w.positions;
        }
        
        timeSeconds = 300;
        document.getElementById('wordsearchTimer').textContent = '05:00';
        document.getElementById('wordsFound').textContent = '0';
        document.getElementById('totalWords').textContent = words.length;
        document.getElementById('wordsearchContainer').style.display = 'block';
        document.getElementById('wordsearchResults').style.display = 'none';
        
        selectionStart = null;
        currentSelection = [];
        isDragging = false;
        
        generateGrid();
        renderGrid();
        updateWordsList();
        startTimer();
    }
    
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        toast.style.backgroundColor = isError ? '#dc3545' : '#28a745';
        toast.style.color = 'white';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '30px';
        toast.style.fontSize = '0.85rem';
        toast.style.fontWeight = '500';
        toast.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2"></i>${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
    
    // Inicializar
    document.addEventListener('DOMContentLoaded', async () => {
        if (!await checkAuth()) return;
        document.getElementById('totalWords').textContent = words.length;
        resetWordSearch();
    });