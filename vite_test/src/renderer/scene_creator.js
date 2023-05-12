import Renderer from "./renderer"
import * as THREE from 'three'

export default class SceneCreator {
    constructor(renderer) {
        this.#renderer = renderer;
    }

    init() {
        this.#renderer.renderer.setSize(window.innerWidth, window.innerHeight);
        this.#renderer.renderer.setClearColor(0xccccff);
        this.#mainScene = this.#renderer.createScene();
        this.#renderer.setActiveScene(this.#mainScene);
        this.#mainCamera = this.#renderer.createCamera(70, window.innerWidth / window.innerHeight, 0.01, 50);
        this.#mainCamera.position.z = 1;
        this.#renderer.setActiveCamera(this.#mainCamera);
        this.#ambientLight = this.#renderer.createAmbientLight(0x404040, 0.35);
        this.#renderer.addToActiveScene(this.#ambientLight);
        this.#directionalLight = this.#renderer.createDirectionalLight(0xffffff, 0.5);
        this.#directionalLight.position.set(2, 10, 10);
        this.#directionalLight.target.position.set(0, 0, 0);
        //this.#directionalLight.target.setRotationFromEuler(new THREE.Euler(-3.14, -3.14, -3.14));
        this.#renderer.addToActiveScene(this.#directionalLight);
        this.#renderer.addToActiveScene(this.#directionalLight.target);
        this.#mainMaterial = this.#renderer.createDefaultMaterial();
        this.#mainObject = this.#renderer.createMesh();
        this.#mainObject.material = this.#mainMaterial;
        this.#renderer.addToActiveScene(this.#mainObject);
        this.#renderer.update = time => this.#update(time);
        //this.#renderer.renderer.setAnimationLoop(() => { this.#renderer.renderLoop(); });
    }

    setColorTexture(colorTex) {
        colorTex.generateMipmaps = true;
		this.#mainMaterial.map = colorTex;
		colorTex.needsUpdate = true;
        this.#mainMaterial.needsUpdate = true;
    }

    setNormalMapTexture(normalMapTex) {
		this.#mainMaterial.normalMap = normalMapTex;
        this.#mainMaterial.normalMap.needsUpdate = true;
        this.#mainMaterial.needsUpdate = true;
    }

    #update(time) {
        this.#mainObject.rotation.x = time / 2000;
		this.#mainObject.rotation.y = time / 2000;
    }

    #renderer;
    #mainScene;
    #mainCamera;
    #mainMaterial;
    #mainObject;
    #directionalLight;
    #ambientLight;
}