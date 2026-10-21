from pathlib import Path
from PIL import Image,ImageSequence
import numpy as np,shutil
R=Path(__file__).resolve().parents[1]
files=list((R/'public/assets').glob('card-*.webp'))+list((R/'public/assets/ai-suite').glob('*.webp'))+list((R/'public/assets/boss-flow').glob('*.webp'))
backup=R/'references/opaque-posters';backup.mkdir(parents=True,exist_ok=True)
def alpha(im,light=False):
 a=np.array(im.convert('RGBA'));rgb=a[:,:,:3].astype(float);v=rgb.max(axis=2);mask=np.clip((v-15)/30,0,1);a[:,:,3]=(a[:,:,3]*mask).astype('uint8')
 if light:
  gray=(rgb.max(axis=2)-rgb.min(axis=2))<35
  a[:,:,:3][gray]=(255-rgb[gray]).clip(0,255).astype('uint8')
 return Image.fromarray(a)
for p in files:
 dest=backup/p.relative_to(R/'public/assets');dest.parent.mkdir(parents=True,exist_ok=True)
 if not dest.exists():shutil.copy2(p,dest)
 with Image.open(dest) as src:
  frames=[alpha(f.copy()) for f in ImageSequence.Iterator(src)];duration=src.info.get('duration',110)
 frames[0].save(p,save_all=True,append_images=frames[1:],duration=duration,loop=0,quality=82,method=4)
 frames[0].save(p.with_suffix('.png'))
 if p.parent.name=='boss-flow':
  fs=[alpha(f.copy(),True) for f in ImageSequence.Iterator(Image.open(dest))]
  out=p.with_name(p.stem+'-light.webp');fs[0].save(out,save_all=True,append_images=fs[1:],duration=110,loop=0,quality=82,method=4);fs[0].save(out.with_suffix('.png'))
print(f'Transparent posters: {len(files)}')
