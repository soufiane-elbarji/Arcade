document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('tictactoe-board');
    const statusMessage = document.getElementById('status-message');
    const resetButton = document.getElementById('reset-btn');
    
    const startButton = document.getElementById('start-game-btn');
    const optionsPanel = document.getElementById('game-options');
    const gameArea = document.getElementById('game-area');

    let board;
    const player = 'X'; // Human
    const bot = 'O';    // AI
    let gameActive;
    let gameMode; // 'bot' or 'friend'
    let currentPlayer; // 'X' or 'O' for friend mode

    // --- Game Initialization ---
    startButton.addEventListener('click', () => {
        gameMode = document.querySelector('input[name="game-mode"]:checked').value;
        
        optionsPanel.style.display = 'none';
        gameArea.classList.add('active');
        initializeGame();
    });

    function initializeGame() {
        board = Array(9).fill(null);
        gameActive = true;
        currentPlayer = 'X';
        
        if (gameMode === 'bot') {
            statusMessage.textContent = 'Your turn (X)';
        } else {
            statusMessage.textContent = "X's Turn";
        }

        resetButton.style.display = 'none';
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }

    // --- Game Logic ---
    function handleCellClick(e) {
        const index = e.target.dataset.index;

        // This check now prevents clicks if board is locked
        if (board[index] || !gameActive) {
            return;
        }

        if (gameMode === 'bot') {
            // --- Bot Mode Logic ---
            makeMove(index, player); // Player's move
            
            gameActive = false; // Lock the board during bot's turn
            
            if (checkEndCondition(player)) {
                endGame(player);
                return;
            }
            
            statusMessage.textContent = "Bot is thinking...";
            setTimeout(botMove, 500); // Board is locked during this timeout
        } else {
            // --- Friend Mode Logic ---
            makeMove(index, currentPlayer);
            if (checkEndCondition(currentPlayer)) {
                endGame(currentPlayer);
                return;
            }
            currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
            statusMessage.textContent = `${currentPlayer}'s Turn`;
        }
    }

    function makeMove(index, marker) {
        board[index] = marker;
        const cell = boardElement.children[index];
        cell.textContent = marker;
        cell.style.color = marker === 'X' ? '#00e5ff' : '#ff3b30';
    }

    // --- Bot AI ---
    function botMove() {
        // Minimax logic to find bestMove...
        const bestMove = minimax(board, bot).index;

        makeMove(bestMove, bot);

        if (checkEndCondition(bot)) {
            endGame(bot);
            return; // Game is over, board remains locked
        }
        
        statusMessage.textContent = 'Your turn (X)';
        
        gameActive = true; // Unlock the board for player's turn
    }

    function checkEndCondition(marker) {
        if (checkWinnerLogic(board, marker)) {
            return true;
        }
        if (findAvailableSpots(board).length === 0) {
            return true; // Draw
        }
        return false;
    }

    // --- Minimax Helper Functions ---
    function findAvailableSpots(currentBoard) {
        return currentBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    }

    function checkWinnerLogic(currentBoard, marker) {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]  // Diagonals
        ];
        return winConditions.some(combination => {
            return combination.every(index => currentBoard[index] === marker);
        });
    }

    // The Minimax Algorithm
    function minimax(newBoard, currentMarker) {
        // Find all available spots
        const availSpots = findAvailableSpots(newBoard);

        // Check for terminal states (win, lose, draw)
        if (checkWinnerLogic(newBoard, player)) {
            return { score: -10 };
        } else if (checkWinnerLogic(newBoard, bot)) {
            return { score: 10 };
        } else if (availSpots.length === 0) {
            return { score: 0 };
        }

        // Collect all possible moves
        const moves = [];
        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];
            newBoard[availSpots[i]] = currentMarker;

            if (currentMarker === bot) {
                const result = minimax(newBoard, player);
                move.score = result.score;
            } else {
                const result = minimax(newBoard, bot);
                move.score = result.score;
            }

            // Reset the spot to null for the next iteration
            newBoard[availSpots[i]] = null;
            moves.push(move);
        }

        // Find the best move
        let bestMove;
        if (currentMarker === bot) {
            // Maximize the score
            let bestScore = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            // Minimize the score
            let bestScore = Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    }

    // --- End Game Handling ---
    function endGame(winner) {
        gameActive = false; // Board stays locked
        resetButton.style.display = 'block';

        if (checkWinnerLogic(board, winner)) {
            statusMessage.textContent = `${winner} Wins!`;
            if (gameMode === 'bot' && winner === player) {
                submitScore('tictactoe', 1);
            }
        } else {
            // This is a draw
            statusMessage.textContent = "It's a Draw!";
        }
        
        if (gameMode === 'bot' && !checkWinnerLogic(board, player)) {
            submitScore('tictactoe', 0);
        }
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

    // --- Event Listeners ---
    resetButton.addEventListener('click', () => {
        initializeGame();
    });
});
