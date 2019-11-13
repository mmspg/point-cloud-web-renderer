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

var CONFIG = './config/config002.json';
var sessions = [];
var sessIndex = 0;



// ===============================================================
// FUNCTIONS
// ===============================================================

function initializeScene( ){
	// Set size of canvas
	canvas = document.getElementById( 'canvas' );
	canvas.width = rendererWidth;
	canvas.height = rendererHeight;

	// Set camera
	camera = new THREE.OrthographicCamera( cameraLeft, cameraRight, cameraTop, cameraBottom, cameraNear, cameraFar );
	camera.matrixAutoUpdate = false;

	// Initialize scene
	scene = new THREE.Scene( );
	scene.background = new THREE.Color( 0xC0C0C0 );

	// Initialize renderer
	renderer = new THREE.WebGLRenderer( {
		preserveDrawingBuffer: false,
		canvas: canvas,
		antialias: false
	} );
	renderer.setPixelRatio( window.devicePixelRatio );

	// Set session
	renderModel( );
}


function setSession( ){
	cameraLayouts = [];

	playback = sessions[ sessIndex ].playback;
	file = sessions[ sessIndex ].fileName;
	timeInt = sessions[ sessIndex ].timeInt;
	storeViews = sessions[ sessIndex ].storeViews;

	if ( playback ){
		readJSON( pathToCamRecords+file, function( text ){
			data = JSON.parse( text );

			rendererWidth = data.renderer.width;
			rendererHeight = data.renderer.height;

			user_id = data.user_id;
			stimuli_id = data.stimuli_id;
			user_score = data.user_score;

			cameraLeft = Number(data.camera.left);
			cameraRight = Number(data.camera.right);
			cameraBottom = Number(data.camera.bottom);
			cameraTop = Number(data.camera.top);
			cameraNear = Number(data.camera.near);
			cameraFar = Number(data.camera.far);

			// Playback the distorted model - straightforward to choose the reference instead
			fileName = data.distorted.name;
			isVoxelized = data.distorted.voxelized;
			geomResolution = data.distorted.geomResolution;
			splatScalingFactor = data.distorted.splatScalingFactor;
			pixelsPerPoint = splatScalingFactor * rendererWidth * ( 1 / geomResolution );
			splatType = data.distorted.splatType;
			pointSize = data.distorted.pointSize;

			setSizePerPoint( );
		});
	}
	else{
		rendererWidth = sessions[ sessIndex ].renderer.width;;
		rendererHeight = sessions[ sessIndex ].renderer.height;;

		cameraLeft = sessions[ sessIndex ].camera.left;
		cameraRight = sessions[ sessIndex ].camera.right;
		cameraBottom = sessions[ sessIndex ].camera.bottom;
		cameraTop = sessions[ sessIndex ].camera.top;
		cameraNear = sessions[ sessIndex ].camera.near;
		cameraFar = sessions[ sessIndex ].camera.far;

		fileName = sessions[ sessIndex ].models.name;
		isVoxelized = sessions[ sessIndex ].models.voxelized;
		geomResolution = sessions[ sessIndex ].models.geomResolution;		// For irregular point clouds, a regular grid approximation can be used to set the geomResolution parameter
		splatScalingFactor = sessions[ sessIndex ].models.splatScalingFactor;
		pixelsPerPoint = splatScalingFactor * rendererWidth * ( 1 / geomResolution );
		splatType = sessions[ sessIndex ].models.splatType;
		pointSize = sessions[ sessIndex ].models.pointSize;							// For fixed splat type, either a number, or a file name can be given. For adaptive splat type, a file name should be given
		offset = sessions[ sessIndex ].models.offset;

		setSizePerPoint( );
	}
}


function setSizePerPoint( ){
	if ( typeof(pointSize) === "number" ){
		sizePerPoint = pointSize;
		setViewsOfModel( );
	}
	else{
		readJSON( pathToAssets+pathToMetadata+pointSize, function( text ){
			sizePerPoint = JSON.parse( text );
			setViewsOfModel( );
		});
	}
}


function setViewsOfModel( ){
	// Get camera positions
	if ( playback ){
		for ( var i = 0; i < data.user_interactivity.length; i++ ){
    	cameraLayouts.push( data.user_interactivity[i].camera );
    }
    cameraIndex = 0;
    initializeScene( );
	}
	else{
		readJSON( pathToCamLayouts+file, function( text ){
	    cam = JSON.parse( text );
	    for ( var i = 0; i < cam.length; i++ ){
	    	cameraLayouts.push( cam[i] );
	    }
			cameraIndex = 0;
			initializeScene( );
		});
	}
}


