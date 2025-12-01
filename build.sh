#!/usr/bin/env bash
set -e

echo "🔨 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

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

echo "📂 Running collectstatic (without post-processing)..."
PYTHONPATH=/opt/render/project/src/backend python manage.py collectstatic --noinput --no-post-process

echo "📂 Final verification:"
ls -lah staticfiles/ | head -20
if [ ! -f "staticfiles/index.html" ]; then
    echo "❌ ERROR: index.html missing!"
    exit 1
fi

echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "✅ Build complete!"