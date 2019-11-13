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



// ===============================================================
// FUNCTIONS
// ===============================================================

function animate( ){
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

	rendererRef.render( sceneRef, camera );
	rendererDist.render( sceneDist, camera );
}


function initializeScene( ){
	// Choose side of reference content
	if ( models[modelIndex].reference.side == 'L' ){
		canvasRef = document.getElementById( 'canvasA' );
		canvasDist = document.getElementById( 'canvasB' );
		textRef = document.getElementById( 'textA' );
		textDist = document.getElementById( 'textB' );
	}
	else{
		canvasRef = document.getElementById( 'canvasB' );
		canvasDist = document.getElementById( 'canvasA' );
		textRef = document.getElementById( 'textB' );
		textDist = document.getElementById( 'textA' );
	}
	canvasExit = document.getElementById( 'canvasC' );

	// Set size of canvas
	canvasRef.width = rendererWidth;
	canvasRef.height = rendererHeight;
	canvasDist.width = rendererWidth;
	canvasDist.height = rendererHeight;

	// Set annotations
	textRef.width = rendererWidth;
	textRef.height = 30;
	var ctxRef = textRef.getContext( "2d" );
	ctxRef.font = "25px Arial";
	ctxRef.textAlign = "center";
	ctxRef.fillText( "Reference", rendererWidth / 2, 30 );

	textDist.width = rendererWidth;
	textDist.height = 30;
	var ctxDist = textDist.getContext( "2d" );
	ctxDist.font = "25px Arial";
	ctxDist.textAlign = "center";
	ctxDist.fillText( "Distorted", rendererWidth / 2, 30 );

	// Set text for the end of the session
	canvasExit.width = 2 * rendererWidth;
	canvasExit.height = 2 * rendererHeight;
	var ctxExit = canvasExit.getContext( "2d" );
	ctxExit.font = "20px Arial";
	ctxExit.textAlign = "center";
	ctxExit.fillText( "The session is finished. Thank you for your participation!", rendererWidth, rendererHeight / 2 );

	// Set camera
	camera = new THREE.OrthographicCamera( cameraLeft, cameraRight, cameraTop, cameraBottom, cameraNear, cameraFar );

	// Set controls
	controls = new THREE.OrthographicTrackballControls( camera );
	setControls( );

	// Initialize scenes
	sceneRef = new THREE.Scene( );
	sceneRef.background = new THREE.Color( 0xC0C0C0 );
	sceneDist = new THREE.Scene( );
	sceneDist.background = new THREE.Color( 0xC0C0C0 );

	// Initialize renderers
	rendererRef = new THREE.WebGLRenderer( {
		preserveDrawingBuffer: false, // set true to take snapshots
		canvas: canvasRef,
		antialias: false
	} );
	rendererDist = new THREE.WebGLRenderer( {
		preserveDrawingBuffer: false,	// set true to take snapshots
		canvas: canvasDist,
		antialias: false
	} );
	rendererRef.setPixelRatio( window.devicePixelRatio );
	rendererDist.setPixelRatio( window.devicePixelRatio );

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
	// Disable submit button
	document.getElementById( 'button' ).disabled = true;

	fileNameRef = models[ modelIndex ].reference.name;
	isVoxelizedRef = models[ modelIndex ].reference.voxelized;
	geomResolutionRef = models[ modelIndex ].reference.geomResolution;	// For irregular point clouds, a regular grid approximation can be used to set the geomResolutionRef parameter
	splatScalingFactorRef = models[ modelIndex ].reference.splatScalingFactor;
  pixelsPerPointRef = splatScalingFactorRef * rendererWidth * ( 1 / geomResolutionRef );
	splatTypeRef = models[ modelIndex ].reference.splatType;
	pointSizeRef = models[ modelIndex ].reference.pointSize; 						// For fixed splat type, either a number, or a file name can be given. For adaptive splat type, a file name should be given
	sideRef = models[ modelIndex ].reference.side;

  fileNameDist = models[ modelIndex ].distorted.name;
  isVoxelizedDist = models[ modelIndex ].distorted.voxelized;
  geomResolutionDist = models[ modelIndex ].distorted.geomResolution;		// For irregular point clouds, a regular grid approximation can be used to set the geomResolutionDist parameter
  splatScalingFactorDist = models[ modelIndex ].distorted.splatScalingFactor;
  pixelsPerPointDist = splatScalingFactorDist * rendererWidth * ( 1 / geomResolutionDist );
	splatTypeDist = models[ modelIndex ].distorted.splatType;
	pointSizeDist = models[ modelIndex ].distorted.pointSize; 						// For fixed splat type, either a number, or a file name can be given. For adaptive splat type, a file name should be given
	sideDist = models[ modelIndex ].distorted.side;

	if ( splatTypeRef != splatTypeDist ){
		getRenderingModeErrorMessage( );
	}
	else{
		splatType = splatTypeRef;
	}

	if ( typeof(pointSizeRef) === "number" &&  typeof(pointSizeDist) === "number" ){
		sizePerPointRef = pointSizeRef;
		sizePerPointDist = pointSizeDist;

		renderModels( );
	}
	else if ( typeof(pointSizeRef) === "string" &&  typeof(pointSizeDist) === "string" ){
	  readJSON( pathToAssets+pathToMetadata+pointSizeRef, function( text ){
		  sizePerPointRef = JSON.parse( text );

	    readJSON( pathToAssets+pathToMetadata+pointSizeDist, function( text ){
	    	sizePerPointDist = JSON.parse( text );

		    renderModels( );
	    });
		});
	}
}


