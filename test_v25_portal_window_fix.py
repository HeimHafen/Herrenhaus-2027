from pathlib import Path
import re,zipfile
p=Path(__file__).parent
f=(p/'src/facade.js').read_text()
h=(p/'src/heritage-ornaments.js').read_text()
m=(p/'src/main.js').read_text()
i=(p/'index.html').read_text()
w=(p/'src/double-hung-windows.js').read_text()
d=(p/'src/castle-door-import.js').read_text()
assert 'const isWindowInsert = material===glass || material===paintedSash || material===carvedFrame || material===limestoneShadow;' in f
assert 'new THREE.TorusGeometry(1.18' not in f
assert 'archLeft' not in f and 'keystone.position' not in f
assert 'surface(0,2.70,12.08,3.72,3.72,.10,stone)' not in f
assert 'skipWindowSurrounds:true' in f
assert 'if(!skipWindowSurrounds)' in h
assert 'Heritage_Front_Capital_Echinus' in h
assert 'V25</span>' in i and 'v25-portalfenster-reparatur' in i
assert 'dataset.version = "V25"' in m
assert "dataset.build='20261118-v25-portalfenster-reparatur'" in m
assert 'loadCastleDoor' in m and 'loadSixOverSixWindows' in m
assert 'root.userData.leaves=leaves' in d
assert 'const placements=[]' in w
assert (p/'assets/imported-door/castle-style-door-optimized.glb').exists()
assert (p/'assets/imported-window/double-hung-6over6-cc0.glb').exists()
assert (p/'assets/white-house-structure.glb').exists()
print('PASS V25: keine U-Ring-/Wandplatte, keine doppelten Fensterrahmen, Säulendetails und 3D-Assets bleiben')
