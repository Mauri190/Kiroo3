     // Palabras a encontrar (todas en mayúsculas)
        const wordsList = ['MOTOR', 'FRENOS', 'ACEITE', 'RUEDA', 'BATERIA', 'RADIADOR', 'FILTRO', 'VOLANTE'];
        
        let wsGrid = [];
        let foundWs = [];
        let wsTimer = null;
        let wsTimeLeft = 300;
        let wsSelecting = false;
        let wsSelectedCells = [];

        // Tamaño de la cuadrícula
        const GRID_SIZE = 10;

        function resetWordSearch() { 
            if (wsTimer) clearInterval(wsTimer); 
            foundWs = []; 
            wsTimeLeft = 300; 
            wsSelectedCells = [];
            wsSelecting = false;
            
            document.getElementById('wordsFound').innerText = '0'; 
            document.getElementById('totalWords').innerText = wordsList.length; 
            document.getElementById('wordsearchTimer').innerText = '05:00'; 
            document.getElementById('wordsearchContainer').style.display = 'block'; 
            document.getElementById('wordsearchResults').style.display = 'none'; 
            
            generateWordsearch(); 
            renderWordsearchGrid(); 
            startWsTimer(); 
        }

        function generateWordsearch() { 
            // Inicializar cuadrícula vacía
            wsGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));
            
            // Para cada palabra, intentar colocarla
            for (let word of wordsList) {
                let placed = false;
                let attempts = 0;
                const maxAttempts = 200;
                
                while (!placed && attempts < maxAttempts) {
                    const direction = Math.floor(Math.random() * 3); // 0: horizontal, 1: vertical, 2: diagonal
                    const row = Math.floor(Math.random() * GRID_SIZE);
                    const col = Math.floor(Math.random() * GRID_SIZE);
                    
                    if (canPlaceWord(word, row, col, direction)) {
                        placeWord(word, row, col, direction);
                        placed = true;
                    }
                    attempts++;
                }
                
                // Si no se pudo colocar, intentar con otra dirección o posición
                if (!placed) {
                    for (let dir = 0; dir < 3; dir++) {
                        for (let r = 0; r < GRID_SIZE && !placed; r++) {
                            for (let c = 0; c < GRID_SIZE && !placed; c++) {
                                if (canPlaceWord(word, r, c, dir)) {
                                    placeWord(word, r, c, dir);
                                    placed = true;
                                }
                            }
                        }
                    }
                }
            }
            
            // Rellenar espacios vacíos con letras aleatorias
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                    if (wsGrid[i][j] === '') {
                        wsGrid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                    }
                }
            }
        }

        function canPlaceWord(word, row, col, direction) { 
            const len = word.length; 
            
            // Verificar límites
            if (direction === 0 && col + len > GRID_SIZE) return false; 
            if (direction === 1 && row + len > GRID_SIZE) return false; 
            if (direction === 2 && (row + len > GRID_SIZE || col + len > GRID_SIZE)) return false; 
            
            // Verificar que no haya conflicto con otras palabras
            for (let i = 0; i < len; i++) { 
                let r = row, c = col; 
                if (direction === 0) c = col + i; 
                else if (direction === 1) r = row + i; 
                else if (direction === 2) { r = row + i; c = col + i; } 
                
                if (wsGrid[r][c] !== '' && wsGrid[r][c] !== word[i]) return false; 
            } 
            return true; 
        }

        function placeWord(word, row, col, direction) { 
            for (let i = 0; i < word.length; i++) { 
                let r = row, c = col; 
                if (direction === 0) c = col + i; 
                else if (direction === 1) r = row + i; 
                else if (direction === 2) { r = row + i; c = col + i; } 
                wsGrid[r][c] = word[i]; 
            } 
        }

        function renderWordsearchGrid() {
            const container = document.getElementById('wordsearchGrid'); 
            container.innerHTML = '';
            
            for (let i = 0; i < GRID_SIZE; i++) { 
                for (let j = 0; j < GRID_SIZE; j++) { 
                    const cell = document.createElement('div'); 
                    cell.className = 'wordsearch-cell'; 
                    cell.textContent = wsGrid[i][j]; 
                    cell.dataset.row = i; 
                    cell.dataset.col = j; 
                    
                    cell.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        startWsSelect(i, j);
                    });
                    cell.addEventListener('mouseenter', () => continueWsSelect(i, j));
                    cell.addEventListener('mouseup', () => endWsSelect());
                    
                    // Soporte para touch
                    cell.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        startWsSelect(i, j);
                    });
                    cell.addEventListener('touchmove', (e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (element && element.classList && element.classList.contains('wordsearch-cell')) {
                            const row = parseInt(element.dataset.row);
                            const col = parseInt(element.dataset.col);
                            continueWsSelect(row, col);
                        }
                    });
                    cell.addEventListener('touchend', () => endWsSelect());
                    
                    container.appendChild(cell); 
                } 
            }
            
            // Renderizar lista de palabras
            const wordsDiv = document.getElementById('wordsearchWords'); 
            wordsDiv.innerHTML = '';
            wordsList.forEach(word => { 
                const div = document.createElement('div'); 
                div.className = 'wordsearch-word'; 
                div.innerHTML = `<i class="bi bi-search"></i> ${word}`; 
                div.dataset.word = word; 
                wordsDiv.appendChild(div); 
            });
        }

        function startWsSelect(r, c) { 
            wsSelecting = true; 
            wsSelectedCells = [{row: r, col: c}]; 
            updateWsSelection(); 
        }
        
        function continueWsSelect(r, c) { 
            if (!wsSelecting) return; 
            if (!wsSelectedCells.some(cell => cell.row === r && cell.col === c)) {
                wsSelectedCells.push({row: r, col: c}); 
            }
            updateWsSelection(); 
        }
        
        function endWsSelect() { 
            wsSelecting = false; 
            checkWsWord(); 
        }
        
        function updateWsSelection() { 
            document.querySelectorAll('.wordsearch-cell').forEach(cell => cell.classList.remove('selected')); 
            wsSelectedCells.forEach(cell => { 
                const el = document.querySelector(`.wordsearch-cell[data-row='${cell.row}'][data-col='${cell.col}']`); 
                if (el) el.classList.add('selected'); 
            }); 
        }
        
        function checkWsWord() { 
            if (wsSelectedCells.length < 3) { 
                clearWsSelection(); 
                return; 
            } 
            
            // Obtener la palabra formada
            const word = wsSelectedCells.map(cell => wsGrid[cell.row][cell.col]).join(''); 
            const reversed = word.split('').reverse().join(''); 
            
            let foundWord = null; 
            if (wordsList.includes(word) && !foundWs.includes(word)) foundWord = word; 
            else if (wordsList.includes(reversed) && !foundWs.includes(reversed)) foundWord = reversed; 
            
            if (foundWord) { 
                foundWs.push(foundWord); 
                
                // Marcar celdas como encontradas
                wsSelectedCells.forEach(cell => { 
                    const el = document.querySelector(`.wordsearch-cell[data-row='${cell.row}'][data-col='${cell.col}']`); 
                    if (el) {
                        el.classList.add('found');
                        el.classList.remove('selected');
                    }
                }); 
                
                // Marcar palabra en la lista
                const wordEl = document.querySelector(`.wordsearch-word[data-word='${foundWord}']`); 
                if (wordEl) wordEl.classList.add('found'); 
                
                document.getElementById('wordsFound').innerText = foundWs.length; 
                
                if (foundWs.length === wordsList.length) { 
                    clearInterval(wsTimer); 
                    document.getElementById('wordsearchContainer').style.display = 'none'; 
                    document.getElementById('wordsearchResults').style.display = 'block'; 
                } 
                wsSelectedCells = []; 
            } else { 
                setTimeout(clearWsSelection, 300); 
            } 
        }

        function clearWsSelection() { 
            wsSelectedCells.forEach(cell => { 
                const el = document.querySelector(`.wordsearch-cell[data-row='${cell.row}'][data-col='${cell.col}']`); 
                if (el && !el.classList.contains('found')) el.classList.remove('selected'); 
            }); 
            wsSelectedCells = []; 
        }
        
        function startWsTimer() { 
            wsTimer = setInterval(() => { 
                wsTimeLeft--; 
                const mins = Math.floor(wsTimeLeft / 60); 
                const secs = wsTimeLeft % 60; 
                document.getElementById('wordsearchTimer').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; 
                if (wsTimeLeft <= 0) { 
                    clearInterval(wsTimer); 
                    alert('⏰ Tiempo agotado. ¡Inténtalo de nuevo!'); 
                    resetWordSearch(); 
                } 
            }, 1000); 
        }
        
        function showWordsearchHint() { 
            const remaining = wordsList.filter(w => !foundWs.includes(w)); 
            if (remaining.length) {
                alert(`🔍 Busca la palabra: "${remaining[0]}"\nPuede estar en horizontal, vertical o diagonal.`);
            } else { 
                alert('🎉 ¡Ya encontraste todas las palabras!'); 
            } 
        }

        // Iniciar el juego
        resetWordSearch();