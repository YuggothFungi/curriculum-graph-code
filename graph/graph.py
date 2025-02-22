import networkx as nx
import json
import os

def create_graph_from_adjacency(file_path):
    """Создает граф на основе матрицы смежности из JSON файла"""
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Создаем граф
    G = nx.DiGraph()  # Используем ориентированный граф
    
    # Добавляем узлы
    topics = data['topics']
    for i, topic in enumerate(topics):
        G.add_node(i, label=topic)
    
    # Добавляем ребра на основе матрицы смежности
    adjacency_matrix = data['adjacency_matrix']
    for i in range(len(adjacency_matrix)):
        for j in range(len(adjacency_matrix[i])):
            weight = adjacency_matrix[i][j]
            if weight > 0:
                G.add_edge(i, j, weight=weight)
    
    return G

def create_graph_data():
    """Создает JSON представление графа для D3.js"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, 'static', 'graphs', 'linear_algebra.json')
    
    G = create_graph_from_adjacency(file_path)
    
    # Преобразуем граф в формат для D3.js
    nodes = []
    links = []
    
    for node in G.nodes():
        nodes.append({
            "id": node,
            "label": G.nodes[node]['label']
        })
    
    for edge in G.edges(data=True):
        links.append({
            "source": edge[0],
            "target": edge[1],
            "weight": edge[2]['weight']
        })
    
    graph_data = {
        "nodes": nodes,
        "links": links
    }
    
    return json.dumps(graph_data) 