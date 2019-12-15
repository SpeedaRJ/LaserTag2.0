import Node from "./Node";
import Mesh from "./Mesh";
import Utils from "./Utils";

class Player extends Node {

    constructor(options, mesh, texture) {
        super(options);
        Utils.init(this, Node.defaults, options);
        this.mesh = mesh;
        this.image = texture;
    }
}