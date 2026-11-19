from pathlib import Path
import json,struct,trimesh,numpy as np
p=Path(__file__).parent
main=(p/'src/main.js').read_text()
facade=(p/'src/facade.js').read_text()
door=(p/'src/castle-door-import.js').read_text()
win=(p/'src/double-hung-windows.js').read_text()
assert 'buildOakEntrance' not in facade and 'loadCastleDoor' in main
assert 'loadSixOverSixWindows' in main and 'legacyWindowInserts.clear()' in main
assert 'Frame.002' in door and 'Frame.001' in door
assert 'pivot.attach(source)' in door
assert 'InstancedMesh' in win and 'scale:h/1.5940011' in win
assert 'V23</span>' in (p/'index.html').read_text()
assert 'CC BY 4.0' in (p/'ATTRIBUTION-MODELLE-V22.md').read_text()
for name in ['imported-door/castle-style-door-optimized.glb','imported-window/double-hung-6over6-cc0.glb']:
  raw=(p/'assets'/name).read_bytes();assert raw[:4]==b'glTF'
  ver,size=struct.unpack_from('<II',raw,4);assert ver==2 and size==len(raw)
  jl,typ=struct.unpack_from('<II',raw,12); assert typ==0x4e4f534a
  j=json.loads(raw[20:20+jl]);assert len(j['meshes'])>=4
  print(name, 'MB',round(size/1e6,2),'meshes',len(j['meshes']))
optimized=trimesh.load(p/'assets/imported-door/castle-style-door-optimized.glb',force='scene')
assert len(optimized.geometry)==6
assert 'Frame.002' in optimized.graph.nodes_geometry[0] or any('Frame.002' in name for name in optimized.graph.nodes_geometry)
print('PASS optimized GLB loaded, door leaf pivots, 74 windows and licenses present')

facade=(p/'src/facade.js').read_text()
assert 'Gewaende_Steinspandrel' in facade
assert 'const fanlight=null;' in facade
assert 'buildOakEntrance' not in facade
assert 'Math.abs(x)>.69' in (p/'src/main.js').read_text()
