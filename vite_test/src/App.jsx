import { useState, useRef, useEffect, createElement } from 'react'
//import './tfjs.js';
//import Tiff from 'tiff.js'
import * as THREE from 'three'
import './externals/tiff'
import './App.css'

import FileLoader from './loaders/file_loader.js'
import TextureLoader from './loaders/tex_loader.js'
import NormalMapGenerator from './model/normal_map_generator'
import ThreeRenderer from './renderer/three_renderer'
import SceneCreator from './renderer/scene_creator'

const normalMapGenerator = new NormalMapGenerator();
const threeRenderer = new ThreeRenderer();
const sceneCreator = new SceneCreator(threeRenderer);
var renderer;

window.onload = function() {
   normalMapGenerator.loadModel('/model/model.json');
   sceneCreator.init();
   setRendererInitializedOuter(true);
}


var textureImgData;
var normalTexImgData;

function generateButtonClickedHandle(setNormalMapGenerated) {
   normalMapGenerator.generateNormalMap(textureImgData, canvas => {
      normalTexImgData = canvas.getContext('2d').getImageData(0, 0, 512, 512);
      setNormalMapGenerated(true);
   });
}

function upload_texture(textureWidth, textureHeight, onLoad)
{
   var loader = new FileLoader();
   loader.load(new TextureLoader(), onLoad);
}

function TexturePlaceholder({setImgLoaded, textureWidth, textureHeight}) {
   function uploadClickHandle() {
      upload_texture(textureWidth, textureHeight, 
         imageData => {
            textureImgData = imageData;
            setImgLoaded(true);
            //var canvas = canvasRef.current;
            //canvas.putImageData(textureImgData);
         });
   }

   return (
      <>
         <div className="imgPlaceholder">
            <button onClick={uploadClickHandle}>Upload</button>
         </div>
      </>
   );
}

function TextureCanvas({textureWidth, textureHeight, contentImageData}) {
   const canvasRef = useRef(null);
   useEffect(() => {
      if (contentImageData) {
         var canvas = canvasRef.current;
         canvas.getContext('2d').putImageData(contentImageData, 0, 0);
      }
   }, []);

   return (
      <span>
         <canvas ref={canvasRef} width={textureWidth} height={textureHeight}></canvas>
      </span>
   );
}

function RendererCanvas() {
   const canvasRef = useRef(null);

   /*
   const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
   camera.position.z = 1;
   const scene = new THREE.Scene();

   // LIGHTS
   var light = new THREE.AmbientLight( 0x404040 ); // soft white light
   scene.add( light );
   var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
   scene.add( directionalLight );

   //const geometry = new THREE.BoxGeometry( 0.75, 0.75, 0.75 );
   const material = new THREE.MeshPhongMaterial();

   var mesh = new THREE.Mesh(new THREE.BoxGeometry( 0.75, 0.75, 0.75 ), material);
   scene.add(mesh);

   renderer = new THREE.WebGLRenderer( { antialias: true } );
   renderer.setSize( window.innerWidth, window.innerHeight );
   renderer.setClearColor(0xccccff);
   renderer.setAnimationLoop( animation );
   renderer.render( scene, camera );
   function animation( time ) {
	   mesh.rotation.x = time / 2000;
	   mesh.rotation.y = time / 1000;

	   //controls.update();

	   renderer.render( scene, camera );
   }
   */

   useEffect(() => {
      canvasRef.current.appendChild(threeRenderer.renderer.domElement);
   }, []);

   return (
      <div ref={canvasRef}></div>
   );
}

var setRendererInitializedOuter;

function App() {
   const [count, setCount] = useState(0);
   const [imgLoaded, setImgLoaded] = useState(false);
   const [rendererInitialized, setRendererInitialized] = useState(false);
   const [normalMapGenerated, setNormalMapGenerated] = useState(false);

   setRendererInitializedOuter = setRendererInitialized;

   const textureWidth = 512;
   const textureHeight = 512;

   return (
      <>
      <h1>Normal map generation test</h1>
      <div className="mainPanel">
         {imgLoaded ? (
            <TextureCanvas textureWidth={textureWidth} textureHeight={textureHeight} contentImageData={textureImgData.getTextureData()} />
            ) : (
            <TexturePlaceholder setImgLoaded={setImgLoaded} textureWidth={textureWidth} textureHeight={textureHeight} />
         )}
         {normalMapGenerated ? (
            <TextureCanvas textureWidth={textureWidth} textureHeight={textureHeight} contentImageData={normalTexImgData} />
         ) : (<></>)}
         {rendererInitialized ? (<RendererCanvas/>) : (<></>)}
      </div>
      <div className="card">
         <button onClick={() => generateButtonClickedHandle(setNormalMapGenerated)}>
            Generate
         </button>
      </div>
      </>
  );
}

export default App
