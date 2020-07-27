async function overviewLine() {


    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Country == "China" && d.Year != 2020)
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

async function clearLines() {
    d3.select(".container").select("svg").selectAll("g").selectAll(".line").remove();
}

async function clearSVG() {
    d3.select(".container").select("svg").remove();
}

async function slide1() {

    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Country == "China" && d.Year != 2020)
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
        .attr("class", "line") // Assign a class for styling 
        .attr("d", balanceLine); // 11. Calls the line generator 
}

async function plotEveryCountry() {
    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Year < 2020)
            return {
                country: d.Country,
                time: d.Time,
                exports: d['Total Exports Value ($US)'],
                imports: d['Customs Import Value (Gen) ($US)'],
                balance: d['Total Exports Value ($US)'] - d['Customs Import Value (Gen) ($US)']
            }
    });

    var monthYear = d3.timeParse("%B %Y") // Parses string into date format

    var xTime = d3.scaleTime()
        //scale time does not seem to undertand the format?
        .domain(d3.extent(data, function (d) { return monthYear(d.time); })) //fail?
        .range([0, width]);

    var x = d3.scaleLog()
        .domain([0, data.length])
        .range([0, width]);

    // splits the data into arrays by country
    var dataArray = data.reduce(function (obj, value) {
        var key = value.country;
        if (obj[key] == null)
            obj[key] = [];
        obj[key].push(value);
        return obj;
    }, {});

    var y = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return d.balance; }), d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var balanceLine = d3.line()
        .x(function (d, i) { return xTime(monthYear(d.time)); })
        .y(function (d) { return y(d.balance); }) // set the y values for the line generator 

    var svg = d3.select(".container").select("svg").append("g");

    svg.selectAll("path")
        .data(dataArray)
        .enter()
        .append("path")
        .attr("class", "line") // Assign a class for styling 
        .attr("d", balanceLine);

    for (countryData in dataArray) {
        svg.append("path")
            .datum(dataArray[countryData]) // 10. Binds data to the line 
            .attr("class", "line exports") // Assign a class for styling 
            .attr("id", countryData)
            .attr("d", balanceLine); // 11. Calls the line generator 

    }
}

async function slide2() {

    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Country == "China" && d.Year != 2020)
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
        .attr("class", "line") // Assign a class for styling 
        .attr("d", balanceLine); // 11. Calls the line generator 

}

async function slide3() {

    await clearLines();

    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/USA-Trade2010-v2.csv", function (d) {
        if (d.Country == "China" && d.Year != 2020)
            return {
                time: d.Time,
                exports: d['Total Exports Value ($US)'],
                imports: d['Customs Import Value (Gen) ($US)'],
                balance: d['Total Exports Value ($US)'] - d['Customs Import Value (Gen) ($US)']
            }

    });
    console.log(data);

    var monthYear = d3.timeParse("%B %Y"); // Parses string into date format

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

    var svg = d3.select(".container").select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line exports") // Assign a class for styling 
        .attr("d", importsLine); // 11. Calls the line generator 

}

async function slide4() {

    await clearSVG();

    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = (width / 2) - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/Exports-Imports-China.csv", function (d) {
        if (d.Year < 2020)
            return {
                commodity: d.Commodity,
                time: d.Time,
                exports: parseInt(d['Total Exports Value ($US)']),
                imports: parseInt(d['Customs Import Value (Gen) ($US)']),
                balance: parseInt(d['Balance ($US)'])
            }

    });
    console.log(data);

    // splits the data into arrays by country
    var dataByCommodity = data.reduce(function (obj, value) {
        var key = value.commodity;
        if (obj[key] == null)
            obj[key] = [];
        obj[key].push(value);
        return obj;
    }, {});

    var monthYear = d3.timeParse("%B %Y"); // Parses string into date format

    var xTime = d3.scaleTime()
        //scale time does not seem to undertand the format?
        .domain(d3.extent(data, function (d) { return monthYear(d.time); })) //fail?
        .range([0, width]);

    var x = d3.scaleLog()
        .domain([0, data.length])
        .range([0, width]);


    var y = d3.scaleLinear()
        .domain([d3.min(data, function (d) { return d.balance; }), d3.max(data, function (d) { return d.balance; })])
        .range([height, 0]);

    var balanceLine = d3.line()
        //.x(function (d, i) { return x(i); }) // set the x values for the line generator basic
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

    /*svg.append("path")
        .data([dataByCommodity["Agricultural Products"]]) // 10. Binds data to the line 
        .attr("class", "line exports") // Assign a class for styling 
        .attr("d", balanceLine); // 11. Calls the line generator */

    
    for (commodity in dataByCommodity) {
        svg.append("path")
            .datum(dataByCommodity[commodity]) // 10. Binds data to the line 
            .attr("class", "line exports") // Assign a class for styling 
            .attr("id", commodity)
            .attr("d", balanceLine); // 11. Calls the line generator 

    }

}