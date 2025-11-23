from rest_framework.decorators import api_view
from rest_framework.response import Response
from pathlib import Path
from django.conf import settings

@api_view(['GET'])
def list_datasets(request):
    static_data = Path(settings.BASE_DIR) / 'static' / 'data'

    datasets = []
    if static_data.exists():
        for dataset_dir in static_data.iterdir():
            if dataset_dir.is_dir():
                frames = list(dataset_dir.glob('frame_*.png'))
                metrics_file = dataset_dir / 'metrics.json'

                datasets.append({
                    'id': dataset_dir.name,
                    'name': dataset_dir.name.replace('_', ' ').title(),
                    'frame_count': len(frames),
                    'has_metrics': metrics_file.exists(),
                    'path': f'/static/data/{dataset_dir.name}'
                })
    
    return Response({'datasets': datasets})