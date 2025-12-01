from django.contrib import admin
from django.urls import path, re_path
from django.http import HttpResponse, JsonResponse
from django.conf import settings
import os

from datasets.views import list_datasets, analyze_ice_rings

def serve_index(request):
    """Serve the React index.html file"""
    index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
    
    # Debug info
    if not os.path.exists(index_path):
        error_info = {
            'error': 'index.html not found',
            'STATIC_ROOT': str(settings.STATIC_ROOT),
            'index_path': index_path,
            'staticfiles_exists': os.path.exists(settings.STATIC_ROOT),
            'staticfiles_contents': os.listdir(settings.STATIC_ROOT) if os.path.exists(settings.STATIC_ROOT) else 'Directory does not exist',
        }
        return JsonResponse(error_info, status=404)
    
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return HttpResponse(html_content, content_type='text/html')
    except Exception as e:
        return JsonResponse({
            'error': 'Failed to read index.html',
            'exception': str(e),
            'index_path': index_path,
        }, status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/datasets/', list_datasets, name='list_datasets'),
    path('api/analyze-ice/', analyze_ice_rings, name='analyze_ice'),
    
    # Whitenoise serves /assets/* and /static/* automatically
    # Catch everything else and serve index.html
    re_path(r'^(?!api/|admin/).*$', serve_index),
]