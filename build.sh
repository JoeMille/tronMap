#!/usr/bin/env bash
set -e

echo "🔨 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "🔬 Generating diffraction images..."
cd ../simulations
python testImage.py

echo "📦 Building frontend..."
cd ../frontend
npm ci
npm run build

echo "📂 Setting up staticfiles..."
cd ../backend
rm -rf staticfiles
mkdir -p staticfiles

# Copy frontend build
cp -r ../frontend/dist/* staticfiles/

# Data files are already in static/data/ from testImage.py
# Just verify they exist
echo "📂 Verifying diffraction data..."
if [ ! -d "static/data/lysozyme_good" ]; then
    echo "❌ ERROR: Diffraction images not generated!"
    exit 1
fi

if [ ! -f "static/data/lysozyme_good/metrics.json" ]; then
    echo "❌ ERROR: metrics.json missing!"
    exit 1
fi

echo "✅ Found $(ls static/data/lysozyme_good/frame_*.png 2>/dev/null | wc -l) diffraction frames"

# Copy static/data to staticfiles for serving
cp -r static/data staticfiles/

echo "📂 Running collectstatic (without post-processing)..."
python manage.py collectstatic --noinput --no-post-process

echo "📂 Final verification..."
ls -lah staticfiles/ | head -20
if [ ! -f "staticfiles/index.html" ]; then
    echo "❌ ERROR: index.html missing!"
    exit 1
fi

echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "✅ Build complete!"
echo "📊 Staticfiles size: $(du -sh staticfiles/ | cut -f1)"