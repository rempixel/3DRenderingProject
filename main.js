let program;
let gl;
let canvas;

let stopSign, lamp, car, street, bunny;

let skyBoxUrl = [
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posx.png",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negx.png",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posy.png",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negy.png",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posz.png",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negz.png"
]

const skyboxVertices = [
    // Back face
    -1.0, -1.0, -1.0, 1.0,
    1.0, -1.0, -1.0, 1.0,
    1.0,  1.0, -1.0, 1.0,
    1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0, 1.0,
    1.0, -1.0,  1.0, 1.0,
    1.0,  1.0,  1.0, 1.0,
    1.0,  1.0,  1.0, 1.0,
    1.0,  1.0, -1.0, 1.0,
    1.0, -1.0, -1.0, 1.0,

    // Front face
    -1.0, -1.0,  1.0, 1.0,
    1.0, -1.0,  1.0, 1.0,
    1.0,  1.0,  1.0, 1.0,
    1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,

    // Top face
    -1.0,  1.0, -1.0, 1.0,
    1.0,  1.0, -1.0, 1.0,
    1.0,  1.0,  1.0, 1.0,
    1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0, -1.0, 1.0,

    // Bottom face
    -1.0, -1.0, -1.0, 1.0,
    1.0, -1.0, -1.0, 1.0,
    1.0, -1.0,  1.0, 1.0,
    1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0, -1.0, 1.0
];

//make sure all textures are loaded before we do anything
let textureCount = 0;
const allTexturesLoaded = 6;

let up = vec3(0, 1, 0);

let lightSwitch = true;

let lightAmbient = vec4(.5, .5, .5, 1.0);
let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
let lightPosition = vec4(0.0, 10.0, 0.0, 1.0);

let materialAmbient = vec4(0.3, 0.3, 0.3, 1.0 );
let materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
let materialShininess = 20.0;

let diffuseProduct = mult(lightDiffuse, materialDiffuse);
let specularProduct = mult(lightSpecular, materialSpecular);
let ambientProduct = mult(lightAmbient, materialAmbient);

let uProjectionMatrixLoc, uCameraMatrixLoc, uViewMatrixLoc, uWorldMatrixLoc, uModelMatrixLoc;
let uTextureLoc, uColorLoc, uSkyboxLoc, uStopSignLoc;

let positionAttributeLoc, normalAttributeLoc, texCoordAttributeLoc, diffuseAttributeLoc, specularAttributeLoc;
let hierarchyStack = [mat4()];
let modelInfoArray = [];
const modelsToLoad = 5;

//Animations and toggles
let carAnimation = false;
let cameraAnimation = false;
let carReflection = false;
let hoodRefraction = false;
let hoodCam = false;
let shadowVisibliity = true;
let skyExist = false;

