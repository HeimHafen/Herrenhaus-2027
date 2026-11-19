
from pathlib import Path
p=Path(__file__).parent
facade=(p/'src/facade.js').read_text()
door=(p/'src/oak-door.js').read_text()
arch=(p/'src/architecture.js').read_text()
main=(p/'src/main.js').read_text()
html=(p/'index.html').read_text()
assert 'buildEntranceFanlight' not in facade
assert 'const fanlight=null;' in facade
assert 'surface(0,4.335,12.35,3.39,.195,.26,mats.dressedStone);' in facade
assert 'leaf.scale.y=1.085;' in door
assert "design='OAK-2027-v2-high'" in door
assert 'corridorLid=4.70' in arch
for n in ['Cube.518','Cube.519','Cube.520','Cube.521']:
    assert n in main
assert 'V20</span>' in html
assert "dataset.build='20261118-v20-hohe-eichentuer'" in main
print('PASS V20: hoher Rechteck-Eingang ohne Bogen, hohe Eichen-Doppeltuer, ruhigerer Eingangsbereich')
