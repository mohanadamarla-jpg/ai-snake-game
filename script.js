const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gridSize = 20;
let tileCount = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let dx = 1, dy = 0;
let score = 0;
let obstacles = [];

// Main game loop to update and render game
function gameLoop() {
  moveSnake();
  drawGame();
}

// Move snake based on current direction
function moveSnake() {
  if (!snake || snake.length === 0) return;

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);
  checkObstacleCollision(head);
  checkCollision(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById("score").innerText = score;
    spawnFood();
  } else {
    snake.pop();
  }
}

function spawnFood() {
  food = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };
}

function drawGame() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // snake
  ctx.fillStyle = "lime";
  snake.forEach(s => {
    ctx.fillRect(s.x * gridSize, s.y * gridSize, gridSize, gridSize);
  });

  // food
  ctx.fillStyle = "red";
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);

  // obstacles
  ctx.fillStyle = "gray";
  obstacles.forEach(o => {
    ctx.fillRect(o.x * gridSize, o.y * gridSize, gridSize, gridSize);
  });
}

function checkObstacleCollision(head) {
  if (!obstacles || obstacles.length === 0) return;
  for (let o of obstacles) {
    if (o && head.x === o.x && head.y === o.y) {
      alert("Game Over! Hit obstacle");
      resetGame();
      return;
    }
  }
}

// spawn obstacles every 4 seconds, avoiding snake body
setInterval(() => {
  let newObstacle = {
    x: Math.floor(Math.random() * tileCount),
    y: Math.floor(Math.random() * tileCount)
  };

  obstacles.push(newObstacle);

  // Limit obstacles for better performance
  if (obstacles.length > 10) {
    obstacles.shift();
  }

}, 4000);
// wall & self collision
function checkCollision(head) {
  // hit wall
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    alert("Game Over! Hit the wall");
    resetGame();
    return;
  }
  // hit self (skip head at index 0)
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      alert("Game Over! Hit yourself");
      resetGame();
      return;
    }
  }
}

function resetGame() {
  snake = [{ x: 10, y: 10 }];
  obstacles = [];
  score = 0;
  document.getElementById("score").innerText = score;
  dx = 1;
  dy = 0;
  generateMap();
}

// voice control
function startVoice() {
  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;

  recognition.onresult = function(event) {
    const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

    if (command.includes("up"))    { dx = 0;  dy = -1; }
    if (command.includes("down"))  { dx = 0;  dy = 1;  }
    if (command.includes("left"))  { dx = -1; dy = 0;  }
    if (command.includes("right")) { dx = 1;  dy = 0;  }
  };

  recognition.start();
}

// Generate obstacle map using Gemini AI
async function generateMap() {
  const API_KEY = "AIzaSyDQLtsiXTyVoCcVPQIumvTXJ-CPBa-LSCw";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Generate 5 obstacle coordinates for a 20x20 snake grid. Return ONLY a JSON array like: [{\"x\":1,\"y\":2}]. No extra text."
            }]
          }]
        })
      }
    );

    const data = await response.json();
    console.log("Gemini response:", data);

    const text = data.candidates[0].content.parts[0].text;
    // extract JSON array from response
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      obstacles = JSON.parse(match[0]);
      console.log("AI obstacles loaded:", obstacles);
    } else {
      throw new Error("No JSON array found in response");
    }
  } catch (e) {
    console.log("AI map generation failed, using random obstacles:", e.message);
  }
}

// Handle keyboard arrow key controls
document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") { dx = 0; dy = -1; }
  if (e.key === "ArrowDown") { dx = 0; dy = 1; }
  if (e.key === "ArrowLeft") { dx = -1; dy = 0; }
  if (e.key === "ArrowRight") { dx = 1; dy = 0; }
});

generateMap();
setInterval(gameLoop, 150);
