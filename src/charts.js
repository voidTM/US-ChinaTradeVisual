

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
var colorScale = d3.scaleOrdinal()
    .domain(["negative", "positive"])
    .range(d3.schemeSet2)

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

// Dispatch updates
var dispatch = d3.dispatch("statechange");

// misc functions
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


function updateLineChart(chart, data, line) {
    //Get current chart and refilter

    chart.datum(data)
        .transition()
        .duration(1000)
        .attr('d', line);

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
    annualData = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/US-ChinaTrade-Annual.csv", function (d) {
        return {
            commodity: d.Commodity,
            time: yearDate(d.Time),
            exports: parseInt(d['Total Exports Value ($US)']),
            imports: parseInt(d['Customs Import Value (Gen) ($US)']),
            balance: parseInt(d['Balance ($US)']),
            deficit: -parseInt(d['Balance ($US)'])
        }
    });

    yYear = [0, d3.max(annualData, function (d) { return d.imports; })];

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

    // precursor selects
    // Adds event for when state changes
    d3.select("#selectButton")
        .attr("visibility", "hidden")
        .selectAll('commodities')
        .data(commoditiesList)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; })

    // add a dispatch notifiying of change
    d3.select("#selectButton")
        .on("change", function () {
            dispatch.call("statechange", this, this.value);
        });

    dispatch.on("statechange.line", function () {
        console.log(this.value);
    })


    var svg = d3.select(".container").select("svg")
        .append("g")
        .attr("class", "slide-viz") // this classification does nothing atm?
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // draw scene 1

    drawScene1(svg, annualData);
    drawScene2(svg, annualData);
    //drawScene3(svg, monthlyData);
    //drawScene4(svg, monthlyData);
    setScene2();
    //drawChart1(svg, monthlyData);
    //drawChart1(svg, dataArray);
    //drawChart2(svg, dataArray);
}



/**
 * Scenes 1 and 2 take place here
 */

async function drawScene1(svg, data) {
    //Draw line imports

    /**
     * Tooltip functions
     */
    //var overview = data.filter(function (d) { return d.commodity == "All Commodities"; });
    var tooltip = d3.select(".tooltip")
        .style("opacity", 0)

    var filtered = data.filter(function (d) { return d.commodity == "All Commodities"; })
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

    // Set Scales
    xScales.domain(xOverview);
    yScales.domain(yYear);
    drawAxes(scene1, xScales, yScales);


    scene1.append("path")
        .datum(filtered)
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
    */

    // Filter in post?
    // A selection filter
    // d3 filter only operates upon a selection of existing variables.
}


function drawScene2(svg, data){

    var filtered = data.filter(function (d) { return d.commodity == "All Commodities"; })
    // scene 2 data
    var scene2 = svg.append("g")
        .attr("class", "scene2")
        .attr("visibility", "hidden");

    drawAxes(scene2, xScales, yScales);

    scene2.append("path")
        .datum(filtered)
        .attr("class", "line imports")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["imports"]);

    scene2.append("path")
        .datum(filtered)
        .attr("class", "line exports")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["exports"]);

    dispatch.on("statechange.scene2", function (commodity) {
        //checks for right scene
        //if (currScene == 2)

        var s2exports = scene2.select(".line.exports");
        var s2imports = scene2.select(".line.imports");
        var filteredData = annualData.filter(function (d) { return d.commodity == commodity });
        yScales.domain([0, d3.max(filteredData, function (d) { return Math.max(d.imports, d.exports); })]); // out of wack currently
        updateLineChart(s2exports, filteredData, exportsLine);
        updateLineChart(s2imports, filteredData, importsLine);
        updateAxes(scene2, xScales, yScales);
    })

    /*
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


// Transitions should hide the previous scene and the scene after
/**
 * Shows scene1
 * Hides scene2
 */
function setScene1() {

    d3.selectAll(".scene1")
        .transition()
        .duration(800)
        .attr("visibility", "visible");

    // Hide
    d3.selectAll(".scene2").selectAll(".line.imports")
        .transition()
        .duration(800)
        .attr('d', balanceLine);

    d3.selectAll(".scene2").selectAll(".line.exports")
        .transition()
        .duration(800)
        .attr('d', balanceLine);

    d3.selectAll(".scene2")
        .transition()
        .attr("visiblity", "invisible")
        .duration(800);

    d3.select("#selectButton")
        .attr("visiblity", "invisible");

}
// transition from scene 1 to 2
// hides scene1
// hides scene3
function setScene2() {
    d3.selectAll(".scene1")
        .transition()
        .duration(400)
        .attr("visibility", "hidden");

    d3.selectAll(".scene2")
        .transition()
        .attr("visibility", "visible")
        .duration(800);

    d3.selectAll(".scene2").selectAll(".line.imports")
        .transition()
        .duration(800)
        .attr('d', importsLine);

    d3.selectAll(".scene2").selectAll(".line.exports")
        .transition()
        .duration(800)
        .attr("opacity", 1)
        .attr('d', exportsLine);

    d3.select("#selectButton")
        .attr("visiblity", "visible");

    currScene = 2;
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

    d3.selectAll(".scene4")
    .transition()
    .attr("opacity", 0)
    .duration(800)

    currScene = 3;
}

