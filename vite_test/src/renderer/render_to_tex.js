import Renderer from "./renderer";
import * as THREE from 'three';

export default class ThreeRenderToTexture extends Renderer {
    constructor() {
        super();
        this.renderer = new THREE.WebGLRenderer();
        this.#activeScene = new THREE.Scene();
        this.#activeCamera = new THREE.OrthographicCamera();
        this.#quadObj = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
        this.#activeScene.add(this.#quadObj);

        this.render = function() {
            this.renderToTex();
        };
    }

    setActiveMaterial(material) {
        this.#quadObj.material = material;
    }

    setViewportSize(width, height) {
        this.renderer.setViewport(width, height);
        this.#bufferTex = new THREE.WebGLRenderTarget(width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
        this.renderer.setRenderTarget(this.#bufferTex);
    }

    getRenderTarget() { return this.#bufferTex; }

    renderToTex() {
        if (this.#quadObj.material == null) {
            console.error("render to texture material was null. call setActiveMaterial");
            return;
        }
        if (this.#bufferTex == null) {
            console.error("render to texture bufferTex was null. call setViewport");
            return;
        }

        this.renderer.render(this.#activeScene, this.#activeCamera);
    }

    #quadObj;
    #activeCamera;
    #activeScene;
    #bufferTex;
}