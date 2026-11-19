from pathlib import Path
import struct,json
root=Path(__file__).resolve().parent
for dim in (1024,2048):
    p=root/'assets'/'imported-window'/f'nik-window-{dim}.glb'
    b=p.read_bytes()
    assert b[:4]==b'glTF' and struct.unpack_from('<II',b,4)==(2,len(b))
    n=struct.unpack_from('<I',b,12)[0]
    doc=json.loads(b[20:20+n])
    assert 'CC-BY-4.0' in doc['asset']['extras']['license']
    assert 'Nik' in doc['asset']['extras']['author']
    assert doc['accessors'][0]['count']==26797
    assert doc['accessors'][5]['count']==149997
    assert len(doc['images'])==3
    assert doc['buffers'][0]['byteLength']==struct.unpack_from('<I',b,20+n+(4-n%4)%4)[0]
    assert len(b)<6_000_000
print('PASS – mobile/desktop GLB assets, geometry count, provenance and embedded license')
main=(root/'src/main.js').read_text()
facade=(root/'src/facade.js').read_text()
ornament=(root/'src/heritage-ornaments.js').read_text()
index=(root/'index.html').read_text()
assert "historicWindowPreview" in main
assert "if(historicWindowPreview)" in main
assert 'holder.position.set(-15,7.80,12.38)' in main
assert 'importedWindowPreview && axis===-15 && storey.floor===1' in facade
assert 'a!==skipNorthAxis' in ornament
assert 'imported-model-credit' in index
assert '20261118-v23-tuerfluegel-fix' in index
assert (root/'NOTICE-ORIGINALMODELL-LIZENZ.txt').exists()
print('PASS – selective single-window preview, V12 default view, license display and root layout')
