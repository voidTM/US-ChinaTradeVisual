// first and initial chart
async function overviewLine() {
    const margin = 50;
    const height = 400;
    var width = 500;
    var target = "China"

    // Get data from Only China
    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010.csv", function (d) {
        if (d.Country == "China")
            return {
                country: d.Country,
                time: d.Time,
                exports: d['Total Exports Value ($US)'],
                imports: d['Customs Import Value (Gen) ($US)'],
            }

    });
    console.log(data);

    /*var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.time; }))
        .range([0, width]);*/
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.exports; })])
        .range([height, 0]);

    var y = d3.scaleLog()
        .domain([0, d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.format("~s"));
    var yAxis = d3.axisLeft(y)
        .tickFormat(d3.format("~s"))

    d3.select('svg')
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .selectAll('path')
        .data(data)
        .enter()
        .append('path')
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return x(d.exports); })
            .y(function (d) { return y(d.imports); }));


    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .call(yAxis);
    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + (height + margin) + ")")
        .call(xAxis);

}

async function overviewPoints() {
    const margin = 50;
    const height = 400;
    var width = 500;
    var target = "China"

    // Get data from Only China
    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010.csv", function (d) {
        if (d.Country == "China")
            return {
                country: d.Country,
                time: d.Time,
                exports: d['Total Exports Value ($US)'],
                imports: d['Customs Import Value (Gen) ($US)'],
            }

    });
    console.log(data);

    /*var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) { return d.time; }))
        .range([0, width]);*/
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.exports; })])
        .range([height, 0]);

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.format("~s"));
    var yAxis = d3.axisLeft(y)
        .tickFormat(d3.format("~s"))

    d3.select('svg')
        .append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr("cx", function (d) { return x(d.exports); })
        .attr("cy", function (d) { return y(d.imports); })
        .attr("r", function (d) { return 2; });



    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .call(yAxis);
    d3.select('svg').append("g")
        .attr("transform", "translate(" + margin + "," + (height + margin) + ")")
        .call(xAxis);

}