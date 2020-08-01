

var margin = { top: 10, right: 50, bottom: 50, left: 100 }
    , width = 1000 - margin.right - margin.left
    , height = 500 - margin.top - margin.bottom;

const colorScheme = {
    imports: "rgb(223, 63, 63)",
    balance: "blueviolet",
    deficit: "blueviolet",
    exports: "green"
}

var currScene = 1;
var prevScene = -1;

// Scales
var xScales = d3.scaleTime()
    .range([0, width]);
var yScales = d3.scaleLinear()
    .range([height, 0]);



// domains for scales
var xOverview = [new Date("01/01/2002"), new Date("01/01/2020")];
var yYear;
var yMonth;
var yTrump;
var xTrump = [new Date("01/01/2016"), new Date("01/01/2020")];


// Scene 1 and 2 lines
var balanceLine = d3.line()
    .x(function (d) { return xScales(d.time); })
    .y(function (d) { return yScales(d.deficit) })

var importsLine = d3.line()
    .x(function (d) { return xScales(d.time); })
    .y(function (d) { return yScales(d.imports); })

var exportsLine = d3.line()
    .x(function (d) { return xScales(d.time); })
    .y(function (d) { return yScales(d.exports); })


// Date time format parsers
var yearDate = d3.timeParse("%Y");
var monthYear = d3.timeParse("%B %Y");

// Data from csvs
var annualData;
var monthlyData;

// Annotations
var annotations = []

function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

function drawAxes(svg, x, y) {

    var xAxes = d3.axisBottom(x).ticks(10);
    var yAxes = d3.axisLeft(y)
        .tickFormat(function (d) { return "$" + (d / 1000000000) + " bn" })
        .ticks(10)
        .tickSize(-width);


    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxes); // Create an axis component with d3.axisBottom

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxes); // Create an axis component with d3.axisLeft
}

// updates the axes
function updateAxes(svg, x, y) {

    var xAxes = d3.axisBottom(x).ticks(10);
    var yAxes = d3.axisLeft(y)
        .tickFormat(function (d) { return "$" + (d / 1000000000) + " bn" })
        .ticks(10)
        .tickSize(-width);


    svg.select(".x-axis")
        .transition(200)
        .call(xAxes); 

    svg.select(".y-axis")
        .transition(200)
        .call(yAxes); 
}


/**
 * 
 * Data filtering and aggregation
 */

function groupBy(data, key) {
    return data.reduce(function (obj, value) {
        var valueKey = value[key];
        if (obj[valueKey] == null)
            obj[valueKey] = [value];
        obj[valueKey].push(value);
        return obj;
    }, {});
}


function aggregateData(data, key) {
    // aggregates data 
    var commodityData = data.reduce(function (obj, value) {
        var valueKey = value[key];
        if (obj[valueKey] == null)
            obj[valueKey] = value;

        obj[valueKey]["imports"] += value["imports"] || 0;
        obj[valueKey]["balance"] += value["balance"] || 0;

        return obj;
    }, {});

    var commodityArray = Object.values(commodityData);
    commodityArray.sort(function (a, b) {
        return d3.ascending(a.balance, b.balance);
    });

    return commodityArray;
}


function annotateArea(svg, note) {
    t = svg.append("g")
        .attr("class", "annotation")
        .attr("transform", "translate(" + note.x + "," + note.y + ")");

    t.append("rect")
        .attr("class", "rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", note.width) // 3 years
        .attr("height", height);

    t.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", 1)
        .text(note.label)
        .call(wrap, note.width)
}

async function init() {
    // move querying data to here?
    // and make data global
    // Setsup the visualizations
    annualData = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/Exports-Imports-China-Year.csv", function (d) {
        return {
            time: yearDate(d.Time),
            exports: parseInt(d['Total Exports Value ($US)']),
            imports: parseInt(d['Customs Import Value (Gen) ($US)']),
            deficit: -parseInt(d['Balance ($US)'])
        }
    });

    yYear = [0, d3.max(annualData, function (d) { return d.imports; })];

    //y.domain(yYear);
    //monthlyData = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/test3.csv", function (d) {
    monthlyData = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/US-ChinaTradeV3.csv", function (d) {
        return {
            commodity: d.Commodity,
            time: monthYear(d.Time),
            month: d.Time,
            exports: parseInt(d['Total Exports Value ($US)']),
            imports: parseInt(d['Customs Import Value (Gen) ($US)']),
            balance: parseInt(d['Balance ($US)']),
            deficit: -parseInt(d['Balance ($US)'])
        }
    });

    yMonth = [0, d3.max(monthlyData, function (d) { return d.imports; })]
    //y.domain(yMonth)

    var d2 = groupBy(monthlyData, "commodity");
    var dataArray = Object.values(d2);
    var commoditiesList = Object.keys(d2);

    d3.select("#selectButton")
        .selectAll('commodities')
        .data(commoditiesList)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; })

    var svg = d3.select(".container").select("svg")
        .append("g")
        .attr("class", "slide-viz") // this classification does nothing atm?
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    drawChart1(svg, annualData);
    //drawChart1(svg, monthlyData);
    //drawChart1(svg, dataArray);
    //drawChart2(svg, dataArray);
}

