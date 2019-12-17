export default class Scene {

    constructor() {
        this.nodes = [];
        this.GLTF = [];

    }

    addNode(node) {
        this.nodes.push(node);
    }
    addGltfScene( node ){
        this.GLTF.push( node );
    }
    traverse(before, after) {
        this.nodes.forEach(node => node.traverse(before, after));
    }

}
