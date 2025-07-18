import { Parser } from 'https://cdn.jsdelivr.net/npm/@etothepii/satisfactory-file-parser@latest/dist/index.esm.js';

export function parseBlueprint(buffer) {
  console.log('[parser.js] Using @etothepii/satisfactory-file-parser');

  const bp = Parser.ParseBlueprint('blueprint', buffer);
  if (!bp || !Array.isArray(bp.BuildableList)) return [];

  // Attach metadata if available
  if (bp.MetaData) {
    const { Name, Description } = bp.MetaData;
    window.appendLog?.(`📘 Name: ${Name || 'Unknown'}`);
    window.appendLog?.(`📝 Description: ${Description || 'None'}`);

    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      const header = document.createElement('div');
      header.style.marginBottom = '10px';
      header.innerHTML = `
        <strong>📘 ${Name || 'Unnamed Blueprint'}</strong><br>
        <em>${Description || ''}</em>
      `;
      sidebar.prepend(header);
    }
  }

  return bp.BuildableList.map(obj => ({
    typePath: obj.PathName,
    position: obj.Transform.Position,
    rotation: obj.Transform.Rotation
  }));
}
