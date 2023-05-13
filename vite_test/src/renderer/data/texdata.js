export default class TextureData {
    constructor(texData, imgCanvas){
        this.texData = texData;
        this.imgCanvas = imgCanvas;
    }

    getTextureData() { return this.texData; }

    getWidth() { return this.texData.width; }

    getHeight() { return this.texData.height; }

    loadData(dataArr) {
        texData = new ImageData(dataArr, width, height);
        imgCanvas = document.createElement("canvas");
        this.imgCanvas.putImageData(texData, 0, 0);
    }

    imgCanvas;
    texData;
}