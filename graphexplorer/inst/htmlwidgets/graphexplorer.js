HTMLWidgets.widget({

  name: "graphexplorer",

  type: "output",


  initialize: function(el, width, height) {

    d3.select(el).append("svg")
        .attr("width", width)
        .attr("height", height);
        
    var opts = {lines: 13 // The number of lines to draw
              , length: 28 // The length of each line
              , width: 14 // The line thickness
              , radius: 42 // The radius of the inner circle
              , scale: 1 // Scales overall size of the spinner
              , corners: 1 // Corner roundness (0..1)
              , color: '#000' // #rgb or #rrggbb or array of colors
              , opacity: 0.25 // Opacity of the lines
              , rotate: 0 // The rotation offset
              , direction: 1 // 1: clockwise, -1: counterclockwise
              , speed: 1 // Rounds per second
              , trail: 60 // Afterglow percentage
              , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
              , zIndex: 2e9 // The z-index (defaults to 2000000000)
              , className: 'spinner' // The CSS class to assign to the spinner
              , top: '50%' // Top position relative to parent
              , left: '50%' // Left position relative to parent
              , shadow: false // Whether to render a shadow
              , hwaccel: false // Whether to use hardware acceleration
              , position: 'absolute' // Element positioning
              }
              
    var target = el;
    spinner = new Spinner(opts).spin(target);

    return d3.layout.force();
  },

  resize: function(el, width, height, force) {

    d3.select(el).select("svg")
        .attr("width", width)
        .attr("height", height);

    force.size([width, height]).resume();
  },

  renderValue: function(el, x, force) {
  
    var options = x.options;
    
    //alert(JSON.stringify(options));

    // convert links and nodes data frames to d3 friendly format
    var imported_links = HTMLWidgets.dataframeToD3(x.links);
    var imported_nodes = HTMLWidgets.dataframeToD3(x.nodes);
    
    spinner.stop();
    
    //alert("links: " + JSON.stringify(imported_links));
    //alert("nodes: " + JSON.stringify(imported_nodes));

    // get the width and height
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    var maxdim = 20;
    var defaultdim = 5;
    var stroke_width = 2;
    var padding = 2;

    var force = force;

    var color = eval(options.colourScale);
    //alert(JSON.stringify(color));

    var oldsvg = d3.select(el).select("svg");    

    var link,node,gnodes;
    var openedNode = {};
    var numChem=0,numDrug=0,numDise=0;

    graph = JSON.parse('{"nodes":[], "links":[]}');
    
    var nodeNano = JSON.parse('{"name":"nano","group":1}');
    var nodeDise = JSON.parse('{"name":"dise","group":2}');
    var nodeDrug = JSON.parse('{"name":"drugs","group":3}');
    var nodeChem = JSON.parse('{"name":"chem","group":4}');
    
    var link1 = JSON.parse('{"source": 0, "target":1, "value":1}');
    var link2 = JSON.parse('{"source": 0, "target":2, "value":1}');
    var link3 = JSON.parse('{"source": 0, "target":3, "value":1}');
    var link4 = JSON.parse('{"source": 1, "target":2, "value":1}');
    var link5 = JSON.parse('{"source": 1, "target":3, "value":1}');
    var link6 = JSON.parse('{"source": 2, "target":3, "value":1}');
    
    graph.nodes.push(nodeNano);
    graph.nodes.push(nodeDise);
    graph.nodes.push(nodeDrug);
    graph.nodes.push(nodeChem);
    
    graph.links.push(link1);
    graph.links.push(link2);
    graph.links.push(link3);
    graph.links.push(link4);
    graph.links.push(link5);
    graph.links.push(link6);
    // alert(numDrug);
    // alert(numChem);
    // alert(numDise);
    //alert(nodi);
    //alert(linki);
    
    //END DATA PARSING
    
    

    //graph.nodes = nodi;
    //graph.links = linki;
    
    //alert("graph.links " + JSON.stringify(graph.links));
    //alert("graph.nodes " + JSON.stringify(graph.nodes));
    
    //BEGIN RENDERING
    
    var zoom = d3.behavior.zoom();

    
    force
      .nodes(graph.nodes)
      .links(graph.links)
      .charge(options.charge)
      .linkDistance(options.linkDistance)
      .friction(0.95)
      .size([width, height])
      .on("tick", tickfunction)
      .on("end", endfunction)
      .start();
      
    var drag = force.drag()
        .on("dragstart", dragstart)
      // allow force drag to work with pan/zoom drag
      function dragstart(d) {
        d3.event.sourceEvent.preventDefault();
        d3.event.sourceEvent.stopPropagation();
      }
      
    var svg = oldsvg
       .append("g").attr("class","zoom-layer")
       .append("g") 
      
     // select the svg element and remove existing children
    svg.selectAll("*").remove();
      
 
    // add zooming if requested
    if (options.zoom) {
      function redraw() {
        d3.select(el).select(".zoom-layer").attr("transform",
          "translate(" + d3.event.translate + ")"+
          " scale(" + d3.event.scale + ")");
      }
      
      zoom.on("zoom", redraw);
      d3.select(el).select("svg")
      .attr("pointer-events", "all")
      .call(zoom);
    }
    else {
      zoom.on("zoom", null);
    }

    //draw links
    link = svg.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("class", "link")
        .on("mouseover", function(d) {
            d3.select(this)
              .style("opacity", options.opacity);
        })
        .on("mouseout", function(d) {
            d3.select(this)
              .style("opacity", options.opacity/2);
        })
        .style("opacity",options.opacity/2)
        .style("stroke-width", function(d) { return Math.abs(d.value); })
        .style("stroke",function(d){
          if(d.value>0){
            return "#008000";
          }else{
            return "#FF0000";
          }
        });

    //draw nodes
    gnodes = svg.selectAll('g.gnode')
            .data(graph.nodes)
            .enter()
            .append('g')
            .classed('gnode', true)
            .on("mouseover",mouseover)
            .on("mouseout",mouseout)
            .style("stroke",'#fff')
            .style("stroke-width", "1.5px");


    node = gnodes
        .append("circle")
        .attr("class","node")
        .attr("r", defaultdim)
        .style("fill", function(d) { return color(d.group); })
        .attr("group", function(d){return d.group;})
        .on("click", function(d){
          //alert("Ho cliccato " + d.name);
          if (! (d.name in openedNode)){
                  openedNode[d.name] = [];
                  addNodes(d);
                  return;
          }
          else{
            //alert("going to remove");
            removeNodes(d);
            return;
          }
        })
        .style("stroke", '#fff')
        .style("stroke-width", 1);
        
    // add legend option
    if(options.legend){
        var legendRectSize = 18;
        var legendSpacing = 4;
        var legend = oldsvg.selectAll('.legend')
          .data(color.domain())
          .enter()
          .append('g')
          .attr('class', 'legend')
          .attr('transform', function(d, i) {
            var height = legendRectSize + legendSpacing;
            var offset =  height * color.domain().length / 2;
            var horz = legendRectSize;
            var vert = i * height+4;
            return 'translate(' + horz + ',' + vert + ')';
          });

        legend.append('rect')
          .attr('width', legendRectSize)
          .attr('height', legendRectSize)
          .style('fill', color)
          .style('stroke', color);

        legend.append('text')
          .attr('x', legendRectSize + legendSpacing)
          .attr('y', legendRectSize - legendSpacing)
          .text(function(d) {
           switch(d){
             case 1:
                return "Nano";
                break;
             case 2:
                return "Disease";
                break;
             case 3:
                return "Pharmaceutical";
                break;
             case 4:
                return "Chemical";
                break;
           }
           });
    }
        

    //alert(gnodes);
    //alert(node);
    
    //END RENDER, SUPPORT FUNCTIONS HERE
     
    function tickfunction() {
      //alert("entro");
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      
      node
          .style("fill", function(d) { 
            return color(d.group); 
          })
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

      node.each(collide(0.5));
        
    }

    function endfunction(){

      try{
        link.exit().remove();
        gnodes.exit().remove();
      }catch(err){
        console.warn(err);
      }

      node
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

    }
       
    function addNodes(d){ 
      if(!(d.name in openedNode)){
        openedNode[d.name] = [];
      }
      //alert("Numero di nodi prima l'add: " + graph.nodes.length);
      //alert("Numero di archi prima l'add" + graph.links.length);
      //probabilmente va portata fuori
      alreadyAddedNodes = {};
      for(i = 0; i < imported_links.length; i++){
        ln = imported_links[i];
        oldsource = imported_nodes[ln.source];
        oldtarget = imported_nodes[ln.target];
        //alert("oldsource.name = " + oldsource.name + "oldsource.group = " + oldsource.group + "oldtarget.name = " + oldtarget.name + " oldtarget.group = " + oldtarget.group);
        if(oldsource.group == d.group && oldtarget.group == d.group){
          //alert("dentro!")
          //arco con due nodi da aggiungere
          if(!(oldsource.name in alreadyAddedNodes)){
            source = JSON.parse(JSON.stringify(oldsource));
            graph.nodes.push(source);
            alreadyAddedNodes[oldsource.name] = graph.nodes.indexOf(source);
          }
          if(!(oldtarget.name in alreadyAddedNodes)){
            target = JSON.parse(JSON.stringify(oldtarget));
            graph.nodes.push(target);
            alreadyAddedNodes[oldtarget.name] = graph.nodes.indexOf(target);
          }
          addLn = JSON.parse(JSON.stringify(ln));
          addLn.source = alreadyAddedNodes[oldsource.name];
          addLn.target = alreadyAddedNodes[oldtarget.name];
          graph.links.push(addLn);
          openedNode[d.name].push(addLn);
        }
      }
      //alert("Finito di scorrere gli archi");  
      //alert("Numero di nodi dopo l'add: " + graph.nodes.length);
      //alert("Numero di archi dopo l'add" + graph.links.length);
      restartAdd();
    }

    function removeNodes(d){

      //alert("Lunghezza link prima removeNodes:"+ link.data().length);
      //alert("Lunghezza node prima removeNodes:"+ node.data().length);

      toremove = openedNode[d.name];
      //alert(toremove.length);

      toremove.forEach(function(link) {
          indexOfSource = graph.nodes.indexOf(link.source);
          indexOfTarget = graph.nodes.indexOf(link.target);
          if(indexOfSource > 3){
            graph.nodes.splice(indexOfSource,1);
          }
          if(indexOfTarget > 3){
            graph.nodes.splice(indexOfTarget,1);
          }
          graph.links.splice(graph.links.indexOf(link),1);

      });

      delete openedNode[d.name];

      //alert("Lunghezza link dopo removeNodes:"+ graph.links.length);
      //alert("Lunghezza node dopo removeNodes:"+ graph.nodes.length);
      

      restartRemove();

    }

    function restartAdd(){

      //alert("Lunghezza link prima restart:"+ link.data().length);
      //alert("Lunghezza node prima restart:"+ node.data().length);
      // alert("stroke_width = " + stroke_width);
      //link = svg.selectAll(".link")
                        //.data(graph.links)
      link = link.data(graph.links);

      link.enter()
        .insert("line", "g.gnode")
        .attr("class", "link")
        .on("mouseover", function(d) {
            d3.select(this)
              .style("opacity", options.opacity);
        })
        .on("mouseout", function(d) {
            d3.select(this)
              .style("opacity", options.opacity / 2);
        })
        .style("opacity", options.opacity / 2)
        .style("stroke", function(d){
          if(d.value>0){
            return "#008000";
          }else{
            return "#FF0000";
          }
        })
        .style("stroke-width", function(d) { return Math.abs(d.value); });

      //alert("Lunghezza link dopo restart:"+  link.data().length);
      gnodes = gnodes.data(graph.nodes);

      var wrongnode =gnodes.enter()
        .append("g")
          .classed('gnode', true)
          .attr("dim",function(d){
            //alert(nodeSize(d));
            return nodeSize(d);
          })
          .on("mouseover",mouseover)
          .on("mouseout",mouseout)
        .append("circle")
          .attr("class", "node")
          .attr("r", function(d){
            return nodeSize(d);
          })
        .style("fill", function(d) { 
          //alert(d);
          return color(d.group); 
        });

     for (i = 0; i < wrongnode[0].length; i++) {
        nd = wrongnode[0][i];
        if(!!nd){
          node[0].push(nd);
        }
     }

      //alert("Gnode");
      //alert(gnodes);
      //alert("gnodes_data")
      //alert(gnodes.data());
      //alert("node");
      //alert(node);
      //alert("node_data");
      //alert(node.data());

      //alert("Lunghezza node dopo restart:"+ node.data().length);
      force.stop();
      force.start();
    }

    function restartRemove(){

      //alert("Lunghezza link prima restart:"+ link.data().length);
      //alert("Lunghezza node prima restart:"+ node.data().length);

      link = link.data(graph.links);

      link.exit()
          .remove();

      link.enter()
        .insert("line", ".node")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.abs(d.value); });

      //alert("Lunghezza link dopo restart:"+  link.data().length);
      gnodes = gnodes.data(graph.nodes);

      gnodes.exit()
          .remove(); 

      
      //alert("gnodes");
      //alert(gnodes);
      //alert("gnodes_data");
      //alert(gnodes.data());
      node = node.data(gnodes.data());
      //alert("nodes");
      //alert(node);
      //alert("nodes_data");
      //alert(node.data());


      //alert("Lunghezza node dopo restart:"+ node.data().length);
      force.stop();
      force.start();

    }

    function countDegree(d,type){//OK
    //alert("in countDegree"); OK

      for(i =0; i<imported_nodes.length; ++i){

          if(imported_nodes[i].name == d.name){
            index=i;
            //alert("found " + d.name + " at index " + i); OK
            break;
          }
      }
      degree =0;
      for(j=0; j<imported_links.length; ++j){

        if ((imported_links[j].source == index) && (imported_nodes[imported_links[j].target].group == type))
          degree++;
      }

      return degree;

    }

    function mouseover() {
        d3.select(this).select("circle").transition()
          .duration(750)
          .attr("r", function(d){return nodeSize(d)+5;});
        //alert(d3.select(this).select("text"));

        g = d3.select(this);

        g.select("text").remove();

        g.append('svg:text')
          .text(function(d) { return getText(d); })
          .style("fill",function(d){return color(d.group) })
          .style("stroke-width", ".5px")
          .style("font", options.fontSize + "px " + options.fontFamily)
          .transition()
            .duration(750)
            .attr("x",13)
            .attr("class", "nodetext")
            .attr("dx", 12)
            .attr("dy", ".35em")
        .style("z",2)
        .style("opacity", options.opacity)
        .style("pointer-events", "none")
        .style("font", options.clickTextSize + "px ")
        .attr("x", function (d) {
              return d.x;
        })
        .attr("y", function (d) {
              return d.y;
        
        });

        
      }


    function mouseout() {
        d3.select(this).select("circle").transition()
          .duration(750)
          .attr("r", function(d){
            return nodeSize(d);
          });
        //alert(d3.select(this).select("text"));
        d3.select(this).select("text")
        .transition()
          .duration(1250)
          .style("font", options.fontSize + "px ") 
          .style("opacity", options.opacityNoHover)
          .remove();

      }

    function nodeSize(d){
      //alert(d);
      return defaultdim;
    }

    function getText(d){
      return d.name;
    }

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(graph.nodes);
      return function(d) {
        var rb = 2*d.r + padding,
            nx1 = d.x - rb,
            nx2 = d.x + rb,
            ny1 = d.y - rb,
            ny2 = d.y + rb;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y);
              if (l < rb) {
              l = (l - rb) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }    
    
  }//end render
}) //end htmlwidget
  
  

