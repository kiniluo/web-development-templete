
var w=$(".canvas").width(),
    h=$(".canvas").height(),
    m={top:10,right:10,bottom:10,left:10}
    margin={top:50,right:50,bottom:300,left:30},
    margin2 = {top: 350, right: 50, bottom: 200, left: 30},
    margin3 = {top: 450, right: 50, bottom: 50, left: 30},
    mLegend={top:20,right:50,bottom:500,left:30},    
    mLegend2={top:480,right:50,bottom:300,left:30},     
    width = w - margin.left - margin.right,
    height = h - margin.top - margin.bottom,//main chart
    height2 = h- margin2.top - margin2.bottom,//context chart
    height3 = h - margin3.top - margin3.bottom,//sub chart
    articleWidth=$(".article").width(),
    articleHeight=$(".article").height();   
    


//create SVG and set width and height
var svg = d3.select(".canvas")
            .append("svg")
            .attr("width",w-m.left-m.right)
            .attr("height",h-m.bottom-m.top)
            .attr("transform", "translate(" + m.left + "," + m.top + ")");


var parseDate = d3.timeParse("%b %Y");//for orinigal file
var timeParser= d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");//for series file
var timeFormater=d3.timeFormat("%B %d, %Y");


var bisectDate = d3.bisector(function(d) { return d.date; }).left;

//set up the scale for the coordinates
var x = d3.scaleTime().range([0, width]),  // the x value for the main chart
    x2 = d3.scaleTime().range([0, width]),  // the x value for the contexts1
    x3 = d3.scaleTime().range([0, width]),// the x value for the contexts2
    y = d3.scaleLinear().range([height, 50]), //the y value for the main chart
    y2 = d3.scaleLinear().range([height2, 0]), //the y value for the context1 chart 
    y3 = d3.scaleLinear().range([height3, 0]); //the y value for the context2 chart 
   
//set up the axis
var xAxis = d3.axisBottom(x).ticks(d3.timeWeek),
    xAxis2 = d3.axisBottom(x2).ticks(d3.timeWeek),
    xAxis3 = d3.axisBottom(x3).ticks(d3.timeWeek),
    yAxis = d3.axisRight(y).tickSize(width).ticks(5);


//define the brush, 
var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

//define the zoom
var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

//line chart
var line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.overallInsight); });

var line2=d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.overallPulse); });

var line3=d3.line()
    .x(function(d) { return x2(d.date); })
    .y(function(d) { return y2(d.overallPulse); });

var line4=d3.line()
    .x(function(d) { return x2(d.date); })
    .y(function(d) { return y2(d.overallInsight); });


svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + mLegend.left + ","+ mLegend.top +")");

var legend2 = svg.append("g")
    .attr("class", "legend2")
    .attr("transform", "translate(" + mLegend2.left + ","+ mLegend2.top +")");
 
var main = svg.append("g")
    .attr("class", "main")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

var sub = svg.append("g")
    .attr("class", "sub")
    .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("display","none");

var focus2 = svg.append("g")
    .attr("class", "focus")
    .attr("display","none");

var focus3 = svg.append("g")
    .attr("class", "focus")
    .attr("display","none")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
    
var focus4 = svg.append("g")
    .attr("class", "focus")
    .attr("display","none")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
    

var queue=d3.queue;
	queue()
		.defer(d3.json, 'data/TeslaSeries.json')
		.defer(d3.json, 'data/TeslaArticles.json')
//        .defer(d3.json, 'data/AppleSeries.json')
//		.defer(d3.json, 'data/AppleArticles.json')
		.await(draw);