function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);

    // Check that the return value is not null.
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //Depth Testing and Culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    window.addEventListener("keydown", keyPress);

    lightingUniforms();

    //enable attribute data
    positionAttributeLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionAttributeLoc);

    normalAttributeLoc = gl.getAttribLocation(program, "aNormal");
    gl.enableVertexAttribArray(normalAttributeLoc);

    texCoordAttributeLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.enableVertexAttribArray(texCoordAttributeLoc);

    diffuseAttributeLoc = gl.getAttribLocation(program, "aDiffuse");
    gl.enableVertexAttribArray(diffuseAttributeLoc);

    specularAttributeLoc = gl.getAttribLocation(program, "aSpecular");
    gl.enableVertexAttribArray(specularAttributeLoc);

    // Initiate Uniforms
    uProjectionMatrixLoc = gl.getUniformLocation(program, "uProjMatrix");
    uCameraMatrixLoc = gl.getUniformLocation(program, "uCameraMatrix");
    uViewMatrixLoc = gl.getUniformLocation(program, "uViewMatrix");
    uWorldMatrixLoc = gl.getUniformLocation(program, "uWorldMatrix");
    uModelMatrixLoc = gl.getUniformLocation(program, "uModelMatrix");

    uTextureLoc = gl.getUniformLocation(program, "textureType");
    uSkyboxLoc = gl.getUniformLocation(program, "skyBoxTexture");
    uStopSignLoc = gl.getUniformLocation(program, "stopSignTexture");
    
    
    loadSkyboxTextures();

    // Get the models
    stopSign = new Model(
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.obj",
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.mtl");

    lamp = new Model(
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.obj",
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.mtl");

    car = new Model(
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.obj",
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.mtl");

    street = new Model(
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.obj",
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.mtl");

    bunny = new Model(
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.obj",
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.mtl");

    //load models
    loadModel(street);
    loadModel(lamp);
    loadModel(stopSign);
    loadModel(car);
    loadModel(bunny);

    render();
}

function lightingUniforms() {
    let diffuseProduct = mult(lightDiffuse, materialDiffuse);
    let specularProduct = mult(lightSpecular, materialSpecular);
    let ambientProduct = mult(lightAmbient, materialAmbient);

    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
}

function keyPress(event){
    switch(event.key){
        case 'M':
        case 'm':
            carAnimation = !carAnimation;
            console.log(carAnimation, "m pressed")
            break;

        case 'C':    
        case 'c':
            cameraAnimation = !cameraAnimation;
            console.log(cameraAnimation, "c pressed")
            break;

        case 'R':    
        case 'r':
            carReflection = !carReflection;
            console.log(carReflection, "r pressed")
            break;

        case 'F':    
        case 'f':
            hoodRefraction = !hoodRefraction;
            console.log(hoodRefraction, "f pressed")
            break;

        case 'D':
        case 'd':
            hoodCam = !hoodCam;
            console.log(hoodCam, "d pressed")
            break;
        case 'S':    
        case 's':
            shadowVisibliity = !shadowVisibliity;
            console.log(shadowVisibliity, "s pressed")
            break;
        case 'E':    
        case 'e':
            skyExist = !skyExist;
            console.log(skyExist, "e pressed")
            break;
        
        case 'L':    
        case 'l':
            lightSwitch = !lightSwitch;
            if (lightSwitch) {
                lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
                lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
            } else {
                lightSpecular = vec4(.15, .15, .15, 1.0);
                lightDiffuse = vec4(.15, .15, .15, 1.0);
            }

            lightingUniforms();
            console.log(lightSwitch, "l pressed");
            break;
    }
}


function computeShadowMatrix(modelMatrix) {
    let shadowMatrix = mat4();

    // Set y-axis component to 0 to flatten the shadow
    shadowMatrix[1][1] = 0;

    // Compute shadow x-axis component based on light position
    shadowMatrix[0][1] = lightPosition[0] === 0 ? modelMatrix[0][3] : -1 / lightPosition[0];

    // Compute shadow z-axis component based on light position
    shadowMatrix[2][1] = lightPosition[2] === 0 ? modelMatrix[2][3] : -1 / lightPosition[2];

    // Set shadow height adjustment
    shadowMatrix[1][3] = -lightPosition[1];

    return shadowMatrix;
}

function drawShadow(model, modelMatrix) {
    if (shadowVisibliity && lightSwitch) {
        let shadowMatrix = computeShadowMatrix(modelMatrix);
        let shadowModelMatrix = mult(translate(lightPosition[0], lightPosition[1], lightPosition[2]), shadowMatrix);
        shadowModelMatrix = mult(shadowModelMatrix, modelMatrix);

        modelBuffers(model);
        drawModel(model, shadowModelMatrix, 3); //3 for shadow
    }
}

let cameraRadius = 6;
let cameraSpeed = -0.01;
let eyeMoveHeight = 0.5;
let eyeHeight = 2;
let cameraAlpha = 90;

function createCamera() {
    const cameraAngle = cameraAlpha * cameraSpeed;
    const camX = cameraRadius * Math.cos(cameraAngle);
    const camZ = cameraRadius * Math.sin(cameraAngle);
    const camY = eyeHeight + Math.cos(cameraAngle) * eyeMoveHeight;

    // Define camera position and target
    let cameraPosition = vec3(camX, camY, camZ);
    let target = vec3(0, 0, 0); // Look at the origin
    let upVector = up;

    // Calculate camera matrix using lookAt function
    return lookAt(cameraPosition, target, upVector);
}

let carAlpha = 0;
let carRadius = 3;
let carSpeed = 0.01;
let alpha = 1;

function calculateCarRotation(carAngleRadians) {
    // Convert car angle to direction vectors
    let xDirection = Math.sin(carAngleRadians);
    let zDirection = Math.cos(carAngleRadians);

    // Calculate rotation angle in radians and convert to degrees
    let carRotationDegrees = Math.atan2(zDirection, xDirection) * (180 / Math.PI);

    // Adjust rotation to match the coordinate system orientation
    carRotationDegrees -= 90;

    return carRotationDegrees;
}

//Helper to reduce some redundancy when making model buffers
function createBufferAndAttribData(bufferData, attributeLoc, size, type = gl.FLOAT, usage = gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(bufferData), usage);
    gl.vertexAttribPointer(attributeLoc, size, type, false, 0, 0);
}

function modelBuffers(model) {
    createBufferAndAttribData(model.vertices, positionAttributeLoc, 4);
    createBufferAndAttribData(model.normals, normalAttributeLoc, 3);
    createBufferAndAttribData(model.texCoords, texCoordAttributeLoc, 2);
    createBufferAndAttribData(model.diffuse, diffuseAttributeLoc, 4);
    createBufferAndAttribData(model.specular, specularAttributeLoc, 4);
}

// Helper function to render a model with buffers

function drawAllModels(projMatrix) {
    // Initialize camera and view matrices
    let cameraMatrix = createCamera();
    let viewMatrix = mat4();
    gl.uniform1i(uStopSignLoc, 0);

    function renderModel(modelInfo, transformationMatrix, isTexture) {
        modelBuffers(modelInfo);
        drawModel(modelInfo, transformationMatrix, isTexture);
    }

    // Render sign
    let signMatrix = mult(translate(5, 0, 1), rotateY(90));
    renderModel(modelInfoArray[2], signMatrix, Number(modelInfoArray[2].textured));
    drawShadow(modelInfoArray[2], signMatrix);
    // Render street
    renderModel(modelInfoArray[0], mat4(), Number(modelInfoArray[0].textured));
    // Render lamp
    renderModel(modelInfoArray[1], mat4(), Number(modelInfoArray[1].textured));

    // Calculate car position and rotation
    let carAngle = carAlpha * carSpeed;

    let carZ = carRadius * Math.sin(carAngle);
    let carX = carRadius * Math.cos(carAngle);
    let carRotation = calculateCarRotation(carAngle);

    hierarchyStack.push(hierarchyStack[hierarchyStack.length - 1]);
    hierarchyStack[hierarchyStack.length - 1] = mult(translate(carX, 0, carZ), rotateY(carRotation));

    // Apply camera transformations if nested
   if (hoodCam) {
    const carOriginTranslation = translate(carRadius, 0, carRadius);
    const carOriginBackTranslation = translate(-carRadius, 0, -carRadius);
    const carRotation = rotateY(-30);
    const cameraAdjustment = translate(0, 1, -5);
    const lastMatrixInverse = inverse4(hierarchyStack[hierarchyStack.length - 1]);
    cameraAlpha = 90;

    viewMatrix = mult(viewMatrix, carOriginTranslation);
    viewMatrix = mult(viewMatrix, carRotation);
    viewMatrix = mult(viewMatrix, cameraAdjustment);
    viewMatrix = mult(viewMatrix, carOriginBackTranslation);
    viewMatrix = mult(viewMatrix, lastMatrixInverse);
}
    // Push bunny
    hierarchyStack.push(hierarchyStack[hierarchyStack.length - 1]);
    hierarchyStack[hierarchyStack.length - 1] = mult(hierarchyStack[hierarchyStack.length - 1], translate(0, 0.7, 1.7));

    // Render the bunny with refraction option
    renderModel(modelInfoArray[4], hierarchyStack[hierarchyStack.length - 1], hoodRefraction ? 5 : Number(modelInfoArray[4].textured));

    // Pop bunny
    hierarchyStack.pop();

    renderModel(modelInfoArray[3], hierarchyStack[hierarchyStack.length - 1], carReflection ? 4 : Number(modelInfoArray[3].textured));
    drawShadow(modelInfoArray[3], hierarchyStack[hierarchyStack.length - 1]);

    gl.uniformMatrix4fv(uProjectionMatrixLoc, false, flatten(projMatrix));
    gl.uniformMatrix4fv(uCameraMatrixLoc, false, flatten(cameraMatrix));
    gl.uniformMatrix4fv(uWorldMatrixLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(uViewMatrixLoc, false, flatten(viewMatrix));
}


//render a single object
function drawModel(modelInfo, modelMatrix, isTexture) {
    gl.uniform1i(uTextureLoc, isTexture);

    //model matrix info
    gl.uniformMatrix4fv(uModelMatrixLoc, false, flatten(modelMatrix));

    //draw it
    gl.drawArrays(gl.TRIANGLES, 0, modelInfo.vertices.length);
}


//apply texture to models
function setTexture(model) {
    const texture = createAndBindTexture();
    const image = createImage(model.imagePath);

    image.addEventListener('load', function () {
        updateTextureWithImage(texture, image);
        generateMipmap(texture);
    });

    setTextureParameters();

    function createAndBindTexture() {
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return texture;
    }

    function createImage(imagePath) {
        const image = new Image();
        image.crossOrigin = "";
        image.src = imagePath;
        return image;
    }

    function updateTextureWithImage(texture, image) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    function generateMipmap(texture) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    function setTextureParameters() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
}

function loadSkyboxTextures(){
    const skyBoxTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyBoxTexture);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let faceInfo = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: skyBoxUrl[0] },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: skyBoxUrl[1] },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: skyBoxUrl[2] },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: skyBoxUrl[3] },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: skyBoxUrl[4] },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: skyBoxUrl[5] }
    ];

    faceInfo.forEach((face) => {
        let {target, url} = face;

        const image = new Image();
        image.src =url;
        image.crossOrigin ="";
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyBoxTexture);
            gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            textureCount++;
        };
    });
}

