"""Archive legacy source GIFs; never overwrite the active continuous animations."""
import pathlib,json,subprocess,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1]
sources=json.loads((root/'scripts/anatomy-sources.json').read_text())
commit='ebf642cd90fdf73a6c73e7127e93b607b12c229e'
def download(item):
    id,source=item
    if source=='custom':return
    target=pathlib.Path.home()/'.cache/makebody-legacy-originals'/f'{id}.gif';target.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run(['curl','-fsSL','--retry','3',f'https://raw.githubusercontent.com/omercotkd/exercises-gifs/{commit}/assets/{source}.gif','-o',str(target)],check=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:list(pool.map(download,sources.items()))
print('Archived legacy originals outside public/. Active motion must be built from the authored pose sheets with build-motion.py.')
