import Mesh from './Mesh.js';

import Node from './Node.js';
import Model from './Model.js';
import Camera from './Camera.js';

import Scene from './Scene.js';
import GLTFLoader from './GLTFLoader.js';

export default class SceneBuilder {

    constructor(spec) {
        this.gl = document.getElementById('game').getContext('webgl2');
        this.loader = new GLTFLoader( this.gl );
        this.spec = spec;
    }

    createNode(spec) {
        switch (spec.type) {
            case 'camera': return new Camera(spec);
            case 'model': {
                const mesh = new Mesh(this.spec.meshes[spec.mesh]);
                const texture = this.spec.textures[spec.texture];
                return new Model(mesh, texture, spec);
            }
            default: return new Node(spec);
        }
    }
    async createGLTFNode(gtflFile) {
        await this.loader.load(gtflFile);

    }
    async loadGLTFNodes( scene ){
        let filenames = ['./common/models/monkey/monkey.gltf'];
        for (const filename of filenames) {
            await this.createGLTFNode( filename );

            if(this.loader.getObjectByName("Scene") !== undefined &&
               this.loader.getObjectByName("Scene").hasOwnProperty("nodes"))
                        scene.addGltfScene( {"Scene"  : this.loader.getObjectByName("Scene"),
                                                  "Camera" : this.loader.getObjectByName("Camera") });

        }
    }
    async build() {
        let scene = new Scene();

        this.spec.nodes.forEach(spec => scene.addNode(this.createNode(spec)));
        await this.loadGLTFNodes( scene );

        return scene;
    }

}
