document.addEventListener('DOMContentLoaded', () => {
    // --- Canvas & Game Elements ---
    const canvas = document.getElementById('breakout-canvas');
    const ctx = canvas.getContext('2d');
    
    // --- UI Elements ---
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const gameOverMessage = document.getElementById('game-over-message');
    const gameOverText = document.getElementById('game-over-text');
    const resetButton = document.getElementById('reset-btn');

    // --- Game State Variables ---
    let ball, paddle, bricks;
    let score, lives, gameActive;
    let rightPressed = false;
    let leftPressed = false;

    // --- Game Constants ---
    const paddleHeight = 12;
    const paddleWidth = 100;
    const ballRadius = 10;
    const brickRowCount = 5;
    const brickColumnCount = 9;
    const brickWidth = 55;
    const brickHeight = 20;
    const brickPadding = 5;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 30;

    // --- Game Object Definitions ---
    function setupGameObjects() {
        ball = {
            x: canvas.width / 2,
            y: canvas.height - 50,
            dx: 4, // Speed
            dy: -4,
            radius: ballRadius
        };
        paddle = {
            x: (canvas.width - paddleWidth) / 2,
            width: paddleWidth,
            height: paddleHeight,
            speed: 8
        };
        bricks = [];
        const brickColors = ["#f2b179", "#f59563", "#f67c5f", "#f65e3b", "#00e5ff"]; // Colors for rows
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1, color: brickColors[r] };
            }
        }
    }
    
    // --- Initialization ---
    function initializeGame() {
        score = 0;
        lives = 3;
        gameActive = true;
        
        scoreElement.textContent = '0';
        livesElement.textContent = '3';
        gameOverMessage.style.display = 'none';
        
        setupGameObjects();

        // Hide options, show game
        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');
        
        draw(); // Start the game loop
    }
    
    startButton.addEventListener('click', initializeGame);
    resetButton.addEventListener('click', initializeGame);

    // --- Drawing Functions ---
    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#00e5ff"; // cyan ball
        ctx.fill();
        ctx.closePath();
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
        ctx.fillStyle = "#e0e0e0"; // light paddle
        ctx.fill();
        ctx.closePath();
    }

    function drawBricks() {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                if (bricks[c][r].status === 1) {
                    let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                    let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                    bricks[c][r].x = brickX;
                    bricks[c][r].y = brickY;
                    ctx.beginPath();
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);
                    ctx.fillStyle = bricks[c][r].color;
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    // --- Collision Detection ---
    function collisionDetection() {
        // Ball vs. Bricks
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                        ball.dy = -ball.dy; // Reverse vertical direction
                        b.status = 0; // Brick is hit
                        score += 10;
                        scoreElement.textContent = score;

                        // Check for win
                        if (score === brickRowCount * brickColumnCount * 10) {
                            endGame("You Win!");
                        }
                    }
                }
            }
        }

        // Ball vs. Walls
        if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx; // Reverse horizontal direction
        }
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy; // Reverse vertical (top wall)
        } else if (ball.y + ball.dy > canvas.height - ball.radius) {
            // Ball hits bottom
            // Check for paddle collision
            if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                ball.dy = -ball.dy; // Bounce off paddle
            } else {
                // Ball missed paddle
                lives--;
                livesElement.textContent = lives;
                if (lives === 0) {
                    endGame("Game Over!");
                } else {
                    // Reset ball and paddle
                    ball.x = canvas.width / 2;
                    ball.y = canvas.height - 50;
                    ball.dx = 4;
                    ball.dy = -4;
                    paddle.x = (canvas.width - paddle.width) / 2;
                }
            }
        }
    }
    
    // --- Game Loop ---
    function draw() {
        if (!gameActive) return; // Stop the loop if game ended
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawBricks();
        drawBall();
        drawPaddle();
        collisionDetection();

        // Move paddle
        if (rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += paddle.speed;
        } else if (leftPressed && paddle.x > 0) {
            paddle.x -= paddle.speed;
        }

        // Move ball
        ball.x += ball.dx;
        ball.y += ball.dy;

        requestAnimationFrame(draw);
    }
    
    // --- End Game ---
    function endGame(message) {
        gameActive = false;
        gameOverText.textContent = message;
        gameOverMessage.style.display = 'flex';
        submitScore('breakout', score);
    }

    // --- Event Listeners ---
    document.addEventListener("keydown", (e) => {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = true;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = true;
        }
    }, false);

    document.addEventListener("keyup", (e) => {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = false;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = false;
        }
    }, false);

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
                document.getElementById('user-info').innerHTML = `<strong>${result.username}</strong> | EXP: ${result.new_exp}`;
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }
});