/**
 * Chart1 takes place using annual data of the US Trade deficit
 * Scenes 1 and 2 take place here
 */

async function drawChart1(svg, data) {
    
    // Set Scales
    xScales.domain(xOverview);
    yScales.domain(yYear);
    drawAxes(svg, xScales, yScales);
    //Draw line imports

    /**
     * Tooltip functions
     */
    //var overview = data.filter(function (d) { return d.commodity == "All Commodities"; });
    var tooltip = d3.select(".tooltip")
        .style("opacity", 0)


    var mouseover = function (d, i) {
        tooltip
            .style("opacity", 1)
            .html(d.month + " Deficit: <br>$ " + (d.deficit / 1000000000).toFixed(2) + " bn")
            //Tooltip is center bottom of data point
            .style("left", ((d3.event.pageX - 50) + "px"))
            .style("top", ((d3.event.pageY + 10) + "px"));

    };

    var mouseleave = function (d, i) {
        tooltip
            .style("opacity", 0);
    };

    // Draw Scene1 data
    var scene1 = svg.append("g")
        .attr("class", "scene1")
        .attr("opacity", 1);
    /*
    scene1.selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["deficit"])
        .attr("opacity", 0);
    */

    scene1.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["deficit"]);
    /*
    scene1.selectAll("deficit-points")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "datapoint")
        .attr("fill", colorScheme["deficit"])
        .attr("cx", function (d) { return x1(d.time); })
        .attr("cy", function (d) { return yAnnual(d.deficit); })
        .attr("r", 5)
        .on("mouseover", mouseover)

    // Filter in post?
    // A selection filter
    // d3 filter only operates upon a selection of existing variables.
    /*scene1.selectAll("path")
        .filter(function (d, i) { return d[i].commodity == "All Commodities"; })
        .attr("opacity", 1);

    /*
    // scene 2 data
    var scene2 = svg.append("g")
        .attr("class", "scene2")
        .attr("opacity", 0);

    scene2.append("path")
        .datum(data)
        .attr("class", "line imports")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["imports"]);

    scene2.append("path")
        .datum(data)
        .attr("class", "line exports")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["exports"]);

    scene2.selectAll("import-points")
        .data(data)
        .enter()
        .append("circle")
        .attr("fill", colorScheme["imports"])
        .attr("stroke", "none")
        .attr("cx", function (d) { return xAnnual(yearDate(d.time)) })
        .attr("cy", function (d) { return yAnnual(d.imports) })
        .attr("r", 5)

    scene2.selectAll("export-points")
        .data(data)
        .enter()
        .append("circle")
        .attr("fill", colorScheme["exports"])
        .attr("stroke", "none")
        .attr("cx", function (d) { return xAnnual(yearDate(d.time)) })
        .attr("cy", function (d) { return yAnnual(d.exports) })
        .attr("r", 5)


    svg.on("mouseleave", mouseleave);
    */
}


async function drawChart2(svg, data) {

    var exportScale = d3.scaleLinear()
        .domain([0, d3.max(monthlyData, function (d) { return d.exports; })])
        .range([0, width]);


    var colorScale = d3.scaleLinear()
        .domain(d3.extent(monthlyData, function (d) { return monthYear(d.time); }))
        .range(["blue", "orange"]);
    //drawAxes(svg, xMonth, yMonth);
    var scene3 = svg.append("g")
        .attr("class", "scene3")
        .attr("opacity", 0);
    console.log(data);
    scene3.selectAll("path")
        .data(data)
        .filter(function (d) { return d.commodity == "" })
        .enter()
        .append("path")
        .attr("d", importsLine2)
        .attr("class", "line imports")
        .on("mouseover", function (d) { console.log(d); })

    /*
    scene3.selectAll("points")
        .data(data)
        .enter()
        .append("circle")
        .attr("fill", "red")
        .attr("stroke", "none")
        .attr("cx", function (d) { return })
        .attr("cy", function (d) { return yMonthly(d.imports) })
        .attr("r", 5);
    */

}

