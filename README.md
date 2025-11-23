Core Visual Components (in order of wow-factor)

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
