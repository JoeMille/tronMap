#!/bin/bash
set -e

echo "🔨 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build

echo "📂 Collecting static files..."
cd ../backend
python manage.py collectstatic --noinput --clear

echo "✅ Build complete!"
