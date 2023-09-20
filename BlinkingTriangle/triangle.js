///////////////////////////////////////////////////////////////////
//    Heimadæmi 3a
//    Hjálmtýr gaf okkur einfaldan rauðan þrýhyrning, sem við áttum
//    að láta blikka 1 sinni á sec.
//
//    Gunnar Björn
///////////////////////////////////////////////////////////////////
var gl;
var program;
var colorLocation;
var localTime;
var intiTime;
var color = vec4(1.0,0.0,0.0,1.0);
var locColor;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    var vertices = new Float32Array([-1, -1, 0, 1, 1, -1]);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    locColor = gl.getUniformLocation(program, "rcolor");
    
    localTime = gl.getUniformLocation(program, "time");
    initTime = Date.now();
    
    requestAnimationFrame(render);
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    
    var seconds = (Date.now()-initTime) * 0.001;
    ranCol(seconds);

    gl.drawArrays( gl.TRIANGLES, 0, 3 );
    requestAnimationFrame(render);
}

function ranCol(time){
    var red = 0.5 * (Math.sin(time) + 1.0);
    var green = 0.5 * (Math.sin(time + 2.0) + 1.0);
    var blue = 0.5 * (Math.sin(time + 4.0) + 1.0);
    
    var col = vec4( red, green, blue, 1.0 );
    gl.uniform4fv( locColor, flatten(col) );
}
