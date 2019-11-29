//	Copyright (C) 2019 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE, Switzerland
//
//		Multimedia Signal Processing Group (MMSPG)
//
//		This program is free software: you can redistribute it and/or modify
//		it under the terms of the GNU General Public License as published by
//		the Free Software Foundation, either version 3 of the License, or
//		(at your option) any later version.
//
//		This program is distributed in the hope that it will be useful,
//		but WITHOUT ANY WARRANTY; without even the implied warranty of
//		MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//		GNU General Public License for more details.
//
//		You should have received a copy of the GNU General Public License
//		along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// 	Author: Evangelos Alexiou
// 	Email: evangelos.alexiou@epfl.ch


// ===============================================================
// VARIABLES
// ===============================================================

var CONFIG = './config/config001.json';
var models = [];
var modelIndex = 0;
var randView = true;


// ===============================================================
// FUNCTIONS
// ===============================================================

function animate( ) {
	request = requestAnimationFrame( animate );

	if ( showStats ){
		stats.update( );
	}

	if ( camZoomLimit ){
		if ( camera.zoom >= camZoomMax ){
			camera.zoom = camZoomMax;
		}
		else if ( camera.zoom <= camZoomMin ){
			camera.zoom = camZoomMin;
		}
	}

	controls.update( );
	renderer.render( scene, camera );
}


function initializeScene( ){
	// Set size of canvas
	canvas = document.getElementById( 'canvas' );
	canvas.width = rendererWidth;
	canvas.height = rendererHeight;

	// Set camera
	camera = new THREE.OrthographicCamera( cameraLeft, cameraRight, cameraTop, cameraBottom, cameraNear, cameraFar );

	// Set controls
	controls = new THREE.OrthographicTrackballControls( camera );
	setControls( );

	// Initialize scene
	scene = new THREE.Scene( );
	scene.background = new THREE.Color( Number( sceneColor ) );

	// Initialize renderer
	renderer = new THREE.WebGLRenderer( {
		preserveDrawingBuffer: true,
		canvas: canvas,
		antialias: false
	} );
	renderer.setPixelRatio( window.devicePixelRatio );

	// Add window event listeners
	window.addEventListener( 'keypress', onKeyPress );

	// Initialize stats, if user chooses to display
	if ( showStats ){
		stats = new Stats( );
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.zIndex = 100;
		container.appendChild( stats.domElement );
	}

	// Set model-related variables
	setModels( );

	request = requestAnimationFrame( animate );
}


function setControls( ){
	controls = new THREE.OrthographicTrackballControls( camera );
	controls.rotateSpeed = controlsRotateSpeed;
	controls.zoomSpeed = controlsZoomSpeed;
	controls.panSpeed = controlsPanSpeed;
	controls.noPan = controlsNoPan;
	controls.staticMoving = controlsStaticMoving;
	controls.dynamicDampingFactor = controlsDynamicDampingFactor;
}


function setModels( ){
	fileName = models[ modelIndex ].name;
	isVoxelized = models[ modelIndex ].voxelized;
	geomResolution = models[ modelIndex ].geomResolution;		// For irregular point clouds, a regular grid approximation can be used to set the geomResolution parameter
	splatScalingFactor = models[ modelIndex ].splatScalingFactor;
	pixelsPerPoint = splatScalingFactor * rendererWidth * ( 1 / geomResolution );
	splatType = models[ modelIndex ].splatType;
	pointSize = models[ modelIndex ].pointSize; 						// For fixed splat type, either a number, or a file name can be given. For adaptive splat type, a file name should be given

	if ( typeof(pointSize) === "number" ){
		sizePerPoint = pointSize;
		renderModels( );
	}
	else{
		readJSON( pathToAssets+pathToMetadata+pointSize, function( text ){
		  sizePerPoint = JSON.parse( text );
			renderModels( );
		});
	}
}


function renderModels( ){
	controls.reset( );

	// Initializations
	previousCameraZoom = -1;
	var date = Date.now( );

	// Show button if more than one models will be shown
	if ( modelNum != 1 ){
		document.getElementById( 'menu' ).style.display = 'inline';
	}

	// Remove model from the scene
	if ( modelIndex > 0 ){
    scene.remove( pointcloud );
    pointcloud = [ ];
	}

	// Prepare shader material
	if ( splatType == 'adaptive' ){
			var shaderMaterial = new THREE.ShaderMaterial( {
				vertexShader: document.getElementById( 'vertexshader' ).textContent,
				fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
				vertexColors: true
		} );
	}

	// Load model
	if ( fileName.endsWith( 'pcd' ) ){
		var loader = new THREE.PCDLoader( );
	}
	else{
		var loader = new THREE.PLYLoader( );
	}

	loader.load( pathToAssets+pathToModels+fileName, function ( content ) {
		// Load point cloud
		pointcloud = loadPointCloud( fileName, splatType, pixelsPerPoint, shaderMaterial, content );

		// Add model to the scene
		scene.add( pointcloud );

		// Scale model
		updateModelScaling( );

		// Initialize camera position; if argument == "true", randomly
		initializeCameraParameters( randView );

		// Add controls event listener
		controls.addEventListener( 'change', onPositionChange );

		console.log( 'Loading time: ' + (Date.now( ) - date)/1000 + ' sec' );
	} );
}


