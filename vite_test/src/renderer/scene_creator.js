import Renderer from "./renderer";
import TextureData from "./data/texdata";
import * as THREE from 'three';

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

                const float offset = 1.0f;
         
                const vec2 offsets[9] = vec2[9](
                    vec2(-offset,  offset), // top-left
                    vec2( 0.0f,    offset), // top-center
                    vec2( offset,  offset), // top-right
                    vec2(-offset,  0.0f),   // center-left
                    vec2( 0.0f,    0.0f),   // center-center
                    vec2( offset,  0.0f),   // center-right
                    vec2(-offset, -offset), // bottom-left
                    vec2( 0.0f,   -offset), // bottom-center
                    vec2( offset, -offset)  // bottom-right    
                );
                
                const float kernel_x[9] = float[9](
                    1.0f, 0.0f, -1.0f,
                    2.0f, 0.0f, -2.0f,
                    1.0f, 0.0f, -1.0f
                );
                const float kernel_y[9] = float[9](
                    1.0f, 2.0f, 1.0f,
                    0.0f, 0.0f, 0.0f,
                    -1.0f, -2.0f, -1.0f
                );
                
                void main() {
                    //vec4 tx = texture2D(inputTex, vUv);
                    //gl_FragColor = vec4(tx.rgb, 1.0);
                    
                    vec3 sampleTex[9];
                    for(int i = 0; i < 9; i++)
                    {
                        sampleTex[i] = vec3(texelFetch(inputTex, ivec2(gl_FragCoord.xy + offsets[i]), 0));
                        float average = (sampleTex[i].r + sampleTex[i].g + sampleTex[i].b) / 3.0;
                        sampleTex[i] = vec3(average, average, average);
                    }
                    vec3 col = vec3(0.0);
                    for(int i = 0; i < 9; i++)
                        col += sampleTex[i] * (kernel_x[i] + kernel_y[i]) / 2.0f;
                    //if (length(col) > 1.0f)
                        //col = vec3(1.0f, 0.0f, 0.0f);
                    
                    gl_FragColor = vec4(col, 1.0);
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

    strengthenNormals(mask) {
        mask.needsUpdate = true;
        const testMat = new THREE.ShaderMaterial({
            uniforms: {
                normalTex: { value: this.#mainMaterial.normalMap },
                mask: { value: mask }
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
                uniform sampler2D normalTex;
                uniform sampler2D mask;
                
                void main() {
                    float mask = max(texture2D(mask, vUv).x, 0.0) + 1.0f;
                    vec3 normal = texture2D(normalTex, vUv).xyz;
                    //normal = normal * 2.0f - 1.0f;
                    normal.xy *= mask * 1.0f;
                    //normal = normalize(normal);
                    gl_FragColor = vec4(normal, 1.0);
                }
            `
        });
        this.#rendererToTex.setActiveMaterial(testMat);
        this.#rendererToTex.render();
        const gl = this.#rendererToTex.renderer.getContext();
        const renderTarget = this.#rendererToTex.getRenderTarget();
        const quadTexData = new ImageData(renderTarget.width, renderTarget.height);
        gl.readPixels(0, 0, renderTarget.width, renderTarget.height, gl.RGBA, gl.UNSIGNED_BYTE, quadTexData.data);
        this.#mainMaterial.normalMap = this.#renderer.createTexture(new TextureData(quadTexData));
        this.#mainMaterial.normalMap.needsUpdate = true;
        this.#mainMaterial.needsUpdate = true;

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