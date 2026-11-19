from pathlib import Path
import json,struct,re
p=Path(__file__).parent
main=(p/'src/main.js').read_text()
arch=(p/'src/entrance-fanlight.js').read_text()
ceiling=(p/'src/architecture.js').read_text()
facade=(p/'src/facade.js').read_text()
floor=(p/'src/entrance-floor.js').read_text()
html=(p/'index.html').read_text()
for n in range(518,522):
 assert f"'Cube.{n}'" in main, f'Altleuchte Cube.{n} nicht verborgen'
assert all(x in arch for x in ['new THREE.ExtrudeGeometry','STONE_OUT','STONE_IN','ringShape','freeEndcaps:0'])
assert 'Seitliches_Anschlussprofil' not in arch
assert 'new THREE.TubeGeometry' not in arch
assert '4.245' in arch and '4.085,12.35,3.38,.315' in facade
assert '4.277' in ceiling and 'Cube.003' in ceiling
assert 'corridorLid=4.245' in ceiling
assert 'nearDoorZ = 12.34' in floor and 'depth = 4.32' in floor
assert 'V19</span>' in html and 'v19-portal-rohbau' in html
assert "dataset.build='20261118-v19-portal-rohbau'" in main
# Parse actual GLB without additional dependency; verify the unique names are present.
glb=(p/'assets/white-house-structure.glb').read_bytes();assert glb[:4]==b'glTF'
l,typ=struct.unpack_from('<II',glb,12);assert typ==0x4e4f534a
j=json.loads(glb[20:20+l]); names=set(n.get('name') for n in j['nodes']);
for n in range(518,522): assert f'Cube.{n}' in names
assert 'Cube.003' in names
print('PASS V19: GLB-Lampen-Knoten, durchgehender Portalbogen, Sichtdecke bei 4.277, nur Eingangsfliesen, Cachekennung')