function renderModels( ){
	controls.reset( );

	// Initializations
	previousCameraZoom = -1;
	if ( logInteractionData ){
		timestamps = [];
		logInteractions = [];
	}
	var date = Date.now( );

	// Remove models from scenes
	if ( modelIndex > 0 ){
    sceneRef.remove( pointcloudRef );
    sceneDist.remove( pointcloudDist );

    pointcloudRef = [ ];
    pointcloudDist = [ ];
	}

	// Prepare shader material
	if ( splatType == 'adaptive' ){
			var shaderMaterial = new THREE.ShaderMaterial( {
				vertexShader: document.getElementById( 'vertexshader' ).textContent,
				fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
				vertexColors: true
		} );
	}

	// Load models, start with the reference
	if ( fileNameRef.endsWith( 'pcd' ) ){
		var loaderRef = new THREE.PCDLoader( );
	}
	else{
		var loaderRef = new THREE.PLYLoader( );
	}

	loaderRef.load( pathToAssets+pathToModels+fileNameRef, function ( content ) {
		// Load reference point cloud
		pointcloudRef = loadPointCloud( fileNameRef, splatType, pixelsPerPointRef, shaderMaterial, content );

		if ( fileNameDist.endsWith( 'pcd' ) ){
			var loaderDist = new THREE.PCDLoader( );
		}
		else{
			var loaderDist = new THREE.PLYLoader( );
		}

		loaderDist.load( pathToAssets+pathToModels+fileNameDist, function ( content ) {
			// Load distorted model inside callback function
			pointcloudDist = loadPointCloud( fileNameDist, splatType, pixelsPerPointDist, shaderMaterial, content );

			// Add models in the scenes
			sceneRef.add( pointcloudRef );
			sceneDist.add( pointcloudDist );

			// Scale models
			updateModelsScaling( );

			// Update camera parameters
			initializeCameraParameters( true );

			// Add controls event listener
			controls.addEventListener( 'change', onPositionChange );

			console.log( 'Loading time: ' + (Date.now( ) - date)/1000 + ' sec' );
		} );
	} );
}


