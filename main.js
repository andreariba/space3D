import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import Stats from 'three/examples/jsm/libs/stats.module'

let camera, scene, renderer, pointer, starGroup;
const LIGHTYEAR_PER_PARSEC = 3.26156;
const canvasWidth = () => {
    // return Math.floor(window.innerWidth*3/4);
    return window.innerWidth;
}
const canvasHeight = () => {
    return window.innerHeight;
}

camera = new THREE.PerspectiveCamera( 45, canvasWidth() / canvasHeight(), 0.1, 1000 );
camera.position.set( 0, 0, 5 );

const distanceRange = document.getElementById("distanceRange");
const distanceRangeLabel = document.getElementById("distanceRangeLabel");

const universeMesh = new THREE.Mesh(
    new THREE.SphereGeometry( Math.pow(10, distanceRange.value)/LIGHTYEAR_PER_PARSEC, 16, 16 ), 
    new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true
    })
);

scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(1));
scene.add(universeMesh);

distanceRange.addEventListener("change", async(event) => {

    
    const radius = Math.round(Math.pow(10,event.target.value));
    console.log("Universe radius: ", radius);
    distanceRangeLabel.innerText = 'Distance: '+radius+' ly';

    universeMesh.geometry = new THREE.SphereGeometry( radius/LIGHTYEAR_PER_PARSEC, 16, 16 );

    // console.log("before:", scene);
    let starObj = scene.getObjectByName( "stars" );
    // console.log(starObj);
    starObj.children.slice().forEach(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        starObj.remove(obj);
    });
    starObj.removeFromParent();
    scene.remove(starObj);
    // console.log("after:", scene);
    starGroup = await createStarGroup(radius/LIGHTYEAR_PER_PARSEC);
    
    scene.add(starGroup);
    console.log(scene);
});


const raycaster = new THREE.Raycaster();
pointer = new THREE.Vector2(canvasWidth(), canvasHeight());

function onPointer( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / canvasWidth() ) * 2 - 1;
	pointer.y = - ( event.clientY / canvasHeight() ) * 2 + 1;

    render();

}
window.addEventListener( 'click', onPointer );

// const stats = new Stats()
// document.body.appendChild(stats.dom)

renderer = new THREE.WebGLRenderer(); // { antialias: true } 
renderer.setSize( canvasWidth(), canvasHeight() );
document.body.appendChild( renderer.domElement );

class DescriptiveMesh extends THREE.Mesh {
    constructor(geometry, material, info) {
      super(geometry, material);
      this.info = info;
    }
}


const createStarMesh = (x,y,z, info) => {

    const starGeometry = new THREE.SphereGeometry( 0.1, 32, 16 ); 
    const starTexture = new THREE.TextureLoader().load('sun_texture.jpg');
    const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture });
    const starMesh = new DescriptiveMesh(starGeometry, starMaterial, info);
    starMesh.position.set(x, y, z);
    starMesh.material.color.set( info['color'] );

    return starMesh;
}

const createStarGroup = async(maxRadius) => {
    const response = await fetch("closest_stars.json");
    const json = await response.json();
    const newStarGroup = new THREE.Group();
    json.forEach(function (row) {
        if( row['dist']<maxRadius) {
            let newStar = createStarMesh(row['x'], row['y'], row['z'], row);
            newStarGroup.add(newStar);
            // console.log(row['proper'], row['mag'], row["spect"]);
        }
    });
    newStarGroup.name = 'stars';
    return newStarGroup;
}

createStarGroup( Math.pow(10,distanceRange.value)/LIGHTYEAR_PER_PARSEC ).then( (starGroup) => scene.add( starGroup ) );
// scene.add( starGroup );
console.log(scene);
const starInfo = document.getElementById('star-info');

var ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const controls = new OrbitControls( camera, renderer.domElement );
controls.addEventListener('change', render);

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = canvasWidth() / canvasHeight()
    camera.updateProjectionMatrix()
    renderer.setSize(canvasWidth(), canvasHeight())
    render()
}

function render() {
    // update the picking ray with the camera and pointer position
	raycaster.setFromCamera( pointer, camera );

    let starObj = scene.getObjectByName( "stars" );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( starObj.children );
    
    if( intersects.length>0) {
        let star = intersects[0];
        console.log(star);
        // starInfo.left = (pointer.x+1)*canvasWidth()/2+'px';
        // starInfo.top = (1-pointer.y)*canvasHeight()/2+'px';
        starInfo.innerText = 'Name: '+ star.object.info['proper']
                           + '\nDistance: ' + Math.round(star.object.info['dist']*LIGHTYEAR_PER_PARSEC*100)/100 + ' ly'
                           + '\nMagnitude: ' + star.object.info['mag']
                           + '\nSpectral type: ' + star.object.info['spect']
                           + '\nConstellation: ' + star.object.info['con'];
        
        pointer = new THREE.Vector2(canvasWidth(), canvasHeight());
	}

    renderer.render( scene, camera );
}

THREE.DefaultLoadingManager.onLoad = function () { render(); };

// render();

// function animate() {
// 	requestAnimationFrame( animate );
//     stats.update();
// }
// animate()
