"use strict";

var gl;
var vertices = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Number of iterations
    var count = 5;
    
    devideCarpet(vec2(-1,1),vec2(1,1),vec2(1,-1),vec2(-1,-1),count);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

// Recursive function to create boxes in the middle of boxes
function devideCarpet(a,b,c,d,cnt){
    if(cnt === 0){
	vertices.push(a,b,c);
	vertices.push(b,c,d);
	vertices.push(a,b,d);
	
    }
    else{


	// Making the outer points, the first letter is the point closest.
	var ab = mix(a,b,1/3); 
	var ba = mix(b,a,1/3);
	var bc = mix(b,c,1/3);
	var cb = mix(c,b,1/3);
	var cd = mix(c,d,1/3);
	var dc = mix(d,c,1/3);
	var da = mix(d,a,1/3);
	var ad = mix(a,d,1/3);

	// Making the inner points
	var abd = mix(ab,dc,1/3); // Top left corner
	var abc = mix(ba,cd,1/3); // Top right corner
	var bcd = mix(cd,ba,1/3); // Bottom right corner
	var acd = mix(dc,ab,1/3); // Bottom left corner

	--cnt;

	devideCarpet(a,ab,abd,ad,cnt);   // Top left box
	devideCarpet(ab,ba,abc,abd,cnt); // Top middle box
	devideCarpet(ba,b,bc,abc,cnt);   // Top right box
	devideCarpet(ad,abd,acd,da,cnt); // Middle left box
	devideCarpet(bc,cb,bcd,abc,cnt); // Middle right box
	devideCarpet(da,acd,dc,d,cnt);   // Bottom left box
	devideCarpet(acd,bcd,cd,dc,cnt); // Bottom middle box
	devideCarpet(bcd,cb,c,cd,cnt);   // Bottom right box
    }

};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, vertices.length );
}
