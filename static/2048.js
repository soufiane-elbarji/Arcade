document.addEventListener('DOMContentLoaded', () => {
    const gridElement = document.getElementById('game-board-2048');
    const scoreElement = document.getElementById('score');
    const gameOverMessage = document.getElementById('game-over-message');
    const resetButton = document.getElementById('reset-btn');

    // --- NEW: Add selectors for options/game area ---
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');
    
    let grid = Array(4).fill(null).map(() => Array(4).fill(0));
    let score = 0;
    let gameActive = true;
    const gridSize = 4;

    // --- Game Initialization ---
    function initializeGame() {
        grid = Array(4).fill(null).map(() => Array(4).fill(0));
        score = 0;
        gameActive = true;
        
        scoreElement.textContent = '0';
        gameOverMessage.style.display = 'none';
        
        // --- NEW: Hide options, show game area ---
        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');

        addNewTile();
        addNewTile();
        updateGridUI();
    }

    // --- UI Update ---
    function updateGridUI() {
        gridElement.innerHTML = ''; // Clear board
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                const value = grid[r][c];
                tile.dataset.value = value;
                tile.textContent = value > 0 ? value : '';
                gridElement.appendChild(tile);
            }
        }
    }

    // --- Game Logic ---
    function addNewTile() {
        let emptyTiles = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    emptyTiles.push({ r, c });
                }
            }
        }

        if (emptyTiles.length > 0) {
            const { r, c } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            // 90% chance of 2, 10% chance of 4
            grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }
    
    // --- Move Handling ---
    document.addEventListener('keydown', (e) => {
        // --- UPDATED: Check if gameArea is active before handling keys ---
        if (!gameActive || !gameArea.classList.contains('active')) return;
        
        let moved = false;
        switch (e.key) {
            case 'ArrowUp':
                moved = moveUp();
                break;
            case 'ArrowDown':
                moved = moveDown();
                break;
            case 'ArrowLeft':
                moved = moveLeft();
                break;
            case 'ArrowRight':
                moved = moveRight();
                break;
            default:
                return; // Ignore other keys
        }

        if (moved) {
            addNewTile();
            updateGridUI();
            scoreElement.textContent = score;
            
            if (isGameOver()) {
                gameActive = false;
                gameOverMessage.style.display = 'flex';
                submitScore('2048', score);
            }
        }
    });
    
    resetButton.addEventListener('click', initializeGame);

    // --- NEW: Add start button listener ---
    startButton.addEventListener('click', initializeGame);


    // --- Move Logic (L/R/U/D) ---
    // These functions slide, merge, and slide again
    
    function moveLeft() {
        let moved = false;
        for (let r = 0; r < gridSize; r++) {
            let row = grid[r];
            let originalRow = [...row]; // Copy original
            
            // 1. Slide non-zero tiles
            let newRow = row.filter(val => val !== 0);
            // 2. Merge
            for (let c = 0; c < newRow.length - 1; c++) {
                if (newRow[c] === newRow[c+1]) {
                    newRow[c] *= 2;
                    score += newRow[c];
                    newRow.splice(c + 1, 1); // Remove merged tile
                }
            }
            // 3. Fill with zeros
            while (newRow.length < gridSize) {
                newRow.push(0);
            }
            grid[r] = newRow;
            
            // Check if anything actually changed
            if (originalRow.join(',') !== newRow.join(',')) {
                moved = true;
            }
        }
        return moved;
    }

    function moveRight() {
        let moved = false;
        for (let r = 0; r < gridSize; r++) {
            let row = grid[r];
            let originalRow = [...row];
            
            // 1. Slide non-zero tiles
            let newRow = row.filter(val => val !== 0);
            // 2. Merge (from right to left)
            for (let c = newRow.length - 1; c > 0; c--) {
                if (newRow[c] === newRow[c-1]) {
                    newRow[c] *= 2;
                    score += newRow[c];
                    newRow.splice(c - 1, 1);
                }
            }
            // 3. Fill with zeros (on the left)
            while (newRow.length < gridSize) {
                newRow.unshift(0);
            }
            grid[r] = newRow;
            
            if (originalRow.join(',') !== newRow.join(',')) {
                moved = true;
            }
        }
        return moved;
    }

    function moveUp() {
        // Transpose grid, move left, then transpose back
        grid = transpose(grid);
        let moved = moveLeft();
        grid = transpose(grid);
        return moved;
    }
    
    function moveDown() {
        // Transpose grid, move right, then transpose back
        grid = transpose(grid);
        let moved = moveRight();
        grid = transpose(grid);
        return moved;
    }

    function transpose(matrix) {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }
    
    // --- Game Over Check ---
    function isGameOver() {
        // Check for empty cells
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === 0) {
                    return false; // Not over
                }
            }
        }
        // Check for possible merges
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // Check right
                if (c < gridSize - 1 && grid[r][c] === grid[r][c+1]) {
                    return false;
                }
                // Check down
                if (r < gridSize - 1 && grid[r][c] === grid[r+1][c]) {
                    return false;
                }
            }
        }
        return true; // No moves left
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