function draw(error,series,articles){
	if (error) throw error;


console.log(articles)
//construct the article data structure
   //1.construct a new array
   var article=[]
   for (var i=0;i<articles.length;i++){
   	   article.push({
   	   	    "pubDate":timeParser(articles[i].pubDate), //only extract the dat
   	   	    "dateString":timeFormater(timeParser(articles[i].pubDate)),
   	   	    "title":articles[i].title,
   	   	    "sicsSector":articles[i].SICSSector,
   	   	    "sicsIndustry":articles[i].SICSIndustry

   	   })
   }
   console.log("article",article);
   
   //2.nest them up
   nested=d3.nest()
    .key(function(d){return d.dateString})
    .rollup(function(d) { return d.length; })
    .entries(article);
    console.log("nested",nested);


    nested2=d3.nest()
    .key(function(d){return d.dateString})
    .entries(article);
      console.log("nested2",nested2);


//construct new data structure 
    var data=[];
    for (var i=0;i<series.series.length;i++){

    	data.push({
    		"name":"Apple",
    		"date":timeParser(series.series[i].date),
    		"dateString":timeFormater(timeParser(series.series[i].date)),
    		"overallInsight":series.series[i].insight.OverallScore,
    		"overallPulse":series.series[i].pulse.OverallScore,
    		"value":0,
    		"values":{}
    	});
    	
    }
     

    for (var i=0;i<data.length;i++){

    	for (var j=0;j<nested.length;j++){

	    		if (data[i].dateString == nested[j].key){ 
	    		data[i].value = nested[j].value;
		    			
	    	   } 
    	} 			
    }


    for (var i=0;i<data.length;i++){

    	for (var j=0;j<nested2.length;j++){

	    		if (data[i].dateString == nested2[j].key){ 
	    		data[i].values = nested2[j].values;
		    			
	    	   } 
    	} 			
    }
 


 console.log(data)

    
  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([57, 64]);
  x2.domain(x.domain());
  y2.domain([57, 64]);
  x3.domain(x.domain());
  y3.domain([0, 15]);

  

//append first legend  
var legendInsight=legend.append('g')
    legendInsight.append("line")
        .attr("x1", 5)
        .attr("y1", 0)
        .attr("x2", 20)
        .attr("y2", 0)
        .attr("stroke-width", 1)
        .style("stroke-dasharray", ("3, 3"))
        .attr("stroke", "#6053B8");
    legendInsight.append("text")
        .text("Pulse Score")
        .attr("x", 25)
        .attr("y", 0)
        .style("fill","#5C5C5C");
        
    
var legendPulse=legend.append('g');
    legendPulse.append('line')
        .attr("x1", 5)
        .attr("y1", 20)
        .attr("x2", 20)
        .attr("y2", 20)
        .attr("stroke-width", 1)
        .attr("stroke", "#6053B8");  
    legendPulse.append("text")
        .text("Insight Score")
        .attr("x", 25)
        .attr("y", 20)
        .style("fill","#5C5C5C");

var legendVolume=legend2.append("g");
    legendVolume.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 8)
        .attr("fill","#6053B8");
    legendVolume.append("text")
        .text("Article Volumes")
        .attr("x", 15)
        .attr("y", 8)
        .style("fill","#5C5C5C");
    
    
    
        
