let topics = [];
let adjacencyMatrix = [];

// Функция для обновления таблицы
function updateTable() {
    const tbody = document.querySelector('#adjacencyMatrix tbody');
    tbody.innerHTML = ''; // Очищаем таблицу

    // Создаем заголовок
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th'));
    topics.forEach(topic => {
        const th = document.createElement('th');
        th.textContent = topic;
        headerRow.appendChild(th);
    });
    tbody.appendChild(headerRow);

    // Создаем строки для матрицы
    topics.forEach((topic, rowIndex) => {
        const row = document.createElement('tr');
        const th = document.createElement('th');
        th.textContent = topic;
        row.appendChild(th);

        topics.forEach((_, colIndex) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'table_input';
            input.value = adjacencyMatrix[rowIndex][colIndex] || 0; // Значение по умолчанию
            input.onchange = () => {
                adjacencyMatrix[rowIndex][colIndex] = parseInt(input.value) || 0; // Обновляем значение
            };
            td.appendChild(input);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

// Функция для добавления темы
function addTopic() {
    const newTopic = prompt("Введите название новой темы:");
    if (newTopic) {
        topics.push(newTopic);
        // Обновляем матрицу
        adjacencyMatrix.forEach(row => row.push(0)); // Добавляем новый столбец
        adjacencyMatrix.push(new Array(topics.length).fill(0)); // Добавляем новую строку
        updateTable();
    }
}

// Функция для сохранения матрицы
function saveMatrix() {
    const matrixData = {
        topics: topics,
        adjacency_matrix: adjacencyMatrix
    };
    console.log("Сохраненная матрица:", matrixData);

    // Отправляем данные на сервер для сохранения
    fetch('/save-matrix', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(matrixData)
    })
    .then(response => {
        if (response.ok) {
            alert("Матрица успешно сохранена!");
        } else {
            alert("Ошибка при сохранении матрицы.");
        }
    })
    .catch(error => {
        console.error("Ошибка:", error);
    });
}

// Функция для загрузки матрицы из файла
function loadMatrix() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = JSON.parse(event.target.result);
            topics = data.topics;
            adjacencyMatrix = data.adjacency_matrix;
            updateTable();
        };
        reader.readAsText(file);
    } else {
        alert("Пожалуйста, выберите файл.");
    }
}

// Инициализация
function init() {
    // Загружаем данные по умолчанию из linear_algebra.json
    fetch('./static/graphs/linear_algebra.json')
        .then(response => response.json())
        .then(data => {
            topics = data.topics;
            adjacencyMatrix = data.adjacency_matrix;
            updateTable();
        })
        .catch(error => {
            console.error("Ошибка загрузки данных:", error);
        });
}

document.getElementById('addTopic').onclick = addTopic;
document.getElementById('saveMatrix').onclick = saveMatrix;
document.getElementById('loadMatrix').onclick = loadMatrix;

// Запускаем инициализацию
init();