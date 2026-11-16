"""Verify decoded exports and fixed-rig geometry, including the loop seam."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--manifest',type=Path,default=Path('src/data/exercise-media.json'))
parser.add_argument('--media-dir',type=Path)
parser.add_argument('--ids')
parser.add_argument('--report',type=Path)
args=parser.parse_args()
manifest=json.loads(args.manifest.read_text());ids=args.ids.split(',') if args.ids else list(manifest)
source=hashlib.sha256()
for f in sorted(Path('scripts/rig').rglob('*')):
    if f.suffix in ['.py','.obj','.mhw','.mhskel','.target','.json']:source.update(f.read_bytes())
source_hash=source.hexdigest();report={}
for id in ids:
    entry=manifest[id]
    def file(key):return args.media_dir/Path(entry[key]).name if args.media_dir else Path('public')/entry[key]
    gif=Image.open(file('gif'));atlas=Image.open(file('atlas')).convert('RGB');poster=Image.open(file('poster')).convert('RGB')
    assert entry['sourceId']=='fixed-anatomical-rig' and entry['sheetSha256']==source_hash,(id,'stale renderer/model hash')
    assert gif.n_frames==entry['frameCount']==60 and gif.info.get('loop')==0,id
    hashes=[];delays=[]
    for k in range(60):
        gif.seek(k);im=gif.convert('RGB')
        x=k%entry['columns']*entry['width'];y=k//entry['columns']*entry['height']
        tile=atlas.crop((x,y,x+entry['width'],y+entry['height']))
        assert im.tobytes()==tile.tobytes(),(id,'atlas',k)
        if k==0:assert im.tobytes()==poster.tobytes(),(id,'poster')
        hashes.append(hashlib.sha256(im.tobytes()).hexdigest());delays.append(gif.info['duration'])
    assert delays==entry['durations']==[40]*60,id
    rig=json.loads((Path('design/rig-reports')/(id+'.json')).read_text())
    assert rig['maximumBoneLengthErrorMetres']<.000002,(id,'bone stretched')
    assert rig['maximumLeverLengthVariationMetres']<.00002,(id,'machine linkage stretched')
    assert rig['maximumBoneTurnDegrees']<30,(id,'bone roll flip')
    assert rig['maximumJointStepMetres']<.10,(id,'joint discontinuity')
    coordinates=np.array([[value for side in p.values() for point in side.values() for value in point] for p in rig['poses']])
    ordinary=float(np.abs(np.diff(coordinates,axis=0)).max())
    seam=float(np.abs(coordinates[0]-coordinates[-1]).max())
    assert seam<=max(.00001,ordinary*1.25),(id,'loop seam jump')
    hold=id in ['front-plank','side-plank','wall-sit']
    if not hold:assert len(set(hashes))>=24,(id,'too few rendered motion poses')
    lengths={}
    for p in rig['poses']:
        for s in ['L','R']:
            for a,b in [('shoulder','elbow'),('elbow','hand'),('hip','knee'),('knee','ankle')]:
                lengths.setdefault((s,a,b),[]).append(float(np.linalg.norm(np.array(p[s][a])-p[s][b])))
    assert max(np.ptp(v) for v in lengths.values())<.000002,(id,'decoded joint report lengths')
    turns=[]
    for s in ['L','R']:
        for bone,a,b in [('upperarm','shoulder','elbow'),('forearm','elbow','hand'),('thigh','hip','knee'),('shin','knee','ankle')]:
            bases=[]
            for p in rig['poses']:
                y=np.array(p[s][b])-p[s][a];y/=np.linalg.norm(y)
                x=np.cross(np.array(rig['bonePoles'][bone+'.'+s]),y);x/=np.linalg.norm(x)
                bases.append(np.array([x,y,np.cross(x,y)]).T)
            bs=np.array(bases);trace=np.einsum('fij,fij->f',bs,np.roll(bs,1,axis=0))
            turns.extend(np.degrees(np.arccos(np.clip((trace-1)/2,-1,1))).tolist())
    assert max(turns)<30 and abs(max(turns)-rig['maximumBoneTurnDegrees'])<.001,(id,'bone rotation continuity')
    report[id]={'frames':60,'uniqueRenderedPoses':len(set(hashes)),'pixelExactAtlasAndPoster':True,'staticHold':hold,**{k:v for k,v in rig.items() if k!='poses'}}
if args.report:args.report.write_text(json.dumps(report,indent=2)+'\n')
print(f'Verified {len(ids)} fixed-model animations / {len(ids)*60} GIF frames: exact decoded atlas/poster pixels, 40ms timing, constant bone/lever lengths and continuous loop seams.')
