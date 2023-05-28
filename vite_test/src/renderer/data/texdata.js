export default class TextureData {
    constructor(texData, imgCanvas){
        this.texData = texData;
        this.imgCanvas = imgCanvas;
    }

    getTextureData() { return this.texData; }

    getWidth() { return this.texData.width; }

    getHeight() { return this.texData.height; }

    async loadData(dataArr, type) {
        //texData = new ImageData(dataArr, width, height);
        //imgCanvas = document.createElement("canvas");
        //this.imgCanvas.putImageData(texData, 0, 0);
        const res = await convertDataArrToImage(dataArr, type);
        this.img = res.img;
        this.texData = res.imgData;
    }

    imgCanvas;
    texData;
    img;
}

function convertDataArrToImage(dataArr, type) {
    const blob = new Blob( [ dataArr ], { type: `image/${type}` } );
    const urlCreator = window.URL || window.webkitURL;
    const URI = urlCreator.createObjectURL( blob );
    return new Promise(function(resolve, reject) {
      if (URI == null) return reject();
      var canvas = document.createElement('canvas'),
          context = canvas.getContext('2d'),
          image = new Image();
      image.addEventListener('load', function() {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({img: image, imgData: context.getImageData(0, 0, canvas.width, canvas.height)});
      }, false);
      image.src = URI;
    });
}
