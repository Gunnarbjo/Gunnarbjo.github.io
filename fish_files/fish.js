var canvas;
var gl;

const BOX_SIZE = 20;
var numVertices = 9;
var numBodyVertices = 6;
var numTailVertices = 3;
var numFinsVertices = 3;

var vertices = [
    // Body
    vec4(-0.5, 0.0, 0.0, 1.0),
    vec4(0.2, 0.2, 0.0, 1.0),
    vec4(0.5, 0.0, 0.0, 1.0),
    vec4(0.5, 0.0, 0.0, 1.0),
    vec4(0.2, -0.15, 0.0, 1.0),
    vec4(-0.5, 0.0, 0.0, 1.0),
    // Tail
    vec4(-0.5, 0.0, 0.0, 1.0),
    vec4(-0.65, 0.15, 0.0, 1.0),
    vec4(-0.65, -0.15, 0.0, 1.0),
    // Fins
    vec4(0.0, 0.0, 0.0, 1.0),
    vec4(0.1, 0.15, 0.0, 1.0),
    vec4(-0.1, 0.15, 0.0, 1.0),
];

var boxVertices = [
    vec4(-10, 10, -10, 1.0),
    vec4(-10, -10, -10, 1.0),
    vec4(10, -10, -10, 1.0),
    vec4(10, 10, -10, 1.0),
    vec4(-10, 10, -10, 1.0),
    vec4(-10, 10, 10, 1.0),
    vec4(-10, -10, 10, 1.0),
    vec4(10, -10, 10, 1.0),
    vec4(10, 10, 10, 1.0),
    vec4(-10, 10, 10, 1.0),
    vec4(-10, -10, 10, 1.0),
    vec4(-10, -10, -10, 1.0),
    vec4(10, -10, -10, 1.0),
    vec4(10, -10, 10, 1.0),
    vec4(10, 10, 10, 1.0),
    vec4(10, 10, -10, 1.0),
];

var isMouseMoving = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var tailRotation = 0.0;
var tailRotationIncrement = 2.0;

var finRotation = 0.0;
var finRotationIncrement = 2.0;

var viewZ = 25.0;

var projectionMatrixLocation;
var modelviewMatrixLocation;
var colorLocation;

var fishData = [];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.95, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    colorLocation = gl.getUniformLocation(program, "fColor");
    projectionMatrixLocation = gl.getUniformLocation(program, "projection");
    modelviewMatrixLocation = gl.getUniformLocation(program, "modelview");

    var projectionMatrix = perspective(90.0, 1.0, 0.1, 100.0);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, flatten(projectionMatrix));

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousewheel", onMouseWheel);

    generateRandomFishData(500);
    render();
}

function generateRandomFishData(numFish) {
    fishData = [];
    for (var i = 0; i < numFish; i++) {
        var x = Math.random() * 20 - 10;
        var y = Math.random() * 20 - 10;
        var z = Math.random() * 20 - 10;
        var color = [Math.random(), Math.random(), Math.random(), 1.0];
        var speed = 0.001 + Math.random() * 0.03;
        fishData.push({ x, y, z, color, speed });
    }
}

function updateFishPositions() {
    for (var i = 0; i < fishData.length; i++) {
        var fish = fishData[i];

        // Generate random direction vector if it's not defined
        if (!fish.direction) {
            fish.direction = vec3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        }

        // Normalize the direction vector
        fish.direction = normalize(fish.direction);

        // Save the old position
        var oldX = fish.x;
        var oldY = fish.y;
        var oldZ = fish.z;

        // Update fish position
        fish.x += fish.speed * fish.direction[0];
        fish.y += fish.speed * fish.direction[1];
        fish.z += fish.speed * fish.direction[2];

        // Check for collision with the box boundaries
        if (
            Math.abs(fish.x) >= BOX_SIZE / 2 ||
            Math.abs(fish.y) >= BOX_SIZE / 2 ||
            Math.abs(fish.z) >= BOX_SIZE / 2
        ) {
            // Fish collided with the box, move it back within the boundaries
            fish.x = clamp(fish.x, -BOX_SIZE / 2, BOX_SIZE / 2);
            fish.y = clamp(fish.y, -BOX_SIZE / 2, BOX_SIZE / 2);
            fish.z = clamp(fish.z, -BOX_SIZE / 2, BOX_SIZE / 2);

            // Reflect only the component of the direction vector that caused the collision
            if (Math.abs(fish.x) >= BOX_SIZE / 2) {
                fish.direction[0] *= -1;
            }
            if (Math.abs(fish.y) >= BOX_SIZE / 2) {
                fish.direction[1] *= -1;
            }
            if (Math.abs(fish.z) >= BOX_SIZE / 2) {
                fish.direction[2] *= -1;
            }

            // Add some randomness to the new direction
            fish.direction[0] += Math.random() - 0.5;
            fish.direction[1] += Math.random() - 0.5;
            fish.direction[2] += Math.random() - 0.5;

            // Normalize the new direction
            fish.direction = normalize(fish.direction);
        }
    }
}

