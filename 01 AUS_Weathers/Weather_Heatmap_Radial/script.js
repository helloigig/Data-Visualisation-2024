// Function to create a radial heatmap
function createRadialHeatmap(data, chartId) {
    // Filter data for the years 2008 to 2017
    var startYear = 2008;
    var endYear = 2017;
    var filteredData = data.filter(function(d) {
        return +d.Year >= startYear && +d.Year <= endYear;
    });

    // Prepare data
    var dailyData = [];
    filteredData.forEach(function(d) {
        var date = new Date(+d.Year, +d.Month - 1, +d.Day);
        dailyData.push({
            year: +d.Year,
            month: +d.Month,
            day: +d.Day,
            date: date,
            maxTemp: +d.MaxTemp
        });
    });

    var filledData = [];
    for (var year = startYear; year <= endYear; year++) {
        for (var month = 1; month <= 12; month++) {
            var daysInMonth = new Date(year, month, 0).getDate();
            for (var day = 1; day <= daysInMonth; day++) {
                var date = new Date(year, month - 1, day);
                var existingData = dailyData.find(d => d.year === year && d.month === month && d.day === day);
                if (existingData) {
                    filledData.push(existingData);
                } else {
                    var avgTemp = d3.mean(dailyData.filter(d => d.month === month), d => d.maxTemp);
                    filledData.push({
                        year: year,
                        month: month,
                        day: day,
                        date: date,
                        maxTemp: avgTemp
                    });
                }
            }
        }
    }

    // Define scales
    var margin = {top: 20, right: 20, bottom: 50, left: 100};
    var width = document.getElementById(chartId).clientWidth - margin.left - margin.right;
    var height = document.getElementById(chartId).clientHeight - margin.top - margin.bottom;
    var innerRadius = 50;  // Decreased inner radius for more space
    var outerRadius = Math.min(width, height) / 2 - margin.top;

    var colorScale = d3.scale.linear()
        .domain(d3.extent(filledData, function(d) { return d.maxTemp; }))
        .range(["white", "red"]);  // Update the color scale

    var angleScale = d3.scale.linear()
        .domain([0, 365])
        .range([0, 2 * Math.PI]);  // Create a consistent gap

    var radiusScale = d3.scale.ordinal()
        .domain(d3.range(startYear, endYear + 1))
        .rangeBands([innerRadius, outerRadius]);

    // Create SVG
    var svg = d3.select('#' + chartId)
        .append('svg')
        .attr('width', width + margin.left + margin.right)  // Ensure full width is used
        .attr('height', height + margin.top + margin.bottom)  // Ensure full height is used
        .append('g')
        .attr('transform', `translate(${(width + margin.left + margin.right) / 2}, ${(height + margin.top + margin.bottom) / 2})`);

    // Tooltip div
    var tooltip = d3.select("#tooltip");

    // Create a text element for displaying the date on hover
    var dateLabel = svg.append('text')
        .attr('class', 'date-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.35em')
        .style('font-size', '12px')
        .style('opacity', 0);

    // Render arcs for each day
    var cells = svg.selectAll('path')
        .data(filledData)
        .enter().append('path')
        .attr('d', d3.svg.arc()
            .innerRadius(function(d) { return radiusScale(d.year); })
            .outerRadius(function(d) { return radiusScale(d.year) + radiusScale.rangeBand(); })
            .startAngle(function(d) {
                var startOfYear = new Date(d.year, 0, 0);
                var diff = d.date - startOfYear;
                var oneDay = 1000 * 60 * 60 * 24;
                var dayOfYear = Math.floor(diff / oneDay);
                return angleScale(dayOfYear);
            })
            .endAngle(function(d) {
                var startOfYear = new Date(d.year, 0, 0);
                var diff = d.date - startOfYear;
                var oneDay = 1000 * 60 * 60 * 24;
                var dayOfYear = Math.floor(diff / oneDay);
                return angleScale(dayOfYear + 1);
            })
        )
        .attr('fill', function(d) { return colorScale(d.maxTemp); })
        .on('mouseover', function(d) {
            var startOfYear = new Date(d.year, 0, 0);
            var diff = d.date - startOfYear;
            var oneDay = 1000 * 60 * 60 * 24;
            var dayOfYear = Math.floor(diff / oneDay);
            var angle = angleScale(dayOfYear) - Math.PI / 2; // Adjust for rotation

            // Determine if the text should be flipped
            var angleInDegrees = angle * 180 / Math.PI;
            var flipText = angleInDegrees > 90 && angleInDegrees < 270;

            // Update the date label position to be at the outer radius
            var labelRadius = outerRadius + 50; // Move hover text further out
            dateLabel
                .attr('x', labelRadius * Math.cos(angle))
                .attr('y', labelRadius * Math.sin(angle))
                .attr('transform', function() {
                    return flipText
                        ? 'rotate(' + (angleInDegrees + 180) + ',' + (labelRadius * Math.cos(angle)) + ',' + (labelRadius * Math.sin(angle)) + ')'
                        : 'rotate(' + angleInDegrees + ',' + (labelRadius * Math.cos(angle)) + ',' + (labelRadius * Math.sin(angle)) + ')';
                })
                .text(d3.time.format("%B %d, %Y")(d.date))
                .style('opacity', 1);

            // Show tooltip at cursor position
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Max Temp: " + d.maxTemp + "°C")
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("display", "block");
        })
        .on('mouseout', function(d) {
            // Hide the date label
            dateLabel.style('opacity', 0);

            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0)
                .style("display", "none");
        });

    // Add radial axes and labels
    var radialAxis = svg.append('g')
        .selectAll('g')
        .data(d3.range(startYear, endYear + 1))
        .enter().append('g');

    radialAxis.append('text')
        .attr('x', 0)
        .attr('y', function(d) { return -radiusScale(d) - radiusScale.rangeBand() / 2; })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(function(d) { return d; });

    // Add angular labels
    var angularLabels = svg.append('g')
        .selectAll('g')
        .data(d3.range(1, 13))
        .enter().append('g')
        .attr('text-anchor', 'middle')
        .attr('transform', function(d) {
            var angle = (d - 1) * 30 - 90; // Adjust rotation so that January is at the top
            return 'rotate(' + angle + ') translate(' + (outerRadius + 30) + ',0)';
        });

    angularLabels.append('text')
        .attr('transform', function(d) {
            var angle = (d - 1) * 30 - 90;
            return angle > 90 && angle < 270 ? 'rotate(180)' : null; // Ensure labels are upright
        })
        .text(function(d) {
            var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return monthNames[d - 1];
        });
}

// Load the complete data and split it
d3.csv('complete_data.csv', function(error, data) {
    if (error) {
        console.error("Error loading data:", error);
        alert("Can't load data :(");
        return;
    }

    // Split the data into Sydney, Melbourne, and others
    var sydneyData = data.filter(d => d.Location === 'Sydney');
    var melbourneData = data.filter(d => d.Location === 'Melbourne');
    var otherData = data.filter(d => d.Location !== 'Sydney' && d.Location !== 'Melbourne');

    // Create the radial heatmaps
    createRadialHeatmap(sydneyData, 'chart1');
    createRadialHeatmap(melbourneData, 'chart2');
});
