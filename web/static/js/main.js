//const Tiff = require("tiff.js");

var input_texture;

function base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function RGBtoArr(line)
{
    return flattenArray(line.map(pix => [pix[0], pix[1], pix[2], 255]));
}
function flattenArray(arr)
{
    return [].concat.apply([], arr);
}

function createCanvasFromRGBAData(data, width, height) {
	// `data` should look something like [[123,32,40,255], [3,233,42,120], ...]
	//if(width*height !== data.length) throw new Error("width*height should equal data.length");
	let canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	let ctx = canvas.getContext("2d");
	let imgData = ctx.createImageData(width, height);
	for(let i = 0; i < data[0].length; i++) {
		console.log("new line");
		for (let j = 0; j < data[0][i].length; j++) {
		    const index = i*width * 4 + j*4;
	  		imgData.data[index+0] = data[0][i][j][0] * 255;
			//console.log(data[0][i][j][0]);
	  		imgData.data[index+1] = data[0][i][j][1] * 255;
			//console.log(data[0][i][j][1]);
	  		imgData.data[index+2] = data[0][i][j][2] * 255;
			//console.log(data[0][i][j][2]);
	  		imgData.data[index+3] = 255;
			//console.log(index);
		}
		if (i + 1 == data[0].length) 
		{
			console.log("break");
		}
	}
	/*
	for (let i = 0; i < data[0].length; i++) 
	{
		for (let j = 0; j < data[0][i].length; j++) 
		{
			const index = i * width + 
		}
	}
	*/
	ctx.putImageData(imgData, 0, 0);
	return canvas;
  }

function upload_texture()
{
    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => { 

    // getting a hold of the file reference
    var file = e.target.files[0];

    // setting up the reader
    var reader = new FileReader();

    // here we tell the reader what to do when it's done reading...
    reader.onload = readerEvent => {
		Tiff.initialize({
			TOTAL_MEMORY: 100000000
		  });
        var content = readerEvent.target.result; // this is the content!
		//input_texture = content;
		//const buffer = base64ToArrayBuffer(content);
		var image = new Tiff({ buffer: content });
		image.to
		var width = 512;
		var height = 512;
		var canvas = image.toCanvas();
		input_texture = image;
          if (canvas) {
            canvas.setAttribute('style', 'width:' + width +
              'px; height: ' + height + 'px');
			canvas.setAttribute('id', 'it_canvas');
            var elem = document.createElement("div");
            elem.innerHTML ='<div><a href="' + file.filename + '">' + file.filename +
                          ' (width: ' + width + ', height:' + height + ')' +
                          '</a></div>';
            document.body.append(elem);
            document.body.append(canvas);
			
			input_texture = document.getElementById('it_canvas').getContext("2d").getImageData(0, 0, width, height).data;
          }
        //document.getElementById('input_texture').src = image;
    }

    reader.readAsArrayBuffer(file);

	/*
	var loadImage = function (filename) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.open('GET', filename);
        xhr.onload = function (e) {
          var tiff = new Tiff({buffer: xhr.response});
          var width = tiff.width();
          var height = tiff.height();
          var canvas = tiff.toCanvas();
          if (canvas) {
            canvas.setAttribute('style', 'width:' + (width*0.3) +
              'px; height: ' + (height*0.3) + 'px');
            var elem = document.createElement("div");
            elem.innerHTML ='<div><a href="' + filename + '">' + filename +
                          ' (width: ' + width + ', height:' + height + ')' +
                          '</a></div>';
            document.body.append(elem);
            document.body.append(canvas);
          }
        };
        xhr.send();
      }

      loadImage(file);
	  */
}

input.click();
}

var normalScaleInputSlider;
var normalScaleLabel;

