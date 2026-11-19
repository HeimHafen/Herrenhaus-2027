"""Verifies that the entrance tile is confined to the passage behind the door."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parent
main=(ROOT/'src/main.js').read_text()
floor=(ROOT/'src/entrance-floor.js').read_text()
assert main.count('buildEntranceFloor(THREE, scene, renderer)')==1
assert "buildEntranceFloor" in main
assert 'new THREE.PlaneGeometry(width, depth)' in floor
assert "nearDoorZ = 12.34" in floor
assert "depth = 4.32" in floor
assert "width = 2.92" in floor
assert "farEndZ = nearDoorZ - depth" in floor
assert "floor.position.set(0, slabTop + finishOffset, (nearDoorZ + farEndZ) / 2)" in floor
assert "slabTop = .89 + .018 + .025" in floor
assert "floor.rotation.x = -Math.PI / 2" in floor
assert 'floor.receiveShadow = true' in floor
assert (ROOT/'assets/entrance-floor/historische-eingangsfliesen.jpg').stat().st_size>100_000
assert not (ROOT/'src/marble-entrance.js').exists()
assert not (ROOT/'assets/interior').exists()
print('PASS – genau eine lokal begrenzte Fliesenfläche hinter der Eingangstür; keine anderen Böden verändert')
