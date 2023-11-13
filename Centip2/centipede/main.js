
let score = 0;
let oldPlayerPosition = new THREE.Vector3(); // Initialize with a default position
let lasers = []; // Array to keep track of lasers
let mushrooms = []; // Array to keep track of mushrooms

let centipedeSpheres = [];
// Initial direction and speed
let centipedeSpeed = 0.05; // Adjust as necessary
let centipedeBaseSpeed = 0.05;
let centipedeDirection = new THREE.Vector3(1, 0, 0); // Moving right initially

const minMushrooms = 14; // Minimum number of mushrooms
const maxMushrooms = 20; // Maximum number of mushrooms

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// Function to toggle between camera and camera2
let activeCamera = camera;
function toggleCamera() {
    activeCamera = (activeCamera === camera) ? camera2 : camera;
    if (activeCamera === camera2) {
        // Attach camera2 to the player
        player.add(camera2);

        // Position the camera above and slightly behind the player, relative to the player
        camera2.position.set(0, -1.5,1 ); // Position camera above (y = -1.5) and behind (z = 1) the player

        // Rotate the camera to look up along the X-axis
        camera2.rotation.x = Math.PI / 2;
    } else {
        // When switching back to the main camera, detach camera2 from the player
        player.remove(camera2);
        scene.add(camera2); // Add camera2 back to the scene directly
    }
}

// Create canvas and set it's sise and positioning it in the middle of the window
const renderer = new THREE.WebGLRenderer();
const multiplyer = 50; // keeps it within bounderies of my screen, you can change it
const canvasInnerWidth = 16 * multiplyer; // 16 is given from teacher
const canvasInnerHeight = 15 * multiplyer; // 15 is given from teacher
renderer.setSize( canvasInnerWidth, canvasInnerHeight );
renderer.domElement.style.position = 'absolute'; // Position the canvas element absolutely
renderer.domElement.style.top = '50%'; // Align the top edge of the canvas to the vertical center of the screen
renderer.domElement.style.left = '50%'; // Align the left edge of the canvas to the horizontal center of the screen
renderer.domElement.style.transform = 'translate(-50%, -50%)'; // Offset the canvas by half of its width and height to center it
document.body.appendChild( renderer.domElement );

// Functions here are to create items inside the canvas

// Creating the player
const playerWidthX = 0.2;
const playerHeightY = 0.1;
const playerDeapthZ = 0.2;

const playerGeometry = new THREE.BoxGeometry( playerWidthX, playerHeightY, playerDeapthZ );
const playerMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff } );

const player = new THREE.Mesh( playerGeometry, playerMaterial );
player.position.y = (-1 * (canvasInnerWidth / 2) / 100) + playerHeightY * 10;
player.position.x = 0;
player.position.z = 0;
scene.add( player );

camera.position.z = 5;


const light = new THREE.PointLight(0xffffff, 70, 100, 1.7);
light.position.set(0, 10, 10);
scene.add(light);

function initGame() {
    // Reset Player Position
    player.position.set(0, (-1 * (canvasInnerWidth / 2) / 100) + playerHeightY * 10, 0);

    // Reset Camera Position
    camera.position.set(0, 0, 5);
    activeCamera = camera;

    // Reset Score
    score = 0;
    updateScoreDisplay();

    // Clear and Create Centipede
    centipedeSpheres.forEach(segment => scene.remove(segment));
    centipedeSpheres = [];
    createCentipede();
	centipedeSpeed = 0.05;

    // Clear and Create Mushrooms
    mushrooms.forEach(mushroom => scene.remove(mushroom));
    mushrooms = [];
    createRandomMushrooms();

    // Reset Centipede Speed
    centipedeSpeed = centipedeBaseSpeed;

    // Clear Lasers
    lasers.forEach(laser => scene.remove(laser));
    lasers = [];

    // Hide Game Over Screen
    document.getElementById('gameOverScreen').style.display = 'none';
}


function createSphere(x, y){
    const sphereGeometry = new THREE.SphereGeometry( 0.25, 64, 64 ); 
    const material = new THREE.MeshStandardMaterial( { color: 0xe81809} ); 
    const mesh = new THREE.Mesh( sphereGeometry, material );
    mesh.position.x = x;
    mesh.position.y = y;
    return mesh;
}

