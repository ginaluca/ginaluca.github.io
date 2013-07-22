/*global THREE */

var ROTATE_90_AROUND_X = new THREE.Vector3(Math.PI / 180 * 90, 0, 0);
var ROTATE_90_AROUND_Y = new THREE.Vector3(0, Math.PI / 180 * 90, 0);
var ROTATE_90_AROUND_Z = new THREE.Vector3(0, 0, Math.PI / 180 * 90);

var BEVEL_RADIUS_PERC = 0.05;

function moveAlongX(distance) {
    return new THREE.Vector3(distance, 0, 0);
}

function moveAlongY(distance) {
    return new THREE.Vector3(0, distance, 0);
}

function moveAlongZ(distance) {
    return new THREE.Vector3(0, 0, distance);
}

function faceMesh(faceGeometry, color, rotation, trnslation) {
    var mesh = new THREE.Mesh( 
        faceGeometry, 
        new THREE.MeshPhongMaterial( { color: color, specular: 0xffffff, emissive: 0x000000, 
        ambient: 0x000000, shininess: 20, shading: THREE.SmoothShading, opacity: 1.0, transparent: false } ));
    if (rotation) {
        mesh.rotation = rotation;
    }
    mesh.position = trnslation;
    return mesh;
}

function faceMeshGen(faceGeometry) {
    return function(color, rotation, trnslation) {
        return faceMesh(faceGeometry, color, rotation, trnslation);
    }
}

/**
 * position: THREE.Vector3 
 * cubeMetrics: { cubeletCount: {x: 3, y: 3, z: 3}, cubeSize: 20}
 * 
 * returns the cubelet as a Mesh
 **/
function buildCubelet(position, cubeMetrics) {
    
    var cubeletSize = cubeMetrics.cubeSize / cubeMetrics.cubeletCount.x;
    var cubeletSizeReduced = cubeletSize * (1 - BEVEL_RADIUS_PERC * 2);
    var mesh = faceMeshGen(new THREE.CubeGeometry( 1, cubeletSizeReduced, cubeletSizeReduced, 1, 1, 1 ));
    
    var cubelet = mainBlock(cubeletSize, new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0xffffff, emissive: 0x000000, 
        ambient: 0x000000, shininess: 20, shading: THREE.SmoothShading, opacity: 1.0, transparent: false } ));
    // var cubelet = mainBlock(cubeletSize, new THREE.MeshLambertMaterial( { color: 0x5F5F5F, shading: THREE.SmoothShading }));
    // var cubelet =new THREE.Mesh( 
    //     new THREE.CubeGeometry( cubeletSize, cubeletSize, cubeletSize, 1, 1, 1 ), 
    //     new THREE.MeshLambertMaterial( { color: 0x5F5F5F, shading: THREE.SmoothShading }) );
    
    
	if (position.y == 0)
	{
        cubelet.add(mesh(COLORS.bottom, ROTATE_90_AROUND_Z, moveAlongY( -cubeletSize / 2 + 1/2)));
	}
	if (position.y==cubeMetrics.cubeletCount.y-1)
	{
        cubelet.add(mesh(COLORS.top, ROTATE_90_AROUND_Z, moveAlongY( cubeletSize / 2 - 1/2)));
	}
	if (position.x ==cubeMetrics.cubeletCount.x-1)
	{
        cubelet.add(mesh(COLORS.right, undefined, moveAlongX( cubeletSize / 2 - 1/2)));
	}
	if (position.x==0)
	{
        cubelet.add(mesh(COLORS.left, undefined, moveAlongX( -cubeletSize / 2 + 1/2)));
	}
	if (position.z==cubeMetrics.cubeletCount.z-1)
	{
        cubelet.add(mesh(COLORS.front, ROTATE_90_AROUND_Y, moveAlongZ( cubeletSize / 2 - 1/2)));
	}
	if (position.z==0)
	{
        cubelet.add(mesh(COLORS.back, ROTATE_90_AROUND_Y, moveAlongZ( -cubeletSize / 2 + 1/2)));
	}
	
	cubelet.overdraw = true;
    
    // TODO: move to rubik.js
	cubelet.extra_data={xx:position.x ,yy:position.y,zz:position.z};
    
    return cubelet;
}

function mainBlock(cubeletSize, material) {
        
    var bevelRadius = cubeletSize * BEVEL_RADIUS_PERC;
    var block =new THREE.Mesh( 
        new THREE.CubeGeometry( cubeletSize - bevelRadius * 2, cubeletSize - bevelRadius * 2, cubeletSize - bevelRadius * 2, 1, 1, 1 ), 
        material );
        
    var sphere = new THREE.SphereGeometry(bevelRadius, 16, 12);    
    for (var i = -1; i < 2; i += 2) {
        for (var j = -1; j < 2; j += 2) {
            for (var k = -1; k < 2; k += 2) {
                var cornerBall = new THREE.Mesh(sphere, 
                    material);
                cornerBall.position.x  = i * (cubeletSize / 2 - bevelRadius);
                cornerBall.position.y  = j * (cubeletSize / 2 - bevelRadius);
                cornerBall.position.z  = k * (cubeletSize / 2 - bevelRadius);
                block.add(cornerBall);
            }
        }
    }
        
    var cyl = new THREE.CylinderGeometry(bevelRadius, bevelRadius, cubeletSize - bevelRadius * 2, 16);
    for (var i = -1; i < 2; i += 2) {
        for (var j = -1; j < 2; j += 2) {
            
            var edgeCyl = new THREE.Mesh(cyl, 
                material);
            edgeCyl.position.x  = i * (cubeletSize / 2 - bevelRadius);
            edgeCyl.position.z  = j * (cubeletSize / 2 - bevelRadius);
            block.add(edgeCyl);
            
            edgeCyl = new THREE.Mesh(cyl, 
                material);
            edgeCyl.rotation.x = Math.PI / 2;    
            edgeCyl.position.y  = i * (cubeletSize / 2 - bevelRadius);
            edgeCyl.position.x  = j * (cubeletSize / 2 - bevelRadius);
            block.add(edgeCyl);
            
            edgeCyl = new THREE.Mesh(cyl, 
                material);
            edgeCyl.rotation.z = Math.PI / 2;    
            edgeCyl.position.y  = i * (cubeletSize / 2 - bevelRadius);
            edgeCyl.position.z  = j * (cubeletSize / 2 - bevelRadius);
            block.add(edgeCyl);
        }
    }

    
    return block;
    
}



