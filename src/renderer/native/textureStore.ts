export class TextureStore {
  private textures: Map<string, WebGLTexture> = new Map();

  constructor(private gl: WebGLRenderingContext) {}

  createColormapTexture(id: string, data: Uint8Array): WebGLTexture {
    const { gl } = this;
    let texture = this.textures.get(id);

    if (!texture) {
      texture = gl.createTexture()!;
      this.textures.set(id, texture);
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      data.length / 4,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      data
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
  }

  getTexture(id: string): WebGLTexture | undefined {
    return this.textures.get(id);
  }

  destroy(): void {
    this.textures.forEach((t) => this.gl.deleteTexture(t));
    this.textures.clear();
  }
}