function updateModelScaling( ){
	var frustumRange = camera.right - camera.left;

	if ( isVoxelized ){
		var contentMaxRange = geomResolution;
	}
	else{
		pointcloud.geometry.computeBoundingBox( );
		var dimensionX = pointcloud.geometry.boundingBox.max.x - pointcloud.geometry.boundingBox.min.x;
		var dimensionY = pointcloud.geometry.boundingBox.max.y - pointcloud.geometry.boundingBox.min.y;
		var dimensionZ = pointcloud.geometry.boundingBox.max.z - pointcloud.geometry.boundingBox.min.z;
		var contentMaxRange = Math.max( dimensionX, dimensionY, dimensionZ );	// = max dimension of the min bounding box
	}

	pointcloud.geometry.scale( frustumRange / contentMaxRange, frustumRange / contentMaxRange, frustumRange / contentMaxRange );
	pointcloud.geometry.center( );

	pointcloud.geometry.computeBoundingBox( );
	pointcloud.geometry.computeBoundingSphere( );

	pointcloud.geometry.attributes.position.needsUpdate = true;
}


function initializeCameraParameters( randomize ){
	var theta;
	var phi;
	if ( randomize ){
		theta = Math.random( ) * Math.PI; 	// \theta \in [0, \pi] - inclination
		phi = Math.random( ) * 2 * Math.PI; // \phi \in [0, 2 \pi] - azimuth
	}
	else{
		theta = 0;
		phi = 0;
	}

	pointcloud.geometry.computeBoundingSphere( );
	var radius = 2 * pointcloud.geometry.boundingSphere.radius;

	var x = radius * Math.sin( theta ) * Math.cos( phi );
	var y = radius * Math.sin( theta ) * Math.sin( phi );
	var z = radius * Math.cos( theta );

	camera.zoom = cameraZoom;
	camera.position.set( x, y, z );
	camera.lookAt( pointcloud.geometry.boundingSphere.center.x, pointcloud.geometry.boundingSphere.center.y, pointcloud.geometry.boundingSphere.center.z );
	camera.near = cameraNear;
	camera.far = cameraFar;

	camera.updateProjectionMatrix( );
	onPositionChange( );
}


function onPositionChange ( ev ) {
	// Adjust size of splats
	if ( previousCameraZoom != camera.zoom ){
		if ( splatType == 'adaptive' ){
			var splatSize = pointcloud.geometry.attributes.size.array;
			if ( sizePerPoint.length != splatSize.length ){
				getNumberPointsErrorMessage( );
			}
			for ( var i = 0; i < splatSize.length; i++ ){
				splatSize[ i ] = camera.zoom * pixelsPerPoint * sizePerPoint[i];
			}
			pointcloud.geometry.attributes.size.needsUpdate = true;
		}
		else{
			pointcloud.material.size = camera.zoom * pixelsPerPoint * sizePerPoint;
			pointcloud.material.needsUpdate = true;
		}
	}
	previousCameraZoom = camera.zoom;
}


function onKeyPress( e ) {
	if ( e.code == 'KeyR' ){
		controls.reset( );
		initializeCameraParameters( randView );
	}

	if ( e.code == 'KeyS' ){
		takeScreenshot( canvas, 'snapshot' );
	}

	if ( e.code == 'KeyH' ){
		setControls( );
		initializeCameraParameters( randView );
		controls.addEventListener( 'change', onPositionChange );
	}
}


function onPressingButton( ){
	modelIndex++;

	if (modelIndex < modelNum){
		controls.removeEventListener( 'change', onPositionChange );
		setModels( );
	}
	else{
		controls.removeEventListener( 'change', onPositionChange );
		closeSession( );
	}
}


function closeSession( ){
	scene.remove( pointcloud );
	renderer.clear( )
	canvas.style.display = 'none';
	document.getElementById( 'menu' ).style.display = 'none';
	alert("The preview has finished! No more models to display!");
}



// ---------------------------------------------------------------
// Document Ready
// ---------------------------------------------------------------

window.onload = ( function( ) {
	// Check availability of WebGL
	if ( THREE.REVISION == '110' ){
		if ( THREE.WEBGL.isWebGLAvailable( ) === false ){
			document.body.appendChild( THREE.WEBGL.getWebGLErrorMessage( ) );
		}
	}
	else if ( THREE.REVISION == '97' ){
		if ( WEBGL.isWebGLAvailable( ) === false ){
			document.body.appendChild( WEBGL.getWebGLErrorMessage( ) );
		}
	}

	readJSON( CONFIG, function( text ){
		config = JSON.parse( text );

		pathToAssets = config.path.assets;
		pathToModels = config.path.models;
		pathToMetadata = config.path.metadata;

		sceneColor = config.sceneColor;

		rendererWidth = config.renderer.width;
		rendererHeight = config.renderer.height;
		aspectRatio = rendererWidth / rendererHeight;

		cameraLeft = config.camera.left;
    cameraRight = config.camera.right;
    cameraTop = config.camera.top;
    cameraBottom = config.camera.bottom;
    cameraNear = config.camera.near;
    cameraFar = config.camera.far;
		cameraZoom = config.camera.zoom;

		camZoomLimit = config.camZoom.limit;
		camZoomMin = config.camZoom.min;
		camZoomMax = config.camZoom.max;

    controlsRotateSpeed = config.controls.rotateSpeed;
    controlsZoomSpeed = config.controls.zoomSpeed;
		controlsPanSpeed = config.controls.panSpeed;
		controlsNoPan = config.controls.noPan;
		controlsStaticMoving = config.controls.staticMoving;
		controlsDynamicDampingFactor = config.controls.dynamicDampingFactor;

    showStats = config.io.showStats;

		if ( typeof( config.models.length ) === 'undefined' ){
			modelNum = 1;
			models[modelIndex] = config.models;
		}
		else{
			modelNum = config.models.length;
			models = config.models;
		}

		if ( aspectRatio == 1){
			initializeScene( );
		}
		else{
			getAspectRatioErrorMessage( );
		}
	});
})( );
