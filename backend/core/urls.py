from django.contrib import admin
from django.urls import path, re_path
from django.views.static import serve
from django.http import HttpResponse
from django.conf import settings
import os
from datasets.views import list_datasets, analyze_ice_rings

def serve_react_index(request):
    index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
    if not os.path.exists(index_path):
        return HttpResponse(f"ERROR: {index_path} not found", status=404)
    with open(index_path, 'r') as f:
        return HttpResponse(f.read(), content_type='text/html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/datasets/', list_datasets),
    path('api/analyze-ice/', analyze_ice_rings),
    
    # Static files (before catch-all!)
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': os.path.join(settings.STATIC_ROOT, 'assets')}),
    re_path(r'^vite\.svg$', serve, {'document_root': settings.STATIC_ROOT, 'path': 'vite.svg'}),
    
    # React app (catch-all - MUST be last)
    re_path(r'^.*$', serve_react_index),
]
