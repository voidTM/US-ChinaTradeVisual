async function overview() {
    const margin = 50;
    const height = 200;
    const width = 200;
    const axisticks = [10, 20, 50, 100];
    const data = await d3.csv("https://flunky.github.io/cars2017.csv");
    var scale = d3.scaleLog()
        .base(10)
        .domain([10, 150]);

    var xScale = d3.scaleLog()
        .base(10)
        .domain([10, 150])
        .range([0, width]);

    var yScale = d3.scaleLog()
        .base(10)
        .domain([10, 150])
        .range([height, 0]);

    var xAxis = d3.axisBottom(xScale)
        .tickValues(axisticks)
        .tickFormat(d3.format("~s"));
    var yAxis = d3.axisLeft(yScale)
        .tickValues(axisticks)
        .tickFormat(d3.format("~s"))

    d3.select('svg')
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr("cx", function (d) { return xScale(d.AverageCityMPG); })
        .attr("cy", function (d) { return yScale(d.AverageHighwayMPG); })
        .attr("r", function (d) { return (parseInt(d.EngineCylinders) + 2); });

    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .call(yAxis);
    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + (height + margin) + ")")
        .call(xAxis);

}