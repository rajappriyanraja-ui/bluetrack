#!/bin/bash
# Setup script for BluTrack Simulation
# Installs Python dependencies and starts a simple HTTP server.

# Exit on any error
set -e

# Create virtual environment (optional)
if [ ! -d "venv" ]; then
  python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install required Python packages
pip install -r requirements.txt

# Start a local HTTP server to serve the HTML files
# You can change the port if needed.
python -m http.server 8000
