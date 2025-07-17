// parser.js

/**
 * Lightweight parser for Satisfactory .sbp blueprint files
 * @param {ArrayBuffer} sbpBuffer - Binary .sbp data
 * @returns {Array} - Parsed array of blueprint objects
 */
export function parseBlueprint(sbpBuffer) {
  const view = new DataView(sbpBuffer);
  let offset = 0;
  const result = [];

  function readUint32() {
    const val = view.getUint32(offset, true); offset += 4; return val;
  }

  function readFloat32() {
    const val = view.getFloat32(offset, true); offset += 4; return val;
  }

  function readString() {
    const len = readUint32();
    const bytes = new Uint8Array(sbpBuffer, offset, len);
    offset += len;
    return new TextDecoder().decode(bytes);
  }

  try {
    const version = readUint32();
    const objectCount = readUint32();

    for (let i = 0; i < objectCount; i++) {
      const typePath = readString();
      const position = {
        x: readFloat32(),
        y: readFloat32(),
        z: readFloat32(),
      };
      const rotation = {
        x: readFloat32(),
        y: readFloat32(),
        z: readFloat32(),
        w: readFloat32(),
      };
      result.push({ typePath, position, rotation });
    }
  } catch (e) {
    console.error('Error parsing blueprint:', e);
  }

  return result;
}
