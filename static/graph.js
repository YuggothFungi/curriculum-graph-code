class GraphData {
    constructor(data) {
        this.nodes = data.nodes;
        this.links = data.links;
    }
}

class GraphVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        // Инициализация основных свойств
        this.svg = null;
        this.g = null;
        this.zoom = null;
        this.simulation = null;
        this.link = null;
        this.node = null;
        this.cacheKey = 'graphPositions'; // Ключ для локального хранилища
    }

    initialize(data) {
        this.clearContainer();
        this.createSvg();
        this.setupZoom();
        this.createGraphGroup();
        this.defineArrowMarker();
        this.setupSimulation(data);
        this.createLinks(data.links);
        this.createNodes(data.nodes);
        this.setupEventHandlers();

        // Загружаем кэшированные позиции
        this.loadCachedPositions();
    }

    clearContainer() {
        d3.select(`#${this.container.id}`).selectAll("*").remove();
    }

    createSvg() {
        this.svg = d3.select(`#${this.container.id}`).append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
    }

    setupZoom() {
        this.zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => this.handleZoom(event));
        this.svg.call(this.zoom);
    }

    createGraphGroup() {
        this.g = this.svg.append("g");
    }

    defineArrowMarker() {
        this.svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#999");
    }

    setupSimulation(data) {
        this.simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink(data.links)
                .id(d => d.id)
                .distance(150)
                .strength(1))
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(this.width / 2, this.height / 2))
            .force("collision", d3.forceCollide().radius(80))
            .force("x", d3.forceX(this.width / 2).strength(0.1))
            .force("y", d3.forceY(this.height / 2).strength(0.1))
            .alphaDecay(0.1);
    }

    createLinks(links) {
        this.link = this.g.append("g")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke-width", d => Math.max(Math.sqrt(d.weight) * 2, 1))
            .attr("stroke", "#999")
            .attr("marker-end", d => d.weight === 2 ? "url(#arrowhead)" : "none")
            .attr("pointer-events", "none");
    }

    createNodes(nodes) {
        this.node = this.g.append("g")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("cursor", "move");

        // Добавляем круги
        this.node.append("circle")
            .attr("r", 8)
            .attr("fill", "#69b3a2");

        // Добавляем текст
        this.node.append("text")
            .text(d => d.label)
            .attr("x", 12)
            .attr("y", 4)
            .style("font-family", "Arial")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("pointer-events", "none");
    }

    setupEventHandlers() {
        // Настройка перетаскивания
        const drag = d3.drag()
            .on("start", (event, d) => this.handleDragStart(event, d))
            .on("drag", (event, d) => this.handleDrag(event, d))
            .on("end", (event, d) => this.handleDragEnd(event, d));

        this.node.call(drag);

        // Обновляем только начальное положение узлов
        this.simulation.on("tick", () => this.updateInitialPositions());
        
        // Настройка начального масштабирования
        this.simulation.on("end", () => this.setInitialScale());
    }

    handleZoom(event) {
        this.g.attr("transform", event.transform);
    }

    handleDragStart(event, d) {
        // Останавливаем симуляцию при начале перетаскивания
        this.simulation.stop();
        // Сохраняем начальную позицию
        d.fx = d.x;
        d.fy = d.y;
    }

    handleDrag(event, d) {
        // Обновляем позицию узла
        d.x = event.x;
        d.y = event.y;
        d.fx = event.x;
        d.fy = event.y;
        
        // Обновляем визуальное положение узла
        d3.select(event.sourceEvent.target.parentNode)
            .attr("transform", `translate(${event.x},${event.y})`);
        
        // Обновляем связанные ребра
        this.updateConnectedLinks(d);
    }

    handleDragEnd(event, d) {
        // Сохраняем конечную позицию
        d.x = event.x;
        d.y = event.y;
        // Освобождаем фиксированную позицию
        d.fx = null;
        d.fy = null;

        // Сохраняем позиции в кэш
        this.savePositions();
    }

    updateConnectedLinks(node) {
        // Обновляем все ребра, связанные с текущим узлом
        this.link.each(function(l) {
            if (l.source === node || l.target === node) {
                d3.select(this)
                    .attr("x1", l.source.x)
                    .attr("y1", l.source.y)
                    .attr("x2", l.target.x)
                    .attr("y2", l.target.y);
            }
        });
    }

    updateInitialPositions() {
        // Обновляем позиции только при начальной расстановке
        this.link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        this.node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    }

    setInitialScale() {
        const bounds = this.g.node().getBBox();
        const scale = 0.95 / Math.max(bounds.width / this.width, bounds.height / this.height);
        const transform = d3.zoomIdentity
            .translate(
                this.width/2 - scale * (bounds.x + bounds.width/2),
                this.height/2 - scale * (bounds.y + bounds.height/2)
            )
            .scale(scale);
        
        this.svg.transition()
            .duration(750)
            .call(this.zoom.transform, transform);
    }

    savePositions() {
        const positions = this.node.data().map(d => ({ id: d.id, x: d.x, y: d.y }));
        localStorage.setItem(this.cacheKey, JSON.stringify(positions));
    }

    loadCachedPositions() {
        const cachedPositions = localStorage.getItem(this.cacheKey);
        if (cachedPositions) {
            const positions = JSON.parse(cachedPositions);
            positions.forEach(pos => {
                const node = this.node.data().find(n => n.id === pos.id);
                if (node) {
                    node.x = pos.x;
                    node.y = pos.y;
                }
            });
        }
    }

    // Добавьте метод для проверки изменений
    checkForChanges(newData) {
        const currentDataHash = localStorage.getItem('graphDataHash');
        const newDataHash = this.hashCode(JSON.stringify(newData));

        if (currentDataHash !== newDataHash) {
            localStorage.setItem('graphDataHash', newDataHash);
            return true; // Данные изменились
        }
        return false; // Данные не изменились
    }

    // Простой метод для вычисления хэш-суммы
    hashCode(str) {
        let hash = 0, i, chr;
        for (i = 0; i < str.length; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr; // hash * 31 + chr
            hash |= 0; // Приводим к 32-битному целому
        }
        return hash;
    }
}

// Инициализация графа при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    d3.json("/graph-data")
        .then(data => {
            const graphData = new GraphData(data);
            const visualizer = new GraphVisualizer('graph');

            // Проверяем изменения перед инициализацией
            if (visualizer.checkForChanges(data)) {
                visualizer.initialize(graphData);
            } else {
                visualizer.loadCachedPositions(); // Загружаем кэшированные позиции
            }
        })
        .catch(error => {
            console.error("Ошибка загрузки JSON:", error);
        });
});