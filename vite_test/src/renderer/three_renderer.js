import Renderer from './renderer'
import * as THREE from 'three'

export default class ThreeRenderer extends Renderer {
    #activeScene;
    #activeCamera;
    
    constructor(antialias) {
        super();
        this.renderer = new THREE.WebGLRenderer({ antialias: antialias });
        //this.renderer.setAnimationLoop(() => { this.renderer.render(this.#activeScene, this.#activeCamera); });
        this.render = function() {
            if (!this.#activeScene || !this.#activeCamera) {
                return;
            }
            this.renderer.render(this.#activeScene, this.#activeCamera);
        };
        this.renderer.setAnimationLoop(time => this.renderLoop(time));
    }

    createMesh(meshData) {
        return new THREE.Mesh(new THREE.BoxGeometry( 0.75, 0.75, 0.75 ));
    }
    createTexture(textureData) {
        return new THREE.DataTexture(
            textureData.getTextureData().data, 
            textureData.getWidth(), 
            textureData.getHeight(), 
            THREE.RGBAFormat, 
		    THREE.UnsignedByteType, 
		    THREE.UVMapping, 
		    THREE.ClampToEdgeWrapping, 
		    THREE.ClampToEdgeWrapping, 
		    THREE.LinearFilter, 
		    THREE.LinearMipmapLinearFilter);
    }
    createDefaultMaterial() {
        return new THREE.MeshStandardMaterial();
    }
    createScene() {
        return new THREE.Scene();
    }
    
    setActiveScene(scene) {
        this.#activeScene = scene
    }

    addToActiveScene(object) {
        this.#activeScene.add(object);
    }

    createCamera(fov, aspectRatio, near, far) {
        return new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
    }

    setActiveCamera(camera) {
        this.#activeCamera = camera;
    }

    createDirectionalLight(color, intensity) {
        return new THREE.DirectionalLight(color, intensity);
    }

    createAmbientLight(color, intensity) {
        return new THREE.AmbientLight(color, intensity);
    }
}