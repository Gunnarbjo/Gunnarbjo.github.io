var gl;
var color;
var froggo = [-0.18, -1.0, -0.02, -1.0, -0.1, -0.9];
var bufferId;
var thetaLoc;
var isPointingUpwards = true; // initial orientation
var     road = [
    -1.0, -1.0,
    1.0, -1.0,
    1.0, -0.75,
    
    1.0, -0.75,
    -1.0, -0.75,
    -1.0, -1.0,
    
    -1.0, -0.25,
    1.0, -0.25,
    1.0, 0.25,
    
    1.0, 0.25,
    -1.0, 0.25,
    -1.0, -0.25,
    
    -1.0, 0.75,
    1.0, 0.75,
    1.0, 1.0,
    
    1.0, 1.0,
    -1.0, 1.0,
    -1.0, 0.75
];

var cars = [];
for (var i = 0; i < 20; i++) {
    cars.push(createCar());
}

var roadBuffer;
var program;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    initBuffers();

    thetaLoc = gl.getUniformLocation(program, "theta");
    color = gl.getUniformLocation(program, "color");


    render();
    window.addEventListener("keydown", movement);
};

function initBuffers() {
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(froggo), gl.STATIC_DRAW);

    roadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, roadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(road), gl.STATIC_DRAW);

    carsBuffer = [];
    for (var i = 0; i < cars.length; i++) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cars[i]), gl.STATIC_DRAW);
        carsBuffer.push(buffer);
    }

}

function renderRoad() {
    gl.bindBuffer(gl.ARRAY_BUFFER, roadBuffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.uniform4fv(color, vec4(0.5, 0.5, 0.5, 1.0)); // Gray color for road
    gl.drawArrays(gl.TRIANGLES, 0, road.length / 2);
}

function renderCars() {
    var vPosition = gl.getAttribLocation(program, "vPosition");

    gl.uniform4fv(color, vec4(1.0, 0.0, 0.0, 1.0)); // Red color for cars

    for (var i = 0; i < cars.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, carsBuffer[i]);
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, cars[i].length / 2);
    }
}


function render() {
    setTimeout(function () {
        window.requestAnimFrame(render);
        gl.clear(gl.COLOR_BUFFER_BIT);
	moveCars()

        // Render the roads
        renderRoad();

        // Render the cars
        renderCars();

        // Render the triangle (froggo)
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.uniform4fv(color, vec4(0.0, 1, 0.0, 1.0)); // green color
        gl.drawArrays(gl.TRIANGLES, 0, froggo.length / 2);

        // Move the cars
	function moveCars() {
	    for (var i = 0; i < cars.length; i++) {
		var car = cars[i];
		moveCar(car);
	    }
	}
	

    }, 100);
}

function moveCar(car) {
    var speed = 0.01;
    for (var i = 0; i < car.length; i += 2) {
        if (car[i + 1] === -0.9 || car[i + 1] === 0.0) {
            car[i] += speed;
        } else {
            car[i] -= speed;
        }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, carsBuffer[cars.indexOf(car)]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(car), gl.STATIC_DRAW);;

}



function movement(e) {
    var oldFroggo = [...froggo];
    var fmov = 0.1;
    switch (e.key) {
    case "ArrowLeft":
        for (let i = 0; i < froggo.length; i += 2) { froggo[i] -= fmov; }
        break;
    case "ArrowUp":
        for (let i = 1; i < froggo.length; i += 2) { froggo[i] += fmov; }
	if(!isPointingUpwards){
            flipVertically(); // Point upwards
	    isPointingUpwards = true;}
	break;
    case "ArrowRight":
        for (let i = 0; i < froggo.length; i += 2) { froggo[i] += fmov; }
        break;
    case "ArrowDown":
        for (let i = 1; i < froggo.length; i += 2) { froggo[i] -= fmov; }
	if(isPointingUpwards){
            flipVertically();// Point downward
	    isPointingUpwards = false;}
	break;
    case "r": // Add rotation on "r" key press
        rotate();
        break;
    }

    // Check for collisions between the frog and the cars
    if (checkCollisionWithCars()) {
        froggo = [-0.18, -1.0, -0.02, -1.0, -0.1, -0.9];
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(froggo), gl.STATIC_DRAW);
        return; // exit the function if there's a collision
    }
    // check for colision between the frog and the edges
    if(checkCollisionWithEdges(froggo)){
        froggo = oldFroggo;
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(froggo), gl.STATIC_DRAW);
        return; // exit the function if there's a collision
    }


    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(froggo), gl.STATIC_DRAW);
}


function checkCollisionWithEdges(vertices) {
    for (let i = 0; i < vertices.length; i += 2) {
        if (vertices[i] > 1.0 || vertices[i] < -1.0 || vertices[i + 1] > 1.0 || vertices[i + 1] < -1.0) {
            return true;
        }
    }
    return false;
}


function flipVertically() {
    let centerY = (froggo[1] + froggo[3] + froggo[5]) / 3;

    for (let i = 1; i < froggo.length; i += 2) {
        let dy = froggo[i] - centerY;
        froggo[i] = centerY - dy;
    }
}

function checkCollisionWithCars() {
    var frogRect = {
        x: Math.min(froggo[0], froggo[2], froggo[4]),
        y: Math.min(froggo[1], froggo[3], froggo[5]),
        width: Math.abs(froggo[0] - froggo[4]),
        height: Math.abs(froggo[1] - froggo[5]),
    };
    
    for (var i = 0; i < cars.length; i += 12) {
        var carRect = {
	    x: Math.min(cars[i], cars[i+2], cars[i+4]),
	    y: Math.min(cars[i+1], cars[i+3], cars[i+5]),
	    width: Math.abs(cars[i] - cars[i+4]),
	    height: Math.abs(cars[i+1] - cars[i+5]),
        };
        
        if (checkOverlap(frogRect, carRect)) {
	    return true;
        }
    }
    
    return false;
}

function checkOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect2.x < rect1.x + rect1.width &&
        rect1.y < rect2.y + rect2.height &&
        rect2.y < rect1.y + rect1.height;
}
function createCar() {
    var x = Math.random() * (1.0 - -1.0) + -1.0;  // random number between -1.0 and 1.0
    var lanes = [-0.9, -0.6, -0.3, 0.0, 0.3]; // possible y-values for lanes
    var y = lanes[Math.floor(Math.random()*lanes.length)];  // random y-value from lanes array
    var car = [
        x, y,
        x + 0.2, y,
        x, y + 0.1,
        x + 0.2, y + 0.1,
    ];
    return car;
}