function renderModel( ){
	var date = Date.now( );

	// Remove models from scenes
	if ( sessIndex > 0 ){
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

		// Add model in the scenes
		scene.add( pointcloud );

		// Scale model
		updateModelScaling( );

		// Get projected views
		getProjectedViews( );

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

	if ( playback ){
		pointcloud.geometry.center();
	}
	else{
		// Specify a constant offset to center manually a model, in order to avoid misalignments between different degradaed versions of the same model due to geometry.center()
		pointcloud.geometry.translate( offset[0], offset[1], offset[2] );
	}

	pointcloud.geometry.computeBoundingBox();
	pointcloud.geometry.attributes.position.needsUpdate = true;
}


async function getProjectedViews( ){
	// Set camera parameters
	if ( playback ){
		var d = new THREE.Vector3();
    var q = new THREE.Quaternion();
    var s = new THREE.Vector3();

    var dummy_cam = new THREE.Matrix4();
    dummy_cam.set(cameraLayouts[cameraIndex].matrix[0], cameraLayouts[cameraIndex].matrix[4], cameraLayouts[cameraIndex].matrix[8], cameraLayouts[cameraIndex].matrix[12], cameraLayouts[cameraIndex].matrix[1], cameraLayouts[cameraIndex].matrix[5], cameraLayouts[cameraIndex].matrix[9], cameraLayouts[cameraIndex].matrix[13], cameraLayouts[cameraIndex].matrix[2], cameraLayouts[cameraIndex].matrix[6], cameraLayouts[cameraIndex].matrix[10], cameraLayouts[cameraIndex].matrix[14], cameraLayouts[cameraIndex].matrix[3], cameraLayouts[cameraIndex].matrix[7], cameraLayouts[cameraIndex].matrix[11], cameraLayouts[cameraIndex].matrix[15]);

		dummy_cam.decompose( d, q, s );

		camera.position.copy( d );
		camera.quaternion.copy( q );
		camera.scale.copy( s );
	}
	else{
		camera.position.set( cameraLayouts[cameraIndex].position[0], cameraLayouts[cameraIndex].position[1], cameraLayouts[cameraIndex].position[2] );
		camera.quaternion.set( cameraLayouts[cameraIndex].quaternion[0], cameraLayouts[cameraIndex].quaternion[1], cameraLayouts[cameraIndex].quaternion[2], cameraLayouts[cameraIndex].quaternion[3] );
		camera.scale.set( 1, 1, 1 )
	}
	// camera.left = cameraLayouts[cameraIndex].left;
	// camera.right = cameraLayouts[cameraIndex].right;
	// camera.bottom = cameraLayouts[cameraIndex].bottom;
	// camera.top = cameraLayouts[cameraIndex].top;
	camera.zoom = Number(cameraLayouts[cameraIndex].zoom);
	camera.near = Number(cameraLayouts[cameraIndex].near);
	camera.far = Number(cameraLayouts[cameraIndex].far);
	camera.up = Number(cameraLayouts[cameraIndex].up);

	camera.updateMatrix( );
	camera.updateMatrixWorld( );
	camera.updateProjectionMatrix( );

	// Adjust size of splats
	if ( splatType == 'adaptive' ){
		var splatsize = pointcloud.geometry.attributes.size.array;
		if ( sizePerPoint.length != splatsize.length ){
			getNumberPointsErrorMessage( );
		}
		for ( var i = 0; i < splatsize.length; i++ ){
			splatsize[ i ] = camera.zoom * pixelsPerPoint * sizePerPoint[i]; //  = (dist[i]/voxelDepthRef) / (1/voxelDepthRef) = dist[i]
		}
		pointcloud.geometry.attributes.size.needsUpdate = true;
	}
	else{
		pointcloud.material.size = camera.zoom * pixelsPerPoint * sizePerPoint;
		pointcloud.material.needsUpdate = true;
	}

	// Take screenshot
	requestAnimationFrame( captureView );

	await sleep(timeInt);

	cameraIndex++;
	if ( cameraIndex < cameraLayouts.length ){
		requestAnimationFrame( getProjectedViews );
	}
	else{
		sessIndex++;
		if (sessIndex < sessNum){
			setSession( );
		}
	}
}


function sleep(ms) {
  return new Promise( resolve => setTimeout( resolve, ms ) );
}


function captureView( ) {
	renderer.render( scene, camera );

	if ( storeViews ){
		takeScreenshot( canvas, fileName+pad(cameraIndex, 3) )
	}
}


function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
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
		pathToCamRecords = config.path.recordings;
		pathToCamLayouts = config.path.camLayouts;

		if ( typeof( config.sessions.length ) === 'undefined' ){
			sessNum = 1;
			sessions[sessIndex] = config.sessions;
		}
		else{
			sessNum = config.sessions.length;
			sessions = config.sessions;
		}

		setSession( );
	});
})();
