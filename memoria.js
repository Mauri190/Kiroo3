        const memoryItems = ['Motor', 'Rueda', 'Freno', 'Aceite', 'Batería', 'Radiador', 'Volante', 'Luces'];
        let memCards = [], flipped = [], matched = 0, attempts = 0;

        const icons = {
            'Motor': 'bi-gear-fill', 'Rueda': 'bi-circle', 'Freno': 'bi-exclamation-circle',
            'Aceite': 'bi-droplet', 'Batería': 'bi-battery-full', 'Radiador': 'bi-thermometer-sun',
            'Volante': 'bi-circle-half', 'Luces': 'bi-lightbulb'
        };

        function resetMemory() {
            memCards = [...memoryItems, ...memoryItems];
            for (let i = memCards.length - 1; i > 0; i--) { 
                const j = Math.floor(Math.random() * (i + 1)); 
                [memCards[i], memCards[j]] = [memCards[j], memCards[i]]; 
            }
            flipped = []; matched = 0; attempts = 0;
            document.getElementById('memoryAttempts').innerText = attempts;
            document.getElementById('memoryMatches').innerText = matched;
            document.getElementById('memoryResults').style.display = 'none';
            renderMemory();
        }

        function renderMemory() {
            const board = document.getElementById('memoryBoard');
            board.innerHTML = '';
            memCards.forEach((item, idx) => {
                const card = document.createElement('div'); 
                card.className = 'memory-card';
                card.innerHTML = `<div class="memory-card-inner">
                    <div class="memory-card-front"><i class="bi bi-question-lg"></i></div>
                    <div class="memory-card-back"><i class="${icons[item]}"></i><span>${item}</span></div>
                </div>`;
                card.onclick = () => flipCard(idx, card);
                board.appendChild(card);
            });
        }

        function flipCard(idx, cardEl) {
            if (cardEl.classList.contains('flipped') || flipped.length >= 2) return;
            cardEl.classList.add('flipped'); 
            flipped.push(idx);
            if (flipped.length === 2) {
                attempts++; 
                document.getElementById('memoryAttempts').innerText = attempts;
                const first = memCards[flipped[0]], second = memCards[flipped[1]];
                if (first === second) { 
                    matched++; 
                    document.getElementById('memoryMatches').innerText = matched; 
                    flipped = [];
                    if (matched === memoryItems.length) {
                        setTimeout(() => { 
                            document.getElementById('memoryResults').style.display = 'block'; 
                            document.getElementById('finalAttempts').innerText = attempts;
                        }, 300);
                    }
                } else {
                    setTimeout(() => { 
                        document.querySelectorAll('.memory-card.flipped').forEach(c => c.classList.remove('flipped')); 
                        flipped = []; 
                    }, 800);
                }
            }
        }

        resetMemory();