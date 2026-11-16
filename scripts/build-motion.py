"""Compatibility entry point for the fixed-model Blender motion renderer."""
from pathlib import Path
import runpy
import sys
rig = Path(__file__).parent / 'rig'
sys.path.insert(0, str(rig))
runpy.run_path(str(rig / 'render.py'), run_name='__main__')
