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

# Copy diffraction data to staticfiles
echo "📂 Copying diffraction data..."
mkdir -p staticfiles/data
cp -r ../simulations/lysozyme_good staticfiles/data/

echo "📂 Verifying data files..."
if [ ! -f "staticfiles/data/lysozyme_good/metrics.json" ]; then
    echo "❌ ERROR: metrics.json missing!"
    exit 1
fi

echo "✅ Data files:"
ls -lah staticfiles/data/lysozyme_good/ | head -10

echo "📂 Running collectstatic (without post-processing)..."
python manage.py collectstatic --noinput --no-post-process

echo "📂 Final verification:"
ls -lah staticfiles/ | head -20
if [ ! -f "staticfiles/index.html" ]; then
    echo "❌ ERROR: index.html missing!"
    exit 1
fi

echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "✅ Build complete!"
echo "📊 Total static files:"
du -sh staticfiles/