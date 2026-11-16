"""Check the deterministic Blender runtime; no AI weights or API keys."""
import bpy
import numpy
from PIL import Image
print('Blender', bpy.app.version_string, '/ NumPy', numpy.__version__, '/ Pillow', Image.__version__)
