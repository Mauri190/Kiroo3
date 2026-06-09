    // ===== USER AUTH & MENU (igual que index_cliente) =====
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
            console.error('Auth error:', e);
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
        } catch(e) { /* sin foto */ }
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

    // ===== SCANNER LOGIC =====
    (function(){
        "use strict";

        const video = document.getElementById('webcam');
        const canvas = document.getElementById('overlayCanvas');
        const ctx = canvas.getContext('2d');
        const startBtn = document.getElementById('startBtn');
        const pauseDetectionBtn = document.getElementById('pauseDetectionBtn');
        const stopBtn = document.getElementById('stopBtn');
        const camPlaceholder = document.getElementById('camPlaceholder');
        const aiStatusSpan = document.getElementById('aiStatus');
        const detectionModeText = document.getElementById('detectionModeText');
        const signListContainer = document.getElementById('signListContainer');

        let currentStream = null;
        let isCameraActive = false;
        let isDetectionRunning = true;
        let animationId = null;
        let lastFrameTime = 0;
        let lastDetections = [];

        const SIGN_DATABASE = {
            "STOP": {
                nombre: "🛑 SEÑAL DE STOP",
                significado: "Detención obligatoria total. Debes detener el vehículo completamente antes de la línea de stop.",
                consejo: "Detente por completo, mira hacia ambos lados y cede el paso a peatones y vehículos antes de continuar."
            },
            "PARE": {
                nombre: "🛑 SEÑAL DE PARE",
                significado: "Señal de alto obligatorio. Requiere detención total del vehículo.",
                consejo: "Alto total, verificar el cruce y avanzar solo cuando sea seguro."
            },
            "CEDA EL PASO": {
                nombre: "⚠️ SEÑAL DE CEDA EL PASO",
                significado: "Debes reducir la velocidad y ceder el paso a los vehículos que circulan por la vía preferente.",
                consejo: "Disminuye la velocidad, observa el tráfico y cede el paso antes de incorporarte."
            },
            "SEMAFORO": {
                nombre: "🚦 SEMÁFORO",
                significado: "Regula el tránsito vehicular y peatonal. Rojo: alto, Amarillo: precaución, Verde: avance.",
                consejo: "Respeta los colores, no aceleres en amarillo y nunca cruces en rojo."
            },
            "ZONA ESCOLAR": {
                nombre: "🏫 ZONA ESCOLAR",
                significado: "Área cercana a escuelas, límite de velocidad reducido y máxima precaución.",
                consejo: "Reduce la velocidad a 30 km/h o menos, atento a niños cruzando."
            },
            "LÍMITE DE VELOCIDAD": {
                nombre: "🚫 LÍMITE DE VELOCIDAD",
                significado: "Velocidad máxima permitida en el tramo. Respetar el número indicado.",
                consejo: "No superes la velocidad indicada, ajusta tu velocidad según las condiciones."
            },
            "PROHIBIDO ESTACIONAR": {
                nombre: "🚫 PROHIBIDO ESTACIONAR",
                significado: "No se permite estacionar el vehículo en esta zona.",
                consejo: "Busca un estacionamiento autorizado para evitar multas y remolque."
            },
            "GIRO OBLIGATORIO": {
                nombre: "🔄 GIRO OBLIGATORIO",
                significado: "Indica la dirección obligatoria que debes seguir.",
                consejo: "Sigue la flecha indicada, no puedes continuar recto ni girar en otra dirección."
            },
            "PEATONES": {
                nombre: "🚶 CRUCE DE PEATONES",
                significado: "Zona de cruce de peatones. Debes ceder el paso.",
                consejo: "Reduce la velocidad y permite el paso seguro de peatones."
            }
        };

        function getSignDetails(signName) {
            const normalized = signName.toUpperCase();
            for (const [key, info] of Object.entries(SIGN_DATABASE)) {
                if (normalized.includes(key) || key.includes(normalized.split(' ')[0])) {
                    return info;
                }
            }
            return {
                nombre: `🚸 ${signName}`,
                significado: "Señal de regulación vial detectada. Respeta las indicaciones de tránsito.",
                consejo: "Mantén precaución y sigue las normas de tránsito aplicables."
            };
        }

        async function analyzeFrameForSigns() {
            if (!isCameraActive || !video.videoWidth || !video.videoHeight || !isDetectionRunning) return [];

            const W = video.videoWidth;
            const H = video.videoHeight;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.floor(W / 2);
            tempCanvas.height = Math.floor(H / 2);
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            const detectedSigns = [];
            const cols = 10, rows = 8;
            const stepX = Math.floor(tempCanvas.width / cols);
            const stepY = Math.floor(tempCanvas.height / rows);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = col * stepX;
                    const y = row * stepY;
                    const rc = analyzeRegionColors(imageData, x, y, stepX, stepY);

                    if (rc.redRatio > 0.18 && rc.whiteRatio > 0.08 &&
                        rc.greenRatio < 0.1 && rc.blueRatio < 0.1 &&
                        rc.redCount > 40) {
                        detectedSigns.push({
                            bbox: [x*2, y*2, stepX*2, stepY*2],
                            class: 'STOP',
                            score: Math.min(0.98, 0.75 + rc.redRatio * 0.8)
                        });
                    }
                    else if (rc.blackRatio > 0.12 &&
                        ((rc.redCount > 15 && rc.greenCount > 10) ||
                         (rc.redCount > 15 && rc.yellowCount > 10) ||
                         (rc.greenCount > 10 && rc.yellowCount > 10))) {
                        detectedSigns.push({
                            bbox: [x*2, y*2, stepX*2, stepY*2],
                            class: 'SEMAFORO',
                            score: 0.80
                        });
                    }
                    else if (rc.redRatio > 0.08 && rc.redRatio < 0.25 &&
                        rc.whiteRatio > 0.25 && rc.blackRatio < 0.1 &&
                        rc.greenRatio < 0.08) {
                        detectedSigns.push({
                            bbox: [x*2, y*2, stepX*2, stepY*2],
                            class: 'CEDA EL PASO',
                            score: 0.72
                        });
                    }
                    else if (rc.yellowRatio > 0.20 && rc.blackRatio > 0.05 &&
                        rc.redRatio < 0.12 && rc.blueRatio < 0.08) {
                        detectedSigns.push({
                            bbox: [x*2, y*2, stepX*2, stepY*2],
                            class: 'ZONA ESCOLAR',
                            score: Math.min(0.92, 0.65 + rc.yellowRatio)
                        });
                    }
                    else if (rc.redRatio > 0.12 && rc.redRatio < 0.35 &&
                        (rc.whiteRatio > 0.15 || rc.blueRatio > 0.10) &&
                        rc.blackRatio > 0.06 && rc.greenRatio < 0.06) {
                        const signClass = rc.blueRatio > 0.10 ? 'PROHIBIDO ESTACIONAR' : 'LÍMITE DE VELOCIDAD';
                        detectedSigns.push({
                            bbox: [x*2, y*2, stepX*2, stepY*2],
                            class: signClass,
                            score: 0.70
                        });
                    }
                    else if (rc.blueRatio > 0.20 && rc.whiteRatio > 0.10 &&
                        rc.redRatio < 0.08 && rc.yellowRatio < 0.08) {
                        detectedSigns.push({
                            bbox: [x*2, y*2, stepX*2, stepY*2],
                            class: 'GIRO OBLIGATORIO',
                            score: 0.68
                        });
                    }
                    else if (rc.whiteRatio > 0.25 && rc.blackRatio > 0.15 &&
                        rc.redRatio < 0.05 && rc.blueRatio < 0.05 && rc.yellowRatio < 0.05) {
                        detectedSigns.push({
                            bbox: [x*2, y*2, stepX*2, stepY*2],
                            class: 'PEATONES',
                            score: 0.62
                        });
                    }
                }
            }

            const uniqueSigns = [];
            for (const sign of detectedSigns) {
                let duplicate = false;
                for (const existing of uniqueSigns) {
                    const dx = Math.abs(existing.bbox[0] - sign.bbox[0]);
                    const dy = Math.abs(existing.bbox[1] - sign.bbox[1]);
                    if (dx < stepX * 2.5 && dy < stepY * 2.5) {
                        if (sign.score > existing.score) {
                            existing.bbox = sign.bbox;
                            existing.class = sign.class;
                            existing.score = sign.score;
                        }
                        duplicate = true;
                        break;
                    }
                }
                if (!duplicate) uniqueSigns.push(sign);
            }

            return uniqueSigns.sort((a, b) => b.score - a.score).slice(0, 5);
        }

        function analyzeRegionColors(imageData, x, y, w, h) {
            let redCount = 0, yellowCount = 0, greenCount = 0, blueCount = 0,
                whiteCount = 0, blackCount = 0, totalPixels = 0;

            const startX = Math.max(0, x);
            const startY = Math.max(0, y);
            const endX = Math.min(imageData.width, x + w);
            const endY = Math.min(imageData.height, y + h);

            for (let py = startY; py < endY; py += 2) {
                for (let px = startX; px < endX; px += 2) {
                    const idx = (py * imageData.width + px) * 4;
                    const r = imageData.data[idx];
                    const g = imageData.data[idx + 1];
                    const b = imageData.data[idx + 2];

                    if (r > 150 && g < 90 && b < 90 && r - g > 70 && r - b > 70) redCount++;
                    else if (r > 180 && g > 150 && b < 90 && r - b > 100) yellowCount++;
                    else if (g > 140 && r < 100 && b < 100 && g - r > 50 && g - b > 50) greenCount++;
                    else if (b > 140 && r < 100 && g < 130 && b - r > 60) blueCount++;
                    else if (r > 200 && g > 200 && b > 200) whiteCount++;
                    else if (r < 50 && g < 50 && b < 50) blackCount++;
                    totalPixels++;
                }
            }

            const t = Math.max(1, totalPixels);
            return {
                redCount, yellowCount, greenCount, blueCount, whiteCount, blackCount, totalPixels,
                redRatio:    redCount    / t,
                yellowRatio: yellowCount / t,
                greenRatio:  greenCount  / t,
                blueRatio:   blueCount   / t,
                whiteRatio:  whiteCount  / t,
                blackRatio:  blackCount  / t,
            };
        }

        function drawDetections(detections) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!detections.length || !isDetectionRunning) return;
            for (const det of detections) {
                const [x, y, w, h] = det.bbox;
                let color;
                switch(det.class) {
                    case 'STOP':            color = "#d32f2f"; break;
                    case 'SEMAFORO':        color = "#4caf50"; break;
                    case 'ZONA ESCOLAR':    color = "#f9a825"; break;
                    case 'CEDA EL PASO':    color = "#e53935"; break;
                    case 'GIRO OBLIGATORIO':color = "#1565c0"; break;
                    default:                color = "#c62828"; break;
                }
                ctx.strokeStyle = color; ctx.lineWidth = 3;
                ctx.strokeRect(x, y, w, h);
                ctx.fillStyle = `${color}22`; ctx.fillRect(x, y, w, h);
                ctx.font = "bold 14px 'Segoe UI'"; ctx.shadowBlur = 4; ctx.shadowColor = "black";
                const label = det.class;
                const metrics = ctx.measureText(label);
                ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(x, y - 26, metrics.width + 14, 24);
                ctx.fillStyle = "#ffffff"; ctx.fillText(label, x + 7, y - 8);
                ctx.shadowBlur = 0;
            }
        }

        function updateInfoPanel(detections) {
            if (!detections || detections.length === 0) {
                let msg = "";
                if (!isCameraActive) msg = "⏹️ Cámara detenida. Inicia el escáner para buscar señales.";
                else if (!isDetectionRunning) msg = "⏸️ Detección pausada. Puedes leer la información.";
                else msg = "📡 Escaneando... Apunta a una señal de tránsito.";
                signListContainer.innerHTML = `<div class="no-signs">${msg}</div>`;
                return;
            }
            let html = '';
            for (const det of detections) {
                const info = getSignDetails(det.class);
                html += `
                    <div class="sign-card">
                        <div class="sign-name">
                            ${info.nombre}
                            <span style="font-size:0.62rem; background:rgba(165,19,19,0.4); padding:2px 9px; border-radius:20px; color:#ffaaaa;">${Math.round(det.score * 100)}%</span>
                        </div>
                        <div class="sign-confidence">Tipo detectado: ${det.class}</div>
                        <div class="sign-description">
                            <strong>📘 Significado:</strong> ${info.significado}<br><br>
                            <strong>⚠️ Recomendación:</strong> ${info.consejo}
                        </div>
                    </div>
                `;
            }
            signListContainer.innerHTML = html;
        }

        async function detectionLoop() {
            if (!isCameraActive) { if (animationId) animationId = requestAnimationFrame(detectionLoop); return; }
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                if (video.videoWidth && video.videoHeight) {
                    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                }
            }
            if (isDetectionRunning) {
                const detections = await analyzeFrameForSigns();
                lastDetections = detections;
                drawDetections(detections);
                updateInfoPanel(detections);
                const now = performance.now();
                if (lastFrameTime !== 0 && now - lastFrameTime > 500) {
                    const fps = Math.round(1000 / (now - lastFrameTime));
                    aiStatusSpan.innerHTML = `📡 Escaneando • ${fps}fps`;
                }
                lastFrameTime = now;
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                updateInfoPanel(lastDetections);
                aiStatusSpan.innerHTML = "⏸️ Detección pausada";
            }
            animationId = requestAnimationFrame(detectionLoop);
        }

        async function startCamera() {
            if (currentStream) stopCamera(false);
            camPlaceholder.style.display = "none";
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment", width: { ideal: 1024 }, height: { ideal: 768 } }
                });
                currentStream = stream;
                video.srcObject = stream;
                await video.play();
                setTimeout(() => { if (video.videoWidth) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; } }, 100);
                isCameraActive = true; isDetectionRunning = true;
                detectionModeText.innerHTML = "⚡ Modo: DETECTANDO";
                pauseDetectionBtn.innerHTML = "⏸️ PAUSAR DETECCIÓN";
                pauseDetectionBtn.classList.add("detecting-active");
                aiStatusSpan.innerHTML = "✅ Cámara activa - Escaneando";
                if (!animationId) detectionLoop();
            } catch(err) {
                console.error("Error cámara:", err);
                camPlaceholder.style.display = "flex";
                camPlaceholder.innerHTML = '<div class="cam-icon">⚠️</div><strong>Error de cámara</strong><small>Permite los permisos en tu dispositivo</small>';
                aiStatusSpan.innerHTML = "❌ Error de cámara";
                isCameraActive = false;
            }
        }

        function toggleDetection() {
            if (!isCameraActive) { alert("Primero inicia el escáner con 'INICIAR ESCÁNER'"); return; }
            isDetectionRunning = !isDetectionRunning;
            if (isDetectionRunning) {
                detectionModeText.innerHTML = "⚡ Modo: DETECTANDO";
                pauseDetectionBtn.innerHTML = "⏸️ PAUSAR DETECCIÓN";
                pauseDetectionBtn.classList.add("detecting-active");
                aiStatusSpan.innerHTML = "📡 Detectando señales...";
                updateInfoPanel(lastDetections);
            } else {
                detectionModeText.innerHTML = "⏸️ Modo: PAUSADO (lectura)";
                pauseDetectionBtn.innerHTML = "▶️ REANUDAR DETECCIÓN";
                pauseDetectionBtn.classList.remove("detecting-active");
                aiStatusSpan.innerHTML = "⏸️ Detección pausada - Puedes leer la información";
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                updateInfoPanel(lastDetections);
            }
        }

        function stopCamera(clearDetections = false) {
            isCameraActive = false; isDetectionRunning = false;
            if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
            if (currentStream) { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
            video.srcObject = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            camPlaceholder.style.display = "flex";
            camPlaceholder.innerHTML = '<div class="cam-icon">📷</div><strong>Cámara detenida</strong><small>Presiona "INICIAR ESCÁNER" para reiniciar</small>';
            aiStatusSpan.innerHTML = "⏹️ Sistema detenido";
            detectionModeText.innerHTML = "⚙️ Inactivo";
            pauseDetectionBtn.innerHTML = "⏸️ PAUSAR DETECCIÓN";
            pauseDetectionBtn.classList.remove("detecting-active");
            if (clearDetections) lastDetections = [];
            updateInfoPanel(lastDetections);
        }

        startBtn.addEventListener('click', startCamera);
        pauseDetectionBtn.addEventListener('click', toggleDetection);
        stopBtn.addEventListener('click', () => stopCamera(false));
        video.addEventListener('loadedmetadata', () => {
            if (video.videoWidth) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
        });
    })();