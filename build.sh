#!/usr/bin/env bash
set -e

echo "🔨 Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "📦 Building frontend..."
cd ../frontend
npm ci
npm run build

echo "📂 Checking frontend build output..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ ERROR: dist/index.html not found after build!"
    exit 1
fi

echo "✅ Frontend build successful:"
ls -lah dist/
echo ""
echo "Assets:"
ls -lah dist/assets/ || echo "No assets folder"

echo "📂 Setting up staticfiles..."
cd ../backend

# Remove old staticfiles
rm -rf staticfiles
mkdir -p staticfiles

# Copy all files from dist to staticfiles
echo "Copying dist/* to staticfiles/..."
cp -r ../frontend/dist/* staticfiles/

# Verify index.html was copied
if [ ! -f "staticfiles/index.html" ]; then
    echo "❌ ERROR: index.html not found in staticfiles after copy!"
    exit 1
fi

echo "✅ Staticfiles structure:"
ls -lah staticfiles/
echo ""
echo "Staticfiles assets:"
ls -lah staticfiles/assets/ || echo "No assets folder"

echo "📂 Running collectstatic..."
python manage.py collectstatic --noinput --clear

echo "📂 Final verification:"
ls -lah staticfiles/
if [ ! -f "staticfiles/index.html" ]; then
    echo "❌ ERROR: index.html missing after collectstatic!"
    exit 1
fi

echo "🗄️ Running migrations..."
python manage.py migrate --noinput

echo "✅ Build complete!"