from pathlib import Path
from PIL import Image
r=Path(__file__).resolve().parent
c=(r/'src/entrance-floor.js').read_text()
index=(r/'index.html').read_text()
main=(r/'src/main.js').read_text()
assert 'width = 2.92' in c and 'depth = 4.32' in c
assert 'nearDoorZ = 12.34' in c and 'farEndZ = nearDoorZ - depth' in c
assert 'slabTop + finishOffset' in c and 'floor.rotation.x = -Math.PI / 2' in c
assert 'bumpMap: relief' in c
assert 'buildEntranceFloor(THREE, scene, renderer)' in main
assert main.count('buildEntranceFloor(THREE, scene, renderer)') == 1
assert '20261118-v23-tuerfluegel-fix' in index and 'V23</span>' in index
for nm in ['historische-eingangsfliesen.jpg','historische-eingangsfliesen-bump.jpg']:
 p=r/'assets/entrance-floor'/nm
 assert p.exists() and p.stat().st_size>40000
 assert Image.open(p).size == (1728,2424)
assert not (r/'src/marble-entrance.js').exists()
assert not (r/'assets/interior').exists()
assert not (r/'assets/entrance-floor/entrance_floor_tiles.glb').exists()
print('PASS V18: original-texture-derived entrance only, no extra stairs/walls, iOS texture and cache marker')
