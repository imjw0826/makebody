"""Restore original anatomical GIFs from the pinned source asset repository."""
import pathlib,json,subprocess,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1]
sources=json.loads((root/'scripts/anatomy-sources.json').read_text())
commit='ebf642cd90fdf73a6c73e7127e93b607b12c229e'
def download(item):
    id,source=item
    if source=='custom':return
    target=root/'public/anatomy'/f'{id}.gif';target.parent.mkdir(exist_ok=True)
    subprocess.run(['curl','-fsSL','--retry','3',f'https://raw.githubusercontent.com/omercotkd/exercises-gifs/{commit}/assets/{source}.gif','-o',str(target)],check=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:list(pool.map(download,sources.items()))
print('Restored original GIFs; run build-anatomy.py to rebuild playback assets.')
