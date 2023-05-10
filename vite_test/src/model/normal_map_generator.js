import TFJS from "tfjs";
import TextureData from "../renderer/data/texdata";

export default class NormalMapGenerator{
    loadModel(path) {
        tf.loadLayersModel(path).then(model => this.#model = model);
    }

    generateNormalMap(inputTexData, resHandler) {
        const texWidth = inputTexData.getWidth();
        const texHeight = inputTexData.getHeight();
        const dataArr = inputTexData.getTextureData().data;
		const dataArrF = new Float32Array(texWidth * texHeight * 3);
		var size = 0;
		for (var i = 0; i < dataArr.length; ++i) {
			if ((i + 1) % 4 != 0 || i == 0) {
				dataArrF[size] = dataArr[i];
				++size;
			}
		}
        const normalizedTensor = tf.tensor(dataArrF).div([255]);
        const tensor = normalizedTensor.reshape([1, texWidth, texHeight, 3]);
        this.#model.predict([tensor]).array().then(scores =>
            resHandler(createCanvasFromRGBData(scores, texWidth, texHeight)));
    }

    #model;
}

function createCanvasFromRGBData(data, width, height) {
	let canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	let ctx = canvas.getContext("2d");
	let imgData = ctx.createImageData(width, height);
	for(let i = 0; i < data[0].length; i++) {
		for (let j = 0; j < data[0][i].length; j++) {
		    const index = i*width * 4 + j*4;
	  		imgData.data[index+0] = data[0][i][j][0] * 255;
	  		imgData.data[index+1] = data[0][i][j][1] * 255;
	  		imgData.data[index+2] = data[0][i][j][2] * 255;
	  		imgData.data[index+3] = 255;
		}
	}
	ctx.putImageData(imgData, 0, 0);
	return canvas;
}