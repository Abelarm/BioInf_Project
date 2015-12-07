function draw(){
    var width =  window.innerWidth,
        height = window.innerHeight;

    console.log(width+" "+height)

    var nodes = [
        { name: "Nano", x:   width/3, y: height/3 , Ncolor:"pink"},
        { name: "Chem", x: 2*width/3, y: height/3 , Ncolor:"aquamarine"},
        { name: "Pharm", x: 2*width/3, y: 2*height/3, Ncolor:"greenyellow"},
        { name: "Dis", x: width/3, y: 2*height/3, Ncolor:"yellow"}
    ];

    var links = [
        { source: 0, target: 1 },
        { source: 0, target: 2 },
        { source: 0, target: 3 },
        { source: 1, target: 2 },
        { source: 1, target: 3 },
        { source: 2, target: 3 }
    ];

    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);


    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .links(links);


    force.linkDistance(width/2);

    var link = svg.selectAll('.link')
        .data(links)
        .enter().append('line')
        .attr('class', 'link');

    var gnodes = svg.selectAll('g.gnode')
      .data(nodes)
      .enter()
      .append('g')
      .classed('gnode', true);

    gnodes.on('mouseover',function(d){

        var g = d3.select(this);
          var info = g.append('text')
            .attr("dy", "-1.50em")
            .attr("dx","1.75em")
            .text(function(d) { return d.name; })
            .style("fill",function(d) { return d3.rgb(d.Ncolor); });

        d3.select(this).select("text")
        .attr("x", function (d) {
            return d.x;
        })
            .attr("y", function (d) {
            return d.y;
        });

    });

    gnodes.on("mouseout", function() {
          // Remove the info text on mouse out.
          d3.select(this).select('text').remove();
      });

    // Add one circle in each group
    var node = gnodes.append("circle")
      .attr("class", "node")
      .style("fill", function(d) { 
            console.log(d.Ncolor);
            return d3.rgb(d.Ncolor); })
      .attr('class', 'node');

    force.on('end', function() {

        node.attr('r', width/35)
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; });

        link.attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

    });


    force.start();
    force.stop();
}
