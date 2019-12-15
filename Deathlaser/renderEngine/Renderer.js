import * as WebGL from './WebGL.js';
import shaders from '../shaders/shaders.js';

const mat4 = glMatrix.mat4;

export default class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.defaultTexture = WebGL.createTexture(gl, {
            width  : 1,
            height : 1,
            data   : new Uint8Array([255, 255, 255, 255])
        });
    }

    prepare(scene) {
        scene.nodes.forEach(node => {
            node.gl = {};
            if (node.mesh) {
                Object.assign(node.gl, this.createModel(node.mesh));
            }
            if (node.image) {
                node.gl.texture = this.createTexture(node.image);
            }
        });
    }

    renderGltf(scene, camera) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.simple;
        gl.useProgram(program.program);

        let mvpMatrix = mat4.create();
        let mvpStack = [];
        const mvpLocation = program.uniforms.uModelViewProjection;
        const viewMatrix = mat4.clone(camera.transform);
        let parent = camera.parent;
        while (parent) {
            mat4.mul(viewMatrix, parent.transform, viewMatrix);
            parent = parent.parent;
        }
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(mvpMatrix, camera.camera.matrix, viewMatrix);

        function useMaterial(material) {
            const pbr = material.pbrMetallicRoughness;
            if (pbr) {
                if (pbr.baseColorTexture) {
                    const texture = pbr.baseColorTexture.texture;
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, texture.textureObject);
                    gl.bindSampler(0, texture.sampler.samplerObject);
                    gl.uniform1i(program.uniforms.uBaseColorTexture, 0);
                }
            }
        }

        function renderNode(node) {
            mvpStack.push(mat4.clone(mvpMatrix));
            mat4.mul(mvpMatrix, mvpMatrix, node.transform);
            if (node.mesh) {
                for (let primitive of node.mesh.primitives) {
                    gl.bindVertexArray(primitive.vao);
                    gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
                    useMaterial(primitive.material);
                    if (primitive.indices) {
                        const mode = primitive.mode;
                        const count = primitive.indices.count;
                        const type = primitive.indices.componentType;
                        gl.drawElements(mode, count, type, 0);
                    } else {
                        const mode = primitive.mode;
                        const count = primitive.attributes.POSITION.count;
                        gl.drawArrays(mode, 0, count);
                    }
                }
            }
            for (let child of node.children) {
                renderNode(child);
            }
            mvpMatrix = mvpStack.pop();
        }

        for (let node of scene.nodes) {
            renderNode(node);
        }
    }
    render(scene, camera) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.simple;
        gl.useProgram(program.program);

        let matrix = mat4.create();
        let matrixStack = [];

        const viewMatrix = camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);

        scene.traverse(
            node => {
                matrixStack.push(mat4.clone(matrix));
                mat4.mul(matrix, matrix, node.transform);
                if (node.gl.vao) {
                    gl.bindVertexArray(node.gl.vao);
                    gl.uniformMatrix4fv(program.uniforms.uViewModel, false, matrix);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, node.gl.texture);
                    gl.uniform1i(program.uniforms.uTexture, 0);
                    gl.drawElements(gl.TRIANGLES, node.gl.indices, gl.UNSIGNED_SHORT, 0);
                }
            },
            node => {
                matrix = matrixStack.pop();
            }
        );
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    createTexture(texture) {
        const gl = this.gl;
        return WebGL.createTexture(gl, {
            image : texture,
            min   : gl.NEAREST,
            mag   : gl.NEAREST
        });
    }

}
