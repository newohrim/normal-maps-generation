import Renderer from "./renderer";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import * as THREE from 'three';

export default class ThreeRenderToTexture extends Renderer {
    constructor() {
        super();
        this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true });
        this.#activeScene = new THREE.Scene();
        this.#activeCamera = new THREE.OrthographicCamera(-1, 1, -1, 1);
        this.#quadObj = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
        this.#activeScene.add(this.#quadObj);

        // OKAY THIS IS FCKING STUPID
        // I have to set renderer size before EffectComposer creation
        this.renderer.setSize(512, 512);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.#activeScene, this.#activeCamera));
        
        this.render = function() {
            if (this.#renderRequested) {
                this.renderToTex();
                this.#renderRequested = false;
                if (this.renderComplete)
                    this.renderComplete();
            }
        };
        this.renderer.setAnimationLoop(time => this.renderLoop(time));
    }

    setActiveMaterial(material) {
        material.depthTest = false;
        this.#activeMaterial = material;
        this.#quadObj.material = material;
    }

    setViewportSize(width, height) {
        //this.renderer.setViewport(width, height);
        this.#bufferTex = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
        //if (!this.renderToCanvas)
            //this.renderer.setRenderTarget(this.#bufferTex);
    }

    getRenderTarget() { 
        //if (!this.renderToCanvas)
        return new THREE.Texture(this.renderer.domElement);
            //return this.#bufferTex.texture;
        //return new THREE.CanvasTexture(this.renderer.domElement);
    }

    addShaderPass(shader, textureId) {
        this.composer.addPass(new ShaderPass(shader, textureId));
    }

    requestRender() { this.#renderRequested = true; }

    renderToTex() {
        if (this.#quadObj.material == null) {
            console.error("render to texture material was null. call setActiveMaterial");
            return;
        }
        if (this.#bufferTex == null) {
            console.error("render to texture bufferTex was null. call setViewport");
            return;
        }
        this.#quadObj.material = this.#activeMaterial;
        this.renderer.setRenderTarget(null);
        this.composer.render();

        //this.renderer.setRenderTarget(this.#bufferTex);
        //this.renderer.render(this.#activeScene, this.#activeCamera);
        //this.testMat.uniforms.tex.value = this.#bufferTex.texture;
        //this.#quadObj.material = this.testMat;
        //this.renderer.setRenderTarget(null);
        //this.renderer.render(this.#activeScene, this.#activeCamera);
    }

    renderToCanvas = false;
    testMat = null;
    composer;

    #quadObj;
    #activeCamera;
    #activeMaterial;
    #activeScene;
    #bufferTex;
    #renderRequested = false;
}