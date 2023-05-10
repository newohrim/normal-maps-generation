import DataLoader from "./loader";

export default class FileLoader extends DataLoader {
    constructor() {
        super();
        this.#inputElement = document.createElement('input');
        this.#inputElement.type = 'file';
    }

    load(subLoader, resHandler) {
        this.#inputElement.onchange = e => this.#loadHandler(e, subLoader, resHandler);
        this.#inputElement.click();
    }

    #loadHandler(e, subLoader, resHandler){
        // getting a hold of the file reference
        var file = e.target.files[0];

        // setting up the reader
        var reader = new FileReader();

        // here we tell the reader what to do when it's done reading...
        reader.onload = readerEvent => resHandler(subLoader.load(readerEvent.target.result));

        // read the file content
        reader.readAsArrayBuffer(file);
    }

    #inputElement;
}