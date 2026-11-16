"""Compare the larger exports with the exact release requested for rollback."""
import hashlib, io, json, subprocess
from pathlib import Path
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
def original(file):return subprocess.check_output(['git','show',f'bdef819:{file}'],cwd=ROOT)
baseline=json.loads(original('src/data/exercise-media.json'))
manifest=json.loads((ROOT/'src/data/exercise-media.json').read_text())
assert set(manifest)==set(baseline)
worst=0;frames=0
for id,entry in manifest.items():
    old=baseline[id];data=original('public/'+old['gif']);before=Image.open(io.BytesIO(data));after=Image.open(ROOT/'public'/entry['gif'])
    assert entry['sourceCommit'].startswith('bdef819') and entry['upscaledFrom']['gifSha256']==hashlib.sha256(data).hexdigest(),id
    assert entry['sourceId']==old['sourceId'] and entry['frameCount']==old['frameCount']==after.n_frames==before.n_frames,id
    assert after.size==(720,720) and after.info.get('loop')==before.info.get('loop')==0,id
    assert entry['durations']==old['durations'],id
    assert entry['mediaRevision']==hashlib.sha256((ROOT/'public'/entry['gif']).read_bytes()).hexdigest()[:16],id
    for k in range(after.n_frames):
        before.seek(k);after.seek(k);assert after.info['duration']==old['durations'][k],(id,k)
        a=np.asarray(before.convert('RGB'),dtype=np.float32)
        b=np.asarray(after.convert('RGB').resize(before.size,Image.Resampling.LANCZOS),dtype=np.float32)
        rmse=float(np.sqrt(np.mean((a-b)**2)));worst=max(worst,rmse)
        assert rmse<6,(id,k,'artwork differs from rollback source',rmse)
        frames+=1
print(f'Verified {len(manifest)} restored animations / {frames} frames at 720x720: same source art, frame sequence, timing and loops as bdef819. Maximum downsample RMSE: {worst:.3f}/255.')
