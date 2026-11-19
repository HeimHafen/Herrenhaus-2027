from pathlib import Path
from PIL import Image, ImageStat
p=Path(__file__).parent
for name in ['facade_limestone','trim_limestone','column_stone','base_limestone']:
    f=p/'assets'/'exterior'/f'{name}_albedo.jpg'
    assert f.is_file()
    vals=ImageStat.Stat(Image.open(f).convert('RGB')).mean
    assert max(vals)-min(vals)<4.0, f'{name} still has a warm color cast: {vals}'
    assert vals[0]>=195, f'{name} overly dark: {vals}'
    print(name, 'mean RGB', tuple(round(x,1) for x in vals))
f=(p/'src'/'facade.js').read_text()
assert 'Exterior corner quoins are constructed once' in f
assert 'for(let row=0;row<16;row++)' not in f
m=(p/'src'/'main.js').read_text()
assert '0xeaf3ff' in m and '0x92989a' in m
print('PASS – neutral stone texture channels, single-layer corners, daylight calibrated')
