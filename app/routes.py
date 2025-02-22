from flask import Blueprint, render_template, request, jsonify
from graph import create_graph_data
import json
import os

bp = Blueprint('routes', __name__)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/edit-matrix')
def edit_matrix():
    return render_template('edit_matrix.html')

@bp.route('/graph-data')
def graph_data():
    data = create_graph_data()
    return data

@bp.route('/save-matrix', methods=['POST'])
def save_matrix():
    data = request.get_json()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, 'static', 'graphs', 'linear_algebra.json')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    return jsonify(success=True)

def generate_graph_json():
    graph_data = create_graph_data()
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, 'static', 'graph.json')
    
    with open(file_path, "w") as f:
        f.write(graph_data) 