// createSphere((-(canvasInnerWidth / 100) / 2) - 2, (canvasInnerHeight / 100) * 0.4);

function createCentipede(){
    const numSphere = 6;

    // Start position for last Sphere
    const lastX = (-(canvasInnerWidth / 100) / 2) - 2;
    const lastY = (canvasInnerHeight / 100) * 0.4; 

    for (let i = 0; i < numSphere; i+=1) {
        const centipede = createSphere(lastX + i*0.5, lastY);
        scene.add( centipede );
        centipedeSpheres.push(centipede);
    }

    centipedeSpeed = centipedeBaseSpeed;
}

createCentipede();



// Creating the mushrooms
function createMushroom() {
    // Smaller radius for the mushroom cap
    const capRadius = 0.15; // Adjust this value to make the cap smaller

    // Keep the stem dimensions unchanged
    const stemRadius = 0.1;  
    const stemHeight = 0.2;  

    // Create mushroom cap (sphere)
    const capGeometry = new THREE.SphereGeometry(capRadius, 32, 32);
    const capMaterial = new THREE.MeshBasicMaterial({ color: 0xefcc00 }); // Yellow color for the cap
    const cap = new THREE.Mesh(capGeometry, capMaterial);

    // Create mushroom stem (cylinder)
    const stemGeometry = new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 32);
    const stemMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White color for the stem
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);

    // Position the cap on top of the stem
    cap.position.y = stemHeight / 2;

    // Create an empty object to group cap and stem
    const mushroom = new THREE.Object3D();
    mushroom.add(cap);
    mushroom.add(stem);

    // Rotate the mushroom 90 degrees (π/2 radians) on the x-axis
    mushroom.rotation.x = Math.PI / 2;

	mushroom.hits = 0; // To track the number if hits on the mushroom

    return mushroom;
}

// Function to create multiple mushrooms
function createRandomMushrooms() {
    const numMushrooms = Math.floor(Math.random() * (maxMushrooms - minMushrooms + 1)) + minMushrooms;

    // Canvas boundaries for x-coordinate
    const minX = (-(canvasInnerWidth / 100) / 2) - 2;
    const maxX = ((canvasInnerWidth / 100) / 2) + 2;

    // Canvas boundaries for y-coordinate, excluding the lowest 25%
    const minY = (-canvasInnerHeight / 100) / 4; // Start from 25% above the bottom
    const maxY = (canvasInnerHeight / 100) * 0.4; // Up to last ~10% of the canvas

    // Overlap threshold
    const overlapThreshold = 0.5; // Adjust based on the size of your mushrooms

    for (let i = 0; i < numMushrooms; i++) {
        let x, y, overlap;
        do {
            x = Math.random() * (maxX - minX) + minX;
            y = Math.random() * (maxY - minY) + minY;
            overlap = isOverlapping(x, y, mushrooms, centipedeSpheres);
        } while (overlap); // Keep generating new positions until no overlap is found

        const mushroom = createMushroom();
        mushroom.position.set(x, y, 0); // Z-coordinate is set to 0 (ground level)
        scene.add(mushroom);
        mushrooms.push(mushroom); // Add each created mushroom to the array
    }
}

createRandomMushrooms();


function createLaser() {
    const playerHeight = playerHeightY; // Assuming this is the player's height
    const laserLength = playerHeight / 2;
    const laserRadius = laserLength / 2; // Adjust the radius as needed

    const laserGeometry = new THREE.CylinderGeometry(laserRadius, laserRadius, laserLength, 32);
    const laserMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const laser = new THREE.Mesh(laserGeometry, laserMaterial);

    laser.rotation.x = Math.PI / 2; // Rotate the cylinder to point forward
    return laser;
}

