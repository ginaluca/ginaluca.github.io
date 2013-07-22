/*global THREE Rubik buildCubelet*/

var COLORS = {inside:0x2c2c2c,top:0xFF00FF,bottom:0x00FF00,left:0xFFFF00,right:0x0000FF,front:0xFF0000,back:0x00FFFF}; // mutually complementary colors
var CUBE_SIZE = 20;

var container;
var windowSize;
var camera;
var cameraControls;
var scene; 
var renderer;
var cube;
var projector;
var raycaster;
var mousepx = new THREE.Vector2();
var possibleRotation;

function init(containerId) {

    windowSize = calcWindowSize();
    
	camera = new THREE.PerspectiveCamera( 45, windowSize.ratio, 1, 4000 );
    camera.position.z = 500;
	cameraControls = new THREE.OrbitControls( camera);
    
    projector  = new THREE.Projector();
    raycaster = new THREE.Raycaster();
    
    scene = new THREE.Scene();
    cube = createCube();
	scene.add( cube);
	// scene.add( mainBlock(200, new THREE.MeshLambertMaterial( { color: 0x5F5F5F, shading: THREE.SmoothShading })));
    
    scene.add(directionalLight(1, 2, 3, 1.0));
    scene.add(directionalLight(-1, -2, -3, 0.5));
    // scene.add(new THREE.AmbientLight(0x0a0a0a));
	
	renderer = createRenderer(windowSize);

    container = document.createElement('div');
    document.body.appendChild(container);

	container.addEventListener( 'mousedown', onEngageStart, false );
	container.addEventListener( 'touchstart', onEngageStart, false );
	container.addEventListener( 'mousemove', onEngageContinue, false );
	container.addEventListener( 'touchmove', onEngageContinue, false );
    container.addEventListener( 'mouseup', onEngageEnd, false );
    container.addEventListener( 'touchend', onEngageEnd, false );
    container.appendChild( renderer.domElement );
    
    animate();
}

function directionalLight(x, y, z, intensity) {
    var dl = new THREE.DirectionalLight(0xffffff, intensity);
    dl.position = new THREE.Vector3(x, y, z);
    return dl;
}

function createCube() {
    return new Rubik('3x3x3'.value, 200, 0.3, buildCubelet);
}

function calcWindowSize() {
    var  size =  {
        width: window.innerWidth,
        height: window.innerHeight
    };
    size.ratio = size.width / size.height;
    return size;    
}

function createRenderer(size) {
	var renderer = new THREE.WebGLRenderer({ antialias: true } );
    
    renderer.sortObjects = false;
    
    // TODO: set these to false and see what happens
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    
	renderer.setSize( size.width, size.height );
    renderer.setClearColor(0x000000, 1.0);
    return renderer;
}

function animate() {

	requestAnimationFrame( animate );

    cameraControls.update();
    render();
}

function render() {
    TWEEN.update();
	renderer.render( scene, camera );
}

// TODO: when a corner cubelet is clicked, rotate counterclockwise
function calculateRotation(cubeletseenas, faceasseen) {
    if (cubeletseenas.xx == 1 && cubeletseenas.yy == 1) {
        return { axis: 'z', row: cubeletseenas.zz, angle: cubeletseenas.zz? -1: 1 };
    }
    if (cubeletseenas.yy == 1 && cubeletseenas.zz == 1) {
        return { axis: 'x', row: cubeletseenas.xx, angle: cubeletseenas.xx? -1: 1 };
    }
    if (cubeletseenas.zz == 1 && cubeletseenas.xx == 1) {
        return { axis: 'y', row: cubeletseenas.yy, angle: cubeletseenas.yy? -1: 1 };
    }
    var r = {};
    if (cubeletseenas.xx == 1) {
        r.row = cubeletseenas.xx;
        r.axis = 'x';
        r.angle = boolToInt(
            ( faceasseen == 'front' && cubeletseenas.yy === 0 ) ||
            ( faceasseen == 'back' && cubeletseenas.yy !== 0 ) ||
            ( faceasseen == 'top' && cubeletseenas.zz !== 0 ) ||
            ( faceasseen == 'bottom' && cubeletseenas.zz === 0 ));
        
        return r;
    }
    else if (cubeletseenas.yy == 1) {
        r.row = cubeletseenas.yy;
        r.axis = 'y';
        r.angle = boolToInt(
            ( faceasseen == 'left' && cubeletseenas.zz !== 0 ) ||
            ( faceasseen == 'right' && cubeletseenas.zz === 0 ) ||
            ( faceasseen == 'front' && cubeletseenas.xx !== 0 ) ||
            ( faceasseen == 'back' && cubeletseenas.xx === 0 ));
        
        return r;
    }
    else if (cubeletseenas.zz == 1 ) {
        r.row = cubeletseenas.zz;
        r.axis = 'z';
        r.angle = boolToInt(
            ( faceasseen == 'top' && cubeletseenas.xx === 0 ) ||
            ( faceasseen == 'bottom' && cubeletseenas.xx !== 0 ) ||
            ( faceasseen == 'left' && cubeletseenas.yy === 0 ) ||
            ( faceasseen == 'right' && cubeletseenas.yy !== 0 ));
        
        return r;
    }
    return null;
    
}

function boolToInt(b) {
    return b? 1: -1;
}

function onEngageStart( event ) {
    mousepx = getEventPosition(event);

    event.preventDefault();
    
	var target=getCubelet(event);
    if (target==null) return;
    cube.decorateFacesAsSeen(target.cubelet);
	var cubeletseenas=cube.getCubeletSeenCoords(target.cubelet);
    // console.log(target.face.asseen);
    // console.log(cubeletseenas);
	
    possibleRotation = calculateRotation(cubeletseenas, target.face.asseen);
}

function onEngageContinue( event ) {
    var newMousePx = getEventPosition(event);
    if (newMousePx == null) {
        return;
    }
    
    if (newMousePx.sub(mousepx).length() > 10.0) {
        possibleRotation = null;
        return;
    }

}

function onEngageEnd( event ) {

    if (possibleRotation) {
        possibleRotation.duration = 0.3;
        cube.rotate(possibleRotation);
        possibleRotation = null;
    }
}

function getNormalizedEventPosition(event) {
    
    var pos = getEventPosition(event);
    pos.x = ( pos.x / windowSize.width ) * 2 - 1;
    pos.y = - ( pos.y / windowSize.height ) * 2 + 1;
    return pos;
}

function getEventPosition(event) {
    if (event.type == 'mousedown' || event.type == 'mouseup' || event.type == 'mousemove') {
        return new THREE.Vector2(event.clientX, event.clientY);
    } else if (event.type == 'touchstart' || event.type == 'touchend' || event.type == 'touchmove') {
        return new THREE.Vector2(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY);
    }
}

function getCubelet(event)
{
    var mouse = getNormalizedEventPosition(event);
    // console.log(mouse);
    
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	projector.unprojectVector( vector, camera );

    raycaster.set( camera.position, vector.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( cube.children );

	if ( intersects.length > 0 ) {
		return({
            cubelet: intersects[0].object,
            face: intersects[0].face
            });
	}
	return(null);
}