function updateModelsScaling( ){
	var frustumRange = camera.right - camera.left;

	if ( isVoxelizedRef ){
		var contentMaxRangeRef = geomResolutionRef;
	}
	else{
		pointcloudRef.geometry.computeBoundingBox( );
		var dimensionX = pointcloudRef.geometry.boundingBox.max.x - pointcloudRef.geometry.boundingBox.min.x;
		var dimensionY = pointcloudRef.geometry.boundingBox.max.y - pointcloudRef.geometry.boundingBox.min.y;
		var dimensionZ = pointcloudRef.geometry.boundingBox.max.z - pointcloudRef.geometry.boundingBox.min.z;
		var contentMaxRangeRef = Math.max( dimensionX, dimensionY, dimensionZ );	// = max dimension of the min bounding box
	}

	if ( isVoxelizedDist ){
		var contentMaxRangeDist = geomResolutionDist;
	}
	else{
		pointcloudDist.geometry.computeBoundingBox( );
		var dimensionX = pointcloudDist.geometry.boundingBox.max.x - pointcloudDist.geometry.boundingBox.min.x;
		var dimensionY = pointcloudDist.geometry.boundingBox.max.y - pointcloudDist.geometry.boundingBox.min.y;
		var dimensionZ = pointcloudDist.geometry.boundingBox.max.z - pointcloudDist.geometry.boundingBox.min.z;
		var contentMaxRangeDist = Math.max( dimensionX, dimensionY, dimensionZ );	// = max dimension of the min bounding box
	}

	pointcloudRef.geometry.scale( frustumRange / contentMaxRangeRef, frustumRange / contentMaxRangeRef, frustumRange / contentMaxRangeRef );
	pointcloudDist.geometry.scale( frustumRange / contentMaxRangeDist, frustumRange / contentMaxRangeDist, frustumRange / contentMaxRangeDist );
	pointcloudRef.geometry.center( );
	pointcloudDist.geometry.center( );

	pointcloudRef.geometry.computeBoundingBox( );
	pointcloudRef.geometry.computeBoundingSphere( );

	pointcloudRef.geometry.attributes.position.needsUpdate = true;
	pointcloudDist.geometry.attributes.position.needsUpdate = true;
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

	pointcloudRef.geometry.computeBoundingSphere();
	var radius = 2 * pointcloudRef.geometry.boundingSphere.radius;

	var x = radius * Math.sin( theta ) * Math.cos( phi );
	var y = radius * Math.sin( theta ) * Math.sin( phi );
	var z = radius * Math.cos( theta );

	camera.zoom = cameraZoom;
	camera.position.set( x, y, z );
	camera.lookAt( pointcloudRef.geometry.boundingSphere.center.x, pointcloudRef.geometry.boundingSphere.center.y, pointcloudRef.geometry.boundingSphere.center.z );
	camera.near = cameraNear;
	camera.far = cameraFar;

	camera.updateProjectionMatrix( );
	onPositionChange( );
}


function onPositionChange ( ev ) {
	// Adjust size of splats
	if ( previousCameraZoom != camera.zoom ){
		if ( splatType == 'adaptive' ){
			var splatsizeRef = pointcloudRef.geometry.attributes.size.array;
			if ( sizePerPointRef.length != splatsizeRef.length ){
				getNumberPointsErrorMessage( );
			}
			for ( var i = 0; i < splatsizeRef.length; i++ ){
				splatsizeRef[ i ] = camera.zoom * pixelsPerPointRef * sizePerPointRef[i];
			}

			var splatsizeDist = pointcloudDist.geometry.attributes.size.array;
			if ( sizePerPointDist.length != splatsizeDist.length ){
				getNumberPointsErrorMessage( );
			}
			for ( var i = 0; i < splatsizeDist.length; i++ ){
				splatsizeDist[ i ] = camera.zoom * pixelsPerPointDist * sizePerPointDist[i];
			}

			pointcloudRef.geometry.attributes.size.needsUpdate = true;
			pointcloudDist.geometry.attributes.size.needsUpdate = true;
		}
		else{
			pointcloudRef.material.size = camera.zoom * pixelsPerPointRef * sizePerPointRef;
			pointcloudDist.material.size = camera.zoom * pixelsPerPointDist * sizePerPointDist;

			pointcloudRef.material.needsUpdate = true;
			pointcloudDist.material.needsUpdate = true;
		}
	}

	// Store new camera positions with corresponding timestamps, after the models are rendered to obtain correct camera parameters
	if ( logInteractionData ){
		requestAnimationFrame( updateLogInteractionData );
	}
}


function updateLogInteractionData( ){
 var cam = {
		left: camera.left,
		right: camera.right,
		bottom: camera.bottom,
		top: camera.top,
		near: camera.near,
		far: camera.far,
		up: camera.up.toArray(),
		zoom: camera.zoom,
		matrix: camera.matrix.toArray()
	};
	timestamps.push( Date.now( ) );
	logInteractions.push( cam );
	previousCameraZoom = camera.zoom;
}


function onKeyPress( e ) {
	if ( e.code == "KeyR" ){
		controls.reset( );
		initializeCameraParameters( true );
	}

	// if ( e.code == "KeyS" ){
	// 	takeScreenshot( canvasRef, 'snapshotRef', canvasDist, 'snapshotDist' );
	// }

	if ( e.code == "KeyH"){
		setControls( );
		initializeCameraParameters( true );
		controls.addEventListener( 'change', onPositionChange );
	}
}


