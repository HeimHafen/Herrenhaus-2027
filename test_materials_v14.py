"""V14 material integration and mobile-resource audit."""
from pathlib import Path
from PIL import Image,ImageStat,ImageChops
import re
root=Path(__file__).resolve().parent
names=['facade_limestone','trim_limestone','column_stone','base_limestone']
asset_root=root/'assets'/'heritage-v14'
for name in names:
    for channel in ['albedo','normal','roughness']:
        file=asset_root/f'{name}_{channel}.jpg'
        assert file.is_file() and file.stat().st_size>1000, file
        with Image.open(file) as im:
            assert im.size==(1024,1024), (file,im.size)
            im=im.convert('RGB')
            if channel=='albedo':
                st=ImageStat.Stat(im)
                assert 150<st.mean[0]<235 and 145<st.mean[1]<225 and 135<st.mean[2]<220,(name,st.mean)
                assert st.stddev[0]>3, (name,st.stddev)
                # Opposite edges were feathered for repeatable source-derived maps.
                a=list(im.crop((0,0,1,1024)).getdata())
                b=list(im.crop((1023,0,1024,1024)).getdata())
                diff=sum(abs(a[i][c]-b[i][c]) for i in range(1024) for c in range(3))/(1024*3)
                assert diff<8,(name,diff)
            elif channel=='normal':
                assert ImageStat.Stat(im).mean[2]>210, f'Normal direction suspicious: {name}'
js=(root/'src/exterior-materials.js').read_text()
assert "'./assets/heritage-v14/'" in js
assert "'heritageAshlar'" in js
assert 'float course=floor((wp.y+.12)/.70);' in js
assert "const facadeWall=limestone('facade_limestone'" in js
main=(root/'src/main.js').read_text()
index=(root/'index.html').read_text()
assert '20261118-v23-tuerfluegel-fix' in index and '20261118-stone-v14' in main
notice=(root/'NOTICE-MATERIALIEN-V14.txt').read_text()
for name in ('PixelatoR','slls666','Nik','CC BY 4.0'):
    assert name in notice, name
assert not (root/'assets'/'plaster_wall.glb').exists()
assert not (root/'assets'/'white_wall_texture.glb').exists()
print('PASS 12 optimierte 1024px-PBR-Dateien, Originalquellen korrekt genannt')
print('PASS neue Texturen in Fassadenmaterialbibliothek und Cache-Version eingebunden')
print('PASS 4 Materialfamilien ohne schwere Wand-GLBs im Browserprojekt')
