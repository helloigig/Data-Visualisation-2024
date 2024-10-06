// Color components
const colors = {
    background: '#F5F5F5', // Light light gray background
    gridLines: 'rgba(177, 166, 139, 0.3)', // More diminished grid lines
    axisText: '#B1A68B',
    lightRain: '#D9FDFF',
    heavyRain: '#2178DD',
    highlightBrown: '#7F534B', // Dark brown for highlighting
    stateButtons: {
        active: '#4A90E2',
        inactive: '#FFF9C4',
        text: '#7F534B',
        hoverBg: '#4A90E2',
        hoverText: '#FFF9C4'
    }
};

// Select states to focus on
const selectedStates = ["NSW", "VIC", "QLD", "SA", "WA"];
let currentState = selectedStates[0];
let data;

let raindropPath = 'M20.422 24.7256L10.8889 0.00292969L1.3561 24.7246C0.813683 25.9831 0.513184 27.3704 0.513184 28.8278C0.513184 34.5582 5.15852 39.2035 10.8888 39.2035C16.6192 39.2035 21.2645 34.5582 21.2645 28.8278C21.2645 27.3708 20.9641 25.9838 20.422 24.7256Z'
let svgLoaded = true; // We can set this to true since we're not loading an external SVG anymore

console.log("Raindrop SVG path:", raindropPath);

// City to State mapping
const cityToState = {
    "Canberra": "ACT", "Sydney": "NSW", "Melbourne": "VIC", "Brisbane": "QLD", "Adelaide": "SA", "Perth": "WA",
    "Hobart": "TAS", "Darwin": "NT", "Albury": "NSW", "Newcastle": "NSW", "Penrith": "NSW", "Wollongong": "NSW",
    "Tuggeranong": "ACT", "MountGinini": "ACT", "Ballarat": "VIC", "Bendigo": "VIC", "Cairns": "QLD",
    "GoldCoast": "QLD", "Townsville": "QLD", "MountGambier": "SA", "Albany": "WA", "Launceston": "TAS",
    "AliceSprings": "NT", "BadgerysCreek": "NSW", "Cobar": "NSW", "CoffsHarbour": "NSW", "Moree": "NSW",
    "NorahHead": "NSW", "NorfolkIsland": "EXT", "Richmond": "NSW", "SydneyAirport": "NSW", "WaggaWagga": "NSW",
    "Williamtown": "NSW", "Sale": "VIC", "MelbourneAirport": "VIC", "Mildura": "VIC", "Portland": "VIC",
    "Watsonia": "VIC", "Dartmoor": "VIC", "Nuriootpa": "SA", "Woomera": "SA", "Witchcliffe": "WA",
    "PearceRAAF": "WA", "PerthAirport": "WA", "SalmonGums": "WA", "Walpole": "WA", "Nhil": "VIC",
    "Katherine": "NT", "Uluru": "NT"
};

// Set up SVG and dimensions
const margin = {top: 0, right: 60, bottom: 10, left: 60};
let width, height;

const svg = d3.select("#chart").append("svg")
    .style("width", "100%")
    .style("height", "calc(98vh - 1px)")
    .style("background-color", colors.background);

const chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let x = d3.scaleLinear();
let y = d3.scalePoint().padding(0.5);

let xAxis = d3.axisBottom(x).ticks(31).tickFormat(d => d);

let yAxis = d3.axisLeft(y).tickSize(-width); // Ensure y-axis grid lines extend full width
let yAxisRight = d3.axisRight(y).tickSize(-width); // Same for right y-axis

chartGroup.append("g").attr("class", "x axis");
chartGroup.append("g").attr("class", "y axis left")
.call(yAxis)  // Assuming you have defined yScale
.select(".domain")
.style("display", "none");  // This hides the axis line


chartGroup.append("g").attr("class", "y axis right")
  .call(yAxisRight)  // Assuming you have defined yScale
  .select(".domain")
  .style("display", "none");  // This hides the axis line

const gridGroup = chartGroup.append("g").attr("class", "grid-group");
const dataGroup = chartGroup.append("g").attr("class", "data-group");
const axisGroup = chartGroup.append("g").attr("class", "axis-group");

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

let colorScale = d3.scaleSequential(d3.interpolate(colors.lightRain, colors.heavyRain));


// Load raindrop SVG
// At the top of your script, replace the existing SVG loading code with this:
console.log("Raindrop SVG path:", raindropPath);

// d3.xml("raindrop.svg").then(data => {
//     const svgNode = data.documentElement;
//     const raindropPath = "M10 0 C4.5 0 0 4.5 0 10 C0 15.5 4.5 20 10 20 C15.5 20 20 15.5 20 10 C20 4.5 15.5 0 10 0 Z";
//     svgLoaded = true;
//     console.log("SVG loaded successfully");
//     updateChart(currentState);
// }).catch(error => {
//     console.error("Error loading SVG:", error);
// });

