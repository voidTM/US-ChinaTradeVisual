async function overviewLine() {


    var margin = { top: 50, right: 50, bottom: 50, left: 100 }
        , width = window.innerWidth - margin.left - margin.right // Use the window's width 
        , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

    const data = await d3.csv("http://127.0.0.1:5500/USTradeWar/data/test2.csv", function (d) {
        if (d.Country == "China")
            return {
                time : d.Time,
                exports: parseInt(d['Total Exports Value ($US)'].replace(/\,/g, '')),
                imports: parseInt(d['Customs Import Value (Gen) ($US)'].replace(/\,/g, ''))
            }

    });
    console.log(data);

    var monthYear = d3.timeParse("%B %Y") // Parses string into date format

    var xTime = d3.scaleTime()
        //scale time does not seem to undertand the format?
        .domain(d3.extent(data, function (d) { return monthYear(d.time); })) //fail?
        .range([0, width]);

    var x = d3.scaleLinear()
        .domain([0, data.length])
        .range([0, width]);
    

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) { return d.imports; })])
        .range([height, 0]);

    var line = d3.line()
        //.x(function (d, i) { return x(i); }) // set the x values for the line generator basic
        .x(function (d, i){ return xTime(monthYear(d.time));})
        .y(function (d) { return y(d.imports); }) // set the y values for the line generator 

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svg.append("path")
        .data([data]) // 10. Binds data to the line 
        .attr("class", "line") // Assign a class for styling 
        .attr("d", line); // 11. Calls the line generator 

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xTime)); // Create an axis component with d3.axisBottom

    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y)); // Create an axis component with d3.axisLeft

}