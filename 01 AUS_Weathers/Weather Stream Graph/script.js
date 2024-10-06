const years = d3.range(2016, 2024);
let currentYear = 2016;
let currentState = 'AUS';

d3.csv('complete_data.csv').then(function(data) {
    console.log("Data loaded:", data);

    if (data.length === 0) {
        console.error("No data loaded. Please check the CSV file.");
        return;
    }

    const cityToState = {
        "Canberra": "ACT", "Sydney": "NSW", "Melbourne": "VIC", "Brisbane": "QLD", "Adelaide": "SA", "Perth": "WA", "Hobart": "TAS", "Darwin": "NT", "Albury": "NSW", "Newcastle": "NSW", "Penrith": "NSW", "Wollongong": "NSW", "Tuggeranong": "ACT", "MountGinini": "ACT", "Ballarat": "VIC", "Bendigo": "VIC", "Cairns": "QLD", "GoldCoast": "QLD", "Townsville": "QLD", "MountGambier": "SA", "Albany": "WA", "Launceston": "TAS", "AliceSprings": "NT", "BadgerysCreek": "NSW", "Cobar": "NSW", "CoffsHarbour": "NSW", "Moree": "NSW", "NorahHead": "NSW", "NorfolkIsland": "EXT", "Richmond": "NSW", "SydneyAirport": "NSW", "WaggaWagga": "NSW", "Williamtown": "NSW", "Sale": "VIC", "MelbourneAirport": "VIC", "Mildura": "VIC", "Portland": "VIC", "Watsonia": "VIC", "Dartmoor": "VIC", "Nuriootpa": "SA", "Woomera": "SA", "Witchcliffe": "WA", "PearceRAAF": "WA", "PerthAirport": "WA", "SalmonGums": "WA", "Walpole": "WA", "Nhil": "VIC", "Katherine": "NT", "Uluru": "NT"
    };

    const yearMap = {
        2016: 2023,
        2015: 2022,
        2014: 2021,
        2013: 2020,
        2012: 2019,
        2011: 2018,
        2010: 2017,
        2009: 2016
    };

    data = data.filter(d => Object.keys(yearMap).includes(d.Year));
    data.forEach(d => {
        d.Year = yearMap[d.Year];
        d.date = new Date(d.Year, d.Month - 1, d.Day);
        d.RainToday = d.RainToday ? d.RainToday.trim().toLowerCase() === "yes" : false;
        d.Rainfall = Math.max(0, +d.Rainfall || 0);
        d.State = cityToState[d.Location] || "Unknown";
    });

    console.log("Processed data:", data);

    const width = 10000;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };

    const svg = d3.select("#chart").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`);

console.log("SVG created with viewBox:", `0 0 ${width} ${height}`);

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(".tooltip");

    const x = d3.scaleTime()
        .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
        .range([height - margin.top - margin.bottom, 0]);

    const color = d3.scaleOrdinal()
        .domain([...new Set(data.map(d => d.State))])
        .range(d3.schemeCategory10);

    const area = d3.area()
        .x(d => x(d.data.date))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveBasis);

    function smoothData(data, windowSize) {
        return data.map((d, i) => {
            const start = Math.max(0, i - windowSize + 1);
            const end = i + 1;
            const window = data.slice(start, end);
            const avgRainfall = d3.mean(window, e => e.Rainfall);
            return { ...d, Rainfall: avgRainfall };
        });
    }

    function update(year, state = 'AUS') {
        console.log(`Updating for year: ${year}, state: ${state}`);

        let filteredData = data.filter(d => d.Year == year);
        if (state !== 'AUS') {
            filteredData = filteredData.filter(d => d.State === state);
        }

        console.log(`Filtered data for year ${year} and state ${state}:`, filteredData);

        if (filteredData.length === 0) {
            console.warn("No data available for the selected year and state.");
            return;
        }

        const smoothedData = smoothData(filteredData, 90);

        const nestedData = d3.groups(smoothedData, d => d.date).map(([date, values]) => {
            const result = { date };
            values.forEach(v => {
                result[v.State] = v.Rainfall;
            });
            return result;
        });

        console.log("Nested data:", nestedData);

        const states = state === 'AUS' ? [...new Set(data.map(d => d.State))] : [state];

        const stack = d3.stack()
            .keys(states)
            .value((d, key) => d[key] || 0)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const stackedData = stack(nestedData);

        console.log("Stacked data:", stackedData);

        x.domain(d3.extent(filteredData, d => d.date));
        y.domain([0, d3.max(stackedData, layer => d3.max(layer, d => d[1]))]);

        g.selectAll("*").remove();

        g.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .ticks(10)
                .tickSize(-width + margin.left + margin.right)
                .tickFormat(''))
            .style("opacity", 0.3);

        g.append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x)
                .ticks(d3.timeDay.every(1))
                .tickSize(-height + margin.top + margin.bottom)
                .tickFormat(''))
            .style("opacity", 0.3);

        g.append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

        g.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .attr("class", "axis-label")
            .style("text-anchor", "middle")
            .text("Rainfall (mm)");

        const areas = g.selectAll(".area")
            .data(stackedData);

        areas.enter().append("path")
            .attr("class", "area")
            .attr("fill", d => color(d.key))
            .merge(areas)
            .attr("d", area)
            .on("click", function(event, d) {
                currentState = d.key;
                update(currentYear, currentState);
                updateTitle();
            })
            .on("mouseover", function(event, d) {
                d3.selectAll(".area").style("opacity", 0.2);
                d3.select(this).style("opacity", 1);
                tooltip.transition().duration(200).style("opacity", .9);
                const mouseX = d3.pointer(event)[0];
                const invertedX = x.invert(mouseX);
                const date = d3.timeFormat("%B %d, %Y")(invertedX);
                const rainfall = d3.mean(d, v => v.data[d.key]);
                tooltip.html(`State: ${d.key}<br/>Rainfall: ${rainfall.toFixed(2)} mm<br/>Date: ${date}`)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", function() {
                d3.selectAll(".area").style("opacity", 1);
                tooltip.transition().duration(500).style("opacity", 0);
            });

        areas.exit().remove();

        console.log("Graph updated successfully");

        updateTitle();
    }

    function updateTitle() {
        d3.select("#details").html(`<h3>RAINFALL IN ${currentState} ${currentYear}</h3>`);
    }

    function changeYear(delta) {
        const currentIndex = years.indexOf(currentYear);
        const newIndex = (currentIndex + delta + years.length) % years.length;
        currentYear = years[newIndex];
        update(currentYear, currentState);
        updateTitle();
    }

    // Add year navigation buttons
    d3.select("#buttons").append("button")
        .text("◀")
        .on("click", () => changeYear(-1));

    d3.select("#buttons").append("button")
        .text("▶")
        .on("click", () => changeYear(1));

    // Add horizontal scroll slider
    const slider = d3.select("#scroll-slider")
        .attr("min", 0)
        .attr("max", width - window.innerWidth)
        .attr("value", 0)
        .on("input", function() {
            const scrollLeft = +this.value;
            d3.select("#chart").style("transform", `translateX(-${scrollLeft}px)`);
        });

    // Reset to all states when clicking outside the graph
    d3.select("#chart").on("click", function(event) {
        if (event.target.tagName !== "path") {
            currentState = 'AUS';
            update(currentYear, currentState);
            updateTitle();
        }
    });

    update(currentYear, currentState);
}).catch(function(error) {
    console.error("Error loading or processing data:", error);
});