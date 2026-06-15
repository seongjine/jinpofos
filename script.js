const logoBtn = document.getElementById("header");
const gameSection = document.getElementById("game-section");
const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");

if (logoBtn) {
    logoBtn.style.cursor = "pointer";
    logoBtn.addEventListener("dblclick", function(e) {
        e.preventDefault();
        
        if (gameSection.classList.contains("show")) {
            gameSection.classList.remove("show");
            setTimeout(() => { gameSection.style.display = "none"; }, 500);
            isGameOver = true; 
        } else {
            gameSection.style.display = "block";
            setTimeout(() => { 
                gameSection.classList.add("show"); 
                gameSection.scrollIntoView({ behavior: "smooth" });
            }, 10);
          
            resetGameVariables();
            isGameOver = true; // 💡 처음엔 움직이지 않게 멈춤
            if (startOverlay) startOverlay.style.display = "flex"; 
            initBricks();
            
            // 렌더링 엔진을 대기 상태로 구동하되 공은 움직이지 않게 처리
            // (이 구조여야 스타트 버튼을 눌렀을 때 엔진이 멈추지 않고 바로 이어집니다!)
            drawWaitingFrames();
        }
    });
}

// 🕹️ 스타트 버튼 클릭 이벤트 (이제 완벽하게 엔진이 작동합니다)
if (startBtn) {
    startBtn.addEventListener("click", function(e) {
        e.stopPropagation(); 
        if (startOverlay) startOverlay.style.display = "none"; 
        isGameOver = false; // 🔓 잠금 해제! 공이 움직이기 시작합니다.
    });
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const overlay = document.getElementById("game-overlay");
const overlayText = document.getElementById("overlay-text");
const restartBtn = document.getElementById("restart-btn");

let ballRadius = 6;
let x, y, dx, dy;
let paddleHeight = 8;
let paddleWidth = 75;
let paddleX;

let rightPressed = false;
let leftPressed = false;

let brickRowCount = 5;
let brickColumnCount = 7;
let brickWidth = 54;
let brickHeight = 14;
let brickPadding = 7;
let brickOffsetTop = 40;
let brickOffsetLeft = 30;

let score = 0;
let lives = 3;
let isGameOver = true; 
let bricks = [];

function resetGameVariables() {
    if (!canvas) return;
    x = canvas.width / 2;
    y = canvas.height - 30;
    
    // 공의 속도 2배 느리게 설정 (1.5)
    dx = 1.5; 
    dy = -1.5; 
    
    paddleX = (canvas.width - paddleWidth) / 2;
    score = 0;
    lives = 3;
    if (overlay) overlay.style.display = "none";
}

function initBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
if (restartBtn) restartBtn.addEventListener("click", restartGame);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
}
function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}
function mouseMoveHandler(e) {
    if (!canvas) return;
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    const scale = canvas.width / canvas.getBoundingClientRect().width;
    const canvasMouseX = relativeX * scale;
    if (canvasMouseX > 0 && canvasMouseX < canvas.width) {
        paddleX = canvasMouseX - paddleWidth / 2;
    }
}

function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c] ? bricks[c][r] : null;
            if (b && b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy; 
                    b.status = 0; 
                    score++;
                    if (score === brickRowCount * brickColumnCount) {
                        endGame(true);
                    }
                }
            }
        }
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ccccff";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight - 5, paddleWidth, paddleHeight);
    ctx.fillStyle = "#94a3b8";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    const rowColors = ["#475569", "#64748b", "#94a3b8", "#cbd5e1", "#ccccff"];
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c] && bricks[c][r] && bricks[c][r].status === 1) {
                let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = rowColors[r];
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawScoreAndLives() {
    ctx.font = "bold 12px sans-serif";
    ctx.fillStyle = "rgba(204, 204, 255, 0.7)";
    ctx.fillText("SCORE: " + score, 20, 22);
    ctx.fillText("LIVES: " + lives, canvas.width - 75, 22);
}

// 💡 버튼 누르기 전 대기 화면 상태를 부드럽게 유지하는 함수
function drawWaitingFrames() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScoreAndLives();
    
    // 스타트 버튼을 누르면 이 대기 함수를 종료하고 진짜 draw() 루프로 넘겨줍니다.
    if (!isGameOver) {
        draw();
        return;
    }
    
    // 버튼 누르기 전에도 패들을 마우스나 키보드로 움직일 수 있게 업데이트 유지
    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 4;
    else if (leftPressed && paddleX > 0) paddleX -= 4;

    requestAnimationFrame(drawWaitingFrames);
}

function draw() {
    if (isGameOver || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScoreAndLives();
    collisionDetection();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;
    else if (y + dy > canvas.height - ballRadius - 5) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            let hitPos = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
            dx = hitPos * 2; 
            dy = -dy;
        } else {
            lives--;
            if (!lives) {
                endGame(false);
            } else {
                x = canvas.width / 2;
                y = canvas.height - 30;
                dx = 1.5;
                dy = -1.5;
                paddleX = (canvas.width - paddleWidth) / 2;
            }
        }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 4;
    else if (leftPressed && paddleX > 0) paddleX -= 4;

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}

function endGame(isWin) {
    isGameOver = true;
    if (overlay && overlayText) {
        overlayText.textContent = isWin ? "STAGE CLEAR!" : "GAME OVER";
        overlay.style.display = "flex";
    }
}

// 🔄 재시작 시에도 다시 친절하게 스타트 창이 뜨도록 수정 완료!
function restartGame() {
    isGameOver = true; 
    resetGameVariables();
    initBricks();
    if (overlay) overlay.style.display = "none";
    if (startOverlay) startOverlay.style.display = "flex"; 
    drawWaitingFrames();
}
