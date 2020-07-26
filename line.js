async function overviewLine() {


    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Country == "China")
            return {
                time: d.Time,
                exports: d['Total Exports Value ($US)'],
                imports: d['Customs Import Value (Gen) ($US)'],
                balance: d['Total Exports Value ($US)'] - d['Customs Import Value (Gen) ($US)']
            }

    });
    console.log(data);

    var monthYear = d3.timeParse("%B %Y") // Parses string into date format

    var xTime = d3.scaleTime()
        //scale time does not seem to undertand the format?
        .domain(d3.extent(data, function (d) { return monthYear(d.time); })) //fail?
        .range([0, width]);

    var x = d3.scaleLog()
        .domain([0, data.length])
        .range([0, width]);


    var y = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return d.balance; }), d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var importsLine = d3.line()
        //.x(function (d, i) { return x(i); }) // set the x values for the line generator basic
        .x(function (d, i) { return xTime(monthYear(d.time)); })
        .y(function (d) { return y(d.imports); }) // set the y values for the line generator 

    var exportsLine = d3.line()
        .x(function (d, i) { return xTime(monthYear(d.time)); })
        .y(function (d) { return y(d.exports); }) // set the y values for the line generator 

    var balanceLine = d3.line()
        .x(function (d, i) { return xTime(monthYear(d.time)); })
        .y(function (d) { return y(d.balance); }) // set the y values for the line generator 

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xTime)); // Create an axis component with d3.axisBottom

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).ticks(10, "s")); // Create an axis component with d3.axisLeft

    //Draw line imports
    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line exports") // Assign a class for styling 
        .attr("d", importsLine); // 11. Calls the line generator 


    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line imports") // Assign a class for styling 
        .attr("d", exportsLine); // 11. Calls the line generator 

    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", balanceLine); // 11. Calls the line generator 

}

async function slide2() {


    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Country == "China")
            return {
                time: d.Time,
                exports: d['Total Exports Value ($US)'],
                imports: d['Customs Import Value (Gen) ($US)'],
                balance: d['Total Exports Value ($US)'] - d['Customs Import Value (Gen) ($US)']
            }

    });
    console.log(data);

    var monthYear = d3.timeParse("%B %Y") // Parses string into date format

    var xTime = d3.scaleTime()
        //scale time does not seem to undertand the format?
        .domain(d3.extent(data, function (d) { return monthYear(d.time); })) //fail?
        .range([0, width]);

    var x = d3.scaleLog()
        .domain([0, data.length])
        .range([0, width]);


    var y = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return d.balance; }), d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var importsLine = d3.line()
        //.x(function (d, i) { return x(i); }) // set the x values for the line generator basic
        .x(function (d, i) { return xTime(monthYear(d.time)); })
        .y(function (d) { return y(d.imports); }) // set the y values for the line generator 

    var exportsLine = d3.line()
        .x(function (d, i) { return xTime(monthYear(d.time)); })
        .y(function (d) { return y(d.exports); }) // set the y values for the line generator 

    var balanceLine = d3.line()
        .x(function (d, i) { return xTime(monthYear(d.time)); })
        .y(function (d) { return y(d.balance); }) // set the y values for the line generator 

    var svg = d3.select(".container").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xTime)); // Create an axis component with d3.axisBottom

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y).ticks(10, "s")); // Create an axis component with d3.axisLeft

    //Draw line imports
    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line exports") // Assign a class for styling 
        .attr("d", importsLine); // 11. Calls the line generator 


    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line imports") // Assign a class for styling 
        .attr("d", exportsLine); // 11. Calls the line generator 

    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", balanceLine); // 11. Calls the line generator 

}
