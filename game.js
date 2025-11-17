// ---- Sounds ----
let jumpSfx = new Audio("assets/jump.mp3");
let flipSfx = new Audio("assets/flip.mp3");
let overSfx = new Audio("assets/over.mp3");          // when player hits obstacle
let bounceSfx = new Audio("assets/bounce.mp3");      // when player lands on wave

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ---- Background ----
let bg = new Image();
bg.src = "assets/background.png";

let bgX = 0;
let bgSpeed = 0.3;

// ---- Player ----
let playerImg = new Image();
playerImg.src = "assets/player.png";

let playerX = canvas.width / 4;
let playerY = 0;
let speed = 5;

let isJumping = false;
let jumpPower = 0;

// ---- Tricks / Combo ----
let doingTrick = false;
let trickAngle = 0;
let trickScore = 0;

let comboMultiplier = 1;
let comboTextTimer = 0;

// Effects
let trail = [];
let shakeTimer = 0;
let glowTimer = 0;

// ---- Wave ----
let t = 0;
let keys = {};

// ---- Obstacles ----
let obstacles = [];
let obstacleTimer = 0;

let score = 0;
let gameOver = false;

// INPUT
window.addEventListener("keydown", e => {
    keys[e.key] = true;

    if (e.key === " " && !isJumping && !gameOver) {
        isJumping = true;
        jumpPower = 18;
        jumpSfx.play();                // JUMP SOUND
    }

    // ---- TRICKS ----
    if (isJumping && !doingTrick) {
        if (e.key === "a") {     // Backflip
            doingTrick = true;
            trickScore = 20;
            comboMultiplier++;
            comboTextTimer = 30;
            flipSfx.play();       // FLIP SOUND
        }

        if (e.key === "d") {     // Frontflip
            doingTrick = true;
            trickScore = 25;
            comboMultiplier++;
            comboTextTimer = 30;
            flipSfx.play();       // FLIP SOUND
        }
    }
});

window.addEventListener("keyup", e => keys[e.key] = false);

// Restart click
canvas.addEventListener("click", () => {
    if (gameOver) restartGame();
});

// MAIN LOOP
function loop() {

    // ---- SCREEN SHAKE ----
    let shakeX = 0, shakeY = 0;
    if (shakeTimer > 0) {
        shakeX = Math.random() * 10 - 5;
        shakeY = Math.random() * 10 - 5;
        shakeTimer--;
    }

    ctx.setTransform(1, 0, 0, 1, shakeX, shakeY);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        drawBackground();
        drawWave();
        movePlayer();
        drawTrail();
        drawPlayer();
        handleObstacles();
        drawGlowBurst();
        drawUI();
    } else {
        drawGameOverScreen();
    }

    requestAnimationFrame(loop);
}

