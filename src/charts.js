

var margin = { top: 50, right: 50, bottom: 50, left: 100 }
    ,width = 700 - margin.right - margin.left
    ,height = 500 - margin.top - margin.bottom;
// Date time format parsers
var yearDate = d3.timeParse("%Y");
var monthYear = d3.timeParse("%B %Y");

var csvData;

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


function drawAxes(svg, xAxes, yAxes) {

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxes)); // Create an axis component with d3.axisBottom

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yAxes).tickFormat(function (d) { return d / 1000000 + "M" })); // Create an axis component with d3.axisLeft

}


async function init() {
    // move querying data to here?
    // and make data global
    drawChart1();
    drawChart2();
}

async function drawChart1() {
    var width = document.getElementById("slide1").offsetWidth - margin.left - margin.right // Use the window's width 
    var height = 500 - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/Exports-Imports-China-Year.csv", function (d) {
        if (d.Time < 2019)
            return {
                time: d.Time,
                exports: parseInt(d['Total Exports Value ($US)']),
                imports: parseInt(d['Customs Import Value (Gen) ($US)']),
                balance: Math.abs(parseInt(d['Balance ($US)']))
            }

    });


    var yearDate = d3.timeParse("%Y")
    var xTime = d3.scaleTime()
        //scale time does not seem to undertand the format?
        .domain(d3.extent(data, function (d) { return yearDate(d.time); })) //fail?
        .range([0, width]);


    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var balanceLine = d3.line()
        .x(function (d) { return xTime(yearDate(d.time)); })
        .y(function (d) { return y(d.balance) })

    var importsLine = d3.line()
        .x(function (d, i) { return xTime(yearDate(d.time)); })
        .y(function (d) { return y(d.imports); }) // set the y values for the line generator 

    var exportsLine = d3.line()
        .x(function (d, i) { return xTime(yearDate(d.time)); })
        .y(function (d) { return y(d.exports); }) // set the y values for the line generator 

    var svg = d3.select("#slide1").select("svg")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    drawAxes(svg, xTime, y);
    //Draw line imports

    svg.append("g")
        .append("path")
        .datum(data) // 10. Binds data to the line 
        .attr("class", "balance line") // Assign a class for styling 
        .attr("d", balanceLine); // 11. Calls the line generator 

    svg.append("g")
        .append("path")
        .datum(data) // 10. Binds data to the line 
        .attr("opacity", 0)
        .attr("class", "imports line") // Assign a class for styling 
        .attr("d", importsLine); // 11. Calls the line generator 

    svg.append("g")
        .append("path")
        .datum(data) // 10. Binds data to the line 
        .attr("class", "exports line") // Assign a class for styling 
        .attr("opacity", 0)
        .attr("d", exportsLine); // 11. Calls the line generator 


    //drawZeroLine();

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