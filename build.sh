#!/usr/bin/env bash
set -e

echo "🔨 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "📦 Building frontend..."
cd ../frontend
npm ci  # Use ci instead of install for faster, reproducible builds
npm run build

echo "📂 Setting up static files..."
cd ../backend
mkdir -p static
cp -r ../frontend/dist/* static/
cp -r ../frontend/dist/index.html static/

echo "📂 Collecting Django static files..."
python manage.py collectstatic --noinput

echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "✅ Build complete!"