function renderSkyBox(vertices) {
    gl.uniform1i(uTextureLoc, 2);

    // Create and bind buffer, then upload vertex data
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Easier to test stuff
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false; 
    const stride = 0; 
    const offset = 0; 

    // Bind the position attribute
    gl.enableVertexAttribArray(positionAttributeLoc);
    gl.vertexAttribPointer(positionAttributeLoc, numComponents, type, normalize, stride, offset);

    const scale = 30;
    let matrix = scalem(scale, scale, scale);
    gl.uniformMatrix4fv(uModelMatrixLoc, false, flatten(matrix));

    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 4);
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //set up perspective
    let projectionMatrix = perspective(120, 1, 0.1, 100);

    //models
    if (modelInfoArray.length === modelsToLoad) {
        drawAllModels(projectionMatrix);

        if (carAnimation) {
            carAlpha += alpha;
        }

        if (cameraAnimation && !hoodCam) {
            cameraAlpha += alpha;
        }
    }

    //skybox
    if (textureCount === allTexturesLoaded) {
        gl.uniform1i(uSkyboxLoc, 1);
        if (skyExist) {
            renderSkyBox(skyboxVertices);
        }
    }

    //next frame time
    requestAnimationFrame(render);

}

//model loading utils
async function loadModel(model) {
    try {
        await waitToLoad(model);
        console.log("Model Loaded Successfully!");

        if (model.textured) {
            setTexture(model);
        }

        modelInfoArray.push(extractModelData(model));
    } catch (reason) {
        console.log("Model Failed to load: ", reason);
    }
}

