document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('pacman-canvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const gameOverMessage = document.getElementById('game-over-message');
    const gameOverText = document.getElementById('game-over-text');
    const resetButton = document.getElementById('reset-btn');

    // --- Game Constants ---
    const TILE_SIZE = 20; // 20px per tile
    const MAP = [ // 1 = Wall, 0 = Pellet, 2 = Empty, 3 = Ghost Home, 4 = Power Pellet
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 4, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 4, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 2, 1, 2, 1, 1, 1, 0, 1, 1, 1, 1],
        [2, 2, 2, 1, 0, 1, 2, 2, 2, 3, 2, 2, 2, 1, 0, 1, 2, 2, 2],
        [1, 1, 1, 1, 0, 1, 2, 1, 1, 3, 1, 1, 2, 1, 0, 1, 1, 1, 1],
        [2, 2, 2, 2, 0, 2, 2, 1, 3, 3, 3, 1, 2, 2, 0, 2, 2, 2, 2],
        [1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1],
        [2, 2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 0, 1, 2, 2, 2],
        [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 4, 1],
        [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    const MAP_ROWS = MAP.length;
    const MAP_COLS = MAP[0].length;

    // --- Game State ---
    let score, lives, gameActive, gameLoop, player, ghosts, pelletCount;
    let powerPelletTimer = 0;
    
    // --- Setup Canvas ---
    canvas.width = MAP_COLS * TILE_SIZE;
    canvas.height = MAP_ROWS * TILE_SIZE;

    // --- Entity Classes ---
    class Player {
        constructor(x, y, speed) {
            this.x = x * TILE_SIZE + TILE_SIZE / 2;
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.speed = speed;
            this.radius = TILE_SIZE / 2 - 2;
            this.direction = null; // 'right', 'left', 'up', 'down'
            this.nextDirection = null; // Buffered direction
            this.mouthOpen = 0; // Animation timer
        }

        draw() {
            // Animate mouth
            this.mouthOpen = (this.mouthOpen + 1) % 20;
            const mouthAngle = (this.mouthOpen > 10 ? (20 - this.mouthOpen) : this.mouthOpen) / 20 * Math.PI / 4;
            
            let startAngle = 0;
            let endAngle = Math.PI * 2;

            if (this.direction) {
                if (this.direction === 'right') { startAngle = mouthAngle; endAngle = Math.PI * 2 - mouthAngle; }
                if (this.direction === 'left') { startAngle = Math.PI + mouthAngle; endAngle = Math.PI - mouthAngle; }
                if (this.direction === 'up') { startAngle = 1.5 * Math.PI + mouthAngle; endAngle = 1.5 * Math.PI - mouthAngle; }
                if (this.direction === 'down') { startAngle = 0.5 * Math.PI + mouthAngle; endAngle = 0.5 * Math.PI - mouthAngle; }
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, startAngle, endAngle);
            ctx.lineTo(this.x, this.y);
            ctx.fillStyle = '#f2b179';
            ctx.fill();
            ctx.closePath();
        }

        update() {
            // Check if next direction is valid
            if (this.nextDirection) {
                const { newX, newY } = this.getFuturePosition(this.nextDirection);
                if (!this.checkWallCollision(newX, newY)) {
                    this.direction = this.nextDirection;
                    this.nextDirection = null;
                }
            }
            
            // Move if direction is set
            if (this.direction) {
                const { newX, newY } = this.getFuturePosition(this.direction);
                if (!this.checkWallCollision(newX, newY)) {
                    this.x = newX;
                    this.y = newY;
                    this.handleTunnel();
                    this.eatPellet();
                } else {
                    // Stop if we hit a wall
                    this.direction = null; 
                }
            }
        }
        
        getFuturePosition(dir) {
            let newX = this.x, newY = this.y;
            if (dir === 'right') newX += this.speed;
            if (dir === 'left') newX -= this.speed;
            if (dir === 'up') newY -= this.speed;
            if (dir === 'down') newY += this.speed;
            return { newX, newY };
        }

        checkWallCollision(x, y) {
            // Check all 4 corners of Pac-Man's hitbox
            const corners = [
                { x: x - this.radius, y: y - this.radius },
                { x: x + this.radius -1, y: y - this.radius },
                { x: x - this.radius, y: y + this.radius -1 },
                { x: x + this.radius -1, y: y + this.radius -1 }
            ];

            for (let corner of corners) {
                const mapX = Math.floor(corner.x / TILE_SIZE);
                const mapY = Math.floor(corner.y / TILE_SIZE);
                if (MAP[mapY] && MAP[mapY][mapX] === 1) {
                    return true; // Collision
                }
            }
            return false;
        }
        
        handleTunnel() {
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
        }
        
        eatPellet() {
            const mapX = Math.floor(this.x / TILE_SIZE);
            const mapY = Math.floor(this.y / TILE_SIZE);
            const tile = MAP[mapY][mapX];
            
            if (tile === 0) { // Regular pellet
                MAP[mapY][mapX] = 2; // Set to empty
                score += 10;
                pelletCount--;
            } else if (tile === 4) { // Power pellet
                MAP[mapY][mapX] = 2;
                score += 50;
                activatePowerPellet();
            }
        }
    }
    
    class Ghost {
        constructor(x, y, speed, color) {
            this.x = x * TILE_SIZE + TILE_SIZE / 2;
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.speed = speed;
            this.radius = TILE_SIZE / 2 - 2;
            this.color = color;
            this.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
            this.isFrightened = false;
        }

        // Get future position based on direction
        getFuturePosition(dir) {
            let newX = this.x, newY = this.y;
            if (dir === 'right') newX += this.speed;
            if (dir === 'left') newX -= this.speed;
            if (dir === 'up') newY -= this.speed;
            if (dir === 'down') newY += this.speed;
            return { newX, newY };
        }

        // Draw the ghost
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, Math.PI, 0);
            ctx.lineTo(this.x + this.radius, this.y + this.radius);
            ctx.lineTo(this.x - this.radius, this.y + this.radius);
            ctx.fillStyle = this.isFrightened ? '#3d5afe' : this.color;
            ctx.fill();
            ctx.closePath();
            
            // Eyes
            ctx.beginPath();
            ctx.arc(this.x - this.radius / 2, this.y - this.radius / 4, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.radius / 2, this.y - this.radius / 4, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.closePath();
        }

        update() {
            // Check if we will hit a wall in the current direction
            const { newX, newY } = this.getFuturePosition(this.direction);

            if (this.isAtIntersection() || this.checkWallCollision(newX, newY)) {
                this.direction = this.getNewDirection();
            }
            
            // Check collision AGAIN with the (potentially new) direction
            const { newX: finalX, newY: finalY } = this.getFuturePosition(this.direction);
            if (!this.checkWallCollision(finalX, finalY)) {
                this.move();
            }
        }
        
        // Move ghost in current direction
        move() {
            if (this.direction === 'right') this.x += this.speed;
            if (this.direction === 'left') this.x -= this.speed;
            if (this.direction === 'up') this.y -= this.speed;
            if (this.direction === 'down') this.y += this.speed;
            this.handleTunnel();
        }

        checkWallCollision(x, y) {
            // Check all 4 corners of the Ghost's hitbox
            const corners = [
                { x: x - this.radius, y: y - this.radius },
                { x: x + this.radius -1, y: y - this.radius },
                { x: x - this.radius, y: y + this.radius -1 },
                { x: x + this.radius -1, y: y + this.radius -1 }
            ];

            for (let corner of corners) {
                const mapX = Math.floor(corner.x / TILE_SIZE);
                const mapY = Math.floor(corner.y / TILE_SIZE);
                if (MAP[mapY] && MAP[mapY][mapX] === 1) {
                    return true; // Collision
                }
            }
            return false;
        }

        isAtIntersection() {
            // Check if current tile is an intersection
            const mapX = Math.floor(this.x / TILE_SIZE);
            const mapY = Math.floor(this.y / TILE_SIZE);
            
            let validMoves = 0;
            if (MAP[mapY-1][mapX] !== 1) validMoves++; // Up
            if (MAP[mapY+1][mapX] !== 1) validMoves++; // Down
            if (MAP[mapY][mapX-1] !== 1) validMoves++; // Left
            if (MAP[mapY][mapX+1] !== 1) validMoves++; // Right
            
            return validMoves > 2;
        }

        getNewDirection() {
            const validDirections = [];
            const opposites = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };

            // Check each direction using the NEW collision logic
            let { newX, newY } = this.getFuturePosition('up');
            if (!this.checkWallCollision(newX, newY) && this.direction !== 'down') validDirections.push('up');
            
            ({ newX, newY } = this.getFuturePosition('down'));
            if (!this.checkWallCollision(newX, newY) && this.direction !== 'up') validDirections.push('down');

            ({ newX, newY } = this.getFuturePosition('left'));
            if (!this.checkWallCollision(newX, newY) && this.direction !== 'right') validDirections.push('left');

            ({ newX, newY } = this.getFuturePosition('right'));
            if (!this.checkWallCollision(newX, newY) && this.direction !== 'left') validDirections.push('right');

            if (validDirections.length > 0) {
                // Simple AI: Try to move towards Pac-Man
                const dx = player.x - this.x;
                const dy = player.y - this.y;

                if (this.isFrightened) {
                    // Run away
                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (dx > 0 && validDirections.includes('left')) return 'left';
                        if (dx < 0 && validDirections.includes('right')) return 'right';
                    } else {
                        if (dy > 0 && validDirections.includes('up')) return 'up';
                        if (dy < 0 && validDirections.includes('down')) return 'down';
                    }
                } else {
                    // Chase
                    if (Math.abs(dx) > Math.abs(dy)) {
                        if (dx > 0 && validDirections.includes('right')) return 'right';
                        if (dx < 0 && validDirections.includes('left')) return 'left';
                    } else {
                        if (dy > 0 && validDirections.includes('down')) return 'down';
                        if (dy < 0 && validDirections.includes('up')) return 'up';
                    }
                }
                // Fallback to random
                return validDirections[Math.floor(Math.random() * validDirections.length)];
            }
            
            // If no other valid move, try turning around
            const oppositeDir = opposites[this.direction];
            if(oppositeDir) {
                ({ newX, newY } = this.getFuturePosition(oppositeDir));
                if (!this.checkWallCollision(newX, newY)) return oppositeDir;
            }

            return this.direction; // No other valid move
        }
        
        handleTunnel() {
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
        }
    }
    
    // --- Initialization ---
    function initializeGame() {
        score = 0;
        lives = 3;
        gameActive = true;
        pelletCount = 0;
        powerPelletTimer = 0;
        
        // Reset map
        for(let r = 0; r < MAP_ROWS; r++) {
            for(let c = 0; c < MAP_COLS; c++) {
                if (MAP[r][c] === 2) MAP[r][c] = 0; // Restore pellets
                if (MAP[r][c] === 0) pelletCount++;
                if (MAP[r][c] === 4) pelletCount++; // Restore power pellets
            }
        }
        
        scoreElement.textContent = '0';
        livesElement.textContent = '3';
        gameOverMessage.style.display = 'none';
        
        player = new Player(9, 16, 2.5);
        ghosts = [
            new Ghost(9, 10, 2, '#dc3545'),
            new Ghost(8, 10, 2, '#f59563'),
            new Ghost(10, 10, 2, '#00e5ff'),
            new Ghost(9, 9, 2, '#f65e3b')
        ];

        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');
        
        document.addEventListener('keydown', handleKeyDown);
        
        if (gameLoop) cancelAnimationFrame(gameLoop);
        gameLoop = requestAnimationFrame(main);
    }
    
    startButton.addEventListener('click', initializeGame);
    resetButton.addEventListener('click', initializeGame);

    // --- Main Game Loop ---
    function main() {
        if (!gameActive) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMap();
        
        player.update();
        player.draw();
        
        ghosts.forEach(ghost => {
            ghost.update();
            ghost.draw();
            checkGhostCollision(ghost);
        });
        
        updateUI();
        
        if (powerPelletTimer > 0) {
            powerPelletTimer--;
            if (powerPelletTimer === 0) {
                ghosts.forEach(g => g.isFrightened = false);
            }
        }
        
        if (pelletCount === 0) {
            endGame("You Win!");
        } else {
            gameLoop = requestAnimationFrame(main);
        }
    }
    
    // --- Drawing ---
    function drawMap() {
        for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
                const tile = MAP[r][c];
                if (tile === 1) { // Wall
                    ctx.fillStyle = '#3d5afe'; // Blue wall
                    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (tile === 0) { // Pellet
                    ctx.beginPath();
                    ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                    ctx.closePath();
                } else if (tile === 4) { // Power Pellet
                    ctx.beginPath();
                    ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, 6, 0, Math.PI * 2);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                    ctx.closePath();
                } else { // Empty or Ghost Home
                    ctx.fillStyle = '#0b0f19'; // Background
                    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
    
    function updateUI() {
        scoreElement.textContent = score;
        livesElement.textContent = lives;
    }

    // --- Game Logic ---
    function activatePowerPellet() {
        powerPelletTimer = 300; // 60fps * 5 seconds
        ghosts.forEach(g => g.isFrightened = true);
    }
    
    function checkGhostCollision(ghost) {
        const dx = player.x - ghost.x;
        const dy = player.y - ghost.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < player.radius + ghost.radius) {
            if (ghost.isFrightened) {
                // Eat ghost
                score += 200;
                ghost.x = 9 * TILE_SIZE + TILE_SIZE / 2; // Reset to home
                ghost.y = 10 * TILE_SIZE + TILE_SIZE / 2;
                ghost.isFrightened = false;
            } else {
                // Collide with ghost
                loseLife();
            }
        }
    }
    
    function loseLife() {
        lives--;
        gameActive = false; // Pause game
        
        if (lives === 0) {
            endGame("Game Over!");
        } else {
            setTimeout(() => {
                player = new Player(9, 16, 2.5); // Reset player
                ghosts.forEach(g => {
                    g.x = 9 * TILE_SIZE + TILE_SIZE / 2;
                    g.y = 10 * TILE_SIZE + TILE_SIZE / 2;
                });
                gameActive = true;
                gameLoop = requestAnimationFrame(main);
            }, 1000); // 1 second delay
        }
    }
    
    function endGame(message) {
        gameActive = false;
        cancelAnimationFrame(gameLoop);
        gameOverText.textContent = message;
        gameOverMessage.style.display = 'flex';
        document.removeEventListener('keydown', handleKeyDown);
        submitScore('pacman', score);
    }
    
    // --- Controls ---
    function handleKeyDown(e) {
        if (e.key === 'ArrowRight') player.nextDirection = 'right';
        else if (e.key === 'ArrowLeft') player.nextDirection = 'left';
        else if (e.key === 'ArrowUp') player.nextDirection = 'up';
        else if (e.key === 'ArrowDown') player.nextDirection = 'down';
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
                document.getElementById('user-info').innerHTML = `<strong>${result.username}</strong> | EXP: ${result.new_exp}`;
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }
});