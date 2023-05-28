import { useState, useRef, useEffect, useCallback, createElement } from 'react'
import { Space, Layout, Divider, Grid, Row, Col, Slider, Checkbox } from 'antd';
const { Header, Footer, Content } = Layout;
//import './tfjs.js';
//import Tiff from 'tiff.js'
import * as THREE from 'three'
import './externals/tiff'
import './App.css'

import FileLoader from './loaders/file_loader.js'
import TextureLoader from './loaders/tex_loader.js'
import MeshLoader from './loaders/mesh_loader';
import NormalMapGenerator from './model/normal_map_generator'
import ThreeRenderer from './renderer/three_renderer'
import ThreeRenderToTexture from './renderer/render_to_tex'
import SceneCreator from './renderer/scene_creator'
import TextureData from './renderer/data/texdata'
import { triggerFocus } from 'antd/es/input/Input';

const headerStyle = {
   
};
 
const contentStyle = {
};
 
const footerStyle = {
};

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
      const normalTex = new TextureData(normalTexImgData);
      const threeNormalTex = threeRenderer.createTexture(normalTex);
      threeRenderer.generateMipmaps = true;
      threeRenderer.anisotropy = threeRenderer.renderer.capabilities.getMaxAnisotropy();
      sceneCreator.setNormalMapTexture(threeNormalTex);
      setNormalMapGenerated(true);
   });
}

function uploadMeshButtonClickedHandle() {
   upload_mesh(mesh => {
      console.log("mesh loaded");
      sceneCreator.setMesh(mesh.mesh, mesh.type);
   });
}

function upload_texture(textureWidth, textureHeight, onLoad)
{
   var loader = new FileLoader();
   loader.load(new TextureLoader(), onLoad);
}

async function upload_mesh(onLoad) {
   var loader = new FileLoader();
   await loader.load(new MeshLoader(), onLoad);
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

function onNormalMapEnabledValueChanged(value) {
   if (isNaN(value)) {
      return;
   }
   sceneCreator.setNormalMapEnabled(value);
}

function TexturePlaceholder({setImgLoaded, textureWidth, textureHeight}) {
   const canvasRef = useRef(null);

   function uploadClickHandle() {
      upload_texture(textureWidth, textureHeight, 
         imageData => {
            canvasRef.current.getContext('2d').drawImage(imageData.img, 0, 0, textureWidth, textureHeight);
            textureImgData = new TextureData(canvasRef.current.getContext('2d').getImageData(0, 0, textureWidth, textureHeight), canvasRef.current);
            const threeColorTex = threeRenderer.createTexture(imageData);
            sceneCreator.setColorTexture(threeColorTex);
            setImgLoaded(true);
         });
   }

   return (
      <>
         <div className="renderCanvasContainer">
            <canvas id='renderCanvas' ref={canvasRef} width={textureWidth} height={textureHeight}></canvas>
            <button id='buttonCanvas' onClick={uploadClickHandle}>Upload</button>
         </div>
      </>
   );
}

function RendererCanvas({rendererObj}) {
   const canvasRef = useRef(null);

   useEffect(() => {
      const renderCanvas = rendererObj.renderer.domElement;
      canvasRef.current.appendChild(renderCanvas);
      renderCanvas.className = 'renderCanvas';
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
   const [normalMapEnabled, setNormalMapEnabled] = useState(true);

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
   const onChange7 = (e) => {
      const checked = e.target.checked;
      setNormalMapEnabled(checked);
      onNormalMapEnabledValueChanged(checked);
   };

   setRendererInitializedOuter = setRendererInitialized;

   const textureWidth = 512;
   const textureHeight = 512;

   return (
      <>
         <Content style={headerStyle}>
            <h1>Normal Map Generator</h1>
         </Content>
         <Content style={contentStyle}>
            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} align="middle">
               <Col><TexturePlaceholder setImgLoaded={setImgLoaded} textureWidth={512} textureHeight={512}/></Col>
               <button onClick={() => generateButtonClickedHandle(setNormalMapGenerated)}>
                  Generate
               </button>
               <Col>{rendererInitialized ? (<RendererCanvas rendererObj={threeRenderToTexture}/>) : (<></>)}</Col>
            </Row>
         </Content>
         <Divider style={{color: "white", borderColor: 'white'}} orientation="center">postprocess</Divider>
         <Content style={footerStyle}>
            <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }} align="middle">
               <Col span={13}>
                  <div className='paramHolder'>
                     <a style={{textAlign: "left"}}>Sobel Filter</a>
                     <Slider disabled={false} step={0.01} min={0} max={10} value={normalStrengthSliderValue} onChange={onChange1}/>
                  </div>
                  <div className='paramHolder'>
                     <a style={{textAlign: "left"}}>Normal strength</a>
                     <Slider disabled={false} step={0.01} min={0} max={10} value={globNormalStrengthSliderValue} onChange={onChange2}/>
                  </div>
                  <div className='paramHolder'>
                     <a style={{textAlign: "left"}}>Blur strength</a>
                     <Slider disabled={false} step={0.01} min={-5} max={5} value={blurStrength} onChange={onChange3}/>
                  </div>
                  <div className='paramHolder'>
                     <a style={{textAlign: "left"}}>Rotate mesh</a>
                     <Checkbox disabled={false} checked={rotateObj} onChange={onChange6}/>
                  </div>
                  <div className='paramHolder'>
                     <a style={{textAlign: "left"}}>Invert X axis</a>
                     <Checkbox disabled={false} checked={invertX} onChange={onChange4}/>
                  </div>
                  <div className='paramHolder'>
                     <a style={{textAlign: "left"}}>Invert Y axis</a>
                     <Checkbox disabled={false} checked={invertY} onChange={onChange5}/>
                  </div>
                  <div className='paramHolder'>
                     <a style={{textAlign: "left"}}>Enable normal map</a>
                     <Checkbox disabled={false} checked={normalMapEnabled} onChange={onChange7}/>
                  </div>
                  <button onClick={() => uploadMeshButtonClickedHandle()}>
                     Upload Mesh
                  </button>
                  {normalMapGenerated ?
                  <button onClick={() => saveAs()}>
                     Download
                  </button> : <></>}
               </Col>
               <Col span={4}>
                  {rendererInitialized ? (<RendererCanvas rendererObj={threeRenderer}/>) : (<></>)}
               </Col>
            </Row>
         </Content>
      </>
  );
}

export default App
