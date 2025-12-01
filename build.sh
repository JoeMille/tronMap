#!/usr/bin/env bash
set -e

echo "🔨 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "📦 Building frontend..."
cd ../frontend
npm ci
npm run build

echo "📂 Copying frontend to staticfiles..."
cd ../backend

# Remove old staticfiles
rm -rf staticfiles

# Create staticfiles directory
mkdir -p staticfiles

# Copy ALL frontend build output directly to staticfiles
cp -r ../frontend/dist/* staticfiles/

# Ensure index.html is at root of staticfiles
cp ../frontend/dist/index.html staticfiles/index.html

echo "📂 Verifying static files structure..."
ls -la staticfiles/
echo "Assets directory:"
ls -la staticfiles/assets/ || echo "No assets directory found"

echo "📂 Running Django collectstatic..."
# This should be a no-op since files are already in staticfiles
python manage.py collectstatic --noinput --clear

echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "✅ Build complete!"
echo "Final staticfiles structure:"
ls -R staticfiles/