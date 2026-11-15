"""Build the canvas atlases/posters from genuine multi-frame anatomical GIFs.
Requires Pillow; original GIFs remain available for download.
"""
import json, pathlib, math
from PIL import Image,ImageOps
root=pathlib.Path(__file__).resolve().parents[1]
sources=json.loads((root/'scripts/anatomy-sources.json').read_text())
out=root/'public/anatomy';out.mkdir(exist_ok=True)
manifest={}
for id,source in sources.items():
    target=out/f'{id}.gif'
    if source=='custom':
        sheet=root/'design/animation-sheets'/f'{id}.png'
        if not sheet.exists():
            print('Waiting for sheet:',id);continue
        atlas=Image.open(sheet).convert('RGB');w,h=atlas.size;frames=[]
        for i in range(8):
            frame=atlas.crop((round((i%4)*w/4),round((i//4)*h/2),round((i%4+1)*w/4),round((i//4+1)*h/2)))
            frames.append(ImageOps.pad(frame,(360,360),color='white'))
        frames[0].save(target,save_all=True,append_images=frames[1:],duration=160,loop=0,disposal=2)
    im=Image.open(target)
    assert im.n_frames>1,(id,im.n_frames)
    frames=[];durations=[]
    for i in range(im.n_frames):
        im.seek(i)
        frame=Image.new('RGB',im.size,'white');rgba=im.convert('RGBA');frame.paste(rgba,mask=rgba.getchannel('A'))
        frames.append(frame);durations.append(max(30,im.info.get('duration',100)))
    width,height=im.size;columns=min(8,len(frames))
    atlas=Image.new('RGB',(columns*width,math.ceil(len(frames)/columns)*height),'white')
    for i,frame in enumerate(frames):atlas.paste(frame,((i%columns)*width,(i//columns)*height))
    atlas.save(out/f'{id}-atlas.webp',quality=92,method=6)
    frames[0].save(out/f'{id}-poster.webp',quality=90,method=6)
    manifest[id]={'gif':f'anatomy/{id}.gif','atlas':f'anatomy/{id}-atlas.webp','poster':f'anatomy/{id}-poster.webp','width':width,'height':height,'columns':columns,'frameCount':len(frames),'durations':durations,'kind':'illustrated-gif','sourceId':source}
(root/'src/data/exercise-media.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Built',len(manifest),'animations;',sum(e['frameCount'] for e in manifest.values()),'total frames')
