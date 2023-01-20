
var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(100.0, 10.0, 10.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 64.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc, viewMatrixLoc;
var eye;
var at = vec3(0.0, -1.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eye = vec3(1,1,10);

var red = vec4(255/255,0,0,0);
var blue = vec4(0,0,1,0);
var grey = vec4(80/255,80/255,80/255,1);
var whitetone = vec4(255/255,228/255,196/255,1);
var browntone = vec4(139/255,69/255,19/255,1);
var ginger = vec4(255/255,160/255,0/255,1);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = false;
var controller;
var framerate = 0;

var useTextures = 0;

var boxingRingLocation = [0,-5,0];
var boxingRingSize = [5,1,5];

var boxer1pos = [-2,-1,0]

var rightsholder = [0,0,0];

var rightelbow = [0,0,0];

var rightsholder1 = [0,0,0];

var rightelbow1 = [0,0,0];

var leftsholder = [0,0,0];

var leftelbow = [0,0,0];

var leftsholder1 = [0,0,0];

var leftelbow1 = [0,0,0];

var boxer2die = [0,0,0];

var textureArray = [] ;

// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

// Helper function to load an actual file as a texture
// NOTE: The image is going to be loaded asyncronously (lazy) which could be
// after the program continues to the next functions. OUCH!
function loadFileTexture(tex, filename)
{
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
}

// Once the above image file loaded with loadFileTexture is actually loaded,
// this funcion is the onload handler and will be called.
function handleTextureLoaded(textureObj) {
	//Binds a texture to a target. Target is then used in future calls.
		//Targets:
			// TEXTURE_2D           - A two-dimensional texture.
			// TEXTURE_CUBE_MAP     - A cube-mapped texture.
			// TEXTURE_3D           - A three-dimensional texture.
			// TEXTURE_2D_ARRAY     - A two-dimensional array texture.
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
	
	//texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
    //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
        //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
    //Border: Width of image border. Adds padding.
    //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
    //Type: Data type of the texel data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    //pname: Texture parameter to set.
        // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
        // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
    //param: What to set it to.
        //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
        //For the Min Filter: 
            //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
    //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	
	//Generates a set of mipmaps for the texture object.
        /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
    gl.generateMipmap(gl.TEXTURE_2D);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually laoded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
    setTimeout(
		function() {
			   var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log(texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               		console.log(wtime + " not ready yet") ;
               		waitForTextures(texs) ;
               }
               else
               {
               		console.log("ready to render") ;
					render(0);
               }
		},
	5) ;
}

// This just calls the appropriate texture loads for this example adn puts the textures in an array
function initTexturesForExample() {
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"boxingRingFloor.bmp") ;
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"crowd.bmp") ;

    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"winner.bmp") ;
}

