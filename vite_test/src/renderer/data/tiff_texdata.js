import TextureData from './texdata.js';
import '../../externals/tiff.js'

export default class TiffTextureData extends TextureData {
    constructor() {
        super();
        Tiff.initialize({
			TOTAL_MEMORY: 100000000
		});
    }

    async loadData(dataArr) {
        this.imgCanvas = new Tiff({ buffer: dataArr }).toCanvas();
        this.texData = this.imgCanvas.getContext('2d').getImageData(0, 0, this.imgCanvas.width, this.imgCanvas.height);
        const res = await convertDataArrToImage(this.texData.data, this.imgCanvas);
        this.img = res.img;
    }
}

function convertDataArrToImage(dataArr, canvas) {
    const blob = new Blob( [ dataArr ], { type: `image/png` } );
    const urlCreator = window.URL || window.webkitURL;
    //const URI = urlCreator.createObjectURL( blob );
    const URI = canvas.toDataURL();
    return new Promise(function(resolve, reject) {
        if (URI == null) return reject();
        canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        const image = new Image();
        image.addEventListener('load', function() {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve({img: image});
        }, false);
        image.src = URI;
    });
}
