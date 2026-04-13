const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const gridSize = 20;
const tileCount = canvas.width / gridSize;
const REWARD_MILESTONE = 5;
let gameSpeed = 10; // FPS equivalent

// Game state
let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let tokens = 0;
let gameLoopTimeout;
let isPlaying = false;
let isGameOver = false;

// DOM Elements
const scoreElement = document.getElementById('score');
const tokensElement = document.getElementById('tokens');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverMessage = document.getElementById('gameOverMessage');
const finalScoreElement = document.getElementById('finalScore');
const rewardMessage = document.getElementById('rewardMessage');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// Web3 UI
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletInfo = document.getElementById('walletInfo');
const walletAddress = document.getElementById('walletAddress');
let userAddress = null;

// Audio context (optional enhancement)
// let eatSound = ...

// Initialize game
function initGame() {
    snake = [
        { x: Math.floor(tileCount/2), y: Math.floor(tileCount/2) }
    ];
    dx = 0;
    dy = 0;
    score = 0;
    updateScore();
    placeFood();
    isGameOver = false;
    gameOverMessage.classList.add('hidden');
}

// Start Game
function startGame() {
    if (isPlaying) return;
    initGame();
    isPlaying = true;
    startBtn.classList.add('hidden');
    gameLoop();
}

// Game Loop
function gameLoop() {
    if (isGameOver) return;
    
    setTimeout(() => {
        if (!isGameOver) {
            clearCanvas();
            moveSnake();
            checkCollision();
            drawFood();
            drawSnake();
            gameLoop();
        }
    }, 1000 / gameSpeed);
}

// Canvas Drawings
function clearCanvas() {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    snake.forEach((segment, index) => {
        // Head gets a slightly different color or gradient
        if (index === 0) {
            ctx.fillStyle = '#34d399'; // Snake head color
        } else {
            ctx.fillStyle = '#10b981'; // Snake body color
        }
        
        ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
}

function drawFood() {
    ctx.fillStyle = '#ef4444';
    // Draw food with a bit of rounding style or a simple rect
    ctx.beginPath();
    let x = food.x * gridSize + gridSize/2;
    let y = food.y * gridSize + gridSize/2;
    ctx.arc(x, y, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function moveSnake() {
    if (dx === 0 && dy === 0) return; // Haven't started moving yet
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        placeFood();
        checkReward();
    } else {
        snake.pop(); // Remove tail if no food eaten
    }
}

function placeFood() {
    let newFoodPos;
    let isValid = false;
    while (!isValid) {
        newFoodPos = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Ensure food isn't placed on snake
        isValid = true;
        for (let segment of snake) {
            if (segment.x === newFoodPos.x && segment.y === newFoodPos.y) {
                isValid = false;
                break;
            }
        }
    }
    food = newFoodPos;
}

function checkCollision() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        handleGameOver();
        return;
    }
    
    // Self collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            handleGameOver();
            return;
        }
    }
}

function handleGameOver() {
    isGameOver = true;
    isPlaying = false;
    finalScoreElement.innerText = score;
    gameOverMessage.classList.remove('hidden');
    startBtn.classList.remove('hidden');
    startBtn.innerText = "Play Again";
}

function updateScore() {
    scoreElement.innerText = score;
}

// Reward Logic
function checkReward() {
    if (score > 0 && score % REWARD_MILESTONE === 0) {
        // Issue reward
        let rewardTokens = REWARD_MILESTONE;
        tokens += rewardTokens;
        tokensElement.innerText = tokens;
        
        // Show notification
        rewardMessage.innerText = `You earned ${rewardTokens} tokens!`;
        rewardMessage.classList.remove('hidden');
        
        // Hide after 2 seconds
        setTimeout(() => {
            rewardMessage.classList.add('hidden');
        }, 2000);
    }
}

// Input Handling
window.addEventListener('keydown', e => {
    // Prevent default scrolling for arrow keys
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    
    // Make sure we don't reverse directly
    switch(e.key) {
        case 'ArrowUp':
            if (dy === 1 && snake.length > 1) break;
            dx = 0; dy = -1;
            break;
        case 'ArrowDown':
            if (dy === -1 && snake.length > 1) break;
            dx = 0; dy = 1;
            break;
        case 'ArrowLeft':
            if (dx === 1 && snake.length > 1) break;
            dx = -1; dy = 0;
            break;
        case 'ArrowRight':
            if (dx === -1 && snake.length > 1) break;
            dx = 1; dy = 0;
            break;
    }
});

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
speedSlider.addEventListener('input', (e) => {
    gameSpeed = parseFloat(e.target.value);
    speedValue.innerText = gameSpeed;
});

// Web3 Wallet Connection (MetaMask)
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            
            // Format address (e.g. 0x1234...5678)
            const formattedAddress = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
            
            // Update UI
            walletAddress.innerText = formattedAddress;
            walletInfo.classList.remove('hidden');
            connectWalletBtn.classList.add('hidden');
            
            console.log("Wallet connected:", userAddress);
        } catch (error) {
            console.error("User denied account access or error occurred:", error);
            alert("Failed to connect wallet.");
        }
    } else {
        alert("MetaMask is not installed. Please install it to use Web3 features!");
    }
}

connectWalletBtn.addEventListener('click', connectWallet);

// Initial setup
initGame();
