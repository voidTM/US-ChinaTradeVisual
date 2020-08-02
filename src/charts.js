

var margin = { top: 50, right: 50, bottom: 50, left: 100 }
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
var currFilter = "All Commodities"; // Current option filter
// Scales
var xScales = d3.scaleTime()
    .range([0, width]);
var yScales = d3.scaleLinear()
    .range([height, 0]);


// domains for scales
var xOverview = [new Date("01/01/2002"), new Date("01/01/2020")];
var yS1;
var yS2;
var yMonth;
var xTrump = [new Date("01/01/2016"), new Date("01/01/2020")];
var yPercent = [0, 1];

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

var verticalLine = d3.line()
    .x(function (d) { return xScales(d[0]); })
    .y(function (d) { return d[1]; })


// Date time format parsers
var yearDate = d3.timeParse("%Y");
var monthYear = d3.timeParse("%B %Y");

// Data from csvs
var annualData;
var monthlyData;
var percentData;



// Dispatch updates
var dispatch = d3.dispatch("statechange", "scenechange");


// misc functions



// wraps text in SVG as needed
function wrap(text, width) {
    text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            x = text.attr("x")
        dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

/**
 * Creates a dotted line for annotations
 */
function annotationLine(svg, x) {

    var data = [
        [x, 0],
        [x, height]]
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", verticalLine);
}


function drawLineAxes(svg, x, y) {

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

//update functions
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

// Fetchs the current scene and updates the title
function updateVizTitle(sceneNumber) {
    var sceneTitles = ["",
        "US Annual Trade Deficit",
        "Annual Imports and Exports by Commodity",
        "Monthly Imports and Exports by Commodity",
        "Imports and Exports Under Trump Presidency"]
    d3.select("#viz-title")
        .html(sceneTitles[sceneNumber]);
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


async function init() {
    // move querying data to here?
    // and make data global
    // Setsup the visualizations

    percentData = await d3.csv(".data/US-ChinaTradeRatio.csv", function (d) {
        return {
            commodity: d.Commodity,
            time: yearDate(d.Time),
            exports: parseFloat(d['Total Exports Value (%)']),
            imports: parseFloat(d['Customs Import Value (Gen) (%)']),
            deficit: parseFloat(d['Balance (%)'])
        }
    });


    // used in Scene 2
    annualData = await d3.csv("./data/US-ChinaTrade-Annual.csv", function (d) {
        return {
            commodity: d.Commodity,
            time: yearDate(d.Time),
            strtime: d.Time,
            exports: parseInt(d['Total Exports Value ($US)']),
            imports: parseInt(d['Customs Import Value (Gen) ($US)']),
            balance: parseInt(d['Balance ($US)']),
            deficit: -parseInt(d['Balance ($US)'])
        }
    });

    yS1 = [0, d3.max(annualData, function (d) { return d.imports; })];
    yS2 = [0, d3.max(annualData, function (d) { return d.imports; })];
    // used in scene 3 and 4
    monthlyData = await d3.csv("./data/US-ChinaTradeV3.csv", function (d) {
        return {
            commodity: d.Commodity,
            time: monthYear(d.Time),
            strtime: d.Time,
            year: d.Year,
            exports: parseInt(d['Total Exports Value ($US)']) || 0,
            imports: parseInt(d['Customs Import Value (Gen) ($US)']) || 0,
            balance: parseInt(d['Balance ($US)']) || 0,
            deficit: -parseInt(d['Balance ($US)']) || 0
        }
    });

    yMonth = [0, d3.max(monthlyData, function (d) { return d.imports; })]

    var d2 = groupBy(monthlyData, "commodity");
    var dataArray = Object.values(d2);
    var commoditiesList = Object.keys(d2);
    //commoditiesList.sort();

    // precursor selects
    // Adds event for when state changes
    d3.select("#selectButton")
        .style("visibility", "hidden")
        .selectAll('commodities')
        .data(commoditiesList)
        .enter()
        .append('option')
        .text(function (d) { return d; }) // text showed in the menu
        .attr("value", function (d) { return d; })

    // add a dispatch notifiying of change
    d3.select("#selectButton")
        .on("change", function () {
            currFilter = this.value;
            dispatch.call("statechange", this, this.value);
        });


    // Test function
    dispatch.on("statechange.line", function () {
        console.log(this.value);
    })

    var svg = d3.select(".container").select("svg")
        .append("g")
        .attr("class", "slide-viz") // this classification does nothing atm?
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('opacity', 0);


    svg.on('mousemove', drawTooltip)
        .on('mouseout', removeTooltip);


    svg.append('path')
        .datum([[0, 0], [0, height]])
        .attr("id", "tooltipLine")
        .attr("d", verticalLine);


    // draw scenes
    drawScene1(svg, percentData);
    drawScene2(svg, annualData);
    drawScene3(svg, monthlyData); // Breakdown by month
    drawScene4(svg, monthlyData);
}



/**
 * Scenes 1 and 2 take place here
 */


function drawScene1(svg, data) {
    var scene1 = svg.append("g")
        .attr("class", "scene1")
        .style("visibility", "visible")
        .style("opacity", 1);

    // Set Scales
    xScales.domain(xOverview);
    yScales.domain(yPercent);

    var xAxes = d3.axisBottom(xScales).ticks(10);
    var yAxes = d3.axisLeft(yScales)
        .tickFormat(function (d) { return (d * 100) + " %" })
        .ticks(10)
        .tickSize(-width);

    var areaBelow = d3.area()
        .x(function (d) { return xScales(d.time); })
        .y0(height)
        .y1(function (d) { return yScales(d.deficit); });

    var areaAbove = d3.area()
        .x(function (d) { return xScales(d.time); })
        .y0(function (d) { return yScales(d.deficit); })
        .y1(0);


    scene1.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", areaAbove)
        .style("fill", "lightsteelblue");

    scene1.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", areaBelow)
        .style("fill", "lightcoral");

    scene1.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxes); // Create an axis component with d3.axisBottom

    scene1.append("g")
        .attr("class", "y-axis")
        .call(yAxes); // Create an axis component with d3.axisLeft


    scene1.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", balanceLine)
        .style("stroke", colorScheme["imports"])
        .style("stroke-width", 2);

    //add annotations for Scene1

    var annotations = scene1
        .append("g")
        .attr("class", "annotations");


    annotations.append("text")
        .attr("x", 700)
        .attr("y", height - 50)
        .attr("dy", 1)
        .text("China")
        .style("font-size", 40);

    annotations.append("text")
        .attr("x", 10)
        .attr("y", 75)
        .attr("dy", 1)
        .text("Other Countries")
        .style("font-size", 40);

    annotationLine(annotations, new Date("12/01/2007"));
    annotations.append("text")
        .attr("x", xScales(new Date("12/01/2007")))
        .attr("y", -35)
        .attr("dy", 0)
        .text("Recession Start")
        .style("font-size", 14)
        .call(wrap, 50);

    annotationLine(annotations, new Date("06/01/2009"));
    annotations.append("text")
        .attr("x", xScales(new Date("06/01/2009")))
        .attr("y", -35)
        .attr("dy", 0)
        .text("Recession End")
        .style("font-size", 14)
        .call(wrap, 50);

}


function drawScene2(svg, data) {

    var filtered = data.filter(function (d) { return d.commodity == "All Commodities"; })
    // scene 2 data
    var scene2 = svg.append("g")
        .attr("class", "scene2")
        .style("visibility", "hidden")
        .style("opacity", 0);

    xScales.domain(xOverview);
    yScales.domain(yS2);
    drawLineAxes(scene2, xScales, yScales);

    // Add annotations
    var annotations = scene2
        .append("g")
        .attr("class", "annotations");

    annotationLine(annotations, new Date("12/01/2007"));
    annotations.append("text")
        .attr("x", xScales(new Date("12/01/2007")))
        .attr("y", -35)
        .attr("dy", 0)
        .text("Recession Start")
        .style("font-size", 14)
        .call(wrap, 50);

    annotationLine(annotations, new Date("06/01/2009"));
    annotations.append("text")
        .attr("x", xScales(new Date("06/01/2009")))
        .attr("y", -35)
        .attr("dy", 0)
        .text("Recession End")
        .style("font-size", 14)
        .call(wrap, 50);

    annotationLine(annotations, new Date("01/01/2018"));
    annotations.append("text")
        .attr("x", 5 + xScales(new Date("01/01/2018")))
        .attr("y", -40)
        .attr("dy", 0)
        .text("Trade Deficit with China Reaches $419 billion")
        .style("font-size", 14)
        .call(wrap, 100);

    // draw lines
    scene2.append("path")
        .datum(filtered)
        .attr("class", "line imports")
        .attr("d", importsLine)
        .attr("stroke", colorScheme["imports"]);

    scene2.append("path")
        .datum(filtered)
        .attr("class", "line exports")
        .attr("d", exportsLine)
        .attr("stroke", colorScheme["exports"]);

    dispatch.on("statechange.scene2", function (commodity) {
        //checks for right scene

        var s2exports = scene2.select(".line.exports");
        var s2imports = scene2.select(".line.imports");
        var filteredData = annualData.filter(function (d) { return d.commodity == commodity });
        xScales.domain(xOverview);
        yS2 = [0, d3.max(filteredData, function (d) { return Math.max(d.imports, d.exports); })]
        yScales.domain(yS2); // out of wack currently
        updateAxes(scene2, xScales, yScales);
        updateLineChart(s2exports, filteredData, exportsLine);
        updateLineChart(s2imports, filteredData, importsLine);

    })


}


function drawScene3(svg, data) {
    var scene3 = svg.append("g")
        .attr("class", "scene3")
        .style("visibility", "hidden")
        .style("opacity", 0);

    xScales.domain(xOverview);
    yScales.domain(yMonth);

    var filtered = data.filter(function (d) {
        return (d.commodity == "All Commodities");
    })

    drawLineAxes(scene3, xScales, yScales)

    // Add annotations
    var annotations = scene3
        .append("g")
        .attr("class", "annotations");

    annotationLine(annotations, new Date("12/01/2007"));
    annotations.append("text")
        .attr("x", xScales(new Date("12/01/2007")))
        .attr("y", -35)
        .attr("dy", 0)
        .text("Recession Start")
        .style("font-size", 14)
        .call(wrap, 50);

    annotationLine(annotations, new Date("06/01/2009"));
    annotations.append("text")
        .attr("x", xScales(new Date("06/01/2009")))
        .attr("y", -35)
        .attr("dy", 0)
        .text("Recession End")
        .style("font-size", 14)
        .call(wrap, 50);

    annotationLine(annotations, new Date("01/01/2018"));
    annotations.append("text")
        .attr("x", xScales(new Date("01/01/2018")))
        .attr("y", -35)
        .attr("dy", 0)
        .text("Start of Trade War")
        .style("font-size", 14)
        .call(wrap, 50);


    scene3.append("path")
        .datum(filtered)
        .attr("d", importsLine)
        .attr("class", "line imports")
        .attr("stroke", colorScheme["imports"])
        .on("mouseover", function (d) { console.log(d); })

    scene3.append("path")
        .datum(filtered)
        .attr("class", "line exports")
        .attr("d", exportsLine)
        .attr("stroke", colorScheme["exports"]);

    dispatch.on("statechange.scene3", function (commodity) {

        var s3exports = scene3.select(".line.exports");
        var s3imports = scene3.select(".line.imports");
        var filteredData = monthlyData.filter(function (d) {
            return (d.commodity == commodity);
        });

        xScales.domain(xOverview);
        yMonth = [0, d3.max(filteredData, function (d) { return Math.max(d.imports, d.exports); })]
        yScales.domain([0, d3.max(filteredData, function (d) { return Math.max(d.imports, d.exports); })]); // out of wack currently
        updateAxes(scene3, xScales, yScales);
        updateLineChart(s3exports, filteredData, exportsLine);
        updateLineChart(s3imports, filteredData, importsLine);

    })


}


function drawScene4(svg, data) {
    var scene4 = svg.append("g")
        .attr("class", "scene4")
        .style("visibility", "hidden")
        .style("opacity", 0);

    xScales.domain(xTrump);
    yScales.domain(yMonth);
    // By Default draw all commodities
    var filtered = data.filter(function (d) {
        return (d.commodity == "All Commodities") && (d.year > 2015);
    })

    drawLineAxes(scene4, xScales, yScales)

    // Add annotations
    var annotations = scene4
        .append("g")
        .attr("class", "annotations");

    annotationLine(annotations, new Date("01/22/2018"));
    annotations.append("text")
        .attr("x", xScales(new Date("01/22/2018")))
        .attr("y", -20)
        .attr("dy", 0)
        .text("Trade War Start")
        .style("font-size", 14)
        .call(wrap, 75);

    annotationLine(annotations, new Date("9/24/2018"));
    annotations.append("text")
        .attr("x", xScales(new Date("9/24/2018")))
        .attr("y", -20)
        .attr("dy", 0)
        .text("US Imposed $200 bn in tariffs")
        .style("font-size", 14)
        .call(wrap, 75);

    annotationLine(annotations, new Date("05/15/2019"));
    annotations.append("text")
        .attr("x", xScales(new Date("05/15/2019")))
        .attr("y", -20)
        .attr("dy", 0)
        .text("Huawei Banned")
        .style("font-size", 14)
        .call(wrap, 75);

    scene4.append("path")
        .datum(filtered)
        .attr("d", importsLine)
        .attr("class", "line imports")
        .attr("stroke", colorScheme["imports"])
        .on("mouseover", function (d) { console.log(d); })

    scene4.append("path")
        .datum(filtered)
        .attr("class", "line exports")
        .attr("d", exportsLine)
        .attr("stroke", colorScheme["exports"]);

    dispatch.on("statechange.scene4", function (commodity) {

        var s4exports = scene4.select(".line.exports");
        var s4imports = scene4.select(".line.imports");
        var filteredData = monthlyData.filter(function (d) {
            return (d.commodity == commodity) && (d.year > 2015);
        });
        xScales.domain(xTrump);
        yScales.domain([0, d3.max(filteredData, function (d) { return Math.max(d.imports, d.exports); })]); // out of wack currently
        updateAxes(scene4, xScales, yScales);
        updateLineChart(s4exports, filteredData, exportsLine);
        updateLineChart(s4imports, filteredData, importsLine);

    })


}

// Tooltip functionality

function removeTooltip() {
    var tooltip = d3.select('#tooltip');
    var tooltipLine = d3.select("#tooltipLine");

    if (tooltip) tooltip.style('display', 'none');
    if (tooltipLine) tooltipLine.style('stroke', 'none');
}

function drawTooltip() {

    if (currScene == 1) {
        return;
    }

    var tooltip = d3.select('#tooltip');
    var tooltipLine = d3.select("#tooltipLine");

    var xDate = xScales.invert(d3.mouse(this)[0]);

    //move to nearest date point
    var m = xDate.getMonth();
    var y = xDate.getFullYear();
    var x = new Date(y, m, 1);

    var dataset = monthlyData.filter(function (d) {
        return (d.commodity == currFilter && xScales(x) == xScales(d.time));
    });

    if (currScene == 2) {
        x = new Date(y, 0, 1);
        dataset = annualData.filter(function (d) {
            return (d.commodity == currFilter && xScales(x) == xScales(d.time));
        });
    }

    var lineData = [
        [x, 0],
        [x, height]];


    tooltipLine.style('stroke', 'black')
        .datum(lineData)
        .attr("d", verticalLine);

    tooltip
        .style('display', 'block')
        .style('left', d3.event.pageX + 1 + "px")
        .style('top', d3.event.pageY - 1 + "px")
        .data(dataset)
        .html(d => d.strtime + "<br> imports: $" + d.imports + "<br> exports: $" + d.exports);
}




// Transitions should hide the previous scene and the scene after
/**
 * Shows scene1
 * Hides scene2
 */
function setScene1() {
    // swap scales
    xScales.domain(xOverview);
    yScales.domain(yS1);

    // Swap sidebar text

    d3.selectAll(".slide-info")
        .attr("class", "slide-info inactive");

    d3.select("#slide1-1")
        .attr("class", "slide-info");

    d3.select("#slide1-2")
        .attr("class", "slide-info");


    d3.selectAll(".scene1")
        .transition()
        .duration(400)
        .style("visibility", "visible")
        .style("opacity", 1);

    d3.selectAll(".scene2")
        .transition()
        .duration(800)
        .style("opacity", 0) //fade out animation
        .transition()
        .style("visibility", "hidden");

    d3.select("#selectButton")
        .style("visibility", "hidden");

    d3.select("#backButton")
        .attr("disabled", true);


}

// transition from scene 1 to 2
// hides scene1
// hides scene3
function setScene2() {

    // swap scales
    xScales.domain(xOverview);
    yScales.domain(yS2); // number too large for individual products

    d3.selectAll(".slide-info")
        .attr("class", "slide-info inactive");

    d3.selectAll("#slide2-1")
        .attr("class", "slide-info");

    d3.selectAll("#slide2-2")
        .attr("class", "slide-info");

    d3.selectAll(".scene1")
        .transition()
        .duration(800)
        .style("opacity", 0)
        .transition()
        .style("visibility", "hidden");

    d3.selectAll(".scene3")
        .transition()
        .duration(800)
        .style("opacity", 0)
        .transition()
        .style("visibility", "hidden");


    d3.selectAll(".scene2")
        .transition()
        .style("visibility", "visible")
        .transition()
        .style("opacity", 1)
        .duration(800);


    d3.selectAll(".scene2").selectAll(".line.imports")
        .transition()
        .duration(800)
        .attr('d', importsLine);

    d3.selectAll(".scene2").selectAll(".line.exports")
        .transition()
        .duration(800)
        .attr('d', exportsLine);



    d3.select("#selectButton")
        .style("visibility", "visible");

}

/**
 * Show: Scene 3
 * Hides Scene 2, Scene 4
 * Scene 3 should be from 2002-2020 showing monthly data
 */
function setScene3() {
    // Set Scales
    xScales.domain(xOverview);
    yScales.domain(yMonth);

    d3.selectAll(".slide-info")
        .attr("class", "slide-info inactive")

    d3.selectAll("#slide3-1")
        .attr("class", "slide-info")

    d3.selectAll("#slide3-2")
        .attr("class", "slide-info")

    // hide previous scenes
    d3.selectAll(".scene2")
        .transition()
        .duration(800)
        .style("opacity", 0)
        .transition()
        .style("visibility", "hidden");

    d3.selectAll(".scene4")
        .transition()
        .duration(800)
        .style("opacity", 0)
        .transition()
        .style("visibility", "hidden");


    d3.selectAll(".scene3")
        .transition()
        .style("visibility", "visible")
        .transition()
        .duration(800)
        .style("opacity", 1);

    d3.selectAll(".scene3").selectAll(".line.imports")
        .transition()
        .duration(800)
        .attr('d', importsLine);

    d3.selectAll(".scene3").selectAll(".line.exports")
        .transition()
        .duration(800)
        .attr('d', exportsLine);

}

/**
 * Show: Scene 4
 * Hides Scene 3
 * Scene 4 should be from 2016-2020 showing monthly data
 */
function setScene4() {
    xScales.domain(xTrump);
    yScales.domain(yMonth);

    d3.selectAll(".slide-info")
        .attr("class", "slide-info inactive")

    d3.selectAll("#slide4-1")
        .attr("class", "slide-info")

    d3.selectAll(".scene3")
        .transition()
        .duration(800)
        .style("opacity", 0)
        .transition()
        .style("visibility", "hidden");

    //Scene 3 transition hide


    d3.selectAll(".scene4")
        .transition()
        .duration(800)
        .style("opacity", 1)
        .transition()
        .style("visibility", "visible");

}

//Get the next scenes number then call the necessary functions to set that scene
function changeScene(move) {
    var s = {
        1: setScene1,
        2: setScene2,
        3: setScene3,
        4: setScene4,
    }

    // update current scene and make sure theres no out of bounds
    currScene = (currScene + move + 5) % 5;

    updateVizTitle(currScene);

    //update buttons

    if (currScene == 1) {
        d3.select("#backButton")
            .attr("disabled", true);
    } else if (currScene == 4) {
        d3.select("#nextButton")
            .attr("disabled", true);
    } else {
        d3.select("#backButton")
            .attr("disabled", null);
        d3.select("#nextButton")
            .attr("disabled", null);

    }

    // Call the appropriate scene change function
    s[currScene]();
}
