import Renderer from "./renderer"
import * as THREE from 'three'

export default class SceneCreator {
    constructor(renderer, rendererToTex) {
        this.#renderer = renderer;
        this.#rendererToTex = rendererToTex;
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

        this.#updateRenderToTexTargetSizeFromTexture(colorTex);
    }

    setNormalMapTexture(normalMapTex) {
		this.#mainMaterial.normalMap = normalMapTex;
        this.#mainMaterial.normalMap.needsUpdate = true;
        this.#mainMaterial.needsUpdate = true;
    }

    applyFilterToTexture(filter, tex) {
        const testMat = new THREE.ShaderMaterial({
            uniforms: {
                inputTex: {
                    value: tex
                }
            },
            vertexShader: `
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);    
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform sampler2D inputTex;
         
                void main() {
                    vec4 tx = texture2D(inputTex, vUv);
                    gl_FragColor = vec4(tx.rgb, 1.0);
                }
            `
        });
        this.#rendererToTex.setActiveMaterial(testMat);
        this.#rendererToTex.render();
        const gl = this.#rendererToTex.renderer.getContext();
        const renderTarget = this.#rendererToTex.getRenderTarget();
        const quadTexData = new ImageData(renderTarget.width, renderTarget.height);
        gl.readPixels(0, 0, renderTarget.width, renderTarget.height, gl.RGBA, gl.UNSIGNED_BYTE, quadTexData.data);

        return quadTexData;
    }
    
    #update(time) {
        this.#mainObject.rotation.x = time / 2000;
		this.#mainObject.rotation.y = time / 2000;
    }
    
    #updateRenderToTexTargetSizeFromTexture(sourceTex) {
        // TODO: add condition if sourceTex dimension changed
        this.#rendererToTex.setViewportSize(
            sourceTex.image.width, sourceTex.image.height);
    }

    #renderer;
    #rendererToTex;
    #mainScene;
    #mainCamera;
    #mainMaterial;
    #mainObject;
    #directionalLight;
    #ambientLight;
}