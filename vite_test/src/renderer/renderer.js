export default class Renderer {
    createMesh(meshData) {}
    createTexture(textureData) {}
    createDefaultMaterial() {}
    createScene() {}
    addToActiveScene(object) {}
    createCamera(fov, aspectRatio, near, far) {}
    createDirectionalLight(color, intensity) {}
    createAmbientLight(color, intensity) {}
    
    setActiveScene(scene) {}
    setActiveCamera(camera) {}
    update;
    render;

    renderLoop(time) {
        if (this.update) {
            this.update(time);
        }
        if (this.render) {
            this.render();
        }
    }
    
    renderer;
}