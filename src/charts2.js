

var margin = { top: 10, right: 50, bottom: 50, left: 100 }
    , width = 1000 - margin.right - margin.left
    , height = 500 - margin.top - margin.bottom;

const colorScheme = {
    imports: "rgb(223, 63, 63)",
    balance: "blueviolet",
    deficit: "blueviolet",
    exports: "green"
}

var currentScene = 1;

// Scales
var xTime;
var y;

var balanceLine = d3.line()
    .x(function (d) { return xTime(yearDate(d.time)); })
    .y(function (d) { return y(d.deficit) })

var importsLine = d3.line()
    .x(function (d, i) { return xTime(yearDate(d.time)); })
    .y(function (d) { return y(d.imports); }) // set the y values for the line generator 

var exportsLine = d3.line()
    .x(function (d, i) { return xTime(yearDate(d.time)); })
    .y(function (d) { return y(d.exports); }) // set the y values for the line generator 

// Date time format parsers
var yearDate = d3.timeParse("%Y");
var monthYear = d3.timeParse("%B %Y");

// Data from csvs
var csvData;
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

function drawLine(path, line, color) {

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
    drawChart1();
    drawChart2();
}

async function drawChart1() {
    //var width = document.getElementById("slide1").offsetWidth - margin.left - margin.right // Use the window's width 

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/Exports-Imports-China-Year.csv", function (d) {
        if (d.Time < 2020)
            return {
                time: d.Time,
                exports: parseInt(d['Total Exports Value ($US)']),
                imports: parseInt(d['Customs Import Value (Gen) ($US)']),
                deficit: -parseInt(d['Balance ($US)'])
            }

    });

    csvData = data;

    var yearDate = d3.timeParse("%Y")
    xTime = d3.scaleTime()
        //scale time does not seem to undertand the format?
        .domain(d3.extent(data, function (d) { return yearDate(d.time); })) //fail?
        .range([0, width]);


    y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var balanceLine = d3.line()
        .x(function (d) { return xTime(yearDate(d.time)); })
        .y(function (d) { return y(d.deficit) })

    var importsLine = d3.line()
        .x(function (d, i) { return xTime(yearDate(d.time)); })
        .y(function (d) { return y(d.imports); }) // set the y values for the line generator 

    var exportsLine = d3.line()
        .x(function (d, i) { return xTime(yearDate(d.time)); })
        .y(function (d) { return y(d.exports); }) // set the y values for the line generator 

    var svg = d3.select(".container").select("svg")
        .append("g")
        .attr("class", "slide-viz")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    drawAxes(svg, xTime, y);
    //Draw line imports

    svg.append("g")
        .attr("class", "scene1")
        .attr("opacity", 1)
        .append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["deficit"]);

    svg.append("g")
        .attr("class", "scene2")
        .attr("opacity", 0)
        .append("path")
        .datum(data)
        .attr("class", "line imports")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["imports"]);

    svg.append("g")
        .attr("class", "scene2")
        .attr("opacity", 0)
        .append("path")
        .datum(data)
        .attr("class", "line exports")
        .attr("d", balanceLine)
        .attr("stroke", colorScheme["exports"]);

    //draw 2018+ fade annotation

    /**
     * Attempt at annotations
     */

    var notes = svg.append("g")
        .attr("class", "annotation");

    annotations.push({
        label: "Financial Recession",
        y: 0,
        x: xTime(new Date("12/01/2007")), //position the x based on an x scale
        width: xTime(new Date("1/01/2010")) - xTime(new Date("12/01/2007")),
        validScenes: [1, 2, 3]
    })

    annotations.push({
        label: "US Trade War with China",
        y: 0,
        x: xTime(new Date("01/01/2018")), //position the x based on an x scale
        width: xTime(new Date("1/01/2005")),
        validScenes: [1, 2, 3]
    })

    annotateArea(svg, annotations[0]);
    annotateArea(svg, annotations[1]);
    /*
    notes.append("rect")
        .attr("class", "rect")
        .attr("x", function (d) {
            return xTime(new Date(2008, 0));
        })
        .attr("y", 0)
        .attr("width", function (d) {
            return xTime(new Date(2005, 0)); // 3 years
        })
        .attr("height", height);

    notes.append("text")
        .attr("x", function (d) {
            return xTime(new Date(2008, 0));
        })
        .attr("y", 0)
        .attr("width", function (d) {
            return xTime(new Date(2005, 0)); // 3 years
        })
        .text("Economic Recession");
    */

}


// transition from scene 1 to 2
// Transitions should hide the previous scene and the scene after
function scene3() {
    d3.selectAll(".scene1")
        .transition()
        .duration(100)
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
        .duration(0)

    currentScene = 3;
}



async function drawChart2() {

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/Exports-Imports-China.csv", function (d) {
        if (d.Year == 2018)
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