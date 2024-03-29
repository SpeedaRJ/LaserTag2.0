export const vertex =
`#version 300 es
uniform vec2 uOffset;

in vec2 aPosition;
in vec4 aColor;

out vec4 vColor;

void main() {
    vColor = aColor;
    gl_Position = vec4(aPosition + uOffset, 0, 1);
}
`;