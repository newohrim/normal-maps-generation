import TextureData from './texdata.js';
import '../../externals/tiff.js'

export default class TiffTextureData extends TextureData {
    constructor() {
        super();
        Tiff.initialize({
			TOTAL_MEMORY: 100000000
		});
    }

    loadData(dataArr) {
        this.imgCanvas = new Tiff({ buffer: dataArr }).toCanvas();
        this.texData = this.imgCanvas.getContext('2d').getImageData(0, 0, this.imgCanvas.width, this.imgCanvas.height);
    }
}