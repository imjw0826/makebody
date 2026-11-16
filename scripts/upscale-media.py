"""Upscale a pinned release without changing its artwork, frames or timing."""
import argparse, hashlib, io, json, math, subprocess, tempfile
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--source',default='bdef819')
ap.add_argument('--size',type=int,default=720)
ap.add_argument('--ids')
args=ap.parse_args()
def original(file):
    return subprocess.check_output(['git','show',f'{args.source}:{file}'],cwd=ROOT)
source=json.loads(original('src/data/exercise-media.json'))
manifest_path=ROOT/'src/data/exercise-media.json'
manifest=json.loads(manifest_path.read_text())
ids=args.ids.split(',') if args.ids else list(source)
source_commit=subprocess.check_output(['git','rev-parse',args.source],cwd=ROOT,text=True).strip()
with tempfile.TemporaryDirectory(prefix='makebody-resolution-') as temp:
    for number,id in enumerate(ids):
        entry=source[id];data=original('public/'+entry['gif']);input_path=Path(temp)/(id+'.gif');input_path.write_bytes(data)
        output=ROOT/'public'/entry['gif']
        # Spatial resampling only. No new poses, interpolation or AI synthesis.
        filters=f'[0:v]scale={args.size}:{args.size}:flags=lanczos,unsharp=3:3:0.3:3:3:0,split[a][b];[a]palettegen=max_colors=256:reserve_transparent=0[p];[b][p]paletteuse=dither=none'
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(input_path),'-filter_complex',filters,'-fps_mode','passthrough','-loop','0',str(output)],check=True)
        gif=Image.open(output);assert gif.n_frames==entry['frameCount'],(id,'frame count')
        columns=4;atlas=Image.new('RGB',(args.size*columns,args.size*math.ceil(gif.n_frames/columns)),'white');durations=[]
        for k in range(gif.n_frames):
            gif.seek(k);frame=gif.convert('RGB');assert frame.size==(args.size,args.size)
            durations.append(gif.info['duration']);atlas.paste(frame,(k%columns*args.size,k//columns*args.size))
            if k==0:frame.save(ROOT/'public'/entry['poster'],lossless=True,method=4)
        assert durations==entry['durations'] and gif.info.get('loop')==0,(id,'timing changed')
        atlas.save(ROOT/'public'/entry['atlas'],lossless=True,method=4)
        manifest[id]={**entry,'width':args.size,'height':args.size,'columns':columns,'sourceCommit':source_commit,
                      'upscaledFrom':{'width':entry['width'],'height':entry['height'],'gifSha256':hashlib.sha256(data).hexdigest()},
                      'mediaRevision':hashlib.sha256(output.read_bytes()).hexdigest()[:16]}
        manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        print(f'UPSCALED {number+1}/{len(ids)} {id}: {entry["width"]} -> {args.size}, {gif.n_frames} frames, timing preserved',flush=True)
