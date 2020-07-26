async function overview() {
    const margin = 50;
    const height = 200;
    var width = 200;
    var target = "China"
  
    const data = await d3.csv("file://./data/USA-Trade2010.csv", function(data){
        return d.Country == "China"
        });
    console.log(data);
    console.log(data.Country);
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
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr("x", function (d) { return xScale(d.Time); })
        .attr("y", function (d) { return yScale(d.country); });

    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .call(yAxis);
    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + (height + margin) + ")")
        .call(xAxis);

}