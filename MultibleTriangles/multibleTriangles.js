 //////////////////////////////////////////////////////////////////////
//    Verkefni í  Tölvugrafík
//     Teiknar 100 þríhyrninga í mismunanid litum á mismunandi stöðum
//
//    Gunnar Björn Þrastarson, ágúst 2023
//////////////////////////////////////////////////////////////////////
var gl;
var points;
var vertices = [];
var color;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); } 
    for(let i=0;i<100;i++){

	var x = Math.random() * 2 - 1;
	var y = Math.random() * 2 - 1;
	
	vertices.push(
	    vec2(-0.1 + x, 0 + y),
	    vec2(0.1 + x, 0 + y),
	    vec2(0 + x, 0.1 + y)
	)
    }
  

    //  Configure WebGL

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER,flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    color = gl.getUniformLocation(program,"color");
    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    for(let i = 0; i < 300; i += 3){
	gl.uniform4fv(color,vec4(Math.random(),Math.random(),Math.random(),1.0));
	gl.drawArrays( gl.TRIANGLES, i, 3 );
    }

}
