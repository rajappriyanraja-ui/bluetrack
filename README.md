# BluTrack Simulation

A web‑based simulation that visualises the health and structural analysis of Blu‑ray optical discs. It provides interactive controls for disc age, usage frequency, and storage conditions, and displays detailed metrics, charts, and layer‑by‑layer technical insights.

## Features
- Upload an image of a disc for AI‑powered structural analysis.
- Real‑time visualisation of disc health, scratch damage, oxidation, and more.
- Interactive controls to simulate ageing and usage scenarios.
- Detailed technical breakdown of disc layers and e‑waste impact.

## Getting Started
1. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start a local HTTP server to serve the HTML files:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000/blutrack_simulation.html`.

## Usage
- Click **Upload** to provide a disc image (PNG, JPG, SVG).
- Adjust the sliders for **Disc Age**, **Usage Frequency**, and **Storage Conditions**.
- Press **Run Structural Analysis** to see the health score and detailed breakdown.

## Contributing
Feel free to open issues or submit pull requests. Please ensure any new code follows the existing style and updates the documentation accordingly.

## License
This project is licensed under the MIT License – see the `LICENSE` file for details.
