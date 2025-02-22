import pytest
import json
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app import create_app

# Получаем путь к корневой директории проекта
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@pytest.fixture
def app():
    app = create_app({
        'TESTING': True,
    })
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def driver():
    driver = webdriver.Firefox()
    yield driver
    driver.quit()

def test_load_matrix_from_json(client, driver):
    """Тест загрузки таблицы из JSON на страницу edit_matrix"""
    # Подготовка тестовых данных
    test_data = {
        "topics": ["Topic 1", "Topic 2"],
        "adjacency_matrix": [[0, 1], [0, 0]]
    }
    
    test_file_path = os.path.join(BASE_DIR, 'test_matrix.json')
    
    # Сохраняем тестовые данные во временный файл
    with open(test_file_path, 'w') as f:
        json.dump(test_data, f)
    
    try:
        # Открываем страницу редактирования матрицы
        driver.get('http://localhost:5000/edit-matrix')
        
        # Находим элемент для загрузки файла и загружаем тестовый файл
        file_input = driver.find_element(By.ID, 'fileInput')
        file_input.send_keys(os.path.abspath(test_file_path))
        
        # Нажимаем кнопку загрузки
        load_button = driver.find_element(By.ID, 'loadMatrix')
        load_button.click()
        
        # Ждем загрузки таблицы
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "adjacencyMatrix"))
        )
        
        # Проверяем, что данные загрузились корректно
        table = driver.find_element(By.ID, 'adjacencyMatrix')
        cells = table.find_elements(By.TAG_NAME, 'input')
        assert len(cells) == 4  # 2x2 матрица
        assert cells[1].get_attribute('value') == '1'  # Проверяем значение [0,1]
        
    finally:
        # Удаляем временный файл
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

def test_save_matrix_to_json(client, driver):
    """Тест сохранения таблицы в JSON файл"""
    driver.get('http://localhost:5000/edit-matrix')
    
    # Добавляем новую тему
    add_button = driver.find_element(By.ID, 'addTopic')
    add_button.click()
    
    # Вводим название темы в диалоговое окно
    alert = driver.switch_to.alert
    alert.send_keys("New Topic")
    alert.accept()
    
    # Сохраняем матрицу
    save_button = driver.find_element(By.ID, 'saveMatrix')
    save_button.click()
    
    # Проверяем, что файл создался и содержит корректные данные
    with open('./static/graphs/linear_algebra.json', 'r') as f:
        saved_data = json.load(f)
        assert "New Topic" in saved_data['topics']

def test_graph_visualization(client, driver):
    """Тест отображения графа на основе JSON файла"""
    # Подготовка тестовых данных
    test_data = {
        "topics": ["Topic 1", "Topic 2"],
        "adjacency_matrix": [[0, 2], [0, 0]]  # 2 означает наличие стрелки
    }
    
    # Сохраняем тестовые данные
    with open('./static/graphs/linear_algebra.json', 'w') as f:
        json.dump(test_data, f)
    
    # Открываем страницу с графом
    driver.get('http://localhost:5000/')
    
    # Ждем загрузки графа
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "svg"))
    )
    
    # Проверяем наличие элементов графа
    svg = driver.find_element(By.CSS_SELECTOR, 'svg')
    nodes = svg.find_elements(By.CSS_SELECTOR, 'circle')
    arrows = svg.find_elements(By.CSS_SELECTOR, 'line[marker-end="url(#arrowhead)"]')
    
    assert len(nodes) == 2  # Должно быть два узла
    assert len(arrows) == 1  # Должна быть одна стрелка

def test_json_structure():
    """Тест структуры JSON файла"""
    with open('./static/graphs/linear_algebra.json', 'r') as f:
        data = json.load(f)
        
        # Проверяем наличие необходимых ключей
        assert 'topics' in data
        assert 'adjacency_matrix' in data
        
        # Проверяем соответствие размерности матрицы количеству тем
        topics_count = len(data['topics'])
        matrix = data['adjacency_matrix']
        
        assert len(matrix) == topics_count
        for row in matrix:
            assert len(row) == topics_count 