function onSelecting( ){
	document.getElementById( 'button' ).disabled = false;
}


function onRating( ){
	var scoreIDs = [ 'r1', 'r2', 'r3', 'r4', 'r5' ]

	for ( var i = 0; i < scoreIDs.length; i++ ){
		if ( document.getElementById( scoreIDs[ i ] ).checked ) {
  		score = document.getElementById( scoreIDs[ i ] ).value;
  		document.getElementById( scoreIDs[ i ] ).checked = false;
		}
	}

	if ( logInteractionData ){
		updateLogInteractionData( );
	}

	if ( logScores ){
		storeRecordings( );
	}

	modelIndex++;

	updateProgressBar( modelIndex, modelNum );

	if (modelIndex < modelNum){
		controls.removeEventListener( 'change', onPositionChange );
		setModels( );
	}
	else{
		controls.removeEventListener( 'change', onPositionChange );
		closeSession( );
	}
}


function updateProgressBar( cur, len ){
	var elem = document.getElementById("bar");
	elem.style.width = ( cur / len ) * 100 + '%';
}


function storeRecordings( ){
	var xhr = new XMLHttpRequest( );
  xhr.open( "POST", 'http://localhost:8888/point-cloud-web-renderer/htdocs/pointCloudQualityAssessmentTestbed/php/storeData.php', true );
  xhr.setRequestHeader( "Content-Type", "application/json;charset=UTF-8" );

 	// Constructor for object
  function dataObject( ts, cam ){
  	this.timestamp = ts;
  	this.camera = cam;
  }

	// Information at each time instance
	var recInteractivity = [ ];
	if ( logInteractionData ){
		for ( var i = 0; i < timestamps.length; i++ ){
			var res = new dataObject( timestamps[ i ], logInteractions[ i ] );
			recInteractivity.push( res );
		}
	}

	// Store data in JSON format
	var obj = {
		user_id: CONFIG,
   	stimuli_id: modelIndex,
   	user_score: score,
   	reference: {name:fileNameRef, voxelized:isVoxelizedRef, geomResolution:geomResolutionRef, splatScalingFactor:splatScalingFactorRef.toFixed(3), splatType:splatType, pointSize:pointSizeRef, side:sideRef},
   	distorted: {name:fileNameDist, voxelized:isVoxelizedDist, geomResolution:geomResolutionDist, splatScalingFactor:splatScalingFactorDist.toFixed(3), splatType:splatType, pointSize:pointSizeDist, side:sideDist},
		camera: {left:camera.left, right:camera.right, bottom:camera.bottom, top:camera.top, near:camera.near, far:camera.far},
   	user_interactivity: recInteractivity,
   	renderer: {width:rendererWidth, height:rendererHeight}
	};
	jsonData = JSON.stringify( obj, null, "\t" );

	console.log( "Uploading data..." );
	xhr.send( jsonData );
}


function closeSession( ){
	sceneRef.remove( pointcloudRef );
  sceneDist.remove( pointcloudDist );

	sceneRef.remove( pointcloudRef );
  sceneDist.remove( pointcloudDist );

	var ctxRef = textRef.getContext( "2d" );
	ctxRef.clearRect(0, 0, textRef.width, textRef.height)

	var ctxDist = textDist.getContext( "2d" );
	ctxDist.clearRect(0, 0, textDist.width, textDist.height)

	rendererRef.clear()
	rendererDist.clear()

	canvasRef.style.display = "none";
	canvasDist.style.display = "none";
	document.getElementById( "menu" ).style.display = "none";
	canvasExit.style.display = "initial";
}



// ---------------------------------------------------------------
// Document Ready
// ---------------------------------------------------------------
window.onload = ( function() {
	// Check availability of WebGL
	if ( WEBGL.isWebGLAvailable( ) === false ){
		document.body.appendChild( WEBGL.getWebGLErrorMessage( ) );
	}

	readJSON( CONFIG, function( text ){
		config = JSON.parse( text );

		pathToAssets = config.path.assets;
		pathToModels = config.path.models;
		pathToMetadata = config.path.metadata;

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
		logInteractionData = config.io.logInteractionData; // Note that the software doesn't handle excessive recordings of interactivity information
		logScores = config.io.logScores;

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
})();