function test() 
{
	var input = new Float32Array(512 * 512 * 3);
	var size = 0;
	for (var i = 0; i < input_texture.length; ++i) 
	{
		if ((i + 1) % 4 != 0 || i == 0) 
		{
			var temp = input_texture[i] * 1.0 / 255;
			input[size] = temp;
			++size;
		}
	}
	
    console.log("test");
    tf.loadLayersModel('static/model/model.json').then(function(model) {
		window.model = model;
		var tensor = tf.tensor(input);
		console.log(tensor.shape);
		var temp = tensor.reshape([1, 512, 512, 3]);
		window.model.predict([temp]).array().then(function(scores){
		console.log(scores);
		var temp = createCanvasFromRGBAData(scores, 512, 512);
		document.body.append(temp);

		// COLOR TEXTURE
		dummyDataTex = new THREE.DataTexture( input_texture, 512, 512, 
			THREE.RGBAFormat, 
			THREE.UnsignedByteType, 
			THREE.UVMapping, 
			THREE.ClampToEdgeWrapping, 
			THREE.ClampToEdgeWrapping, 
			THREE.LinearFilter, 
			THREE.LinearMipmapLinearFilter 
		);
		//dummyTex = new THREE.Texture(dummyDataTex);
		dummyDataTex.generateMipmaps = true;
		material.map = dummyDataTex;
		dummyDataTex.needsUpdate = true;
		
		// NORMAL TEXTURE
		temp = flattenArray(scores[0].map(RGBtoArr)).map( x => x * 255 );
		var tempUInt = new Uint8Array(temp.length);
		for (var i = 0; i < temp.length; ++i) 
		{
			tempUInt[i] = Math.floor(temp[i]);
		}
		dummyDataNorm = new THREE.DataTexture( tempUInt, 512, 512, 
			THREE.RGBAFormat, 
			THREE.UnsignedByteType, 
			THREE.UVMapping, 
			THREE.ClampToEdgeWrapping, 
			THREE.ClampToEdgeWrapping, 
			THREE.LinearFilter, 
			THREE.LinearMipmapLinearFilter 
		);
		material.normalMap = dummyDataNorm;
		dummyDataNorm.needsUpdate = true;

		material.needsUpdate = true;

		normalScaleInputSlider = document.createElement("input");
		normalScaleInputSlider.type = "range";
		normalScaleInputSlider.min = 0;
		normalScaleInputSlider.max = 10;
		normalScaleInputSlider.value = 1;
		normalScaleInputSlider.step = 0.01;
		normalScaleInputSlider.oninput = normalScaleSliderValueChanged;
		document.body.appendChild(normalScaleInputSlider);
		normalScaleLabel = document.createElement("p");
		normalScaleLabel.innerHTML = normalScaleInputSlider.value;
		document.body.appendChild(normalScaleLabel)

		document.body.appendChild( renderer.domElement );

		//scores = scores[0];
		//predicted = scores.indexOf(Math.max(...scores));
		//$('#number').html(predicted);

		
		//var buf = flattenArray(scores[0].map(RGBtoArr));
		/*
		let canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = 512;
		let ctx = canvas.getContext("2d");
		let imgData = ctx.createImageData(512, 512);
		imgData.data = buf;
		ctx.putImageData(imgData, 512, 512);
		canvas.setAttribute('style', 'width:' + 512 +
              'px; height: ' + 512 + 'px');
			canvas.setAttribute('id', 'it_canvas2');
            document.body.append(canvas);
			*/
			/*
			var blob = new Blob( [ buf ], { type: "image/jpeg" } );
			var urlCreator = window.URL || window.webkitURL;
			var imageUrl = urlCreator.createObjectURL( blob );
			var img = document.createElement("img");//.querySelector( "#photo" );
			img.src = imageUrl;
			document.body.append(img);
			*/
	  });
	});	
}

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
camera.position.z = 1;
const scene = new THREE.Scene();

const geometry = new THREE.BoxGeometry( 0.75, 0.75, 0.75 );
const material = new THREE.MeshPhongMaterial();

const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

// LIGHTS
const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animation );

function animation( time ) {

	mesh.rotation.x = time / 2000;
	mesh.rotation.y = time / 1000;

	renderer.render( scene, camera );

}

function normalScaleSliderValueChanged(event) 
{
	normalScaleLabel.innerHTML = normalScaleInputSlider.value;
	material.normalScale = new THREE.Vector2(normalScaleInputSlider.value, normalScaleInputSlider.value);
	material.needsUpdate = true;
}