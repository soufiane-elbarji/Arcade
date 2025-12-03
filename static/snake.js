document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');

    const gameOverMessage = document.getElementById('game-over-message');
    const finalScoreText = document.getElementById('final-score-text');
    const resetButton = document.getElementById('reset-btn-snake');

    // --- Game State ---
    const gridSize = 20;
    const canvasSize = 600;
    ctx.canvas.width = canvasSize;
    ctx.canvas.height = canvasSize;

    let score, snake, food, direction, changingDirection, gameInterval, isGameOver, gameSpeed, gameActive;
    
    let pointsPerFood;

    // --- Initialization ---
    function initializeGame() {
        score = 0;
        snake = [{ x: 15, y: 15 }];
        food = {};
        direction = 'right';
        changingDirection = false;
        isGameOver = false;
        gameActive = true;
        scoreElement.textContent = score;

        // Get selected speed from the radio button's value
        const difficultyValue = document.querySelector('input[name="difficulty"]:checked').value;
        gameSpeed = parseInt(difficultyValue, 10);
        
        // --- NEW: Set points based on difficulty ---
        if (gameSpeed === 150) { // Easy
            pointsPerFood = 10;
        } else if (gameSpeed === 100) { // Normal
            pointsPerFood = 20;
        } else { // Hard (60)
            pointsPerFood = 30;
        }
        
        // Hide options, show game
        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');
        gameOverMessage.style.display = 'none';

        createFood();
        // Clear old interval if it exists
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(main, gameSpeed);
    }
    
    // Connect both buttons
    startButton.addEventListener('click', initializeGame);
    resetButton.addEventListener('click', initializeGame);

    // --- Main Game Loop ---
    function main() {
        if (isGameOver) {
            clearInterval(gameInterval);
            gameActive = false; 
            
            // Show Game Over Popup
            finalScoreText.textContent = `Final Score: ${score}`;
            gameOverMessage.style.display = 'flex';

            submitScore('snake', score);
            return;
        }

        changingDirection = false;
        clearCanvas();
        drawFood();
        moveSnake();
        checkCollision();
        drawSnake();
    }

    // --- Drawing Functions ---
    function clearCanvas() {
        ctx.fillStyle = '#1a2233';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawSnake() {
        ctx.fillStyle = '#00e5ff';
        ctx.strokeStyle = '#0b0f19';
        snake.forEach(part => {
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
            ctx.strokeRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
        });
    }

    // --- Game Logic ---
    function moveSnake() {
        const head = { x: snake[0].x, y: snake[0].y };

        switch (direction) {
            case 'up': head.y -= 1; break;
            case 'down': head.y += 1; break;
            case 'left': head.x -= 1; break;
            case 'right': head.x += 1; break;
        }

        snake.unshift(head); 

        // Check for food
        if (head.x === food.x && head.y === food.y) {
            // Increase score by pointsPerFood
            score += pointsPerFood; 
            scoreElement.textContent = score;
            createFood();
        } else {
            snake.pop(); // Remove tail
        }
    }

    function checkCollision() {
        const head = snake[0];

        // Check wall collision
        if (head.x < 0 || head.x * gridSize >= canvas.width || head.y < 0 || head.y * gridSize >= canvas.height) {
            isGameOver = true;
        }

        // Check self-collision
        for (let i = 4; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                isGameOver = true;
            }
        }
    }

    function createFood() {
        food.x = Math.floor(Math.random() * (canvas.width / gridSize)); 
        food.y = Math.floor(Math.random() * (canvas.height / gridSize));
        
        // Ensure food doesn't spawn on snake
        snake.forEach(part => {
            if (part.x === food.x && part.y === food.y) {
                createFood();
            }
        });
    }

    function drawFood() {
        ctx.fillStyle = '#ff3b30';
        ctx.strokeStyle = '#f0f2f5';
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    }

    // --- Controls ---
    document.addEventListener('keydown', e => {
        if (changingDirection || !gameActive) return;
        changingDirection = true;

        const goingUp = direction === 'up';
        const goingDown = direction ==='down';
        const goingLeft = direction === 'left';
        const goingRight = direction === 'right';

        if ((e.key === 'ArrowUp' || e.key === 'w') && !goingDown) direction = 'up';
        if ((e.key === 'ArrowDown' || e.key === 's') && !goingUp) direction = 'down';
        if ((e.key === 'ArrowLeft' || e.key === 'a') && !goingRight) direction = 'left';
        if ((e.key === 'ArrowRight' || e.key === 'd') && !goingLeft) direction = 'right';
    });

    // --- API Score Submission ---
    async function submitScore(gameName, finalScore) {
        try {
            const response = await fetch('/api/submit_score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_name: gameName,
                    score: finalScore 
                })
            });
            const result = await response.json();
            if (result.success) {
                console.log('Score submitted!');
                const userInfo = document.getElementById('user-info');
                if (userInfo) {
                    userInfo.innerHTML = `<strong>${result.username}</strong> | EXP: ${result.new_exp}`;
                }
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }
});

