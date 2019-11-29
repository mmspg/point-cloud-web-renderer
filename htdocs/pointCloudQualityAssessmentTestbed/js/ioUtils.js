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


function loadPointCloud( fileName, splatType, pixelsPerPoint, shaderMaterial, content ) {
  if ( splatType == 'adaptive' ){
    if ( fileName.endsWith( 'pcd' ) ){
      var positions = content.geometry.attributes.position.array;
      var colors = content.geometry.attributes.color.array;
      var len = content.geometry.attributes.position.array.length / 3;
    }
    else{
      var positions = content.attributes.position.array;
      var colors = content.attributes.color.array;
      var len = content.attributes.position.array.length / 3;
    }
    var sizes = new Float32Array( new Array( len ).fill( 1 ) );

    var geometry = new THREE.BufferGeometry( );
    if ( THREE.REVISION == '110' ){
      geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
      geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
      geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setUsage( 35048 ) ); // ENUM for DynamicDrawUsage (i.e., instead of setDynamic( true ))
    }
    else if ( THREE.REVISION == '97' ){
      geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
      geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
      geometry.addAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setDynamic( true ) );
    }

    pointcloud = new THREE.Points( geometry, shaderMaterial );
  }
  else{
    if ( fileName.endsWith( 'pcd' ) ){
      content.material.size = pixelsPerPoint;

      pointcloud = content;
    }
    else{
      geometry = content;
      var material = new THREE.PointsMaterial( { vertexColors: THREE.VertexColors, size: pixelsPerPoint, sizeAttenuation: true } );

      pointcloud = new THREE.Points( geometry, material );
    }
  }
  pointcloud.name = fileName;

  return pointcloud;
}


function readJSON( file, callback ) {
  var rawFile = new XMLHttpRequest( );
  rawFile.overrideMimeType( 'application/json' );
  rawFile.open( 'GET', file, true );
  rawFile.onreadystatechange = function( ) {
    if ( rawFile.readyState === 4 && rawFile.status == '200' ){
      callback( rawFile.responseText );
    }
  }
  rawFile.send( null );
}


function takeScreenshot( canvasA, fileNameA, canvasB, fileNameB ) {
	canvasA.toBlob( function( blob ) {
    saveAs( blob, fileNameA+'.png' );
	});

  if ( canvasB !== undefined && canvasB.length != 0 && fileNameB !== undefined && fileNameB.length != 0 ){
    canvasB.toBlob( function( blob ) {
      saveAs( blob, fileNameB+'.png' );
  	});
  }
}


function getAspectRatioErrorMessage( ){
	var e = new Error( 'The aspect ratio of the renderer (i.e., width/height) should be 1.' );
	throw e;
}


function getNumberPointsErrorMessage( ){
	var e = new Error( 'The number of points of the model and the size attribute is not the same.' );
	throw e;
}


function getRenderingModeErrorMessage( ){
	var e = new Error( 'The same splat type should be used in both point cloud models.' );
	throw e;
}