function extractModelData(model) {
    const vertices = [];
    const normals = [];
    const texCoords = [];
    const diffuseColors = [];
    const specularColors = [];

    // Helper function to add color data
    const addColorData = (colorArray, color) => {
        for (let i = 0; i < 4; i++) {
            colorArray.push(color[i]);
        }
    };

    // Helper function to add vertex and normal data
    const addVertexAndNormalData = (vertexArray, normalArray, vertex, normal) => {
        for (let i = 0; i < 3; i++) {
            vertexArray.push(vertex[i]);
            normalArray.push(normal[i]);
        }
        vertexArray.push(1); // Append 1 to make vertex position a vec4
    };

    // Iterate through each face in the model
    model.faces.forEach(face => {
        const { faceVertices, faceNormals, faceTexCoords, material } = face;

        // Fetch diffuse and specular colors from maps based on material
        const diffuseColor = model.diffuseMap.get(material);
        const specularColor = model.specularMap.get(material);

        faceVertices.forEach((vertex, index) => {
            const normal = faceNormals[index];
            const texCoord = faceTexCoords[index];

            // Add color, vertex, and normal data
            addColorData(diffuseColors, diffuseColor);
            addColorData(specularColors, specularColor);
            addVertexAndNormalData(vertices, normals, vertex, normal);

            // Add texture coordinates if the model is textured
            if (model.textured) {
                texCoords.push(texCoord[0], texCoord[1]);
            }
        });
    });

    return {
        vertices,
        normals,
        texCoords,
        diffuse: diffuseColors,
        specular: specularColors,
        textured: !model.textured
    };
}


// promise and async to make sure models are loaded before attempting to render:
function checkModelLoad(model) {
    return new Promise((resolve) => {
        // Function to check model's loaded state
        const checkModel = () => {
            if (model.objParsed && model.mtlParsed) {
                resolve(true);
            } else {
                // If not loaded, wait 2s and check again
                setTimeout(checkModel, 2000);
            }
        };
        // Initial check
        checkModel();
    });
}

async function waitToLoad(model) {
    if (await checkModelLoad(model)) {
        return;
    } else {
        setTimeout(() => waitToLoad(model), 100); // Wait for 100ms before trying again
    }
}