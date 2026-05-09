        const quizQuestions = [
            { q: "¿Qué tipo de aceite es mejor para un motor moderno?", opts: ["Mineral", "Sintético", "Semisintético", "Vegetal"], correct: 1 },
            { q: "¿Cada cuánto se recomienda cambiar el filtro de aire?", opts: ["5,000 km", "10,000 km", "20,000 km", "50,000 km"], correct: 1 },
            { q: "¿Qué indica el testigo de presión de aceite?", opts: ["Falta gasolina", "Batería baja", "Presión baja de aceite", "Motor caliente"], correct: 2 },
            { q: "¿Qué significa ABS?", opts: ["Sistema Antibloqueo de Ruedas", "Aceleración Básica", "Asistente de freno", "Aire acondicionado"], correct: 0 },
            { q: "¿Qué líquido es hidráulico en los frenos?", opts: ["Aceite motor", "Refrigerante", "Líquido de frenos", "Agua destilada"], correct: 2 },
            { q: "¿Qué parte del auto genera electricidad?", opts: ["Batería", "Alternador", "Motor de arranque", "Bujías"], correct: 1 },
            { q: "¿Cada cuánto km se recomienda cambiar el aceite de motor?", opts: ["1,000 km", "5,000-10,000 km", "20,000 km", "50,000 km"], correct: 1 },
            { q: "¿Qué sistema ayuda a mantener el control en curvas?", opts: ["ABS", "ESP", "TCS", "Airbag"], correct: 1 }
        ];
        let currentQ = 0, quizScore = 0;

        function resetQuiz() {
            currentQ = 0; quizScore = 0;
            document.getElementById('quizResults').style.display = 'none';
            document.getElementById('quizContainer').style.display = 'block';
            document.getElementById('quizTotal').innerText = quizQuestions.length;
            showQuestion();
        }

        function showQuestion() {
            const q = quizQuestions[currentQ];
            document.getElementById('quizQuestion').innerText = q.q;
            const optsDiv = document.getElementById('quizOptions');
            optsDiv.innerHTML = '';
            q.opts.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.innerText = opt;
                btn.onclick = () => selectAnswer(idx, btn);
                optsDiv.appendChild(btn);
            });
            document.getElementById('nextQuestion').style.display = 'none';
            document.getElementById('quizProgress').style.width = `${(currentQ / quizQuestions.length) * 100}%`;
        }

        function selectAnswer(selected, btnElement) {
            const correct = quizQuestions[currentQ].correct;
            const btns = document.querySelectorAll('.quiz-option');
            btns.forEach(btn => btn.disabled = true);
            if (selected === correct) { quizScore++; btnElement.classList.add('correct'); }
            else { btnElement.classList.add('incorrect'); btns[correct].classList.add('correct'); }
            document.getElementById('nextQuestion').style.display = 'block';
        }

        document.getElementById('nextQuestion').addEventListener('click', () => {
            currentQ++;
            if (currentQ < quizQuestions.length) showQuestion();
            else {
                document.getElementById('quizContainer').style.display = 'none';
                document.getElementById('quizResults').style.display = 'block';
                document.getElementById('quizScore').innerText = quizScore;
                const feedback = document.getElementById('quizFeedback');
                if (quizScore === quizQuestions.length) feedback.innerHTML = '<p class="text-success fs-5">🏆 ¡Excelente! Eres un experto en autos.</p>';
                else if (quizScore >= 6) feedback.innerHTML = '<p class="text-warning fs-5">👍 ¡Muy bien! Sigue aprendiendo.</p>';
                else if (quizScore >= 4) feedback.innerHTML = '<p class="text-info fs-5">📚 Puedes mejorar, ¡inténtalo de nuevo!</p>';
                else feedback.innerHTML = '<p class="text-danger fs-5">⚠️ Te falta práctica, repasa los conceptos.</p>';
            }
        });

        resetQuiz();