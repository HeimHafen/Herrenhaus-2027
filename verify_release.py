"""Self-contained packaging checks; uses Python standard library only."""
from pathlib import Path
import json, re, struct
root=Path(__file__).resolve().parent
required=['index.html','README.md','.nojekyll','src/main.js','src/facade.js','src/south-portico.js','src/exterior-materials.js','src/exterior-details.js','src/architecture.js','src/entrance-floor.js','src/window-layout.js','src/exterior-skin.js','src/entrance-fanlight.js','src/heritage-ornaments.js','assets/white-house-structure.glb','src/oak-door.js','vendor/three/LICENSE','vendor/three/build/three.module.js','vendor/three/examples/jsm/loaders/GLTFLoader.js','vendor/three/examples/jsm/utils/BufferGeometryUtils.js']
required += ['src/entry-salons.js','assets/entry-finish/herringbone-parquet-floor-tile-oak.glb']
required += ['src/cellar.js','assets/wood/eiche-dunkel-v26.jpg']
for f in required:
    assert (root/f).is_file(), f'Fehlende Projektdatei: {f}'
assets=list((root/'assets').rglob('*'))
assert all(p.stat().st_size>0 for p in assets if p.is_file())
assert len([p for p in assets if p.suffix.lower()=='.jpg'])>=28
index=(root/'index.html').read_text()
assert '20261119-v83-innenraum' in index and 'type="importmap"' in index
assert 'src/main.js' in index
assert './vendor/three/build/three.module.js' in index and 'cdn.jsdelivr.net' not in index
assert not any('White-House-3D' in (root/'src'/p).read_text() for p in ['main.js','facade.js','south-portico.js'])
for p in (root/'src').glob('*.js'):
    text=p.read_text()
    # Local imported JS modules must exist; query strings are for cache control.
    for dep in re.findall(r'''from\s+['"](\./[^'"]+)['"]''',text):
        location=p.parent/(dep.split('?')[0])
        assert location.is_file(), f'Import fehlt: {p.name} -> {dep}'
# Parse GLB binary header and verify container metadata.
glb=(root/'assets/white-house-structure.glb').read_bytes()
assert glb[:4]==b'glTF'
version,length=struct.unpack_from('<II',glb,4)
assert version==2 and length==len(glb)
chunk_length,chunk_type=struct.unpack_from('<II',glb,12)
assert chunk_type==0x4e4f534a
obj=json.loads(glb[20:20+chunk_length].decode('utf-8'))
assert len(obj.get('meshes',[]))>300
assert len(obj.get('nodes',[]))>300
assert "startView==='south'" in (root/'src/main.js').read_text()
assert "startView==='west'" in (root/'src/main.js').read_text()
assert not (root/'src/marble-entrance.js').exists() and not (root/'assets/interior').exists()
assert 'marble-entrance' not in (root/'src/main.js').read_text()
print(f'PASS – vollständige Projektstruktur, {len(assets)} Assets inkl. Verzeichnisse, GLB v{version} mit {len(obj["meshes"])} Meshes')
assert "buildOakEntrance" in (root/'src/main.js').read_text()
assert 'loadCastleDoor' not in (root/'src/main.js').read_text()
assert not (root/'Herrenhaus-2027-main').exists()
print('PASS – V83 aktiviert, lokale Modulimporte, Startdatei, GitHub Pages und unabhängiges Repository')
