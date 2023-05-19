import DataLoader from './loader.js';
import TextureData from '../renderer/data/texdata.js';
import TiffTextureData from '../renderer/data/tiff_texdata.js'

export default class TextureLoader extends DataLoader {
    constructor() {
        super();
        this.#tiffLoader = new TiffTextureData();
    }

    async load(dataArr, file) {
        console.log(file.name);
        if (file == null || file.name == null || file.name === "") {
            console.error(`failed to load texture`);
            return;
        }
        const parts = file.name.split('.');
        if (parts.length < 2) {
            console.error(`failed to load texture. incorrect file name ${file.name}`);
            return;
        }
        const type = parts[parts.length - 1].toLowerCase();
        if (type === "tiff") {
            await this.#tiffLoader.loadData(dataArr);
            return this.#tiffLoader;
        }
        if (type !== "png" && type !== "jpg" && type !== "jpeg") {
            console.error(`failed to load texture. unsupported type ${type}`);
            return null;
        }

        //const blob = new Blob( [ dataArr ], { type: `image/${type}` } );
        //const urlCreator = window.URL || window.webkitURL;
        //const imageUrl = urlCreator.createObjectURL( blob );
        //const imgData = await convertURIToImageData(imageUrl);
        const texData = new TextureData();
        await texData.loadData(dataArr, type);
        return texData;
    }

    #tiffLoader;
}

function convertURIToImageData(URI) {
    return new Promise(function(resolve, reject) {
      if (URI == null) return reject();
      var canvas = document.createElement('canvas'),
          context = canvas.getContext('2d'),
          image = new Image();
      image.addEventListener('load', function() {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(context.getImageData(0, 0, canvas.width, canvas.height));
      }, false);
      image.src = URI;
    });
}