// ... (previous code remains the same)

function updateChart(state) {
    console.log("Updating chart for state:", state);
    if (!data || !svgLoaded) {
        console.log("Data or SVG not loaded yet");
        return;
    }

    // Ensure background color is set
    svg.style("background-color", colors.background);
    d3.select("#chart").style("background-color", colors.background);
    d3.select("#chart-container").style("background-color", colors.background);

    const headerHeight = document.querySelector('.header-all').offsetHeight;

    const availableHeight = window.innerHeight - headerHeight;
    height = (availableHeight * 0.95) - margin.top - margin.bottom;


    // Set dimensions based on current container size
    const chartDiv = document.getElementById('chart');
    width = chartDiv.clientWidth - margin.left - margin.right;
    // height = window.innerHeight - margin.top - margin.bottom;

    // Update SVG size
    svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom);

    // Update the position of the chart group
    chartGroup.attr("transform", `translate(${margin.left},${margin.top})`);

    // Update scales' range to match new dimensions
    x.range([0, width]).domain([1, 31]);
    y.range([height, 0]).domain(d3.range(1, 13)); // Ensure full coverage for 12 months

    // Safeguard: Check for proper scale definitions
    if (x.domain().length === 0 || y.domain().length === 0) {
        console.error("Scales are not defined properly:", x.domain(), y.domain());
        return;
    }

    // Update grid lines
    gridGroup.selectAll(".grid-line").remove();

    // Add vertical grid lines
    x.ticks(30).forEach(tick => {
        const xPos = x(tick);
        if (!isNaN(xPos)) {
            gridGroup.append("line")
                .attr("class", "grid-line")
                .attr("x1", xPos)
                .attr("x2", xPos)
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", colors.gridLines);
        } else {
            console.warn("NaN detected in x-position for tick:", tick, "xPos:", xPos);
        }
    });

    // Add horizontal grid lines
    y.domain().forEach(tick => {
        const yPos = y(tick);
        if (!isNaN(yPos)) {
            gridGroup.append("line")
                .attr("class", "grid-line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", yPos)
                .attr("y2", yPos)
                .attr("stroke", colors.gridLines);
        } else {
            console.warn("NaN detected in y-position for tick:", tick, "yPos:", yPos);
        }
    });

    // Update axes
    chartGroup.select(".x.axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    // Format y-axis ticks to display month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yAxisFormatted = d3.axisLeft(y)
    .tickPadding(10)  // Add padding between ticks and labels

    .tickSize(-width) // Extend tick lines across the width to create grid lines
    .tickFormat(d => monthNames[d - 1]);

    chartGroup.select(".y.axis.left")
        .call(yAxisFormatted);

const yAxisRightFormatted = d3.axisRight(y)
    .tickSize(-width)
    .tickPadding(10)  // Add padding between ticks and labels

    .tickFormat(d => monthNames[d - 1]);
    
    chartGroup.select(".y.axis.right")
        .attr("transform", `translate(${width},0)`)
        .call(yAxisRightFormatted);

    // Update raindrops
    const stateData = data.filter(d => d.State === state);
    if (!stateData.length) {
        console.warn("No data found for state:", state);
        return;
    }

    const raindrops = chartGroup.selectAll(".raindrop")
        .data(stateData, d => `${d.State}-${d.Month}-${d.Day}`);

    raindrops.enter()
        .append("path")
        .attr("class", "raindrop")
        .merge(raindrops)
        .attr("d", raindropPath)
        .attr("transform", d => {
            const xPos = x(d.Day);
            const yPos = y(d.Month);
            if (isNaN(xPos) || isNaN(yPos)) {
                console.warn("Invalid position for raindrop:", xPos, yPos, d);
                return `translate(0,0) scale(0)`; // Hides the raindrop
            }
            return `translate(${xPos - 8},${yPos - 16}) scale(0.75)`;
        })
        .attr("fill", d => colorScale(d.avgRainfall * 2))
        .attr("opacity", 1)
        .attr("stroke", "none")
        .on("mouseover", function(event, d) {
            d3.select(this).interrupt();

            const xPos = x(d.Day);
            const yPos = y(d.Month);
            
            // Get the chart dimensions
            const chartRect = chartGroup.node().getBoundingClientRect();
            const tooltipWidth = 150; // Approximate width of the tooltip
            const tooltipHeight = 60; // Approximate height of the tooltip

            // Calculate tooltip position
            let tooltipX = event.pageX + 10;
            let tooltipY = event.pageY - 28;

            // Adjust tooltip position if it goes beyond the right edge of the chart
            if (tooltipX + tooltipWidth > chartRect.right) {
                tooltipX = event.pageX - tooltipWidth - 10;
            }

            // Adjust tooltip position if it goes beyond the bottom edge of the chart
            if (tooltipY + tooltipHeight > chartRect.bottom) {
                tooltipY = event.pageY - tooltipHeight - 10;
            }

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`Date: ${d.Month}/${d.Day}<br/>Avg Rainfall: ${d.avgRainfall.toFixed(2)} mm`)
                .style("left", tooltipX + "px")
                .style("top", tooltipY + "px");
            
            d3.select(this)
                .attr("stroke", "#7F534B")
                .attr("stroke-width", 2)
                .transition()
                .duration(200)
                .attr("transform", `translate(${xPos - 24},${yPos - 48}) scale(2.25)`);
            
            // Highlight corresponding grid lines
            chartGroup.selectAll(".grid-line")
                .filter(t => t == d.Day || t == d.Month)
                .attr("stroke", colors.yellow)
                .attr("stroke-width", 2)
                .attr("stroke-opacity", 1);

            // Highlight corresponding date and month text
            chartGroup.selectAll(".axis text")
                .filter(t => (t == d.Day || monthNames[d.Month - 1] == t))
                .attr("fill", colors.highlightBrown)
                .attr("font-weight", "bold");
        })
        .on("mouseout", function(d) {
            // Stop any ongoing transitions
            d3.select(this).interrupt();

            tooltip.transition().duration(500).style("opacity", 0);
            
            d3.select(this)
                .attr("stroke", null)
                .attr("stroke-width", null)
                .transition()
                .duration(200)
                .attr("transform", d => {
                    const xPos = x(d.Day);
                    const yPos = y(d.Month);
                    return `translate(${xPos - 8},${yPos - 16}) scale(0.75)`;
                });
            
            // Remove highlight from date and month
            chartGroup.selectAll(".axis text")
                .attr("fill", colors.axisText)
                .attr("font-weight", "normal");
        });

    raindrops.exit().remove();

    // Update button styles
    d3.selectAll(".state-button").classed("active", d => d === state);
}