async function drawBar() {

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/Exports-Imports-China.csv", function (d) {
        return {
            commodity: d.Commodity,
            exports: parseInt(d['Total Exports Value ($US)']),
            imports: parseInt(d['Customs Import Value (Gen) ($US)']),
            balance: parseInt(d['Balance ($US)'])
        }
    });

    // aggregate data by value
    var dataArray = data.reduce(function (obj, value) {
        var key = value.commodity;
        if (obj[key] == null)
            obj[key] = [value];
        obj[key].push(value);
        return obj;
    }, {});

    var commodityData = data.reduce(function (obj, value) {
        var key = value.commodity;
        if (obj[key] == null)
            obj[key] = value;

        obj[key]["imports"] += value["imports"] || 0;
        obj[key]["balance"] += value["balance"] || 0;

        return obj;
    }, {});

    var commodityArray = Object.values(commodityData)
    commodityArray.sort(function (a, b) {
        return d3.ascending(a.balance, b.balance);
    });
    var topDeficits = commodityArray.slice(0, 10);

    var y = d3.scaleLinear()
        .domain([d3.min(commodityArray, function (d) { return d.imports }), d3.max(commodityArray, function (d) { return d.imports; })])
        .range([height, 0]);

    var x = d3.scaleBand()
        .domain(topDeficits.map(function (d) {
            return d.commodity;
        }))
        .range([0, width]);


    var svg = d3.select("#slide2").select("svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x-axis bar")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)) // Create an axis component with d3.axisBottom
        .selectAll("text")
        .attr("y", 20)
        .style("font-size", "small")
        .call(wrap, x.step());

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5, "s")); // Create an axis component with d3.axisLeft

    svg.append("g")
        .selectAll("rect")
        .data(topDeficits)
        .enter()
        .append("rect")
        .attr("class", "imports bar")
        .attr("x", function (d) {
            return x(d.commodity);
        })
        .attr("width", x.step())
        .attr("height", function (d) {
            return height - y(d.imports);
        })
        .attr("y", function (d) {
            return y(d.imports);
        });
}

function createAnnotations() {
    var notes = svg.append("g")
        .attr("class", "annotation");

    annotations.push({
        label: "Financial Recession",
        y: 0,
        x: xAnnual(new Date("12/01/2007")), //position the x based on an x scale
        width: xAnnual(new Date("1/01/2010")) - xAnnual(new Date("12/01/2007")),
        validScenes: [1, 2, 3]
    })

    annotations.push({
        label: "US Trade War with China",
        y: 0,
        x: xAnnual(new Date("01/01/2018")), //position the x based on an x scale
        width: xAnnual(new Date("1/01/2005")),
        validScenes: [2, 3]
    })

    annotateArea(svg, annotations[0]);
    //annotateArea(svg, annotations[1]);
}

function updateChart(chart, selected) {
    //Get current chart and refilter
    var data;

}

// Transitions should hide the previous scene and the scene after
/**
 * Shows scene1
 * Hides scene2
 */
function showScene1() {

    d3.selectAll(".scene1")
        .transition()
        .duration(800)
        .attr("opacity", 1);

    d3.selectAll(".scene2").selectAll(".line.imports")
        .transition()
        .duration(800)
        .attr("opacity", 0)
        .attr('d', balanceLine);

    d3.selectAll(".scene2").selectAll(".line.exports")
        .transition()
        .duration(800)
        .attr("opacity", 0)
        .attr('d', balanceLine);

    d3.selectAll(".scene2")
        .transition()
        .attr("opacity", 0)
        .duration(800)

}
// transition from scene 1 to 2
// hides scene1
// hides scene3
function scene2() {
    d3.selectAll(".scene1")
        .transition()
        .duration(400)
        .attr("opacity", 0);
    d3.selectAll(".scene2").selectAll(".line.imports")
        .transition()
        .duration(800)
        .attr("opacity", 1)
        .attr('d', importsLine);

    d3.selectAll(".scene2").selectAll(".line.exports")
        .transition()
        .duration(800)
        .attr("opacity", 1)
        .attr('d', exportsLine);

    d3.selectAll(".scene2")
        .transition()
        .attr("opacity", 1)
        .duration(800)

    currentScene = 2;
}

function scene3() {
    d3.selectAll(".scene2")
        .transition()
        .attr("opacity", 0)
        .duration(800)
    d3.selectAll(".scene3")
        .transition()
        .attr("opacity", 1)
        .duration(800)
}

