Phase 1 – Django

Create project folder synchroviz/
Inside it, create backend/ folder
cd backend && python -m venv venv && source venv/bin/activate
pip install django djangorestframework django-cors-headers
django-admin startproject core .
python manage.py startapp datasets
Add 'corsheaders', 'rest_framework', 'datasets' to INSTALLED_APPS
Add CORS_ALLOW_ALL_ORIGINS = True (dev only)
In settings.py → add:PythonSTATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"
Create folder structure: backend/static/data/lysozyme_good/ and lysozyme_bad/
Run your Python simulator → copy all frame_XXXX.png + metrics.json into both folders
python manage.py runserver → verify images work at:
http://127.0.0.1:8000/static/data/lysozyme_good/frame_0123.png
http://127.0.0.1:8000/static/data/lysozyme_good/metrics.json

(Optional) Add simple API view that lists available datasets

Phase 2 – React + Vite + Three.js Frontend

In root folder → npm create vite@latest frontend -- --template react-ts
cd frontend
npm install three @react-three/fiber @react-three/drei tailwindcss postcss autoprefixer recharts lucide-react
npx tailwindcss init -p
Set up dark sci-fi Tailwind theme (black background, cyan-400/500 glows, glassmorphism)
Replace proxy in vite.config.ts → Django dev server:TypeScriptserver: { proxy: { '/static': 'http://127.0.0.1:8000' } }

Phase 3 – Core Visual Components (in order of wow-factor)

Dataset Selector (dropdown: “Good lysozyme”, “Bad – ice rings”, “Bad – radiation damage”)
Live Diffraction Image Viewer
Large central canvas/image (1000×1000px)
Range slider + play/pause button
Auto-advance every 80–120ms when status ≠ success
Zoom + pan with mouse/touch

Expanding Resolution Rings overlay on the diffraction image
Concentric cyan circles labeled 8Å, 4Å, 2Å, 1.6Å, 1.5Å
Fill solid when that shell’s I/σ > 2

Spot Prediction Overlay (optional but insane)
Tiny red crosses where spots are expected
Real spot hits cross → flash green for 300ms

Six Big Glowing Gauges (semi-circle or radial)
Resolution (Å) – green when <1.8
I/σ(I) – green when >15
R-merge – green when <0.12
Completeness (%) – green when >98
CC½ – green when >0.95
Mosaicity (°) – green when <0.5

Status Banner (Collecting → Indexing → Integrating → Success/Failed)
Resolution Shell Plot (Recharts)
X-axis: resolution bins
Y-axis: I/σ per shell
Line animates left-to-right as data arrives

3D Reciprocal Lattice Viewer (@react-three/fiber)
OrbitControls + auto-rotate
Predicted spots = faint blue spheres
Observed spots = bright pulsing green
Missing/high-error = red (only in bad dataset)

Wilson Plot (log intensity vs resolution²) – proves physics realism
Historical Runs Table
Columns: Date, Name, Resolution, Completeness, Thumbnail
Click row → load that dataset

Phase 4 – Bad Dataset Effects (the “fault diagnosis” flex)

Ice rings → glowing red circles + “ICE CONTAMINATION” warning
Radiation damage → later frames fade + spots blur + metrics crash
Twinning simulation (optional)
