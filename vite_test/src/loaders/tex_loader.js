import DataLoader from './loader.js';
import TiffTextureData from '../renderer/data/tiff_texdata.js'

export default class TextureLoader extends DataLoader {
    constructor() {
        super();
        this.#tiffLoader = new TiffTextureData();
    }

    load(dataArr) {
        // TODO: find out image format

        this.#tiffLoader.loadData(dataArr);

        return this.#tiffLoader;
    }

    #tiffLoader;
}