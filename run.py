from app import create_app
from app.routes import generate_graph_json

app = create_app()

if __name__ == '__main__':
    generate_graph_json()  # Генерируем graph.json при запуске сервера
    app.run(debug=True) 