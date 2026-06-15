// 1️⃣ [필수] 전역 변수 및 게임 상태 변수들을 최상단으로 이동 (선언 순서 오류 해결)
const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const overlay = document.getElementById("game-overlay");
const overlayText = document.getElementById("overlay-text");
const restartBtn = document.getElementById("restart-btn");

const logoBtn = document.getElementById("header");
const gameSection = document.getElementById("game-section");
const startOverlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");

// 0: 시작 전 대기(패들 조작 가능), 1: 플레이 중, 2: 게임오버/클리어
let gameState = 0; 
let isGameOver = true; // 게임 루프 실행 제어 변수

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
let bricks = [];

// 2️⃣ 로고(JIN POFO) 더블클릭 시 게임창을 열고 닫는 토글 제어
if (logoBtn && gameSection) {
    logoBtn.style.cursor = "pointer";
    logoBtn.addEventListener("dblclick", function(e) {
        e.preventDefault();
        
        if (gameSection.classList.contains("show")) {
            // 게임창 닫기
            gameSection.classList.remove("show");
            setTimeout(() => { gameSection.style.display = "none"; }, 500);
            isGameOver = true; 
        } else {
            // 게임창 열기
            gameSection.style.display = "block";
            setTimeout(() => { 
                gameSection.classList.add("show"); 
                gameSection.scrollIntoView({ behavior: "smooth" });
            }, 10);
            
            // 데이터 초기화 및 루프 엔진 가동
            resetGameVariables();
            gameState = 0; 
            isGameOver = false; 
            if (startOverlay) startOverlay.style.display = "flex"; 
            initBricks();
            draw(); // 통합 렌더링 루프 시작
        }
    });
}

// 3️⃣ 스타트 버튼 이벤트 (클릭 시 안전하게 gameState만 플레이 상태로 전환)
if (startBtn) {
    startBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation(); 
        if (startOverlay) startOverlay.style.display = "none"; 
        gameState = 1; // 플레이 상태로 변경 -> 이제 공이 움직입니다!
    });
}

function resetGameVariables() {
    if (!canvas) return;
    x = canvas.width / 2;
    y = canvas.height - 30;
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

// 키보드 및 마우스 이벤트 리스너 등록
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
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    if (relativeX >= 0 && relativeX <= rect.width && relativeY >= 0 && relativeY <= rect.height) {
        const scale = canvas.width / rect.width;
        const canvasMouseX = relativeX * scale;
        paddleX = canvasMouseX - paddleWidth / 2;
        
        if (paddleX < 0) paddleX = 0;
        else if (paddleX > canvas.width - paddleWidth) paddleX = canvas.width - paddleWidth;
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

// 🔄 단 하나의 통합 엔진 루프
function draw() {
    if (isGameOver || !ctx) return;
    
    // 상태에 상관없이 배경 오브젝트들은 실시간으로 렌더링 유지
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScoreAndLives();

    // 대기 상태(0)든 플레이 상태(1)든 패들은 항상 키보드로 움직일 수 있음
    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 4;
    else if (leftPressed && paddleX > 0) paddleX -= 4;

    // 🎯 오직 gameState가 1(플레이 상태)일 때만 공의 물리 연산 수행
    if (gameState === 1) {
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

        x += dx;
        y += dy;
    }

    // gameState가 2(종료)가 아니라면 프레임 루프를 끊지 않고 순환
    if (gameState !== 2) {
        requestAnimationFrame(draw);
    }
}

function endGame(isWin) {
    gameState = 2;
    isGameOver = true;
    if (overlay && overlayText) {
        overlayText.textContent = isWin ? "STAGE CLEAR!" : "GAME OVER";
        overlay.style.display = "flex";
    }
}

function restartGame() {
    resetGameVariables();
    initBricks();
    if (overlay) overlay.style.display = "none";
    if (startOverlay) startOverlay.style.display = "flex"; 
    
    gameState = 0;
    isGameOver = false; 
    draw();
}
