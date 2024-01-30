import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module'

let camera, scene, renderer, pointer, starGroup;

const canvasWidth = () => {
    return Math.floor(window.innerWidth*3/4);
}
const canvasHeight = () => {
    return window.innerHeight;
}

camera = new THREE.PerspectiveCamera( 45, canvasWidth() / canvasHeight(), 0.1, 1000 );
camera.position.set( 0, 0, 5 );

const distanceRange = document.getElementById("distanceRange");

const universeMesh = new THREE.Mesh(
    new THREE.SphereGeometry( distanceRange.value, 16, 16 ), 
    new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true
    })
);

distanceRange.addEventListener("change", async(event) => {
    console.log("Universe radius: ",event.target.value);
    universeMesh.geometry = new THREE.SphereGeometry( event.target.value, 16, 16 );
    starGroup = await createStarGroup(event.target.value);
    scene.add( starGroup );
});

scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(1));
scene.add(universeMesh);

const raycaster = new THREE.Raycaster();
pointer = new THREE.Vector2(canvasWidth(), canvasHeight());

function onPointer( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / canvasWidth() ) * 2 - 1;
	pointer.y = - ( event.clientY / canvasHeight() ) * 2 + 1;

}
window.addEventListener( 'click', onPointer );

const stats = new Stats()
document.body.appendChild(stats.dom)

renderer = new THREE.WebGLRenderer( { antialias: true } );
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
    const starTexture = new THREE.TextureLoader().load('public/sun_texture.jpg');
    const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture });
    const starMesh = new DescriptiveMesh(starGeometry, starMaterial, info);
    starMesh.position.set(x, y, z);
    starMesh.material.color.set( info['color'] );

    return starMesh;
}

const createStarGroup = async(maxRadius) => {
    const response = await fetch("public/closest_stars.json");
    const json = await response.json();
    const starGroup = new THREE.Group();
    json.forEach(function (row) {
        if( row['dist']<maxRadius) {
            let newStar = createStarMesh(row['x'], row['y'], row['z'], row);
            starGroup.add(newStar);
            console.log(row['proper'], row['mag'], row["spect"]);
        }
    });
    return starGroup;
}

// const response = await fetch("public/closest_stars.json");
// const json = await response.json();
// const starGroup = new THREE.Group();
// json.forEach(function (row) {
//     let newStar = createStarMesh(row['x'], row['y'], row['z'], row);
//     starGroup.add(newStar);
//     console.log(row['proper'], row['mag'], row["spect"]);
// });

starGroup = await createStarGroup(distanceRange.value);
scene.add( starGroup );
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

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( starGroup.children );
    
    if( intersects.length>0) {
        let star = intersects[0];
        console.log(star);
        // starInfo.left = (pointer.x+1)*canvasWidth()/2+'px';
        // starInfo.top = (1-pointer.y)*canvasHeight()/2+'px';
        starInfo.innerText = 'Name: '+ star.object.info['proper']
                           + '\nDistance: ' + Math.round(star.object.info['dist']*326.156)/100 + ' ly'
                           + '\nMagnitude: ' + star.object.info['mag']
                           + '\nSpectral type: ' + star.object.info['spect']
                           + '\nConstellation: ' + star.object.info['con'];
        
        pointer = new THREE.Vector2(canvasWidth(), canvasHeight());
	}

    renderer.render( scene, camera );
}

function animate() {
	requestAnimationFrame( animate );
    stats.update();
    render();
}
animate()