// Function that adds more mushroom when they get down to too few
function addMushrooms(numberToAdd) {
    // Canvas boundaries for x-coordinate
    const minX = (-(canvasInnerWidth / 100) / 2) - 2;
    const maxX = ((canvasInnerWidth / 100) / 2) + 2;

    // Canvas boundaries for y-coordinate, excluding the lowest 25%
    const minY = (-canvasInnerHeight / 100) / 4; // Start from 25% above the bottom
    const maxY = (canvasInnerHeight / 100) * 0.4;  // Up to last ~10% of the canvas

	// Overlap threshold
    const overlapThreshold = 0.5; // Adjust based on the size of your mushrooms

    for (let i = 0; i < numberToAdd; i++) {
        let x, y, overlap;
        do {
            x = Math.random() * (maxX - minX) + minX;
            y = Math.random() * (maxY - minY) + minY;
            overlap = isOverlapping(x, y, mushrooms, centipedeSpheres);
        } while (overlap); // Keep generating new positions until no overlap is found

        const mushroom = createMushroom();
        mushroom.position.set(x, y, 0); // Z-coordinate is set to 0 (ground level)
        scene.add(mushroom);
        mushrooms.push(mushroom); // Add each created mushroom to the array
	}
}


// Functions to check for collitions

// To make sure the player does not go out of bounds
function checkBoundsAndResetPlayer() {
    // Define the boundaries of the canvas
	const ciw = canvasInnerWidth / 100;
	const cih = canvasInnerHeight / 100;
	
    const minX = (-ciw / 2) - 2;
    const maxX = (ciw / 2) + 2;
    const minY = -cih / 2;
    const maxY = -2; // Teacher does not want us to go far up

    // Check if the player is outside the boundaries
    if (player.position.x < minX || player.position.x > maxX || 
        player.position.y < minY || player.position.y > maxY) {
        
        // Reset player position to old position
        player.position.copy( oldPlayerPosition );
    }
}

// Check to see if you have hit a mushroom with a laser
function checkLaserMushroomCollisions() {
    for (let i = lasers.length - 1; i >= 0; i--) {
        let laser = lasers[i];
        for (let j = mushrooms.length - 1; j >= 0; j--) {
            let mushroom = mushrooms[j];
            if (isCollision(laser, mushroom)) {
                mushroom.hits += 1; // Increment hit count

                if (mushroom.hits >= 4) {
                    // Remove mushroom if hit 5 times
                    scene.remove(mushroom);
                    mushrooms.splice(j, 1);
					replenishMushroomsIfNeeded();
                } else {
                    // Reduce mushroom size by 20%
                    mushroom.scale.x *= 0.75;
                    mushroom.scale.y *= 0.75;
                    mushroom.scale.z *= 0.75;
                }

                // Remove laser from scene and array
                scene.remove(laser);
                lasers.splice(i, 1);

                // Increment score
                score++;
				updateScoreDisplay();
                // Break out of the inner loop since the laser has been removed
                break;
            }
        }
    }
}

// Helper function to check for collition on laser and mushroom
function isCollision(laser, mushroom) {
    // Simple distance check (point-based collision)
    const distance = laser.position.distanceTo(mushroom.position);
    const collisionThreshold = 0.5; // Adjust as needed
    return distance < collisionThreshold;
}

// To check if a mushroom is placed at the same space as another
function isOverlapping(newX, newY, existingMushrooms, centipedeSpheres) {
    for (const mushroom of existingMushrooms) {
        if (Math.abs(mushroom.position.x - newX) < 0.5 && Math.abs(mushroom.position.y - newY) < 0.5) {
            return true;
        }
    }
    for (const sphere of centipedeSpheres) {
        if (Math.abs(sphere.position.x - newX) < 0.5 && Math.abs(sphere.position.y - newY) < 0.5) {
            return true;
        }
    }
    return false;
}
function checkLaserCentipedeCollisions() {
    for (let i = lasers.length - 1; i >= 0; i--) {
        let laser = lasers[i];
        for (let j = centipedeSpheres.length - 1; j >= 0; j--) {
            let centipedeSegment = centipedeSpheres[j];
            if (isCollisionCentipede(laser, centipedeSegment)) {
                // Handle the collision
                handleCentipedeSegmentHit(j);

                // Remove laser from scene and array
                scene.remove(laser);
                lasers.splice(i, 1);

                // Break out of the inner loop since the laser has been removed
                break;
            }
        }
    }
}

