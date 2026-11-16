"""Compatibility entry point for the continuous, authored-pose motion builder."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('build-motion.py')), run_name='__main__')
