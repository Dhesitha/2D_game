// Game Elements
var player = document.getElementById("player");
var background = document.getElementById("background");
var scoreElement = document.getElementById("score");
var highScoreElement = document.getElementById("highScore"); // අලුත්
var finalHighScoreElement = document.getElementById("finalHighScore"); // අලුත්
var instructions = document.getElementById("instructions");
var endscreen = document.getElementById("endscreen");
var endScore = document.getElementById("endScore");

// Audio Handling
var runSound = new Audio("run.mp3"); runSound.loop = true;
var jumpSound = new Audio("jump.mp3");
var deadSound = new Audio("dead.mp3");

// High Score Variable (localStorage වලින් ගන්නවා)
var highScore = localStorage.getItem("gameHighScore") || 0;
highScoreElement.textContent = highScore;

// Game State
var game = {
    running: false,
    jumping: false,
    dead: false,
    score: 0,
    backgroundX: 0,
    playerHeight: 0,
    velocity: 0,
    blocks: [],
    animationFrame: 1,
    lastTime: 0,
    blockId: 1
};

var settings = {
    gravity: 0,
    jumpPower: 0,
    gameSpeed: 0,
    blockSpeed: 0
};

// 1. Responsive Physics
function setGameConstants() {
    var h = window.innerHeight;
    var w = window.innerWidth;
    
    settings.gravity = h * 0.002;
    settings.jumpPower = h * 0.035;
    settings.gameSpeed = w * 0.006;
    settings.blockSpeed = w * 0.009;
}

window.addEventListener('resize', setGameConstants);
setGameConstants();

// 2. Key Inputs
window.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        if (!game.running && !game.dead) startGame();
        else if (game.dead) reload();
    }
    if (event.code === "Space") {
        if (game.running && !game.jumping) jump();
    }
});

// 3. Start Game
function startGame() {
    game.running = true;
    game.dead = false;
    game.jumping = false;
    game.score = 0;
    game.playerHeight = 0;
    game.velocity = 0;
    game.blocks = [];
    game.blockId = 1;

    scoreElement.textContent = "0";
    // පරණ High Score එක පෙන්වන්න
    highScoreElement.textContent = highScore; 
    
    instructions.style.display = "none";
    endscreen.style.visibility = "hidden";
    player.style.transform = "translateY(0px)";

    document.querySelectorAll('.block').forEach(b => b.remove());

    runSound.play().catch(e => {});

    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    setTimeout(createBlock, 2000);
}

// 4. Jump
function jump() {
    if (game.jumping) return;
    
    game.jumping = true;
    game.velocity = settings.jumpPower;
    player.src = "Jump (1).png";
    
    runSound.pause();
    jumpSound.play().catch(e => {});
}

// 5. Create Block
function createBlock() {
    if (!game.running || game.dead) return;

    var block = document.createElement("div");
    block.className = "block";
    block.id = "block" + game.blockId++;
    block.style.left = window.innerWidth + "px";
    
    background.appendChild(block);
    game.blocks.push({
        element: block,
        x: window.innerWidth
    });

    var delay = Math.random() * 1500 + 1000;
    setTimeout(createBlock, delay);
}

// 6. Main Loop
function gameLoop(currentTime) {
    if (!game.running && !game.dead) return;

    var deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    if (game.running && !game.dead) {
        updatePhysics();
        updateBackground();
        updateBlocks();
        updateScore();
        checkCollisions();
    }

    updateAnimation();

    if (game.running || game.dead) {
        requestAnimationFrame(gameLoop);
    }
}

// 7. Updates
function updatePhysics() {
    if (game.jumping || game.playerHeight > 0) {
        game.playerHeight += game.velocity;
        game.velocity -= settings.gravity;

        if (game.playerHeight <= 0) {
            game.playerHeight = 0;
            game.velocity = 0;
            game.jumping = false;
            
            if (game.running) {
                runSound.play().catch(e => {});
                player.src = "Run (1).png";
            }
        }
        
        player.style.transform = `translateY(${-game.playerHeight}px)`;
    }
}

function updateBackground() {
    game.backgroundX -= settings.gameSpeed;
    background.style.backgroundPositionX = game.backgroundX + "px";
}

function updateBlocks() {
    game.blocks = game.blocks.filter(blockData => {
        blockData.x -= settings.blockSpeed;
        blockData.element.style.left = blockData.x + "px";
        
        if (blockData.x < -100) {
            blockData.element.remove();
            return false;
        }
        return true;
    });
}

function updateScore() {
    game.score += 0.2;
    var currentScore = Math.floor(game.score);
    scoreElement.textContent = currentScore;
    
    // ගේම් එක යන අතරතුර High Score එක කැඩුවොත් ඒ වෙලාවෙම අප්ඩේට් කරන්න
    if (currentScore > highScore) {
        highScore = currentScore;
        highScoreElement.textContent = highScore;
        // අලුත් High Score එක LocalStorage එකට දාන්න
        localStorage.setItem("gameHighScore", highScore);
    }
}

function checkCollisions() {
    var playerRect = player.getBoundingClientRect();
    
    game.blocks.forEach(blockData => {
        var blockRect = blockData.element.getBoundingClientRect();
        var margin = 25; 

        if (playerRect.right - margin > blockRect.left + margin && 
            playerRect.left + margin < blockRect.right - margin && 
            playerRect.bottom - margin > blockRect.top + margin && 
            playerRect.top + margin < blockRect.bottom - margin) {
            gameOver();
        }
    });
}

// 8. Animation
var animationCounter = 0;
function updateAnimation() {
    animationCounter++;
    
    if (game.jumping) {
        if (animationCounter % 8 === 0) {
             game.animationFrame++;
             if (game.animationFrame > 10) game.animationFrame = 1;
             player.src = `Jump (${game.animationFrame}).png`;
        }
        return;
    }

    if (animationCounter % 5 === 0) { 
        if (game.dead) {
             if (game.animationFrame < 10) {
                 game.animationFrame++;
                 player.src = `Dead (${game.animationFrame}).png`;
             } else {
                 endGame();
             }
        } else if (game.running) {
            game.animationFrame++;
            if (game.animationFrame > 10) game.animationFrame = 1;
            player.src = `Run (${game.animationFrame}).png`;
        }
    }
}

function gameOver() {
    if(game.dead) return;
    game.running = false;
    game.dead = true;
    game.animationFrame = 1;
    
    runSound.pause();
    deadSound.play().catch(e => {});
}

function endGame() {
    var finalScore = Math.floor(game.score);
    endScore.textContent = finalScore;
    
    // අවසාන Screen එකේදීත් High Score එක පෙන්වන්න
    finalHighScoreElement.textContent = highScore;

    endscreen.style.visibility = "visible";
}

function reload() {
    location.reload();
}