function isCollisionCentipede(laser, centipedeSegment) {
    // You can use a similar logic to what you have for mushroom collision
    const distance = laser.position.distanceTo(centipedeSegment.position);
    const collisionThreshold = 0.5; // Adjust based on your segment size
    return distance < collisionThreshold;
}


// Function to handle arrow key presses
function onDocumentKeyDown(event) {
	// Store the current player position before any movement
    oldPlayerPosition.copy(player.position);
	var keyCode = event.which;
	// Arrow keys have the following keyCodes: 37 (left), 38 (up), 39 (right), 40 (down)
	if (keyCode == 37 || keyCode == 65) {
		player.position.x -= 0.3; // Move left
	} else if (keyCode == 38 || keyCode == 87) {
		player.position.y += 0.3; // Move up
	} else if (keyCode == 39 || keyCode == 68) {
		player.position.x += 0.3; // Move right
	} else if (keyCode == 40 || keyCode == 83) {
		player.position.y -= 0.3; // Move down
	}
	if (keyCode == 32) { // Spacebar
        const laser = createLaser();
        laser.position.set(player.position.x, player.position.y, player.position.z);
        scene.add(laser);
        lasers.push(laser);
    }

}
function updateCentipede() {
    const ciw = canvasInnerWidth / 100;
    const cih = canvasInnerHeight / 100;
    
    const minX = (-ciw / 2) - 2;
    const maxX = (ciw / 2) + 2;
    const minY = -cih;
    const maxY = cih;

    let sphereDiameter = 0.25;
    let upwardSpeed = 0.1; // Adjust the speed of upward movement

    if (centipedeSpheres[0].position.y < minY) {
        // Reset centipede to its initial position and orientation
        resetCentipede();
    } else {
        // Update the position of each segment
        for (let i = centipedeSpheres.length - 1; i >= 0; i--) {
            if (i === 0) {
                // Continuously move the head upwards
				// centipedeSpheres[i].position.y += upwardSpeed;

                // Check for mushroom collision
                let collisionWithMushroom = checkCentipedeMushroomCollision(centipedeSpheres[i]);
                if (collisionWithMushroom) {
                    // Reverse X direction on collision
                    centipedeDirection.setX(-centipedeDirection.x);
	                centipedeSpheres[i].position.y -= upwardSpeed;
                }

                // Check for horizontal boundary collision
                if (centipedeSpheres[i].position.x > maxX || centipedeSpheres[i].position.x < minX) {
                    // Reverse X direction on boundary collision
                    centipedeDirection.setX(-centipedeDirection.x);
	                centipedeSpheres[i].position.y -= upwardSpeed;
				}

                // Apply horizontal movement
                centipedeSpheres[i].position.x += centipedeDirection.x * centipedeSpeed;
            } else {
                // Following segments
                let targetPosition = centipedeSpheres[i - 1].position.clone();
                centipedeSpheres[i].position.lerp(targetPosition, 0.1);
            }
        }
    }
}

function resetCentipede() {
    // Start position for the first segment of the centipede
    const startX = (-(canvasInnerWidth / 100) / 2) - 2;
    const startY = (canvasInnerHeight / 100) * 0.4; 

    // Reset each segment's position
    for (let i = 0; i < centipedeSpheres.length; i++) {
        centipedeSpheres[i].position.x = startX + i * 0.5;
        centipedeSpheres[i].position.y = startY;
    }

    // Reset centipede's movement direction
    centipedeDirection.set(1, 0, 0); // Assuming initial direction is towards the right
}

function checkCentipedeMushroomCollision(centipedeSegment) {
    for (let mushroom of mushrooms) {
        if (isCollision(centipedeSegment, mushroom)) {
            return true;
        }
    }
    return false;
}

function checkPlayerCentipedeCollision() {
    for (const segment of centipedeSpheres) {
        const distance = player.position.distanceTo(segment.position);
        const collisionThreshold = 0.5; // Adjust as needed
        if (distance < collisionThreshold) {
            // Trigger the game over screen and logic
            document.getElementById('gameOverScreen').style.display = 'block';
            
            // Stop the animation loop
            cancelAnimationFrame(animate);

            // Add event listener to the restart button
            document.getElementById('restartButton').addEventListener('click', function() {
                document.getElementById('gameOverScreen').style.display = 'none';

                // Reset game state
                // This includes resetting the player's position, score, centipede segments, etc.
                initGame();

                // Restart the animation loop
        //        animate();
            });

            // Since a collision is detected, exit the function
            return true;
        }
    }
    return false;
}