// BACKGROUND
function drawBackground() {
    bgX -= bgSpeed;
    if (bgX <= -canvas.width) bgX = 0;

    ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

// ---- WAVE ----
function drawWave() {
    ctx.beginPath();
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 4;

    let waveHeight = 140;
    let waveFreq = 0.008;
    let waveCenter = canvas.height / 2;

    for (let x = 0; x < canvas.width; x++) {
        let y = waveCenter + Math.sin((x * waveFreq) + t) * waveHeight;

        // LANDING SOUND
        if (!isJumping && x === Math.floor(playerX)) {
            if (playerY > y - 50) bounceSfx.play();
            playerY = y - 35;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    ctx.stroke();
    t += 0.05;
}

// ---- TRAIL EFFECT ----
function drawTrail() {
    trail.forEach((t, i) => {
        t.life--;

        ctx.globalAlpha = t.life / 20;
        ctx.fillStyle = t.color;

        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();

        if (t.life <= 0) trail.splice(i, 1);
    });

    ctx.globalAlpha = 1;
}

// ---- GLOW BURST ----
function drawGlowBurst() {
    if (glowTimer > 0) {
        ctx.beginPath();
        ctx.arc(playerX, playerY, 200 - glowTimer * 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,0," + glowTimer / 30 + ")";
        ctx.lineWidth = 8;
        ctx.stroke();
        glowTimer--;
    }
}

// ---- PLAYER ----
function drawPlayer() {
    ctx.save();

    if (doingTrick) {
        trickAngle += 15;

        // Add rainbow trail
        trail.push({
            x: playerX,
            y: playerY,
            size: 20,
            life: 20,
            color: "hsl(" + (trickAngle * 5 % 360) + ",100%,50%)"
        });

        ctx.translate(playerX, playerY);
        ctx.rotate((trickAngle * Math.PI) / 180);
        ctx.drawImage(playerImg, -32, -32, 64, 64);

        if (trickAngle >= 360) {
            doingTrick = false;
            trickAngle = 0;

            // Combo finish effect
            score += trickScore * comboMultiplier;
            shakeTimer = 20;
            glowTimer = 30;
        }

    } else {
        ctx.drawImage(playerImg, playerX - 32, playerY - 32, 64, 64);
    }

    ctx.restore();
}

function movePlayer() {
    if (keys["ArrowRight"]) playerX += speed;
    if (keys["ArrowLeft"]) playerX -= speed;

    if (isJumping) {
        playerY -= jumpPower;
        jumpPower -= 1;
        if (jumpPower < -10) isJumping = false;
    }

    playerX = Math.max(0, Math.min(canvas.width, playerX));
}

// ---- OBSTACLES ----
function handleObstacles() {
    obstacleTimer++;

    if (obstacleTimer > 200) {
        obstacles.push({
            x: canvas.width + 50,
            y: canvas.height / 2 + 30,
            width: 40,
            height: 40
        });
        obstacleTimer = 0;
    }

    obstacles.forEach((o, i) => {
        o.x -= 6;

        ctx.fillStyle = "red";
        ctx.fillRect(o.x, o.y, o.width, o.height);

        if (checkCollision(playerX - 32, playerY - 32, 64, 64, o.x, o.y, o.width, o.height)) {

            overSfx.play();           // GAME OVER SOUND

            gameOver = true;
        }

        if (o.x + o.width < 0) {
            obstacles.splice(i, 1);
            score++;
        }
    });
}

// COLLISION
function checkCollision(px, py, pw, ph, ox, oy, ow, oh) {
    return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
}

// ---- UI ----
function drawUI() {
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    // TITLE
    ctx.font = "48px Arial";
    ctx.fillText("🌊 Wave Rider 🌊", canvas.width / 2, 60);

    // SCORE
    ctx.font = "28px Arial";
    ctx.fillText("Score: " + score, canvas.width / 2, 110);

    // INSTRUCTIONS
    ctx.font = "20px Arial";
    ctx.fillText("← → Move | SPACE Jump | A Backflip | D Frontflip", canvas.width / 2, 150);

    // COMBO POPUP
    if (comboTextTimer > 0) {
        let scale = 1 + Math.sin(comboTextTimer * 0.2) * 0.3;

        ctx.save();
        ctx.translate(canvas.width / 2, 200);
        ctx.scale(scale, scale);

        ctx.font = "48px Arial";
        ctx.fillStyle = "#ffea00";
        ctx.fillText("🔥 COMBO x" + comboMultiplier + "!", 0, 0);

        ctx.restore();

        comboTextTimer--;
    }
}

// ---- GAME OVER ----
function drawGameOverScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = "30px Arial";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#00bfff";
    ctx.fillRect(canvas.width / 2 - 120, canvas.height / 2 + 40, 240, 60);

    ctx.fillStyle = "black";
    ctx.font = "30px Arial";
    ctx.fillText("Restart", canvas.width / 2, canvas.height / 2 + 80);
}

function restartGame() {
    gameOver = false;
    score = 0;
    obstacles = [];
    playerX = canvas.width / 4;
    t = 0;
    trickAngle = 0;
    comboMultiplier = 1;
}

loop();
