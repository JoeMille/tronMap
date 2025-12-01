from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from datasets.views import list_datasets, analyze_ice_rings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/datasets/', list_datasets, name='list_datasets'),
    path('api/analyze-ice/', analyze_ice_rings, name='analyze_ice'),
    
    # Serve frontend for all other routes
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='frontend'),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)