// Attach event listener to the document
document.addEventListener("keydown", onDocumentKeyDown, false);
document.querySelector('.toggle-button').addEventListener('click', toggleCamera);



function resetGameState() {
    // Reset the player's position, score, and any other game states
    player.position.set(0, 0, 0);
    score = 0;
    updateScoreDisplay();
    
    // Reset the centipedes
    resetCentipedes();

    // Remove all mushrooms and regenerate them
    mushrooms.forEach(mushroom => scene.remove(mushroom));
    mushrooms.length = 0;
    createRandomMushrooms();

    // Remove any remaining lasers
    lasers.forEach(laser => scene.remove(laser));
    lasers.length = 0;

   
}


function resetCentipedes() {
    // Remove each centipede segment from the scene
    centipedeSpheres.forEach(segment => scene.remove(segment));

    // Clear the centipedeSpheres array
    centipedeSpheres.length = 0;

    // Recreate the centipede
    createCentipede();

    // Reset the base speed of the centipede if needed
    centipedeBaseSpeed = 0.05; // Reset to initial base speed
	centipedeSpeed = 0.05;
    updateCentipedeSpeed(); // Update the speed of the centipede
}


// Check if the mushroom count is low and add more
function replenishMushroomsIfNeeded() {
    const minimumMushrooms = 10; // Set the minimum number of mushrooms you want in the scene

    if (mushrooms.length < minimumMushrooms) {
        const mushroomsToAdd = Math.floor((Math.random() * (maxMushrooms - minMushrooms + 1)) + minMushrooms) - mushrooms.length;
        addMushrooms(mushroomsToAdd);
    }
}


// Updates score
function updateScoreDisplay() {
    document.getElementById('scoreDisplay').innerText = 'Score: ' + score;
    // Check if score has reached a multiple of 100
    if (score % 100 === 0 && score !== 0) {
        centipedeBaseSpeed += 0.05;
        updateCentipedeSpeed(); // Call a function to update the centipede's speed
    }	
}

function handleCentipedeSegmentHit(segmentIndex) {
    // Remove the hit segment and get the segment
    const hitSegment = centipedeSpheres.splice(segmentIndex, 1)[0];
    scene.remove(hitSegment);

    // Update score based on which segment is hit
    score += (segmentIndex === 0 || segmentIndex === centipedeSpheres.length) ? 100 : 10;
    updateScoreDisplay();

    // Check if the centipede is split into two
    if (segmentIndex > 0 && segmentIndex < centipedeSpheres.length) {
        // Create a new centipede from the remaining segments
        const newCentipede = centipedeSpheres.splice(segmentIndex);
        newCentipede.forEach(segment => scene.add(segment));
        centipedeSpheres.push(...newCentipede); // Add the new centipede to the scene
    }

    // Respawn the centipede if all segments are destroyed
    if (centipedeSpheres.length === 0) {
        createCentipede();
    }
}

function updateCentipedeSpeed() {
    centipedeSpeed = centipedeBaseSpeed; // Update centipede speed
}



// Function to animate everything
function animate() {
	requestAnimationFrame( animate );
    for (let i = lasers.length - 1; i >= 0; i--) {
        let laser = lasers[i];
        laser.position.y += 0.1; // Adjust speed as necessary
    }
	// Check to see if mushrooms and laser collide
	checkLaserMushroomCollisions();
	checkLaserCentipedeCollisions();
	updateCentipede();
	// Check and reset player position if out of bounds
	checkBoundsAndResetPlayer();
	renderer.render( scene, activeCamera );
	const oldplayer = player.position;
	if (checkPlayerCentipedeCollision()) {
        document.getElementById('gameOverScreen').style.display = 'block';
        cancelAnimationFrame(animate); // Stop the animation loop
    }

	console.log(centipedeSpeed);

}
animate();