//append the main chart     
    
    
   main.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("id","line")
      .attr("d", line);
  
   main.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("id","line2")
      .attr("d", line2)
      .style("stroke-dasharray", ("3, 3"));
    
   main.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

   main.append("g")
      .attr("class", "axis axis--y")
      .call(yAxis);
    

    
   $(".domain").remove();    
    
    


  context.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("id","line3")
      .attr("d", line3)
      .style("stroke-dasharray", ("3, 3"));


  context.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("id","line4")
      .attr("d", line4);    

  context.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

  context.append("g")
      .attr("class", "brush")
      .call(d3.brushX().extent([[0, 0], [width, height2]]).on("brush", brushed))
      .call(brush.move, x.range());

  sub.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height3 + ")")
      .call(xAxis3);
  $(".axis--x line").remove();     

  var bandwidth=width/data.length;
    

  sub.selectAll(".bar")
	  	.data(data)
	  	.enter()
	  	.append("rect")
	  	.attr("class", "area")
	  	.attr("x", function(d) { return x3(d.date); })
	    .attr("y", function(d) { return y3(d.value); })
	    .attr("width", bandwidth)
	    .attr("height", function(d) { return height3-y3(d.value); })
	    .on("click",function(d){
            
                d3.selectAll("p").remove();
                d3.selectAll("h2").remove();
                d3.select(".sub").selectAll("#text").remove();
                d3.select(".sub").selectAll("rect").style("fill","#6053B8");
                d3.select(this).style("fill","#A7A3FA");
      
     //append text for volume bars
                d3.select(".sub").append("text")
                  .text(function(){return d.values.length;})
                  .attr("x",function(){return x3(d.date)+bandwidth/3})
                  .attr("y",function(){return y3(d.value)-8})
                  .attr("id","text")
              
      
     //append date to the sidebar
                d3.select(".article")
                  .append('h2')
                  .html(function(){
                    return d.dateString    
                  });
                
     //append the actual article  
                for (var i=0;i<d.values.length;i++){
                      d3.select(".article")
                        .append("p")
                        .html(function(){
                        return d.values[i].title
                        });
                }  
          });
      

    
   svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .on("mouseover", function() { d3.selectAll(".focus").style("display", null); })
      .on("mouseout", function() { d3.selectAll(".focus").style("display", "none"); })
      .on("mousemove", mousemove);
    
     
   focus.append("circle")
           .attr("r", 3)
           .style("stroke","none")

   focus.append("text")
           .attr("x", 9)
           .attr("dy", ".35em");   
    
   focus2.append("circle")
           .attr("r", 3)
           .style("stroke","none");

   focus2.append("text")
           .attr("x", 9)
           .attr("dy", ".35em"); 
    
   focus3.append("circle")
           .attr("r", 2)
           .style("stroke","none");
    
   focus4.append("circle")
           .attr("r", 2)
           .style("stroke","none");
    
//   focus3.append("text")
//           .attr("x", 9)
//           .attr("dy", ".35em"); 
    
    
    
    
   function mousemove() {
    var x0 = x.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    var moveX=x(d.date)+margin.left,
        moveX2=x2(d.date)+margin.left,
        moveY=y(d.overallPulse)+margin.top,
        moveY2=y(d.overallInsight)+margin.top,
        moveY3=y2(d.overallPulse)+margin2.top,
        moveY4=y2(d.overallInsight)+margin2.top;
       
       
       
        focus.attr("transform", "translate(" + moveX + "," + moveY + ")");
        focus.selectAll("circle").style("visibility","visible");
        focus.select("text").text((d.overallPulse).toFixed(2));
       
        focus2.attr("transform", "translate(" + moveX + "," + moveY2 + ")");
        focus2.selectAll("circle").style("visibility","visible");
        focus2.select("text").text((d.overallInsight).toFixed(2));
       
        focus3.attr("transform", "translate(" + moveX2 + "," + moveY3 + ")");
        focus3.selectAll("circle").style("visibility","visible");
       
        focus4.attr("transform", "translate(" + moveX2 + "," + moveY4 + ")");
        focus4.selectAll("circle").style("visibility","visible");
     
       
       
       
  }
    
//  svg.append("rect")
//      .attr("class", "zoom")
//      .attr("width", width)
//      .attr("height", height/3)
//      .attr("transform", "translate(" + margin.left + "," + height/2 + ")")
//      .call(zoom);
//    
    
    
   };




 function brushed() {
   if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
   var s = d3.event.selection || x2.range();
   x.domain(s.map(x2.invert, x2));
   main.select("#line").attr("d", line);
   main.select("#line2").attr("d",line2); 
   main.select(".axis--x").call(xAxis);
   $(".axis--x line").remove(); 
     
   context.select(".zoom").call(zoom.transform, d3.zoomIdentity
       .scale(width / (s[1] - s[0]))
       .translate(-s[0], 0));
 }



function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  main.select("#line").attr("d", line);
  main.select("#line2").attr("d",line2)
  main.select(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  
}






