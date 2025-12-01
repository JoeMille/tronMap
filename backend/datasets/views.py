from rest_framework.decorators import api_view
from rest_framework.response import Response
from pathlib import Path
from django.conf import settings
from .ice_analyzer import IceRingAnalyzer

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

@api_view(['POST'])
def analyze_ice_rings(request):
    try:
        dataset = request.data.get('dataset', 'lysozyme_good')
        frame = request.data.get('frame', 1)
        
        image_path = Path(settings.BASE_DIR) / 'static' / 'data' / dataset / f'frame_{frame:04d}.png'
        
        if not image_path.exists():
            return Response({
                'error': f'Frame {frame} not found in dataset {dataset}'
            }, status=404)
        
        analyzer = IceRingAnalyzer(image_path)
        results = analyzer.analyze()
        
        return Response(results)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=500)
