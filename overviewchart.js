// first and initial chart
async function overviewLine() {
    const margin = 50;
    const height = 300;
    var width = 500;
    var target = "China"

    // Get data from Only China
    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Country == "China")
            return {
                exports: parseInt(d['Total Exports Value ($US)'].replace(/\,/g, '')),
                imports: parseInt(d['Customs Import Value (Gen) ($US)'].replace(/\,/g, ''))
            }

    });
    console.log(data);

    /*var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.time; }))
        .range([0, width]);*/
    var x = d3.scaleLinear()
        .domain([0, 150])
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.format("~s"));
    var yAxis = d3.axisLeft(y)
        .tickFormat(d3.format("~s"));

    var line = d3.line()
        .x(function (d, i) { return i; }) // set the x values for the line generator
        .y(function (d) { return d.imports; });

    d3.select('svg')
        .append("g")
        .attr("transform", "translate(" + 100 + "," + margin + ")")
        .selectAll('path')
        .enter().append('path')
        .datum([data])
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    d3.select('svg')
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .selectAll(".dot")
        .data(data)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d, i) { return x(i) })
        .attr("cy", function (d) { return y(d.imports) })
        .attr("r", 2)

    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .call(yAxis);
    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + (height + margin) + ")")
        .call(xAxis);

}