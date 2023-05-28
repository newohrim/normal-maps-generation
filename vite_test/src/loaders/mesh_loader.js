import DataLoader from './loader.js';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export default class MeshLoader extends DataLoader {
    async load(dataArr, file) {
        console.log(file.name);
        if (file == null || file.name == null || file.name === "") {
            console.error(`failed to load mesh`);
            return;
        }
        const parts = file.name.split('.');
        if (parts.length < 2) {
            console.error(`failed to load mesh. incorrect file name ${file.name}`);
            return;
        }
        var mesh;
        const type = parts[parts.length - 1].toLowerCase();
        switch(type) {
            case "obj":
                const contentStr = new TextDecoder("utf-8").decode(dataArr);
                mesh = new OBJLoader().parse(contentStr);
                break;
            case "fbx":
                mesh = new FBXLoader().parse(dataArr);
                break;
            case "glb":
                //mesh = new GLTFLoader().parse(dataArr);
                mesh = await new GLTFLoader().parseAsync(dataArr);
                mesh = mesh.scene;
                break;
            default:
                console.error(`failed to load mesh. unsupported file type '${type}'`);
                return;
        }

        return { mesh: mesh, type: type };
    }
}