// Event listener for window resize to update the chart dimensions and elements
window.addEventListener('resize', () => updateChart(currentState));

// Event listener for window resize to update the chart dimensions and elements
window.addEventListener('resize', () => updateChart(currentState));

// Event listener for window resize to update the chart dimensions and elements
window.addEventListener('resize', () => updateChart(currentState));

// Event listener for window resize to update the chart dimensions and elements
window.addEventListener('resize', () => updateChart(currentState));

window.addEventListener('resize', debounce(() => {
    updateChart(currentState);
}, 250));

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

console.log("Raindrop SVG path:", raindropPath);



// ... (rest of the code remains the same)
// Create header with title and buttons
const header = d3.select(".button-container").insert("div", ":first-child")
    .attr("class", "state-button");

// header.append("h1")
//     .text("Raining Days")
//     .attr("class", "title");

const buttonContainer = header.append("div")
    .attr("class", "button-container");

buttonContainer.selectAll("button")
    .data(selectedStates)
    .enter()
    .append("button")
    .attr("class", "state-button")
    .text(d => d)
    .on("click", function(event, d) {
        d3.selectAll(".state-button").classed("active", false);
        d3.select(this).classed("active", true);
        updateChart(d);
    });

d3.csv('complete_data.csv').then(function(csvData) {
    console.log("Data loaded successfully");

    // Process and aggregate data
    const processedData = csvData.map(d => ({
        ...d,
        State: cityToState[d.Location] || "Unknown",
        Rainfall: +d.Rainfall || 0,
        Month: +d.Month,
        Day: +d.Day
    }));

    data = d3.rollup(processedData, 
        v => ({
            avgRainfall: d3.mean(v, d => d.Rainfall),
            count: v.length
        }),
        d => d.State,
        d => d.Month,
        d => d.Day
    );

    // Convert Map to array for easier use with D3
    data = Array.from(data, ([State, monthMap]) => 
        Array.from(monthMap, ([Month, dayMap]) => 
            Array.from(dayMap, ([Day, values]) => ({
                State, Month, Day, avgRainfall: values.avgRainfall
            }))
        ).flat()
    ).flat();

    // Filter data for selected states
    data = data.filter(d => selectedStates.includes(d.State));

    // Set up color scale
    const maxRainfall = d3.max(data, d => d.avgRainfall);
    colorScale.domain([0, maxRainfall]);

    console.log("Processed data:", data.slice(0, 10)); // Log first 10 items

    // Initialize the chart with the first state
    if (svgLoaded) {
        updateChart(selectedStates[0]);
    } else {
        console.log("SVG not loaded yet, chart update deferred");
    }

}).catch(function(error) {
    console.error("Error loading data:", error);
});

window.addEventListener('resize', () => updateChart(currentState));

// Ensure background color is set when the page loads
document.addEventListener('DOMContentLoaded', (event) => {
    document.body.style.backgroundColor = colors.background;
    d3.select("#chart").style("background-color", colors.background);
    d3.select("#chart-container").style("background-color", colors.background);
});