//Changes which texture is active in the array of texture examples (see initTexturesForExample)
function toggleTextures() {
 useTextures = (useTextures + 1) % 2
	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    viewLoc = gl.getUniformLocation( program, "eye" );
    viewMatrixLoc = gl.getUniformLocation( program, "viewMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );


    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };
	
	
	// Helper function just for this example to load the set of textures
    initTexturesForExample() ;

    waitForTextures(textureArray);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Draw a Bezier patch
function drawB3(b) {
	setMV() ;
	b.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}


function render(timestamp) {

    if(timestamp % 2000 < 17){
        console.log(Math.pow(dt, -1))
    }

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    MS = []; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);

    // spin around arena for 10 seconds 
    if(timestamp<10000){
        eye[0] = eye[0]*Math.cos(.005) + eye[2]*Math.sin(.005);
        eye[2] = -eye[0]*Math.sin(.005) + eye[2]*Math.cos(.005);
    }

    // watch blue boxer fly out of stadium 
    if(timestamp>20000&&timestamp<22000){
        at[0] = at[0] + .2;
    }

    // look back at winner
    if(timestamp>22500&&timestamp<24500){
        at[0] = at[0] - .2;
    }

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
 


    // set all the matrices
    setAllMatrices();
    
	if( animFlag )
    {
		// dt is the change in time or delta time from the last frame to this one
		// in animation typically we have some property or degree of freedom we want to evolve over time
		// For example imagine x is the position of a thing.
		// To get the new position of a thing we do something called integration
		// the simpelst form of this looks like:
		// x_new = x + v*dt
		// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
		// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
		dt = (timestamp - prevTime) / 1000.0;
		prevTime = timestamp;
	}

    /// set boxing ring stage //////
    gPush();
    {
        
        gPush();
        {
            gTranslate(boxingRingLocation[0],boxingRingLocation[1]+-.2,boxingRingLocation[2])
            gPush()
            {
                gScale(boxingRingSize[0],boxingRingSize[1],boxingRingSize[2]);
                // grey stage
                if(timestamp < 22000){
                    setColor(vec4(80/255,80/255,80/255,1));
                    drawCube();
                }
                // broadcast winner on stage
                if(timestamp>22000){
                    toggleTextures();
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
                    gl.uniform1i(gl.getUniformLocation(program, "curtexture"), 0);
                    drawCube();
                    toggleTextures();
                }
               
            }
            gPop();
        }
        gPop();
    }
	gPop();

    // arena floor 
    gPush();
    {
        setColor(vec4(0,0,0,1));
        gPush();
        {
            gTranslate(boxingRingLocation[0],boxingRingLocation[1]-2,boxingRingLocation[2])
            gPush()
            {
                gScale(boxingRingSize[0]*3,boxingRingSize[1],boxingRingSize[2]*3);
                drawCube();
            }
            gPop();
        }
        gPop();
    }
	gPop();

    // bloody boxing ring floor
    gPush();
    { 
        gPush();
        {
            gTranslate(boxingRingLocation[0],boxingRingLocation[1]+.85,boxingRingLocation[2])
            gPush()
            {   
                toggleTextures();
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
                gl.uniform1i(gl.getUniformLocation(program, "curtexture"), 0);
                gScale(boxingRingSize[0],.02,boxingRingSize[2]);
                drawCube();

                toggleTextures();
            }
            gPop();
        }
        gPop();
    }
	gPop();

    // cylinder to map audience on 
    gPush();
    {
        setColor(vec4(1,1,1,1))
        gScale(30,30,35)
        gRotate(-90,1,0,0)
        toggleTextures();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
        gl.uniform1i(gl.getUniformLocation(program, "curtexture"), 0);

        drawCylinder();

        toggleTextures();
    }
    gPop();

    /// boxer 1 ///
    gPush();
    {
        gTranslate(boxer1pos[0],boxer1pos[1]+.50,boxer1pos[2]);
        gRotate(90,0,1,0)
        gPush();
        {
            
            gPush();
            {
                gPush();
                {   
                    // right shoulder point of rotation
                    gTranslate(-.75,.65,0);
                    gRotate(-30,1,0,0)
                    // punch for 15 seconds
                    if(timestamp<15000){
                     rightsholder[0] = 30*Math.sin(.005*timestamp);													
		             gRotate(rightsholder[0],1,0,0);
                    }
                    // wind up big punch
                    if(timestamp>15000 && timestamp<20000){
                        rightsholder[0] = rightsholder[0] + -900*dt;	
                        gRotate(rightsholder[0],1,0,0);
                    }
                    // extend punch
                    if(timestamp > 20000 && timestamp < 21000){
                        gRotate(-60,1,0,0);
                    }
                    // raise arm 
                    if(timestamp > 21000){
                        gRotate(-120,1,0,0)
                    }


                    gPush();
                    {
                        gPush();
                        {
                            // elbow rotation point
                            gTranslate(-.2,-1.1,0)
                            gRotate(-90,1,0,0)
                            // punch for 15 secs
                            if(timestamp<15000){
                            rightelbow[0] = 30*Math.sin(-.005*timestamp);													
                            gRotate(rightelbow[0],1,0,0);	
                            }
                            // raise arm 
                            if(timestamp > 20000){
                                gRotate(80,1,0,0);
                            }

                            gPush()
                            {
                                    gPush();
                                    {
                                        // glove // 
                                        setColor(red);
                                        gTranslate(0,-1.4,0)
                                        gScale(.3,.3,.3)
                                        drawSphere();
                                    }
                                    gPop();
                                    // right forearm
                                setColor(browntone);
                                gTranslate(0,-.65,0)
                                gScale(.15,.7,.15)
                                drawCube();
                            }
                            gPop()

                        }
                        gPop();
                        // right bicept // 
                        setColor(browntone);
                        gTranslate(-.2,-.5,0)
                        gScale(.2,.75,.2)
                        drawCube();
                    }
                    gPop();
                }
                gPop();

                gPush();
                {   
                    // left shoulder point of rotation
                    gTranslate(1.15,.65,0);
                    gRotate(-25,1,0,0)
                    // punch for 15 secs 
                    if(timestamp<15000){
                    leftsholder[0] = 30*Math.sin(-.005*timestamp);													
                    gRotate(leftsholder[0],1,0,0);	
                    }
                    // raise arm
                    if(timestamp > 21000){
                        gRotate(210,1,0,0);
                    }
                    gPush();

                    {
                        gPush();
                        {
                            // elbow rotation point
                            gTranslate(-.2,-1.1,0)
                            gRotate(-120,1,0,0)
                            // punch for 15 sec
                            if(timestamp<15000){
                            leftelbow[0] = 30*Math.sin(-.0025*timestamp);													
                            gRotate(leftelbow[0],1,0,0);
                            }	
                            // raise arm 
                            if(timestamp > 21000){
                                gRotate(120,1,0,0);
                            }
                            gPush()
                            {
                                    gPush();
                                    {
                                        // glove
                                        setColor(red);
                                        gTranslate(0,-1.4,0)
                                        gScale(.3,.3,.3)
                                        drawSphere();
                                    }
                                    gPop();
                                    // left forearm
                                    setColor(browntone);
                                gTranslate(0,-.65,0)
                                gScale(.15,.7,.15)
                                drawCube();
                            }
                            gPop()

                        }
                        gPop();
                        // left bicept // 
                        gTranslate(-.2,-.5,0)
                        gScale(.2,.75,.2)
                        drawCube();
                    }
                    gPop();
                }
                gPop();
                gPush();
                {
                    // left hip connection //
                    gTranslate(-.3,-1,0)
                    gRotate(-30,1,0,0)
                    gPush();
                    {
                        gPush();
                        {
                            // left knee // 
                            gTranslate(0,-1.4555,0)
                            gRotate(30,1,0,0)
                            gPush();
                            {
                                gPush();
                                {
                                    // foot
                                    setColor(red);
                                    gTranslate(0,-1.2,.25)
                                    gScale(.12,.05,.25)
                                    drawCube();
                                    setColor(grey);
                                }
                                gPop();
                                // shin
                                setColor(browntone);
                                gTranslate(0,-.6,0)
                                gScale(.2,.65,.2)
                                drawCube();
                            }
                            gPop();
                        }
                        gPop();
                        // left thigh
                        setColor(red);
                        gTranslate(0,-.7,0)
                        gScale(.25,.75,.25)
                        drawCube();
                    
                    }
                    gPop();
                }
                gPop();
                gPush();
                {
                    // right hip connection //
                    gTranslate(.3,-1,0)
                    gRotate(30,1,0,0)
                    gPush();
                    {
                        gPush();
                        {
                            // right knee // 
                            gTranslate(0,-1.4555,0)
                            gRotate(10,1,0,0)
                            gPush();
                            {
                                gPush();
                                {
                                    // foot
                                    setColor(red);
                                    gTranslate(0,-1.2,.25)
                                    gScale(.12,.05,.25)
                                    gRotate(90,1,0,0)
                                    drawCube();
                                    setColor(grey);
                                }
                                gPop();
                                // shin
                                setColor(browntone);
                                gTranslate(0,-.6,0)
                                gScale(.2,.65,.2)
                                drawCube();
                            }
                            gPop();
                        }
                        gPop();
                        // left thigh
                        setColor(red);
                        gTranslate(0,-.7,0)
                        gScale(.25,.75,.25)
                        drawCube();

                    }
                    gPop();
                }
                gPop();
                // head // 
                gPush();
                {   
                    // hair
                    setColor(vec4(0,0,0));
                    gTranslate(0,1.6,-.1)
                    gScale(.55,.55,.45)
                    drawSphere();
                    
                }
                gPop();
                setColor(browntone);
                gTranslate(0,1.5,0);
                gScale(.5,.5,.5);
                drawSphere();
            }
            gPop();
            // torso // 
            gPush();
            {   
                // shorts
                setColor(red);
                gTranslate(0,-.7,0)
                gScale(.76,.35,.59)
                drawCube();
                
            }
            gPop();
            setColor(browntone);
            gScale(.75,1,.5)
            drawCube();
        }
        gPop();
        
    }
    gPop();

    // boxer 2 // 
    gPush();
    {
        gTranslate(boxer1pos[0]+4,boxer1pos[1]+.50,boxer1pos[2]);
        gRotate(270,0,1,0)
        // fly out of stadium 
        if(timestamp > 20000){
            boxer2die[2] = boxer2die[2] - .2;
            gTranslate(0,0,boxer2die[2])
        }

        gPush();
        {
            gPush();
            {
                gPush();
                {   
                    
                    gTranslate(-.75,.65,0);
                    gRotate(-30,1,0,0)
                    // punch for 15
                    if(timestamp<15000){
                            rightsholder1[0] = 30*Math.sin(-.005*timestamp);													
                            gRotate(rightsholder1[0],1,0,0);	
                    }
                    gPush();
                    {
                        gPush();
                        {
                            // elbow rotation 
                            gTranslate(-.2,-1.1,0)
                            gRotate(-90,1,0,0)
                            // punch for 15
                            if(timestamp<15000){
                            rightelbow1[0] = 30*Math.sin(.005*timestamp);													
                            gRotate(rightelbow1[0],1,0,0);	
                            }
                            gPush()
                            {
                                    gPush();
                                    {   
                                        // glove
                                        setColor(vec4(0,0,1,0));
                                        gTranslate(0,-1.4,0)
                                        gScale(.3,.3,.3)
                                        gRotate(180,0,1,0)
                                        drawSphere();
                                    }
                                    gPop();
                                    // forearm
                                setColor(whitetone);
                                gTranslate(0,-.65,0)
                                gScale(.15,.7,.15)
                                gRotate(180,0,1,0)
                                drawCube();
                            }
                            gPop()

                        }
                        gPop();
                        // right bicept // 
                        gTranslate(-.2,-.5,0)
                        gScale(.2,.75,.2)
                        gRotate(180,0,1,0)
                        drawCube();
                    }
                    gPop();
                }
                gPop();
                gPush();
                {   
                    // left shoulder point of rotation
                    gTranslate(1.15,.65,0);
                    gRotate(-25,1,0,0)
                    // punch for 15 secs
                    if(timestamp<15000){
                    leftsholder1[0] = 30*Math.sin(.005*timestamp);													
                    gRotate(leftsholder1[0],1,0,0);	
                    }

                    gPush();
                    {
                        gPush();
                        {
                            // elbow rotation 
                            gTranslate(-.2,-1.1,0)
                            gRotate(-120,1,0,0)
                            // punch for 15 secs
                            if(timestamp<15000){
                            leftelbow1[0] = 30*Math.sin(-.0025*timestamp);													
                            gRotate(leftelbow1[0],1,0,0);	
                            }

                            gPush()
                            {
                                    gPush();
                                    {
                                        // glove
                                        setColor(vec4(0,0,1,0));
                                        gTranslate(0,-1.4,0)
                                        gScale(.3,.3,.3)
                                        gRotate(180,0,1,0)
                                        drawSphere();
                                    }
                                    gPop();
                                    // forearm
                                setColor(whitetone);
                                gTranslate(0,-.65,0)
                                gScale(.15,.7,.15)
                                gRotate(180,0,1,0)
                                drawCube();
                            }
                            gPop()

                        }
                        gPop();
                        // left bicept // 
                        gTranslate(-.2,-.5,0)
                        gScale(.2,.75,.2)
                        gRotate(180,0,1,0)
                        drawCube();
                    }
                    gPop();
                }
                gPop();
                gPush();
                {
                    // left hip connection //
                    gTranslate(-.3,-1,0)
                    gRotate(-30,1,0,0)
                    gPush();
                    {
                        gPush();
                        {
                            // left knee // 
                            gTranslate(0,-1.4555,0)
                            gRotate(30,1,0,0)
                            gPush();
                            {
                                gPush();
                                {
                                    // foot
                                    setColor(blue);
                                    gTranslate(0,-1.2,.25)
                                    gScale(.12,.05,.25)
                                    gRotate(180,0,1,0)
                                    drawCube();
                                }
                                gPop();
                                setColor(whitetone);
                                gTranslate(0,-.6,0)
                                gScale(.2,.65,.2)
                                gRotate(180,0,1,0)
                                drawCube();
                            }
                            gPop();
                        }
                        gPop();
                        // left thigh
                        setColor(blue);
                        gTranslate(0,-.7,0)
                        gScale(.25,.75,.25)
                        gRotate(180,0,1,0)
                        drawCube();

                    }
                    gPop();
                }
                gPop();
                gPush();
                {
                    // right hip connection //
                    gTranslate(.3,-1,0)
                    gRotate(30,1,0,0)
                    
                    gPush();
                    {
                        gPush();
                        {
                            // right knee // 
                            gTranslate(0,-1.4555,0)
                            gRotate(10,1,0,0)
                            gPush();
                            {
                                gPush();
                                {
                                    // foot
                                    gTranslate(0,-1.2,.25)
                                    gScale(.22,.05,.25)
                                    gRotate(90,1,0,0)
                                    gRotate(180,0,1,0)
                                    drawCube();
                                }
                                gPop();
                                setColor(whitetone);
                                gTranslate(0,-.6,0)
                                gScale(.2,.65,.2)
                                gRotate(180,0,1,0)
                                drawCube();
                            }
                            gPop();
                        }
                        gPop();
                        // left thigh
                        setColor(blue);
                        gTranslate(0,-.7,0)
                        gScale(.25,.75,.25)
                        gRotate(180,0,1,0)
                        drawCube();

                    }
                    gPop();
                }
                gPop();
                // head // 
                gPush();
                {   
                    setColor(ginger);
                    gTranslate(0,1.6,-.1)
                    gScale(.55,.55,.45)
                    gRotate(180,0,1,0)
                    drawSphere();
                    
                }
                gPop();
                setColor(whitetone);
                gTranslate(0,1.5,0);
                gScale(.5,.5,.5);
                gRotate(180,0,1,0)
                drawSphere();
            }
            gPop();
            gPush();
            {   
                setColor(blue);
                gTranslate(0,-.7,0)
                gScale(.76,.35,.59)
                gRotate(180,0,1,0)
                drawCube();
                
            }
            gPop();
            // torso // 
            setColor(whitetone);
            gScale(.75,1,.5)
            gRotate(180,0,1,0)
            drawCube();
        }
        gPop();
        
    }
    gPop();


    
    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
	var controller = this;
	this.onchange = null;
	this.xRot = 0;
	this.yRot = 0;
	this.scaleFactor = 3.0;
	this.dragging = false;
	this.curX = 0;
	this.curY = 0;
	
	// Assign a mouse down handler to the HTML element.
	element.onmousedown = function(ev) {
		controller.dragging = true;
		controller.curX = ev.clientX;
		controller.curY = ev.clientY;
	};
	
	// Assign a mouse up handler to the HTML element.
	element.onmouseup = function(ev) {
		controller.dragging = false;
	};
	
	// Assign a mouse move handler to the HTML element.
	element.onmousemove = function(ev) {
		if (controller.dragging) {
			// Determine how far we have moved since the last mouse move
			// event.
			var curX = ev.clientX;
			var curY = ev.clientY;
			var deltaX = (controller.curX - curX) / controller.scaleFactor;
			var deltaY = (controller.curY - curY) / controller.scaleFactor;
			controller.curX = curX;
			controller.curY = curY;
			// Update the X and Y rotation angles based on the mouse motion.
			controller.yRot = (controller.yRot + deltaX) % 360;
			controller.xRot = (controller.xRot + deltaY);
			// Clamp the X rotation to prevent the camera from going upside
			// down.
			if (controller.xRot < -90) {
				controller.xRot = -90;
			} else if (controller.xRot > 90) {
				controller.xRot = 90;
			}
			// Send the onchange event to any listener.
			if (controller.onchange != null) {
				controller.onchange(controller.xRot, controller.yRot);
			}
		}
	};
}
