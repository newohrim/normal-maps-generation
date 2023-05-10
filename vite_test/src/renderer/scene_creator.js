import Renderer from "./renderer";

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
        this.#renderer.addToActiveScene(this.#renderer.createAmbientLight(0x404040, 0.35));
        this.#renderer.addToActiveScene(this.#renderer.createDirectionalLight(0xffffff, 0.5));
        this.#mainMaterial = this.#renderer.createDefaultMaterial();
        this.#mainObject = this.#renderer.createMesh();
        this.#mainObject.material = this.#mainMaterial;
        this.#renderer.addToActiveScene(this.#mainObject);
        this.#renderer.update = time => this.#update(time);
        //this.#renderer.renderer.setAnimationLoop(() => { this.#renderer.renderLoop(); });
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
}