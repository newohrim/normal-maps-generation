import { useState, useRef, useEffect, useCallback, createElement } from 'react'
import { Slider, Checkbox } from 'antd';
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
import { triggerFocus } from 'antd/es/input/Input';

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

function saveAs(){
   var a = document.createElement("a");
   a.href = threeRenderToTexture.renderer.domElement.toDataURL()
   a.download = "normalMap.png";
   a.click();
}

function generateButtonClickedHandle(setNormalMapGenerated) {
   normalMapGenerator.generateNormalMap(textureImgData, canvas => {
      normalTexImgData = canvas.getContext('2d').getImageData(0, 0, 512, 512);
      const normalTex = new TextureData(normalTexImgData, canvas);
      const threeNormalTex = threeRenderer.createTexture(normalTex);
      threeRenderer.generateMipmaps = true;
      threeRenderer.anisotropy = threeRenderer.renderer.capabilities.getMaxAnisotropy();
      sceneCreator.setNormalMapTexture(threeNormalTex);
      setNormalMapGenerated(true);
   });
}

function upload_texture(textureWidth, textureHeight, onLoad)
{
   var loader = new FileLoader();
   loader.load(new TextureLoader(), onLoad);
}

function onNormalStrengthSliderChanged(value) {
   if (isNaN(value)) {
      return;
   }
   normalStrength = value;
   sceneCreator.normalMapParams.strength = normalStrength;
   sceneCreator.normalMapParamsChangedHandle();
}

function onGlobalNormalStrengthSliderChanged(value) {
   if (isNaN(value)) {
      return;
   }
   sceneCreator.normalMapParams.nStrength = value;
   sceneCreator.normalMapParamsChangedHandle();
}

function onBlurStrengthSliderValueChanged(value) {
   if (isNaN(value)) {
      return;
   }
   sceneCreator.normalMapParams.blurStrength = value;
   sceneCreator.normalMapParamsChangedHandle();
}

function onInvertXValueChanged(value) {
   if (isNaN(value)) {
      return;
   }
   if (value) 
      sceneCreator.normalMapParams.invertX = 1.0;
   else
      sceneCreator.normalMapParams.invertX = 0.0;
   sceneCreator.normalMapParamsChangedHandle();
}

function onInvertYValueChanged(value) {
   if (isNaN(value)) {
      return;
   }
   if (value) 
      sceneCreator.normalMapParams.invertY = 1.0;
   else
      sceneCreator.normalMapParams.invertY = 0.0;
   sceneCreator.normalMapParamsChangedHandle();
}

function onRotateObjValueChanged(value) {
   if (isNaN(value)) {
      return;
   }
   sceneCreator.isRotateObj = value;
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
   const [normalStrengthSliderValue, setNormalStrength] = useState(1);
   const [globNormalStrengthSliderValue, setGlobalNormalStrength] = useState(1);
   const [blurStrength, setBlurStrength] = useState(1);
   const [invertX, setInvertX] = useState(false);
   const [invertY, setInvertY] = useState(false);
   const [rotateObj, setRotateObj] = useState(true);

   const onChange1 = (newValue) => {
      setNormalStrength(newValue);
      onNormalStrengthSliderChanged(newValue);
   };
   const onChange2 = (newValue) => {
      setGlobalNormalStrength(newValue);
      onGlobalNormalStrengthSliderChanged(newValue);
   };
   const onChange3 = (newValue) => {
      setBlurStrength(newValue);
      onBlurStrengthSliderValueChanged(newValue);
   };
   const onChange4 = (e) => {
      const checked = e.target.checked;
      setInvertX(checked);
      onInvertXValueChanged(checked);
   };
   const onChange5 = (e) => {
      const checked = e.target.checked;
      setInvertY(checked);
      onInvertYValueChanged(checked);
   };
   const onChange6 = (e) => {
      const checked = e.target.checked;
      setRotateObj(checked);
      onRotateObjValueChanged(checked);
   };

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
         {rendererInitialized ? (<RendererCanvas rendererObj={threeRenderToTexture}/>) : (<></>)}
         <Slider disabled={false} step={0.01} min={0} max={10} value={normalStrengthSliderValue} onChange={onChange1}/>
         <Slider disabled={false} step={0.01} min={0} max={10} value={globNormalStrengthSliderValue} onChange={onChange2}/>
         <Slider disabled={false} step={0.01} min={-5} max={5} value={blurStrength} onChange={onChange3}/>
         <Checkbox disabled={false} checked={rotateObj} onChange={onChange6}/>
         <Checkbox disabled={false} checked={invertX} onChange={onChange4}/>
         <Checkbox disabled={false} checked={invertY} onChange={onChange5}/>
         {rendererInitialized ? (<RendererCanvas rendererObj={threeRenderer}/>) : (<></>)}
      </div>
      <div className="card">
         <button onClick={() => generateButtonClickedHandle(setNormalMapGenerated)}>
            Generate
         </button>
         {normalMapGenerated ?
         <button onClick={() => saveAs()}>
            Download
         </button> : <></>}
      </div>
      </>
  );
}

export default App
