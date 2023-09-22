var canvas;
var gl;
var vPosition;

// Ball properties
var locBall;
var ballBufferId;
var speed = 0.02;
const randomAngle = Math.random() * 2 * Math.PI;
var ballX = Math.cos(randomAngle) * speed;
var ballY = Math.sin(randomAngle) * speed;
var ball = vec2(0.0, 0.0);
var maxX = 1.0;
var maxY = 1.0;
var ballRad = 0.05;
var ballVertices = new Float32Array([-0.05, -0.05, 0.05, -0.05, 0.05, 0.05, -0.05, 0.05]);


// Paddle properties
var paddleBufferId;
var locPaddle;
var moveSpeed = 0.1;   
var paddleVertices = [
    vec2(-0.1, -0.9),
    vec2(-0.1, -0.86),
    vec2(0.1, -0.86),
    vec2(0.1, -0.9)
];

window.onload = function init() {
    initializeCanvas();      // Initialize canvas first
    initializeWebGL();       // Then initialize WebGL context
    initializeShadersAndBuffers();
    addPaddleEventListeners();
    render();
}

// Initialization functions

function initializeCanvas() {
    canvas = document.getElementById("gl-canvas");
}

function initializeWebGL() {
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
        return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
}

function initializeShadersAndBuffers() {
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Buffer for the ball
    ballBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ballBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(ballVertices), gl.DYNAMIC_DRAW);

    // Buffer for the paddle
    paddleBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, paddleBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(paddleVertices), gl.DYNAMIC_DRAW);
    
    vPosition = gl.getAttribLocation(program, "vPosition");

    locBall = gl.getUniformLocation(program, "ballPos");
    locPaddle = gl.getUniformLocation(program, "paddlePos");

}

// Render functions

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT );
    updateBallPosition();
    checkCollisions();
    renderBall();
    renderPaddle();
    window.requestAnimFrame(render);
}

function renderBall() {
    gl.bindBuffer(gl.ARRAY_BUFFER, ballBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    // Láta ferninginn skoppa af veggjunum
    if (Math.abs(ball[0] + ballX) > maxX - ballRad) ballX = -ballX;
    if (Math.abs(ball[1] + ballY) > maxY - ballRad) ballY = -ballY;

    // Uppfæra staðsetningu
    ball[0] += ballX;
    ball[1] += ballY;

    if (isCollidingWithPaddle()) {
        ballY = -ballY;  // reverse the ball's Y direction
    }
    
    gl.uniform2fv( locBall, flatten(ball) );

    gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );}

function renderPaddle() {
    gl.bindBuffer(gl.ARRAY_BUFFER, paddleBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}


// Paddle movement and listeners
function addPaddleEventListeners() {
    window.addEventListener("keydown", function(e) {
        switch (e.key) {
        case "ArrowLeft":  // If left arrow key is pressed
            movePaddle(-moveSpeed);  // Move paddle to the left
            break;
        case "ArrowRight":  // If right arrow key is pressed
            movePaddle(moveSpeed);  // Move paddle to the right
            break;
        }
    });
}

function movePaddle(amount) {
    let potentialLeftmostX = paddleVertices[0][0] + amount;
    let potentialRightmostX = paddleVertices[2][0] + amount;

    if (potentialLeftmostX > -1.0 && potentialRightmostX < 1.0) {
        for (let i = 0; i < 4; i++) {
            paddleVertices[i][0] += amount;
        }
        // Re-bind the paddle buffer and update its data after moving
        gl.bindBuffer(gl.ARRAY_BUFFER, paddleBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(paddleVertices));
    }
}

function updateBallPosition() {
    ball[0] += ballX;
    ball[1] += ballY;
}


// Detection on collision

function checkCollisions() {
    if (isCollidingWithPaddle()) {
        ballY = -ballY;  // reverse the ball's Y direction
    }
    // Add any other collision checks here...
}

function isCollidingWithPaddle() {
    var ballLeft = ball[0] - ballRad;
    var ballRight = ball[0] + ballRad;
    var ballTop = ball[1] + ballRad;
    var ballBottom = ball[1] - ballRad;

    var paddleLeft = paddleVertices[0][0];
    var paddleRight = paddleVertices[2][0];
    var paddleTop = paddleVertices[1][1];
    var paddleBottom = paddleVertices[0][1];

    return ballLeft < paddleRight &&
        ballRight > paddleLeft &&
        ballTop > paddleBottom &&
        ballBottom < paddleTop;
}
