export class BufferStore {
  private buffers: Map<string, WebGLBuffer> = new Map();
  private bufferSizes: Map<string, number> = new Map();

  constructor(private gl: WebGLRenderingContext) {}

  createBuffer(id: string, data: Float32Array): void {
    const { gl } = this;
    let buffer = this.buffers.get(id);
    const currentSize = this.bufferSizes.get(id) || 0;

    if (buffer && data.byteLength <= currentSize) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      return;
    }

    if (buffer) gl.deleteBuffer(buffer);

    buffer = gl.createBuffer();
    if (!buffer) throw new Error("Failed to create buffer");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);

    this.buffers.set(id, buffer);
    this.bufferSizes.set(id, data.byteLength);
  }

  updateBuffer(id: string, data: Float32Array, offsetInBytes: number): boolean {
    const { gl } = this;
    const buffer = this.buffers.get(id);
    const currentSize = this.bufferSizes.get(id) || 0;

    if (!buffer || offsetInBytes + data.byteLength > currentSize) return false;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, offsetInBytes, data);
    return true;
  }

  getBuffer(id: string): WebGLBuffer | undefined {
    return this.buffers.get(id);
  }

  deleteBuffer(id: string): void {
    const buffer = this.buffers.get(id);
    if (!buffer) return;

    this.gl.deleteBuffer(buffer);
    this.buffers.delete(id);
    this.bufferSizes.delete(id);
  }

  destroy(): void {
    this.buffers.forEach((buffer) => this.gl.deleteBuffer(buffer));
    this.buffers.clear();
    this.bufferSizes.clear();
  }
}
