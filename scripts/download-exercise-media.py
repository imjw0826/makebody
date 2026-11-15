"""Download pinned exercise photographs listed in the media manifest."""
import json,pathlib,subprocess,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1]
commit='f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
media=json.loads((root/'src/data/exercise-media.json').read_text())
jobs=[(f"{entry['sourceId']}/{i}.jpg",dst) for entry in media.values() if entry['kind']=='photo' for i,dst in enumerate(entry['frames'])]
def download(job):
 src,dst=job; target=root/'public'/dst
 subprocess.run(['curl','-sSL','--fail','--retry','3',f'https://raw.githubusercontent.com/yuhonas/free-exercise-db/{commit}/exercises/{src}','-o',str(target)],check=True)
 return target.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
 sizes=list(pool.map(download,jobs))
print(f'Downloaded {len(sizes)} photographs, {sum(sizes)//1024} KiB')
