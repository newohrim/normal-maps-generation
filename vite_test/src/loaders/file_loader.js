import DataLoader from "./loader";

export default class FileLoader extends DataLoader {
    constructor() {
        super();
        this.#inputElement = document.createElement('input');
        this.#inputElement.type = 'file';
    }

    async load(subLoader, resHandler) {
        this.#inputElement.onchange = e => this.#loadHandler(e, subLoader, resHandler);
        this.#inputElement.click();
    }

    async #loadHandler(e, subLoader, resHandler){
        // getting a hold of the file reference
        var file = e.target.files[0];

        // setting up the reader
        var reader = new FileReader();

        // here we tell the reader what to do when it's done reading...
        reader.onload = async readerEvent => resHandler(await subLoader.load(readerEvent.target.result, file));

        // read the file content
        reader.readAsArrayBuffer(file);
    }

    #inputElement;
}