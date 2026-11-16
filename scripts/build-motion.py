"""Encode 48 real motion-interpolated frames from authored anatomical key poses.

Never uses the previous two-pose/crossfade GIFs as motion inputs. Every dynamic
numeric-source exercise instead receives a newly authored 12-pose atlas.
"""
import argparse, hashlib, importlib.util, json, math, os
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('motion_flow',ROOT/'scripts/animation-flow.py')
flow=importlib.util.module_from_spec(spec);spec.loader.exec_module(flow)

def load_poses(path,columns,rows):
    sheet=Image.open(path).convert('RGB');w,h=sheet.size
    if abs(w/h-columns/rows)>.04:raise ValueError(f'Wrong pose-grid aspect ratio: {path} ({w}x{h})')
    return [ImageOps.pad(sheet.crop((round(i%columns*w/columns),round(i//columns*h/rows),round((i%columns+1)*w/columns),round((i//columns+1)*h/rows))),(360,360),color='white') for i in range(columns*rows)]

def phases(poses,count):
    # Allocate phases to visible movement rather than holding identical endpoints.
    small=[np.asarray(im.resize((90,90)).filter(ImageFilter.GaussianBlur(1.5)),dtype=np.float32) for im in poses]
    changes=np.array([np.sqrt(np.mean((small[(i+1)%len(poses)]-im)**2)) for i,im in enumerate(small)])
    weights=np.maximum(changes,changes.max()*.08);starts=np.concatenate(([0.],np.cumsum(weights)))
    out=[]
    for t in np.arange(count)*starts[-1]/count:
        i=min(len(poses)-1,int(np.searchsorted(starts,t,side='right')-1));out.append((i,(i+1)%len(poses),float((t-starts[i])/weights[i])))
    return out

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--ids');p.add_argument('--cache-dir',type=Path,default=Path('/private/tmp/makebody-animation-cache'));p.add_argument('--out-dir',type=Path,default=ROOT/'public/anatomy');p.add_argument('--manifest',type=Path);p.add_argument('--frames',type=int,default=48);p.add_argument('--duration',type=int,default=40);p.add_argument('--ready-only',action='store_true');p.add_argument('--skip-built',action='store_true');a=p.parse_args()
    sources=json.loads((ROOT/'scripts/anatomy-sources.json').read_text());ids=a.ids.split(',') if a.ids else list(sources)
    manifest_path=a.manifest or (ROOT/'src/data/exercise-media.json' if a.out_dir.resolve()==(ROOT/'public/anatomy').resolve() else a.out_dir/'exercise-media.json');manifest_path.parent.mkdir(parents=True,exist_ok=True);manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    a.out_dir.mkdir(parents=True,exist_ok=True);interpolator=flow.Interpolator(a.cache_dir/'rife425-flownet.pkl')
    for id in ids:
        original=sources[id];is_old_sheet=original=='custom';path=ROOT/('design/animation-sheets' if is_old_sheet else 'design/motion-sheets')/(id+'.png')
        if not path.exists():
            if a.ready_only: continue
            raise FileNotFoundError(f'Authored intermediate poses required: {path}')
        source_sha=hashlib.sha256(path.read_bytes()).hexdigest()
        old=manifest.get(id,{})
        if a.skip_built and old.get('gif')==f'{a.out_dir.name}/{id}.gif' and old.get('renderVersion')=='motion48-clean-1' and old.get('sheetSha256')==source_sha and old.get('frameCount')==a.frames and old.get('durations')==[a.duration]*a.frames and all((ROOT/'public'/old.get(k,'missing')).is_file() for k in ['gif','atlas','poster']):
            continue
        poses=load_poses(path,4,2 if is_old_sheet else 3);samples=phases(poses,a.frames)
        frames=[interpolator.between(poses[x],poses[y],t) for x,y,t in samples]
        strip=Image.new('RGB',(360*len(frames),360),'white')
        for i,im in enumerate(frames):strip.paste(im,(i*360,0))
        palette=strip.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
        indexed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
        gif=a.out_dir/(id+'.gif');indexed[0].save(gif,save_all=True,append_images=indexed[1:],duration=a.duration,loop=0,disposal=2,optimize=False)
        saved=Image.open(gif);assert saved.n_frames==a.frames,(id,saved.n_frames)
        decoded=[];durations=[]
        for i in range(saved.n_frames):saved.seek(i);decoded.append(saved.convert('RGB'));durations.append(saved.info['duration'])
        assert durations==[a.duration]*a.frames
        # Keep the established palette, then remove source cell rules at the rim.
        cleaned=[ImageOps.expand(im.crop((4,4,356,356)),border=4,fill='white') for im in decoded]
        clean_indexed=[im.quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE) for im in cleaned]
        clean_indexed[0].save(gif,save_all=True,append_images=clean_indexed[1:],duration=a.duration,loop=0,disposal=2,optimize=False)
        saved=Image.open(gif);assert saved.n_frames==a.frames
        decoded=[];durations=[]
        for i in range(saved.n_frames):saved.seek(i);decoded.append(saved.convert('RGB'));durations.append(saved.info['duration'])
        assert durations==[a.duration]*a.frames
        columns=8;atlas=Image.new('RGB',(columns*360,math.ceil(a.frames/columns)*360),'white')
        for i,im in enumerate(decoded):atlas.paste(im,(i%columns*360,i//columns*360))
        atlas.save(a.out_dir/(id+'-atlas.webp'),lossless=True,method=6,exact=True);decoded[0].save(a.out_dir/(id+'-poster.webp'),lossless=True,method=6,exact=True)
        prefix=a.out_dir.name
        manifest[id]={'gif':f'{prefix}/{id}.gif','atlas':f'{prefix}/{id}-atlas.webp','poster':f'{prefix}/{id}-poster.webp','width':360,'height':360,'columns':columns,'frameCount':a.frames,'durations':durations,'kind':'illustrated-gif','sourceId':'authored-motion','keyPoseCount':len(poses),'sheetSha256':source_sha,'renderVersion':'motion48-clean-1'}
        temp=manifest_path.with_suffix('.json.tmp');temp.write_text(json.dumps(manifest,indent=2)+'\n');os.replace(temp,manifest_path)
        interpolator.cache.clear();print(f'{id}: {len(poses)} authored poses -> {a.frames} frames, {a.duration}ms/frame',flush=True)
    temp=manifest_path.with_suffix('.json.tmp');temp.write_text(json.dumps(manifest,indent=2)+'\n');os.replace(temp,manifest_path)
if __name__=='__main__':main()
