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
    setActiveMaterial(material) {}
    setViewportSize(width, height) {}
    getRenderTarget() {}
    requestRender() {}
    update;
    render;
    renderComplete;

    renderLoop(time) {
        if (this.update) {
            this.update(time);
        }
        if (this.render) {
            this.render();
        }
        //if (this.renderComplete) {
        //    this.renderComplete();
        //}
    }
    
    renderer;
}