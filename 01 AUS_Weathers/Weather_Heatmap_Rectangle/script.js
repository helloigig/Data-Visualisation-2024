d3.csv('complete_data.csv', function(error, data) {
    if (error) {
      console.error("Error loading data:", error);
      alert("Can't load data :(");
      return;
    }
  
    // Filter data for the years 2008 to 2017
    var startYear = 2008;
    var endYear = 2017;
    var filteredData = data.filter(function(d) {
      return +d.Year >= startYear && +d.Year <= endYear;
    });
  
    // Initial rendering
    var margin = {top: 20, right: 20, bottom: 50, left: 50};
    var width = document.getElementById('chart').clientWidth - margin.left - margin.right;
    var height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;
  
    // Parse data and calculate temperature difference for each day of the years 2008 to 2017
    var dailyData = [];
    filteredData.forEach(function(d) {
      var date = new Date(+d.Year, +d.Month - 1, +d.Day);
      var maxTemp = +d.MaxTemp;
      var minTemp = +d.MinTemp;
      var tempDiff = maxTemp - minTemp;
      dailyData.push({
        year: +d.Year,
        month: +d.Month,
        day: +d.Day,
        date: date,
        tempDiff: tempDiff.toFixed(1), // Calculate and round temperature difference
        maxTemp: maxTemp.toFixed(1), // Round maximum temperature
        minTemp: minTemp.toFixed(1) // Round minimum temperature
      });
    });
  
    function renderChart() {
      // Update dimensions
      width = document.getElementById('chart').clientWidth - margin.left - margin.right;
      height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;
  
      // Remove existing SVG
      d3.select('#chart').select('svg').remove();
  
      // Define scales
      var yScale = d3.scale.ordinal()
          .domain(d3.range(startYear, endYear + 1)) // Years from 2008 to 2017
          .rangeRoundBands([margin.top, height - margin.bottom], -0.01); //change the gap
  
      var xScale = d3.scale.ordinal()
          .domain(d3.range(1, 13)) // Months
          .rangeRoundBands([margin.left, width - margin.right], -0.01);
  
      var colorScale = d3.scale.linear()
          .domain(d3.extent(dailyData, function(d) { return +d.tempDiff; })) // Domain based on temperature differences
          .range(["#294861", "#ebf4f5"]); // Color range from blue (low) to red (high)
  
      // Create SVG
      var svg = d3.select('#chart')
          .append('svg')
          .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);
  
      // Tooltip div
      var tooltip = d3.select("#tooltip");
  
      // Render rectangles for each day
      var cells = svg.append("g")
          .selectAll('rect')
          .data(dailyData)
          .enter().append('rect')
          .attr("x", function(d) {
            var monthWidth = xScale.rangeBand();
            var daysInMonth = new Date(d.year, d.month, 0).getDate();
            return xScale(d.month) + (monthWidth / daysInMonth) * (d.day - 1);
          })
          .attr("y", function(d) { return yScale(d.year); })
          .attr("width", function(d) {
            var daysInMonth = new Date(d.year, d.month, 0).getDate();
            return xScale.rangeBand() / daysInMonth;
          })
          .attr("height", yScale.rangeBand())
          .attr("fill", function(d) { return colorScale(+d.tempDiff); })
          .on('mouseover', function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity",1);
            tooltip.html(d3.time.format("%Y/%m/%d")(d.date) + "<br/>" +
                         "A difference of " + d.tempDiff + "°C" + "<br/>"

                        //  "Max Temp: " + d.maxTemp + "°C" + "<br/>" +
                        //  "Min Temp: " + d.minTemp + "°C"
                        )
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("display", "block")
                .style("line-height", "150%");
            
            d3.select("#date").text(d3.time.format("%Y/%m/%d")(d.date));
            d3.select("#max-temp").text(d.maxTemp + "°C");
            d3.select("#min-temp").text(d.minTemp + "°C");
            d3.select("#temp-diff").text(d.tempDiff + "°C");
          })
          .on('mouseout', function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0)
                .style("display", "none");
  
            d3.select("#date").text("Hover on a date");
            d3.select("#max-temp").text("--°C");
            d3.select("#min-temp").text("--°C");
            d3.select("#temp-diff").text("--°C");
          });
  
      // Add axes and labels
      var xAxis = d3.svg.axis()
          .scale(xScale)
          .orient('top')
          .tickFormat(function(d) {
            var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return monthNames[d - 1]; // Format as month names
        })
        .tickSize(0); // Remove tick lines
        

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .tickFormat(function(d) { return d; }) // Format as year
        .tickSize(0); // Remove tick lines

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,0)')
        .call(xAxis)

        .selectAll("text")
        .style("fill", "#294861"); // Set text color for x-axis labels
    
    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(0,0)')
        .call(yAxis)

        .selectAll("text")
        .style("fill", "#294861"); // Set text color for x-axis labels
    
    // Add axis labels
    svg.append('text')
        // .text('Months')
        .attr({
          'text-anchor': 'middle',
          transform: 'translate(' + (width / 2) + ',' + (-margin.top / 2) + ')'
        });

    svg.append('text')
        // .text('Years')
        .attr({
          'text-anchor': 'middle',
          transform: 'translate(' + (-margin.left / 2) + ',' + (height / 2) + ') rotate(-90)'
        });
  }

  // Initial render
  renderChart();

  // Update the chart when the window is resized
  window.addEventListener('resize', renderChart);
});
  