// Helper function to clamp a value within a range
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function onMouseDown(e) {
    isMouseMoving = true;
    origX = e.offsetX;
    origY = e.offsetY;
    e.preventDefault();
}

function onMouseUp(e) {
    isMouseMoving = false;
}

function onMouseMove(e) {
    if (isMouseMoving) {
        spinY += (e.offsetX - origX) % 360;
        spinX += (e.offsetY - origY) % 360;
        origX = e.offsetX;
        origY = e.offsetY;
    }
}

function onKeyDown(e) {
    switch (e.keyCode) {
        case 38: // Up arrow key
            viewZ -= 0.2;
            break;
        case 40: // Down arrow key
            viewZ += 0.2;
            break;
    }
}

function onMouseWheel(e) {
    if (e.wheelDelta > 0.0) {
        viewZ += 0.2;
    } else {
        viewZ -= 0.2;
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    updateFishPositions();
    
    var mv = lookAt(vec3(0.0, 0.0, viewZ), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));

    // Box
    gl.bufferData(gl.ARRAY_BUFFER, flatten(boxVertices), gl.STATIC_DRAW);
    gl.uniform4fv(colorLocation, vec4(0.0, 0.0, 0.0, 1.0));
    gl.uniformMatrix4fv(modelviewMatrixLocation, false, flatten(mv));
    gl.drawArrays(gl.LINE_STRIP, 0, 16);

    // Fish
    tailRotation += tailRotationIncrement;
    if (tailRotation > 35.0 || tailRotation < -35.0)
        tailRotationIncrement *= -1;

    for (var i = 0; i < fishData.length; i++) {
        var fish = fishData[i];
        var mvFish = mv;

        var dir = normalize(fish.direction);
        var angleX = 0;
        var angleY = Math.atan2(Math.sqrt(Math.pow(dir[0], 2) + Math.pow(dir[1], 2)), dir[2]);
        var angleZ = Math.atan2(dir[1], dir[0]) * 180 / Math.PI;

        angleX = unNaN(angleX);
        angleY = unNaN(angleY);
        angleZ = unNaN(angleZ);

        mvFish = mult(mvFish, translate(fish.x, fish.y, fish.z));
        mvFish = mult(mvFish, rotateX(angleX));
        mvFish = mult(mvFish, rotateY(angleY));
        mvFish = mult(mvFish, rotateZ(angleZ));

        // Random color for fish
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        gl.uniform4fv(colorLocation, vec4(fish.color[0], fish.color[1], fish.color[2], fish.color[3]));

        // Draw fish body (without rotation)
        gl.uniformMatrix4fv(modelviewMatrixLocation, false, flatten(mvFish));
        gl.drawArrays(gl.TRIANGLES, 0, numBodyVertices);

        // Draw tail and rotate it
        var mvTail = mvFish;
        mvTail = mult(mvTail, translate(-0.5, 0.0, 0.0));
        mvTail = mult(mvTail, rotateY(tailRotation));
        mvTail = mult(mvTail, translate(0.5, 0.0, 0.0));
        gl.uniformMatrix4fv(modelviewMatrixLocation, false, flatten(mvTail));
        gl.drawArrays(gl.TRIANGLES, numBodyVertices, numTailVertices);

        // Draw left fin
        var mvLeftFin = mvFish;
        mvLeftFin = mult(mvLeftFin, translate(-0.05, 0.0, 0));
        mvLeftFin = mult(mvLeftFin, rotateZ(90));
        mvLeftFin = mult(mvLeftFin, rotateX(45 + 0.5 * tailRotation));
        mvLeftFin = mult(mvLeftFin, translate(0.05, 0.0, 0));
        gl.uniformMatrix4fv(modelviewMatrixLocation, false, flatten(mvLeftFin));
        gl.drawArrays(gl.TRIANGLES, numBodyVertices + numTailVertices, numFinsVertices);

        // Draw right fin
        var mvRightFin = mvFish;
        mvRightFin = mult(mvRightFin, translate(-0.05, 0.0, 0.0));
        mvRightFin = mult(mvRightFin, rotateZ(90));
        mvRightFin = mult(mvRightFin, rotateX(-45 - 0.5 * tailRotation));
        mvRightFin = mult(mvRightFin, translate(0.05, 0.0, 0.0));
        gl.uniformMatrix4fv(modelviewMatrixLocation, false, flatten(mvRightFin));
        gl.drawArrays(gl.TRIANGLES, numBodyVertices + numTailVertices, numFinsVertices);
    }
    window.requestAnimationFrame(render);
}

function unNaN(x) {
    if (isNaN(x)) {
        return 0;
    }

    return x;
}
