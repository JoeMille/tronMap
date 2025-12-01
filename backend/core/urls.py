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
]

# Static files (highest priority - before catch-all)
if not settings.DEBUG:
    # In production, let Whitenoise handle static files
    # No need for static() helper - Whitenoise middleware handles it
    pass
else:
    # In development, serve static files
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all LAST: serve React index.html only for routes that don't match above
urlpatterns += [
    re_path(r'^(?!static/)(?!assets/).*$', TemplateView.as_view(template_name='index.html')),
]