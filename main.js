import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module'

let camera, scene, renderer, pointer;

camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, 5 );
// camera.layers.enableAll();

scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(1));

const raycaster = new THREE.Raycaster();
pointer = new THREE.Vector2(window.innerWidth, window.innerHeight);

function onPointer( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}
window.addEventListener( 'click', onPointer );

const stats = new Stats()
document.body.appendChild(stats.dom)

renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

class DescriptiveMesh extends THREE.Mesh {
    constructor(geometry, material, info) {
      super(geometry, material);
      this.info = info;
    }
    desc() {
      return this.present() + ', it is a ' + this.model;
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


const response = await fetch("public/closest_stars.json");
const json = await response.json();
const starGroup = new THREE.Group();
json.forEach(function (row) {
    let newStar = createStarMesh(row['x'], row['y'], row['z'], row);
    starGroup.add(newStar);
    console.log(row['proper'], row['mag'], row["spect"]);
});

scene.add(starGroup);
console.log(scene);
const starInfo = document.getElementById('star-info');

var ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

const controls = new OrbitControls( camera, renderer.domElement );
controls.addEventListener('change', render);
// controls.update();

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
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
        starInfo.left = (pointer.x+1)*window.innerWidth/2+'px';
        starInfo.top = (1-pointer.y)*window.innerHeight/2+'px';
        starInfo.innerText = 'Name: '+ star.object.info['proper']
                           + '\nDistance: ' + Math.round(star.object.info['dist']*326.156)/100 + ' ly'
                           + '\nMagnitude: ' + star.object.info['mag']
                           + '\nSpectral type: ' + star.object.info['spect']
                           + '\nConstellation: ' + star.object.info['con'];
        
        pointer = new THREE.Vector2(window.innerWidth, window.innerHeight);
	}

    renderer.render( scene, camera );
}

function animate() {
	requestAnimationFrame( animate );
    stats.update();
    render();
    // renderer.render( scene, camera );
    // labelRenderer.render( scene, camera );
}
animate()
