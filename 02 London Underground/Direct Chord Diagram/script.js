// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 1400 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

// Append the svg object to the body of the page
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define color scale
var color = d3.scaleOrdinal(d3.schemeCategory10);

// Load the data
d3.csv("data.csv").then(function(data) {
    console.log("Data Loaded:", data);

    var graph = {"nodes": [], "links": []};
    var nodeMap = {};
    var lineMap = {};

    function addLine(line) {
        if (!lineMap[line]) {
            lineMap[line] = { "name": line, "category": "line", "stations": [] };
            graph.nodes.push(lineMap[line]);
        }
        return lineMap[line];
    }

    function addStation(name, line) {
        var key = name + "-" + line;
        if (!nodeMap[key]) {
            nodeMap[key] = { "name": name, "line": line, "category": "station" };
            graph.nodes.push(nodeMap[key]);
            if (!lineMap[line]) {
                addLine(line);
            }
            lineMap[line].stations.push(nodeMap[key]);
        }
        return nodeMap[key];
    }

    data.forEach(function(d) {
        if (!d.Lines || !d['Lines.1']) {
            console.error('Line data missing for:', d);
            return;
        }

        var fromLines = d.Lines.split(', ').map(line => line.trim());
        var toLines = d['Lines.1'].split(', ').map(line => line.trim());
        var walkingTime = parseFloat(d["Walking time"]);

        if (isNaN(walkingTime)) {
            console.error('Invalid walking time value for:', d);
            return;
        }

        fromLines.forEach(function(fromLine) {
            var fromStation = addStation(d.From, fromLine);
            var fromLineNode = addLine(fromLine);

            graph.links.push({
                "source": fromLineNode,
                "target": fromStation,
                "value": 1
            });

            toLines.forEach(function(toLine) {
                var toStation = addStation(d.To, toLine);
                var toLineNode = addLine(toLine);

                graph.links.push({
                    "source": fromStation,
                    "target": toStation,
                    "value": walkingTime
                });
            });
        });
    });

    console.log("Graph Nodes:", graph.nodes);
    console.log("Graph Links:", graph.links);

    // Ensure nodes and links are correctly generated
    renderGraph(graph);
}).catch(error => {
    console.error('Error loading or processing data:', error);
});

function renderGraph(graph) {
    var sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 5]]);

    sankey(graph);

    // Add in the nodes
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

    node.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", sankey.nodeWidth())
        .style("fill", d => color(d.category === "line" ? d.name : d.line))
        .style("stroke", d => d3.rgb(color(d.category === "line" ? d.name : d.line)).darker(2))
      .append("title")
        .text(d => `${d.name}\n${d.value}`);

    node.append("text")
        .attr("x", -6)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(d => d.name)
        .filter(d => d.x0 < width / 2)
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    // Add in the links
    var link = svg.append("g").selectAll(".link")
        .data(graph.links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", d => Math.max(1, d.width))
        .style("stroke", d => color(d.source.category === "line" ? d.source.name : d.source.line))
        .style("fill", "none")
        .style("stroke-opacity", 0.5)
      .append("title")
        .text(d => `${d.source.name} → ${d.target.name}\n${d.value} minutes`);
}

