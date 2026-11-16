"""Render each pose from the same skinned model, then encode real GIF frames."""
import argparse, hashlib, json, math, sys, time
from pathlib import Path
import bpy
import numpy as np
from PIL import Image, ImageDraw, GifImagePlugin
from model import setup, Human, V
from motion import Equipment, pose, family

ROOT=Path(__file__).resolve().parents[2]
def source_hash():
    sha=hashlib.sha256()
    for f in sorted(Path(__file__).parent.rglob('*')):
        if f.suffix in ['.py','.obj','.mhw','.mhskel','.target','.json']:sha.update(f.read_bytes())
    return sha.hexdigest()

def encode_gif(frames,path,duration):
    # Write explicit full image descriptors, also for a true isometric hold.
    # Pillow.save otherwise coalesces equal neighbouring frames.
    header,_=GifImagePlugin.getheader(frames[0],info={'loop':0})
    with path.open('wb') as f:
        for block in header:f.write(block)
        for im in frames:
            for block in GifImagePlugin.getdata(im,duration=duration,disposal=1):f.write(block)
        f.write(b';')

def render(e,out,preview=False,count=60,audit=False):
    scene,cam=setup(480);h=Human(e['primaryMuscles'],e['secondaryMuscles']);eq=Equipment(e,h,cam)
    frames=[];joints=[];errors=[];lever_lengths=[]
    times=[0,.25,.5,.75] if preview else [k/count for k in range(count)]
    # Discover a safe, constant axial-roll reference using the actual complete
    # trajectory. IK positions do not depend on skin/bone roll.
    preflight=[]
    for t in [k/count for k in range(count)]:preflight.append(h.pose(**eq.constrain(pose(e,t,h))))
    h.choose_poles(preflight)
    temp=out/'frame.png'
    for t in times:
        p=eq.constrain(pose(e,t,h));j=h.pose(**p);eq.update(j,p['root'],t)
        for s in ['L','R']:
            for bone,a,b in [('upperarm','shoulder','elbow'),('forearm','elbow','hand'),('thigh','hip','knee'),('shin','knee','ankle')]:
                errors.append(abs((j[s][a]-j[s][b]).length-h.lengths[bone+'.'+s]))
        lever_lengths.append([(j[s]['hand']-pivot).length for s,pivot,link in eq.levers])
        joints.append({s:{name:[round(float(x),7) for x in co] for name,co in js.items()} for s,js in j.items()})
        if audit:continue
        scene.render.filepath=str(temp);bpy.ops.render.render(write_still=True)
        frames.append(Image.open(temp).convert('RGB').copy())
    temp.unlink(missing_ok=True)
    if preview:
        strip=Image.new('RGB',(480*4,520),'white')
        for k,im in enumerate(frames):strip.paste(im,(k*480,40))
        ImageDraw.Draw(strip).text((12,12),e['id']+' / '+family(e),fill='black')
        strip.save(out/(e['id']+'-review.jpg'),quality=90)
        return None
    matrix=np.array([[[v for co in s.values() for v in co] for s in j.values()] for j in joints])
    jumps=np.abs(matrix-np.roll(matrix,1,axis=0)).max(axis=(1,2))
    lengths=np.array(lever_lengths)
    turns=[]
    for s in ['L','R']:
        for bone,a,b in [('upperarm','shoulder','elbow'),('forearm','elbow','hand'),('thigh','hip','knee'),('shin','knee','ankle')]:
            bases=[]
            for j in joints:
                y=np.array(j[s][b])-j[s][a];y/=np.linalg.norm(y);x=np.cross(np.array(h.poles[bone+'.'+s]),y);x/=np.linalg.norm(x);bases.append(np.array([x,y,np.cross(x,y)]).T)
            bs=np.array(bases);trace=np.einsum('fij,fij->f',bs,np.roll(bs,1,axis=0));turns.extend(np.degrees(np.arccos(np.clip((trace-1)/2,-1,1))).tolist())
    report={'id':e['id'],'family':family(e),'maximumBoneLengthErrorMetres':max(errors),'maximumJointStepMetres':float(jumps.max()),'loopSeamJointStepMetres':float(jumps[0]),'maximumLeverLengthVariationMetres':float(np.ptp(lengths,axis=0).max()) if lengths.size else 0,'maximumBoneTurnDegrees':max(turns),'bonePoles':{n:list(p) for n,p in h.poles.items()},'poses':joints}
    reports=ROOT/'design/rig-reports';reports.mkdir(parents=True,exist_ok=True)
    (reports/(e['id']+'.json')).write_text(json.dumps(report,separators=(',',':')))
    if audit:return report
    # One palette for the complete cycle keeps both highlights and background stable.
    samples=Image.new('RGB',(480*4,480*2),'white')
    for k,index in enumerate([0,7,15,22,30,37,45,52]):samples.paste(frames[index],(k%4*480,k//4*480))
    palette=samples.quantize(colors=192,method=Image.Quantize.MEDIANCUT)
    quantized=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
    encode_gif(quantized,out/(e['id']+'.gif'),40)
    atlas=Image.new('RGB',(480*8,480*math.ceil(count/8)),'white')
    for k,im in enumerate(quantized):atlas.paste(im.convert('RGB'),(k%8*480,k//8*480))
    atlas.save(out/(e['id']+'-atlas.webp'),lossless=True,method=4)
    quantized[0].convert('RGB').save(out/(e['id']+'-poster.webp'),lossless=True)
    return dict(gif='anatomy/'+e['id']+'.gif',atlas='anatomy/'+e['id']+'-atlas.webp',poster='anatomy/'+e['id']+'-poster.webp',width=480,height=480,columns=8,frameCount=count,durations=[40]*count,kind='illustrated-gif',sourceId='fixed-anatomical-rig',sheetSha256=source_hash(),renderVersion='rigged-3d-v1',motionFamily=family(e))

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--ids');ap.add_argument('--preview',action='store_true');ap.add_argument('--audit',action='store_true');ap.add_argument('--out',default=str(ROOT/'public/anatomy'));args=ap.parse_args()
    out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    all_ex=json.loads((Path(__file__).parent/'exercises.json').read_text());ids=args.ids.split(',') if args.ids else [e['id'] for e in all_ex]
    manifest_path=ROOT/'src/data/exercise-media.json';manifest=json.loads(manifest_path.read_text())
    for index,e in enumerate(e for e in all_ex if e['id'] in ids):
        start=time.time();entry=render(e,out,args.preview,audit=args.audit)
        if args.audit:
            print('AUDIT',e['id'],{k:v for k,v in entry.items() if k!='poses'},flush=True)
        elif entry:
            manifest[e['id']]=entry
            manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        print(f'RENDERED {index+1}/{len(ids)} {e["id"]} {time.time()-start:.1f}s',flush=True)
