async function overview() {
    width = 200
    height = 200
    margin = 50
    xAxis = d3.scaleBand().domain([0, 1, 2, 3, 4, 5]).range([0, width]);
    yAxis = d3.scaleLinear().domain([0, 42]).range([height, 0]);

    d3.select('svg')
        .attr("width", width + margin * 2)
        .attr("length", length + margin * 2)
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .selectAll('rect')
        .data([4, 8, 15, 16, 23, 42])
        .enter()
        .append('rect')
        .attr('x', function (d, i) { return xAxis(i); })
        .attr('y', function (d) { return yAxis(d); })
        .attr('width', function (d) { return width - yAxis(d); })
        .attr("height", 200 / 6)

    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .call(d3.axisLeft(yAxis));
    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + (height + margin) + ")")
        .call(d3.axisBottom(xAxis));
}