"""Download and checksum the upstream RIFE 4.25 weights, outside the repo."""
import argparse
import hashlib
from pathlib import Path
import zipfile
import gdown

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--cache-dir', type=Path, default=Path.home() / '.cache/makebody-animation')
args = parser.parse_args()
args.cache_dir.mkdir(parents=True, exist_ok=True)
archive = args.cache_dir / 'rife425.zip'
archive_sha = 'e63d481b7ae5d4a4e6ad7ac5b410ff78f3bf7be3b51b2e38ca8152747abde5b4'
if not archive.exists():
    gdown.download(id='1ZKjcbmt1hypiFprJPIKW0Tt0lr_2i7bg', output=str(archive))
if hashlib.sha256(archive.read_bytes()).hexdigest() != archive_sha:
    raise SystemExit('RIFE archive checksum mismatch; refusing to extract it.')
weights = args.cache_dir / 'rife425-flownet.pkl'
with zipfile.ZipFile(archive) as bundle:
    data = bundle.read('train_log/flownet.pkl')
if hashlib.sha256(data).hexdigest() != '6615790efd627772917205db291f51cd392528a157ecbb2ecaeec3bff8eb6de2':
    raise SystemExit('RIFE weights checksum mismatch.')
weights.write_bytes(data)
print(weights)
