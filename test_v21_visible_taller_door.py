
from pathlib import Path
p=Path(__file__).parent
facade=(p/'src/facade.js').read_text()
door=(p/'src/oak-door.js').read_text()
arch=(p/'src/architecture.js').read_text()
main=(p/'src/main.js').read_text()
html=(p/'index.html').read_text()
assert 'leaf.scale.set(1.03,1.12,1.0);' in door
assert "design='OAK-2027-v3-tall'" in door
assert 'surface(0,4.405,12.35,3.42,.175,.26,mats.dressedStone);' in facade
assert 'surface(0,4.532,12.37,3.58,.075,.30,mats.trim);' in facade
assert 'corridorLid=4.92' in arch
assert 'V21</span>' in html
assert "dataset.build='20261118-v21-sichtbar-hoehere-tueren'" in main
print('PASS V21: visibly taller entrance door and refined portal')
