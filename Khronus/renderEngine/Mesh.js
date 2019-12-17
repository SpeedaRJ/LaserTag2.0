import Utils from './Utils.js';

export default class Mesh {

    constructor(options) {
        Utils.init(this, this.constructor.defaults, options);
    }
    static translateGLTF( gltfMesh ){
        let m = new Mesh({});
        //TODO


    }
}

Mesh.defaults = {
    vertices: [],
    texcoords: [],
    normals: [],
    indices: []
};
