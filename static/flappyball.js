document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('flappyball-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');

    const gameOverMessage = document.getElementById('game-over-message');
    const finalScoreText = document.getElementById('final-score-text');
    const resetButton = document.getElementById('reset-btn');

    // --- Game Constants ---
    const canvasWidth = 400;
    const canvasHeight = 600;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // --- Game State Variables ---
    let ball, pipes, score, gameActive, gameLoop;
    let gravity = 0.5;
    let bounce = -9; // Renamed from lift
    let pipeGap = 150;
    let pipeSpeed = 3;
    let pipeSpawnTimer = 150; // Controls how often pipes spawn

    // --- Ball Object ---
    const ballProps = {
        x: 100,
        y: 300,
        radius: 20,
        velocity: 0
    };

    // --- Initialization ---
    function initializeGame() {
        ball = { ...ballProps };
        pipes = [];
        score = 0;
        gameActive = true;
        pipeSpawnTimer = 150;
        
        scoreElement.textContent = '0';
        gameOverMessage.style.display = 'none';
        
        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');

        // Start game loop
        if (gameLoop) cancelAnimationFrame(gameLoop);
        main();
        
        // Add game-specific event listeners
        document.addEventListener('keydown', handleBounce);
        canvas.addEventListener('click', handleBounce);
    }

    startButton.addEventListener('click', initializeGame);
    resetButton.addEventListener('click', initializeGame);

    // --- Main Game Loop ---
    function main() {
        if (!gameActive) return;

        // 1. Clear canvas with dark background
        ctx.fillStyle = '#0b0f19'; // var(--bg-color)
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 2. Update and Draw Game Objects
        updateBall();
        drawBall();
        
        updatePipes();
        drawPipes();

        // 3. Check for collisions
        checkCollisions();
        
        // 4. Update Score
        drawScore();

        // 5. Request next frame
        gameLoop = requestAnimationFrame(main);
    }

    // --- Ball Logic ---
    function updateBall() {
        ball.velocity += gravity;
        ball.velocity *= 0.9; // Some air resistance
        ball.y += ball.velocity;

        // Prevent ball from going off-screen (top)
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.velocity = 0;
        }
    }

    function drawBall() {
        // Add neon glow
        ctx.shadowColor = '#f2b179'; // Same as fillStyle
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f2b179'; // Yellowish ball
        ctx.fill();
        ctx.strokeStyle = '#0b0f19';
        ctx.stroke();
        ctx.closePath();

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    function handleBounce(e) {
        if (e.code === 'Space' || e.type === 'click') {
            if (gameActive) {
                ball.velocity = bounce;
            }
        }
    }

    // --- Pipe Logic ---
    function updatePipes() {
        // Move existing pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= pipeSpeed;

            // Check if pipe is off-screen
            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
            
            // Check for score
            if (pipes[i].x === ball.x - pipes[i].width) {
                score++;
                scoreElement.textContent = score;
            }
        }

        // Add new pipes
        pipeSpawnTimer--;
        if (pipeSpawnTimer <= 0) {
            createPipe();
            pipeSpawnTimer = 150; // Reset timer
        }
    }

    function createPipe() {
        const topHeight = Math.floor(Math.random() * (canvasHeight - pipeGap - 100)) + 50;
        const bottomHeight = canvasHeight - topHeight - pipeGap;

        pipes.push({
            x: canvasWidth,
            y: 0,
            width: 60,
            height: topHeight,
            isTop: true
        });

        pipes.push({
            x: canvasWidth,
            y: canvasHeight - bottomHeight,
            width: 60,
            height: bottomHeight,
            isTop: false
        });
    }

    function drawPipes() {
        ctx.fillStyle = '#00e5ff'; // Changed to neon cyan (var(--secondary-color))
        
        // Add neon glow
        ctx.shadowColor = '#00e5ff'; // Same as new fillStyle
        ctx.shadowBlur = 15;

        pipes.forEach(pipe => {
            const capWidth = pipe.width + 10; // Make cap 10px wider
            const capHeight = 30; // Make cap 30px tall
            const capOffset = 5; // (capWidth - pipe.width) / 2

            // Draw main pipe body
            ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
            ctx.strokeStyle = '#0b0f19';
            ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);

            // Draw pipe cap
            if (pipe.isTop) {
                // Cap for top pipe (at the bottom)
                let capY = pipe.height - capHeight;
                ctx.fillRect(pipe.x - capOffset, capY, capWidth, capHeight);
                ctx.strokeRect(pipe.x - capOffset, capY, capWidth, capHeight);
            } else {
                // Cap for bottom pipe (at the top)
                let capY = pipe.y;
                ctx.fillRect(pipe.x - capOffset, capY, capWidth, capHeight);
                ctx.strokeRect(pipe.x - capOffset, capY, capWidth, capHeight);
            }
        });

        // Reset shadow
        ctx.shadowBlur = 0;
    }

    // --- Game State & Score ---
    function checkCollisions() {
        // Ground collision
        if (ball.y + ball.radius > canvasHeight) {
            endGame();
            return;
        }
        
        // Pipe collision
        for (let pipe of pipes) {
            // Check if ball is within the x-range of the pipe
            if (ball.x + ball.radius > pipe.x && ball.x - ball.radius < pipe.x + pipe.width) {
                // Check for collision with top pipe OR bottom pipe
                if (pipe.isTop && ball.y - ball.radius < pipe.height) {
                    endGame();
                    return;
                }
                if (!pipe.isTop && ball.y + ball.radius > pipe.y) {
                    endGame();
                    return;
Error:
                    return;
                }
            }
        }
    }
    
    function drawScore() {
        // This is handled by the HTML element
    }

    function endGame() {
        gameActive = false;
        cancelAnimationFrame(gameLoop);
        
        // Remove listeners
        document.removeEventListener('keydown', handleBounce);
        canvas.removeEventListener('click', handleBounce);
        
        // Show Game Over Popup
        finalScoreText.textContent = `Final Score: ${score}`;
        gameOverMessage.style.display = 'flex';

        // Submit score to backend
        submitScore('flappyball', score);
    }

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