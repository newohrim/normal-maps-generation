import Renderer from "./renderer";
import ThreeRenderToTexture from "./render_to_tex";
import TextureData from "./data/texdata";
import { HorizontalBlurShader } from "../shaders/HorizontalBlurShader";
import { VerticalBlurShader } from "../shaders/VerticalBlurShader";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default class SceneCreator {
    constructor(renderer, rendererToTex, rendererToCanvas) {
        this.#renderer = renderer;
        this.#rendererToTex = rendererToTex;
        this.#rendererToCanvas = rendererToCanvas;
        this.normalMapParams = {
            strength: 1.0,
            nStrength: 1.0,
            blurStrength: 1.0,
            invertX: 0.0,
            invertY: 0.0
        };
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
        //this.#mainMaterial.flatShading = true;
        this.#mainMaterial.roughness = 0.58;
        this.#mainMaterial.metalness = 0.62;
        this.#mainObject = this.#renderer.createMesh();
        this.#mainObject.material = this.#mainMaterial;
        this.#renderer.addToActiveScene(this.#mainObject);
        this.#renderer.update = time => this.#update(time);

        this.#rendererToTex.renderToCanvas = false;
        this.#rendererToTex.setViewportSize(512, 512);
        this.#rendererToTex.renderer.setSize(512, 512);
        this.#rendererToTex.update = time => this.#updateNormalMapParams(time);
        this.#rendererToTex.renderComplete = () => {
            const rt = this.#rendererToTex.getRenderTarget();
            rt.needsUpdate = true;
            const dummyData = new Uint8ClampedArray(rt.image.width * rt.image.height * 4);
            const rtCopy = new THREE.DataTexture(dummyData, rt.image.width, rt.image.height, 
                THREE.RGBAFormat, 
                THREE.UnsignedByteType, 
                THREE.UVMapping, 
                THREE.ClampToEdgeWrapping, 
                THREE.ClampToEdgeWrapping, 
                THREE.LinearFilter, 
                THREE.LinearMipmapLinearFilter);
            rtCopy.generateMipmaps = true;
            rtCopy.anisotropy = this.#renderer.renderer.capabilities.getMaxAnisotropy();
            const gl = this.#rendererToTex.renderer.getContext();
            gl.readPixels(0, 0, rt.image.width, rt.image.height, gl.RGBA, gl.UNSIGNED_BYTE, rtCopy.image.data);
            rtCopy.flipY = true;
            this.#mainMaterial.normalMap = rtCopy; 
            this.#mainMaterial.needsUpdate = true; 
            rtCopy.needsUpdate = true;
            //this.#drawToTexMat.uniforms.tex.value = rt;
            //this.#rendererToCanvas.requestRender();
        };
        
        // PASS 1: Render NM to texture
        this.#drawToTexMat = this.createDrawToTexMaterial();
        this.#rendererToTex.setActiveMaterial(this.#drawToTexMat);

        // PASS 2: Sobel highlight
        this.#normalMapTexMaterial = this.createSobelFilterHighlightMat(null, this.normalMapParams);
        this.#rendererToTex.addShaderPass(this.#normalMapTexMaterial, "normalTex");

        // TODO: REMOVE THIS JUNK
        //this.#rendererToTex.testMat = this.createDrawToTexMaterial();

        // PASS 3: Global highlight
        this.#normalMapStrengthMat = this.createStrengthenNormalsMaterial(null, this.normalMapParams);
        this.#rendererToTex.addShaderPass(this.#normalMapStrengthMat, "tex");
        this.#rendererToTex.testMat = this.#normalMapStrengthMat;

        this.#blurShaderPassMaterialH = new THREE.ShaderMaterial(HorizontalBlurShader);
        this.#rendererToTex.addShaderPass(this.#blurShaderPassMaterialH, "tDiffuse");

        this.#blurShaderPassMaterialV = new THREE.ShaderMaterial(VerticalBlurShader);
        this.#rendererToTex.addShaderPass(this.#blurShaderPassMaterialV, "tDiffuse");
        
        this.#invertShaderPassMaterial = this.createInvertShaderMaterial(null, this.normalMapParams);
        this.#rendererToTex.addShaderPass(this.#invertShaderPassMaterial, "tex");

        this.#rendererToCanvas.renderToCanvas = true;
        this.#rendererToCanvas.setViewportSize(512, 512);
        this.#rendererToCanvas.renderer.setSize(512, 512);
        this.#rendererToCanvas.setActiveMaterial(this.#drawToTexMat);

        this.#controls = new OrbitControls(this.#mainCamera, this.#renderer.renderer.domElement);
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

        this.drawNormalTex(normalMapTex, this.normalMapParams);
    }

    createDrawToTexMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                tex: { value: null },
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
                uniform sampler2D tex;
                
                void main() {
                    //vec4 tx = texture2D(tex, vUv);
                    //gl_FragColor = vec4(0, vUv.x, vUv.y, 1.0);
                    
                    // invert y axis, cause tex input gets inverted for some reason
                    vec2 uv = vec2(vUv.x, 1.0f - vUv.y);
                    //vec2 uv = vUv;
                    vec4 col = texture2D(tex, uv);
                    gl_FragColor = vec4(col.rgb, 1.0);
                }
            `
        });
    }

    createSobelFilterHighlightMat(tex, params) {
        return new THREE.ShaderMaterial({
            uniforms: {
                normalTex: { value: tex },
                strength: { type: 'f', value: params.strength }
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
                uniform float strength;

                const float offset = 1.0f;// / 300.0f;
         
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
                    //vec4 tx = texture2D(normalTex, vUv);
                    //gl_FragColor = vec4(tx.rgb, 1.0);
                    
                    vec3 sampleTex[9];
                    for(int i = 0; i < 9; i++)
                    {
                        sampleTex[i] = vec3(texelFetch(normalTex, ivec2(gl_FragCoord.xy + offsets[i]), 0));
                        //sampleTex[i] = texture2D(normalTex, vUv + offsets[i]).xyz;
                        float average = (sampleTex[i].r + sampleTex[i].g + sampleTex[i].b) / 3.0;
                        sampleTex[i] = vec3(average, average, average);
                    }
                    vec3 col = vec3(0.0);
                    for(int i = 0; i < 9; i++)
                        col += sampleTex[i] * (kernel_x[i] + kernel_y[i]) / 2.0f;
                    //if (length(col) > 1.0f)
                        //col = vec3(1.0f, 0.0f, 0.0f);

                    float mask = clamp(col.x, 0.0, 1.0);
                    vec3 normal = texture2D(normalTex, vUv).xyz; // = sampleTex[4]
                    //normal = normal * 2.0f - 1.0f;

                    // 1 APPROACH
                    //normal.xy *= 1.0f + mask * strength;

                    // 2 APPROACH
                    float maskedStrength = 1.0f + mask * strength;
                    normal.xy *= maskedStrength;
                    normal.z = mix(1.0f, normal.z, clamp(maskedStrength, 0.0f, 1.0f));
                    //normal.z -= clamp(maskedStrength, 0.0f, 1.0f);
                    //normal *= texture2D(normalTex, vUv).xyz;
                    //normal.x = clamp(normal.x, 0.0f, 1.0f);
                    //normal.y = clamp(normal.y, 0.0f, 1.0f);
                    //normal.z = clamp(normal.z, 0.0f, 1.0f);

                    //normal = normalize(normal);
                    gl_FragColor = vec4(normal, 1.0);
                    //gl_FragColor = vec4(0, vUv.x, vUv.y, 1.0);
                }
            `
        });
    }

    drawNormalTex(tex, params) {
        //this.#normalMapTexMaterial = testMat;
        //this.#rendererToTex.setActiveMaterial(testMat);
        this.#drawToTexMat.uniforms.tex.value = tex;
        this.#rendererToTex.requestRender();
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
        this.#rendererToTex.requestRender();
        //const gl = this.#rendererToTex.renderer.getContext();
        //const renderTarget = this.#rendererToTex.getRenderTarget();
        //renderTarget.needsUpdate = true;
        //const quadTexData = new ImageData(renderTarget.width, renderTarget.height);
        //gl.readPixels(0, 0, renderTarget.width, renderTarget.height, gl.RGBA, gl.UNSIGNED_BYTE, quadTexData.data);

        //return quadTexData;
    }

    createStrengthenNormalsMaterial(tex, params) {
        return new THREE.ShaderMaterial({
            uniforms: {
                tex: { value: tex },
                strength: { type: 'f', value: params.nStrength }
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
                uniform sampler2D tex;
                uniform float strength;
                
                void main() {
                    vec3 col = texture2D(tex, vUv).xyz;
                    col.xy *= strength;
                    col.z = mix(1.0f, col.z, clamp(strength, 0.0f, 1.0f));
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
    }

    createInvertShaderMaterial(tex, params) {
        return new THREE.ShaderMaterial({
            uniforms: {
                tex: { value: tex },
                invertX: { type: 'f', value: params.invertX },
                invertY: { type: 'f', value: params.invertY }
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
                uniform sampler2D tex;
                uniform float invertX;
                uniform float invertY;
                
                void main() {
                    vec3 col = texture2D(tex, vUv).xyz;
                    if (invertX > 0.0)
                        col.x = 1.0 - col.x;
                    if (invertY > 0.0)
                        col.y = 1.0 - col.y;
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        });
    }
    
    #update(time) {
        this.#controls.update();
        
        if (this.isRotateObj) {
            this.#mainObject.rotation.x = time / 2000;
		    this.#mainObject.rotation.y = time / 2000;
        }
    }

    #updateNormalMapParams(time) {
        if (this.#normalMapTexMaterial == null) {
            return;
        }

        this.#normalMapTexMaterial.uniforms.strength.value = this.normalMapParams.strength;
        this.#normalMapStrengthMat.uniforms.strength.value = this.normalMapParams.nStrength;
        var rendererSize = new THREE.Vector2();
        this.#rendererToTex.renderer.getSize(rendererSize)
        this.#blurShaderPassMaterialH.uniforms.h.value = this.normalMapParams.blurStrength / rendererSize.x;
        this.#blurShaderPassMaterialV.uniforms.v.value = this.normalMapParams.blurStrength / rendererSize.y;
        this.#invertShaderPassMaterial.uniforms.invertX.value = this.normalMapParams.invertX;
        this.#invertShaderPassMaterial.uniforms.invertY .value= this.normalMapParams.invertY;
    }
    
    #updateRenderToTexTargetSizeFromTexture(sourceTex) {
        // TODO: add condition if sourceTex dimension changed
        this.#rendererToTex.setViewportSize(
            sourceTex.image.width, sourceTex.image.height);
    }

    normalMapParamsChangedHandle() { 
        this.#updateNormalMapParams();
        this.#rendererToTex.requestRender() 
    }

    normalMapParams;
    isRotateObj = true;

    #renderer;
    #rendererToTex;
    #rendererToCanvas;
    #mainScene;
    #mainCamera;
    #mainMaterial;
    #normalMapTexMaterial;
    #normalMapStrengthMat;
    #blurShaderPassMaterialH;
    #blurShaderPassMaterialV;
    #invertShaderPassMaterial;
    #mainObject;
    #directionalLight;
    #ambientLight;
    #controls;

    #drawToTexMat;
}