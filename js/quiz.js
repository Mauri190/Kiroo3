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

    // ===== QUIZ DATA =====
    const quizData = [
        {
            question: "¿Qué significa la luz CHECK ENGINE en el tablero?",
            options: [
                "A) El motor está sobrecalentado",
                "B) Hay una falla en el sistema de emisiones o motor",
                "C) Falta aceite",
                "D) La batería está descargada"
            ],
            correct: 1,
            explanation: "La luz CHECK ENGINE indica una falla en el sistema de gestión del motor o emisiones. Debes escanear el vehículo para identificar el código de error."
        },
        {
            question: "¿Cada cuántos kilómetros se recomienda cambiar el aceite del motor?",
            options: [
                "A) 20,000 - 25,000 km",
                "B) 5,000 - 10,000 km",
                "C) 1,000 - 2,000 km",
                "D) 50,000 km"
            ],
            correct: 1,
            explanation: "El intervalo recomendado es entre 5,000 y 10,000 km, dependiendo del tipo de aceite y las recomendaciones del fabricante."
        },
        {
            question: "¿Qué elemento del vehículo es responsable de convertir la energía química en eléctrica?",
            options: [
                "A) Alternador",
                "B) Batería",
                "C) Bujías",
                "D) Motor de arranque"
            ],
            correct: 0,
            explanation: "El alternador convierte energía mecánica en eléctrica para cargar la batería y alimentar los sistemas eléctricos del auto."
        },
        {
            question: "¿Cuál es la presión correcta de los neumáticos?",
            options: [
                "A) Depende del vehículo y la carga",
                "B) Siempre 30 PSI",
                "C) Siempre 40 PSI",
                "D) No necesita presión específica"
            ],
            correct: 0,
            explanation: "La presión correcta varía según el vehículo, la carga y las recomendaciones del fabricante. Revisa el manual o la etiqueta en la puerta del conductor."
        },
        {
            question: "¿Qué líquido ayuda a mantener el motor a temperatura adecuada?",
            options: [
                "A) Aceite de motor",
                "B) Líquido de frenos",
                "C) Refrigerante o anticongelante",
                "D) Líquido de dirección"
            ],
            correct: 2,
            explanation: "El refrigerante circula por el motor absorbiendo calor y manteniendo la temperatura óptima de operación."
        },
        {
            question: "¿Cuándo debes cambiar las bujías?",
            options: [
                "A) Nunca se cambian",
                "B) Cada 10,000 km",
                "C) Según el manual del fabricante (30,000 - 100,000 km)",
                "D) Solo cuando el auto no enciende"
            ],
            correct: 2,
            explanation: "El intervalo varía según el tipo de bujías (cobre, platino, iridio). Revisa el manual del fabricante para el mantenimiento adecuado."
        },
        {
            question: "¿Qué sistema permite mantener el control del vehículo al frenar en superficies resbaladizas?",
            options: [
                "A) ESP (Control de Estabilidad)",
                "B) ABS (Frenos Antibloqueo)",
                "C) TCS (Control de Tracción)",
                "D) Airbag"
            ],
            correct: 1,
            explanation: "El ABS evita que las ruedas se bloqueen al frenar, permitiendo mantener el control direccional del vehículo."
        },
        {
            question: "¿Con qué frecuencia se recomienda rotar los neumáticos?",
            options: [
                "A) Cada cambio de aceite (8,000 - 10,000 km)",
                "B) Nunca",
                "C) Cada 50,000 km",
                "D) Solo cuando se ven desgastados"
            ],
            correct: 0,
            explanation: "Rotar los neumáticos cada 8,000-10,000 km ayuda a que se desgasten de manera uniforme y prolonga su vida útil."
        },
        {
            question: "¿Qué significa la sigla SUV?",
            options: [
                "A) Super Utility Vehicle",
                "B) Sport Utility Vehicle",
                "C) Standard Utility Van",
                "D) Special Urban Vehicle"
            ],
            correct: 1,
            explanation: "SUV significa Sport Utility Vehicle, vehículos con mayor altura al suelo y capacidad todoterreno limitada."
        },
        {
            question: "¿Cuál es la función del catalizador?",
            options: [
                "A) Aumentar la potencia del motor",
                "B) Reducir gases contaminantes",
                "C) Filtrar el aceite",
                "D) Enfriar el motor"
            ],
            correct: 1,
            explanation: "El catalizador convierte los gases tóxicos del escape (CO, NOx, HC) en sustancias menos dañinas como CO2 y vapor de agua."
        }
    ];

    let currentQuestion = 0;
    let userAnswers = [];
    let quizCompleted = false;

    function renderQuiz() {
        if (quizCompleted) return;
        
        const question = quizData[currentQuestion];
        const progressPercent = ((currentQuestion + 1) / quizData.length) * 100;
        
        document.getElementById('quizProgress').style.width = `${progressPercent}%`;
        document.getElementById('quizQuestion').textContent = question.question;
        
        const optionsContainer = document.getElementById('quizOptions');
        optionsContainer.innerHTML = '';
        
        const letters = ['A', 'B', 'C', 'D'];
        
        question.options.forEach((option, idx) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            if (userAnswers[currentQuestion] === idx) {
                optionDiv.classList.add('selected');
            }
            optionDiv.innerHTML = `
                <div class="option-letter">${letters[idx]}</div>
                <div class="option-text">${option}</div>
            `;
            optionDiv.onclick = () => selectAnswer(idx);
            optionsContainer.appendChild(optionDiv);
        });
        
        const nextBtn = document.getElementById('nextQuestion');
        if (currentQuestion === quizData.length - 1) {
            nextBtn.textContent = 'Finalizar quiz';
        } else {
            nextBtn.textContent = 'Siguiente pregunta';
        }
    }

    function selectAnswer(answerIndex) {
        if (userAnswers[currentQuestion] !== undefined) return;
        userAnswers[currentQuestion] = answerIndex;
        
        // Marcar la opción seleccionada visualmente
        const options = document.querySelectorAll('.quiz-option');
        options.forEach((opt, idx) => {
            if (idx === answerIndex) {
                opt.classList.add('selected');
            }
        });
    }

    function nextQuestion() {
        if (userAnswers[currentQuestion] === undefined) {
            showToast('Por favor selecciona una respuesta', true);
            return;
        }
        
        if (currentQuestion < quizData.length - 1) {
            currentQuestion++;
            renderQuiz();
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        quizCompleted = true;
        
        let score = 0;
        quizData.forEach((q, idx) => {
            if (userAnswers[idx] === q.correct) {
                score++;
            }
        });
        
        const total = quizData.length;
        const percentage = (score / total) * 100;
        
        document.getElementById('quizScore').textContent = score;
        document.getElementById('quizTotal').textContent = total;
        
        let feedbackMessage = '';
        let feedbackClass = '';
        
        if (percentage >= 90) {
            feedbackMessage = '🏆 ¡Excelente! Eres un experto en automóviles. Sigue así.';
            feedbackClass = 'text-success';
        } else if (percentage >= 70) {
            feedbackMessage = '👍 ¡Muy bien! Tienes buen conocimiento, pero puedes mejorar.';
            feedbackClass = 'text-warning';
        } else if (percentage >= 50) {
            feedbackMessage = '📚 Buen intento. Te recomendamos repasar más sobre mecánica básica.';
            feedbackClass = 'text-info';
        } else {
            feedbackMessage = '💪 Sigue practicando. Aprender sobre tu vehículo te ayudará a mantenerlo mejor.';
            feedbackClass = 'text-danger';
        }
        
        document.getElementById('quizFeedback').innerHTML = `<div class="quiz-feedback"><i class="bi bi-chat-dots"></i> ${feedbackMessage}</div>`;
        
        document.getElementById('quizContainer').style.display = 'none';
        document.getElementById('quizResults').style.display = 'block';
    }

    function resetQuiz() {
        currentQuestion = 0;
        userAnswers = [];
        quizCompleted = false;
        
        document.getElementById('quizContainer').style.display = 'block';
        document.getElementById('quizResults').style.display = 'none';
        
        renderQuiz();
    }

    function showToast(message, isError = false) {
        // Crear toast temporal
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';
        toast.style.backgroundColor = isError ? '#dc3545' : '#28a745';
        toast.style.color = 'white';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '30px';
        toast.style.fontSize = '0.85rem';
        toast.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2"></i>${message}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', async () => {
        if (!await checkAuth()) return;
        resetQuiz();
        document.getElementById('nextQuestion').addEventListener('click', nextQuestion);
    });