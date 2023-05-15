import { useState, useRef, useEffect, useCallback, createElement } from 'react'
import { Slider } from 'antd';
//import './tfjs.js';
//import Tiff from 'tiff.js'
import * as THREE from 'three'
import './externals/tiff'
import './App.css'

import FileLoader from './loaders/file_loader.js'
import TextureLoader from './loaders/tex_loader.js'
import NormalMapGenerator from './model/normal_map_generator'
import ThreeRenderer from './renderer/three_renderer'
import ThreeRenderToTexture from './renderer/render_to_tex'
import SceneCreator from './renderer/scene_creator'
import TextureData from './renderer/data/texdata'

const normalMapGenerator = new NormalMapGenerator();
const threeRenderer = new ThreeRenderer();
const threeRenderToTexture = new ThreeRenderToTexture();
const threeRenderToCanvas = new ThreeRenderToTexture();
const sceneCreator = new SceneCreator(threeRenderer, threeRenderToTexture, threeRenderToCanvas);
var renderer;

window.onload = function() {
   normalMapGenerator.loadModel('/model/model.json');
   sceneCreator.init();
   setRendererInitializedOuter(true);
}

var textureImgData;
var normalTexImgData;
var filteredTexData;
var filteredTex;
var strengthenedNormalTexData;

var normalStrength = 1;
var forceUpdateNormalTexCanvas;

function generateButtonClickedHandle(setNormalMapGenerated) {
   normalMapGenerator.generateNormalMap(textureImgData, canvas => {
      normalTexImgData = canvas.getContext('2d').getImageData(0, 0, 512, 512);
      const normalTex = new TextureData(normalTexImgData, canvas);
      const threeNormalTex = threeRenderer.createTexture(normalTex);
      sceneCreator.setNormalMapTexture(threeNormalTex);
      //filteredTex = new THREE.DataTexture(filteredTexData.data, filteredTexData.width, filteredTexData.height, THREE.RGBAFormat);
      //strengthenedNormalTexData = sceneCreator.strengthenNormals(filteredTex, normalStrength);
      setNormalMapGenerated(true);
   });
}

function upload_texture(textureWidth, textureHeight, onLoad)
{
   var loader = new FileLoader();
   loader.load(new TextureLoader(), onLoad);
}

function onNormalStrengthSliderChanged(value, setNormalMapGenerated) {
   if (isNaN(value)) {
      return;
   }
   normalStrength = value;
   sceneCreator.normalMapParams.strength = normalStrength;
   sceneCreator.normalMapParamsChangedHandle();
   //sceneCreator.strengthenNormals(filteredTex, normalStrength);
}

function TexturePlaceholder({setImgLoaded, textureWidth, textureHeight}) {
   function uploadClickHandle() {
      upload_texture(textureWidth, textureHeight, 
         imageData => {
            textureImgData = imageData;
            const threeColorTex = threeRenderer.createTexture(imageData);
            sceneCreator.setColorTexture(threeColorTex);
            //filteredTexData = sceneCreator.applyFilterToTexture(null, threeColorTex);
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
   const [, updateState] = useState();

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

function RendererCanvas({rendererObj}) {
   const canvasRef = useRef(null);

   useEffect(() => {
      canvasRef.current.appendChild(rendererObj.renderer.domElement);
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
   const [normalStrengthSliderValue, setNormalStrength] = useState(1)

   const onChange = (newValue) => {
      setNormalStrength(newValue);
      onNormalStrengthSliderChanged(newValue, setNormalMapGenerated);
   };

   setRendererInitializedOuter = setRendererInitialized;

   const textureWidth = 512;
   const textureHeight = 512;

   return (
      <>
      <h1>Normal map generation test</h1>
      <div className="mainPanel">
         <Slider disabled={false} step={0.01} min={0} max={10} value={normalStrengthSliderValue} onChange={onChange}/>
         {imgLoaded ? (
            <TextureCanvas textureWidth={textureWidth} textureHeight={textureHeight} contentImageData={textureImgData.getTextureData()} />
            ) : (
            <TexturePlaceholder setImgLoaded={setImgLoaded} textureWidth={textureWidth} textureHeight={textureHeight} />
         )}
         {rendererInitialized ? (<RendererCanvas rendererObj={threeRenderToTexture}/>) : (<></>)}
         {rendererInitialized ? (<RendererCanvas rendererObj={threeRenderer}/>) : (<></>)}
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
