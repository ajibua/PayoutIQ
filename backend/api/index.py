# Vercel Serverless Function entry point
import sys
import os

# Add the parent folder to the system path so Python can find main.py and local packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
