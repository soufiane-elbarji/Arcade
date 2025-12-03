document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('next-piece-canvas');
    const nextCtx = nextCanvas.getContext('2d');
    
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const levelElement = document.getElementById('level');
    const gameOverMessage = document.getElementById('game-over-message');
    const resetButton = document.getElementById('reset-btn');

    // --- Game Constants ---
    const ROWS = 20;
    const COLS = 10;
    const BLOCK_SIZE = 30; // 30px per block
    const NEXT_BLOCK_SIZE = 30;

    // --- Piece Colors and Shapes ---
    const COLORS = [
        null,       // 0 - Empty
        '#00e5ff',  // I (Cyan)
        '#f59563',  // J (Orange) - Using Breakout color
        '#3d5afe',  // L (Blue)
        '#f2b179',  // O (Yellow) - Using Breakout color
        '#198754',  // S (Green) - Using Finance color
        '#f65e3b',  // T (Purple/Red) - Using Breakout color
        '#dc3545'   // Z (Red)
    ];

    const SHAPES = [
        [], // Empty
        [[1, 1, 1, 1]], // I
        [[1, 0, 0], [1, 1, 1]], // J
        [[0, 0, 1], [1, 1, 1]], // L
        [[1, 1], [1, 1]], // O
        [[0, 1, 1], [1, 1, 0]], // S
        [[0, 1, 0], [1, 1, 1]], // T
        [[1, 1, 0], [0, 1, 1]]  // Z
    ];

    // --- Game State Variables ---
    let board, currentPiece, nextPiece, score, lines, level, gameActive, gameLoop;
    let dropCounter, dropInterval;

    // --- Initialization ---
    function initializeGame() {
        // Setup game board (2D array)
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        
        score = 0;
        lines = 0;
        level = 1;
        gameActive = true;
        dropCounter = 0;
        dropInterval = 1000; // 1 second per drop

        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level;
        gameOverMessage.style.display = 'none';
        
        // Hide options, show game
        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');

        // Start game
        nextPiece = getRandomPiece();
        currentPiece = getRandomPiece();
        draw();
        
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(update, dropInterval);
    }
    
    startButton.addEventListener('click', initializeGame);
    resetButton.addEventListener('click', initializeGame);

    // --- Core Game Loop ---
    function update() {
        if (!gameActive) return;
        
        if (movePiece(0, 1)) {
            // Piece moved down
        } else {
            // Piece landed
            placePiece();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = getRandomPiece();
            
            if (!isValid(currentPiece)) {
                // Game Over
                endGame();
            }
        }
        draw();
    }
    
    // --- Drawing Functions ---
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();
        drawPiece(currentPiece, ctx);
        drawNextPiece();
    }

    function drawBlock(x, y, color, context) {
        context.fillStyle = color;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.strokeStyle = '#0b0f19'; // Background color for border
        context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }

    function drawBoard() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c] > 0) {
                    drawBlock(c, r, COLORS[board[r][c]], ctx);
                }
            }
        }
    }

    function drawPiece(piece, context) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    drawBlock(piece.x + x, piece.y + y, COLORS[piece.typeId], context);
                }
            });
        });
    }

    function drawNextPiece() {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
        // Center the piece in the next box
        const piece = nextPiece;
        const xOffset = (nextCanvas.width / BLOCK_SIZE - piece.shape[0].length) / 2;
        const yOffset = (nextCanvas.height / BLOCK_SIZE - piece.shape.length) / 2;

        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    drawBlock(x + xOffset, y + yOffset, COLORS[piece.typeId], nextCtx);
                }
            });
        });
    }

    // --- Piece Generation ---
    function getRandomPiece() {
        const typeId = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
        const shape = SHAPES[typeId];
        return {
            x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
            y: 0,
            shape: shape,
            typeId: typeId
        };
    }
    
    // --- Game Logic ---
    function movePiece(x, y) {
        const testPiece = { ...currentPiece, x: currentPiece.x + x, y: currentPiece.y + y };
        if (isValid(testPiece)) {
            currentPiece = testPiece;
            return true;
        }
        return false;
    }
    
    function rotatePiece() {
        // Transpose and reverse rows to rotate
        const shape = currentPiece.shape;
        let newShape = shape[0].map((_, i) => shape.map(row => row[i])).reverse();
        
        const testPiece = { ...currentPiece, shape: newShape };
        
        // Wall kick logic
        let kickOffset = 0;
        if (!isValid(testPiece)) {
            if (testPiece.x < COLS / 2) { // Left side
                kickOffset = 1;
            } else { // Right side
                kickOffset = -1;
            }
        }
        
        testPiece.x += kickOffset;
        if (isValid(testPiece)) {
            currentPiece = testPiece;
        } else {
            testPiece.x -= kickOffset; // Reset x
            // Try kicking 2 spaces (for I-piece)
            testPiece.x += (kickOffset * 2);
            if (isValid(testPiece)) {
                currentPiece = testPiece;
            }
        }
    }
    
    function hardDrop() {
        while (movePiece(0, 1)) {
            // Keep moving down
        }
        update(); // Trigger the land/place logic
    }
    
    function isValid(piece) {
        for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r].length; c++) {
                if (piece.shape[r][c] > 0) {
                    let newX = piece.x + c;
                    let newY = piece.y + r;
                    // Check wall collision
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }
                    // Check floor or existing block collision
                    if (newY < 0 || (board[newY] && board[newY][newX] > 0)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    function placePiece() {
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    board[currentPiece.y + y][currentPiece.x + x] = currentPiece.typeId;
                }
            });
        });
    }
    
    function clearLines() {
        let linesCleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r].every(cell => cell > 0)) {
                // Full row
                linesCleared++;
                board.splice(r, 1); // Remove row
                board.unshift(Array(COLS).fill(0)); // Add empty row at top
                r++; // Re-check the same row index
            }
        }
        
        // Update score and level
        if (linesCleared > 0) {
            const linePoints = [0, 100, 300, 500, 800]; // 1, 2, 3, 4 lines
            score += linePoints[linesCleared] * level;
            lines += linesCleared;
            
            // Check for level up (every 10 lines)
            let newLevel = Math.floor(lines / 10) + 1;
            if (newLevel > level) {
                level = newLevel;
                // Speed up game
                dropInterval = 1000 / level; // Simple speed up
                clearInterval(gameLoop);
                gameLoop = setInterval(update, dropInterval);
            }
            
            scoreElement.textContent = score;
            linesElement.textContent = lines;
            levelElement.textContent = level;
        }
    }
    
    function endGame() {
        gameActive = false;
        clearInterval(gameLoop);
        gameOverMessage.style.display = 'flex';
        submitScore('tetris', score);
    }

    // --- Controls ---
    document.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        
        if (e.key === 'ArrowLeft') {
            movePiece(-1, 0);
        } else if (e.key === 'ArrowRight') {
            movePiece(1, 0);
        } else if (e.key === 'ArrowDown') {
            // Soft drop
            if (movePiece(0, 1)) {
                score += 1; // Bonus for soft drop
                scoreElement.textContent = score;
            }
        } else if (e.key === 'ArrowUp') {
            // Rotate
            rotatePiece();
        } else if (e.key === ' ') {
            e.preventDefault(); // Stop page from scrolling
            hardDrop();
        }
        draw(); // Re-draw immediately on key press
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
                document.getElementById('user-info').innerHTML = `<strong>${result.username}</strong> | EXP: ${result.new_exp}`;
            }
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }
});
