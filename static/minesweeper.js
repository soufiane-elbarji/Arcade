document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const boardElement = document.getElementById('minesweeper-board');
    const mineCountElement = document.getElementById('mine-count');
    const timerElement = document.getElementById('timer');
    const statusFaceElement = document.getElementById('game-status-face');
    
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');

    const gameOverMessage = document.getElementById('game-over-message');
    const gameOverText = document.getElementById('game-over-text');
    const resetButton = document.getElementById('reset-btn');

    // --- Game Settings ---
    const gameSettings = {
        'easy': { rows: 9, cols: 9, mines: 10, multiplier: 1 },
        'medium': { rows: 16, cols: 16, mines: 40, multiplier: 3 },
        'hard': { rows: 20, cols: 20, mines: 60, multiplier: 5 }
    };
    const cellSize = 30; // 30px

    // --- Game State Variables ---
    let board, rows, cols, mineCount, gameActive, timerInterval, timeElapsed;
    let flagsPlaced, revealedCellCount, firstClick;
    let currentDifficultyMultiplier;

    // --- Initialization ---
    startButton.addEventListener('click', initializeGame);
    resetButton.addEventListener('click', initializeGame);
    statusFaceElement.addEventListener('click', initializeGame); // Reset on face click

    function initializeGame() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        const settings = gameSettings[difficulty];
        
        rows = settings.rows;
        cols = settings.cols;
        mineCount = settings.mines;
        currentDifficultyMultiplier = settings.multiplier;

        gameActive = true;
        firstClick = true;
        flagsPlaced = 0;
        revealedCellCount = 0;
        timeElapsed = 0;

        // Reset UI
        mineCountElement.textContent = mineCount;
        timerElement.textContent = '0';
        statusFaceElement.textContent = '🙂';
        gameOverMessage.style.display = 'none';
        
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);

        // Hide options, show game
        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');

        // Create logical board
        board = createBoard(rows, cols);
        
        // Create visual board
        renderBoard();
    }

    // --- Board Creation ---
    function createBoard(rows, cols) {
        let newBoard = Array.from({ length: rows }, () => 
            Array.from({ length: cols }, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );
        return newBoard;
    }

    function placeMines(clickedRow, clickedCol) {
        let minesToPlace = mineCount;
        while (minesToPlace > 0) {
            let r = Math.floor(Math.random() * rows);
            let c = Math.floor(Math.random() * cols);

            // Ensure not a mine and not the first clicked cell
            if (!board[r][c].isMine && (r !== clickedRow || c !== clickedCol)) {
                board[r][c].isMine = true;
                minesToPlace--;
            }
        }
    }

    function calculateNeighbors() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].isMine) continue;
                let count = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const nr = r + i;
                        const nc = c + j;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                board[r][c].neighborMines = count;
            }
        }
    }

    // --- UI Rendering ---
    function renderBoard() {
        boardElement.innerHTML = ''; // Clear board
        boardElement.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        // boardElement.style.width = `${cols * cellSize}px`; // <-- REMOVE THIS LINE

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('mine-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                cell.addEventListener('click', handleLeftClick);
                cell.addEventListener('contextmenu', handleRightClick);
                
                boardElement.appendChild(cell);
            }
        }
    }

    function updateCellUI(r, c) {
        const cell = boardElement.children[r * cols + c];
        const cellData = board[r][c];

        if (cellData.isRevealed) {
            cell.classList.add('revealed');
            if (cellData.isMine) {
                cell.classList.add('mine');
                cell.textContent = '💣';
            } else if (cellData.neighborMines > 0) {
                cell.textContent = cellData.neighborMines;
                cell.dataset.mines = cellData.neighborMines;
            }
        } else if (cellData.isFlagged) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        } else {
            cell.classList.remove('flagged');
            cell.textContent = '';
        }
    }

    // --- Event Handlers ---
    function handleLeftClick(e) {
        if (!gameActive) return;
        
        const cell = e.target;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const cellData = board[r][c];
        
        if (cellData.isRevealed || cellData.isFlagged) return;

        // First Click Logic
        if (firstClick) {
            placeMines(r, c); // Place mines *after* first click
            calculateNeighbors();
            firstClick = false;
        }
        
        statusFaceElement.textContent = '😮';
        setTimeout(() => {
            if(gameActive) statusFaceElement.textContent = '🙂';
        }, 200);

        revealCell(r, c);
        
        if (gameActive) {
            checkWin();
        }
    }

    function handleRightClick(e) {
        e.preventDefault();
        if (!gameActive) return;

        const cell = e.target;
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        const cellData = board[r][c];

        if (cellData.isRevealed) return;

        cellData.isFlagged = !cellData.isFlagged;
        
        if (cellData.isFlagged) {
            flagsPlaced++;
        } else {
            flagsPlaced--;
        }
        
        mineCountElement.textContent = mineCount - flagsPlaced;
        updateCellUI(r, c);
    }

    // --- Game Logic ---
    function revealCell(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return; // Out of bounds
        
        const cellData = board[r][c];
        
        if (cellData.isRevealed || cellData.isFlagged) return; // Stop

        cellData.isRevealed = true;
        revealedCellCount++;
        updateCellUI(r, c);

        if (cellData.isMine) {
            endGame(false); // Lose
            return;
        }

        // If cell is empty (0 neighbors), reveal neighbors
        if (cellData.neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    revealCell(r + i, c + j);
                }
            }
        }
    }

    function updateTimer() {
        timeElapsed++;
        timerElement.textContent = timeElapsed;
    }

    // --- Win/Loss ---
    function checkWin() {
        if (revealedCellCount === (rows * cols) - mineCount) {
            endGame(true); // Win
        }
    }

    function endGame(isWin) {
        gameActive = false;
        clearInterval(timerInterval);
        
        if (isWin) {
            gameOverText.textContent = "You Win!";
            statusFaceElement.textContent = '😎';
            
            // Calculate score: (Difficulty Multiplier * 10000) / Time
            // Faster time = higher score
            let score = Math.floor((currentDifficultyMultiplier * 10000) / timeElapsed);
            if (timeElapsed === 0) score = currentDifficultyMultiplier * 10000; // Prevent divide by zero
            
            submitScore('minesweeper', score);
        
        } else {
            gameOverText.textContent = "Game Over!";
            statusFaceElement.textContent = '😵';
            
            // Reveal all mines
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c].isMine) {
                        board[r][c].isRevealed = true;
                        updateCellUI(r, c);
                    }
                }
            }
        }
        gameOverMessage.style.display = 'flex';
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