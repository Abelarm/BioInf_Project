HTMLWidgets.widget({

  name: "graphexplorer",

  type: "output",


  initialize: function(el, width, height) {

    d3.select(el).append("svg")
        .attr("width", width)
        .attr("height", height);

    return d3.layout.force();
  },

  resize: function(el, width, height, force) {

    d3.select(el).select("svg")
        .attr("width", width)
        .attr("height", height);

    force.size([width, height]).resume();
  },

  renderValue: function(el, x, force) {
	  String.prototype.hashCode = function() {
	    var hash = 0, i, chr, len;
	      if (this.length === 0) return hash;
	      for (i = 0, len = this.length; i < len; i++) {
			  chr   = this.charCodeAt(i);
			      hash  = ((hash << 5) - hash) + chr;
				  hash |= 0; // Convert to 32bit integer
				    
	      }
		return hash;

	  };
  
    var options = x.options;

    // convert links and nodes data frames to d3 friendly format
    var imported_links = HTMLWidgets.dataframeToD3(x.links);
    var imported_nodes = HTMLWidgets.dataframeToD3(x.nodes);
    
    var all_links = {};
    var all_nodes = {};
    
    for (var i = 0; i < imported_links.length; i++){
        
        var source_name = imported_nodes[imported_links[i].source].name;
        var target_name = imported_nodes[imported_links[i].target].name;
        var name = source_name+target_name;
        var reverse_name = target_name+source_name; 
	if (source_name.indexOf('default') >= 0 && target_name.indexOf('default') >= 0)  {
		// console.log("Source name: " + source_name + " Target name: " + target_name + " Value: " + imported_links[i].value + " Hash: " + name.hashCode());	
	}
	// console.log(name + " " + reverse_name);
	if (!(name in all_links || reverse_name in all_links)) {
	  all_links[name.hashCode()] = imported_links[i];
	}
    }
    
    for (var i = 0; i < imported_nodes.length; i++){
        if (!(imported_nodes[i].group in all_nodes)){
          all_nodes[imported_nodes[i].group] = {};
        }
	if (!(imported_nodes[i].subtype in all_nodes[imported_nodes[i].group])) {
	  all_nodes[imported_nodes[i].group][imported_nodes[i].subtype] = {};
	}
        all_nodes[imported_nodes[i].group][imported_nodes[i].subtype][imported_nodes[i].name] = imported_nodes[i];
    }

    // get the width and height
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    var maxdim = 20;
    var defaultdim = 5;
    var stroke_width = 2;
    
    //useful for collision
    var padding = 2;

    var force = force;
    
    var color = eval(options.colourScale);
    var linkDistance = eval(options.linkDistance);
    
    //alert(options.linkDistance);
    //alert(linkDistance);
    var oldsvg = d3.select(el).select("svg");    

    var toggle = 0;
    var link,node,gnodes;
    var fatherOf = {};
    var sons = {};
    var openedNodes = {};
    var linkedByIndex = {};
    var indexMap = {};
    var alreadyAddedNodes = {};
    var subCategories = {};

    var graph = JSON.parse('{"nodes":[], "links":[]}');
    var types = Object.keys(all_nodes);

    var toAddNodes = [];
    var toAddLinks = [];

    types.forEach(function(t){
	    var subkey = Object.keys(all_nodes[t]['default']);
	    toAddNodes.push(all_nodes[t]['default'][subkey[0]]);
    });
      // console.log("Second FOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOR");

    for (var i = 0, len = toAddNodes.length - 1; i < len; i++) {
	    for (var j = i+1, jlen = toAddNodes.length; j < jlen; j++) {
	      // console.log(toAddNodes[i].name + " " + toAddNodes[j].name);
	      var name = toAddNodes[i].name+toAddNodes[j].name;
	      var reverse_name = toAddNodes[j].name+toAddNodes[i].name;
	      // console.log(name.length);
	      var actual_link = all_links[name.hashCode()];
	      if(name.hashCode() in all_links){
		actual_link = all_links[name.hashCode()];
		      if(!(typeof actual_link == 'undefined')){
			toaddi = JSON.parse(JSON.stringify(toAddNodes[i]));
                        toaddj = JSON.parse(JSON.stringify(toAddNodes[j]));
			if (!(toaddi.name in alreadyAddedNodes)) {
			  alreadyAddedNodes[toaddi.name] = toaddi;
			  toaddi.index = graph.nodes.length;
			  graph.nodes.push(toaddi);
			}else{
			  toaddi = alreadyAddedNodes[toaddi.name];
			}
			if (!(toaddj.name in alreadyAddedNodes)) {
			  alreadyAddedNodes[toaddj.name] = toaddj;
			  toaddj.index = graph.nodes.length;
			  graph.nodes.push(toaddj);
			}else{
			  toaddj = alreadyAddedNodes[toaddj.name];
			}
			var edgeToAdd = {};
			edgeToAdd.source = toaddi.index;
			edgeToAdd.target = toaddj.index;
			edgeToAdd.value = actual_link.value;
			graph.links.push(edgeToAdd);
		      }
	      }
	      else{
		actual_link = all_links[reverse_name.hashCode()];
		      if(!(typeof actual_link == 'undefined')){
			
			toaddj = JSON.parse(JSON.stringify(toAddNodes[j]));
                        toaddi = JSON.parse(JSON.stringify(toAddNodes[i]));
			if (!(toaddj.name in alreadyAddedNodes)) {
			  alreadyAddedNodes[toaddj.name] = toaddj;
			  toaddj.index = graph.nodes.length;
			  graph.nodes.push(toaddj);
			}else{
			  toaddj = alreadyAddedNodes[toaddj.name];
			}
			if (!(toaddi.name in alreadyAddedNodes)) {
			  alreadyAddedNodes[toaddi.name] = toaddi;
			  toaddi.index = graph.nodes.length;
			  graph.nodes.push(toaddi);
			}else{
			  toaddi = alreadyAddedNodes[toaddi.name];
			}
			var edgeToAdd = {};
			edgeToAdd.source = toaddj.index;
			edgeToAdd.target = toaddi.index;
			edgeToAdd.value = actual_link.value;
			graph.links.push(edgeToAdd);
		      }
	      }
	      }
    }
    
    
    //END DATA PARSING
    
    console.log(graph);
    //BEGIN RENDERING

    var zoom = d3.behavior.zoom();
    
    force
      .nodes(graph.nodes)
      .links(graph.links)
      .charge(options.charge)
      .linkDistance(linkDistance)
      .friction(0.95)
      .size([width, height])
      .on("tick", tickfunction)
      .on("end", endfunction)
      .start();
      
    var drag = force.drag()
        .on("dragstart", dragstart)
        .on("dragend", dragend);
    
    // allow force drag to work with pan/zoom drag
    function dragstart(d) {
      d3.event.sourceEvent.preventDefault();
      d3.event.sourceEvent.stopPropagation();
      force.stop();
    }
    
    function dragend(d){
      d.fixed = true;
      force.resume();
    }
      
    // select the svg element and remove existing children
    // Needed, otherwise when redrawed with Shiny the old graph isn't eliminated
    oldsvg.selectAll("*").remove();
      
    var svg = oldsvg
        .append("g").attr("class","zoom-layer")
        .append("g");
    
    //svg.on("dblclick.zoom", null);
  
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
      .call(zoom).on("dblclick.zoom", null);
    }
    else {
      zoom.on("zoom", null);
    }


    
    //FIRST DRAWING, ONLY GROUPS AND LINK BETWEEN THEM 

    //draw links
    link = svg.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("g")
	.attr("class","glink")
        .on("mouseover", LinkOver)
        .on("mouseout", LinkOut)
        .append("line")
        .attr("class", "link")
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
            .attr("dim",maxdim)
            .on("mouseover",mouseover)
            .on("mouseout",mouseout)
            .style("stroke",'#fff')
            .style("stroke-width", "1.5px")
            .call(drag);

    //problem here
    node = gnodes
        .append("circle")
        .attr("class","node")
        .attr("r", maxdim)
        .style("fill", function(d) { return color(d.group); })
	.on("dblclick", function(d){
		if (!(d.name in openedNodes)) {
		  if('first_level' in all_nodes[d.group]){
		    var nodes_to_be_opened = all_nodes[d.group]['first_level'];
		    console.log(Object.keys(nodes_to_be_opened).length);	
                  }else{
		    var nodes_to_be_opened = all_nodes[d.group]['NC'];
		    console.log(Object.keys(nodes_to_be_opened).length);	
		  }
		}
	})
        .on("click", function(d){
           var event = d3.event;
           var ctrlPressed = event.ctrlKey;
           var shiftPressed = event.shiftKey;
           if(shiftPressed){
            connectedNodes(d);
           }
           else if (ctrlPressed) {
            if (d.fixed) {
             d.fixed = false; 
            } 
           }
          }
        )
        .style("stroke", '#fff')
        .style("stroke-width", 1);
        
     // add legend option
     
    drawLegend();
    drawEdgeLegend();
     
    function drawLegend(){
        var groupDomain = color.domain();
        if(options.legend){
            var legendRectSize = 18;
            var legendSpacing = 4;
            var colorDomain = color.domain();
            oldsvg.selectAll('.legend').remove();
            var legend = oldsvg.selectAll('.legend')
              .data(groupDomain)
              .enter()
              .append('g')
              .attr('class', 'legend')
              .attr('transform', function(d, i) {
                var legend_height = legendRectSize + legendSpacing;
                var offset =  legend_height* groupDomain.length / 2;
                var horz = legendRectSize;
                var vert = i * legend_height+4;
		// console.log("horz " + horz + " vert " + vert);
                return 'translate(' + horz + ',' + vert + ')';
              });

            legend.append('rect')
              .attr('width', legendRectSize)
              .attr('height', legendRectSize)
	      .style('fill', function (d){
		        return color(d);
	          })
	      .style('stroke', function (d){
		        return color(d);
	          });

            legend.append('text')
              .attr('x', legendRectSize + legendSpacing)
              .attr('y', legendRectSize - legendSpacing)
              .text(function(d) { 
                    return d;
              });

        }}
        
  function drawEdgeLegend(){
        var groupDomainEdge = [];
	      groupDomainEdge.push("Positive Edges");
	      groupDomainEdge.push("Negative Edges");
        if(options.legend){
            var legendRectSize = 18;
            var legendSpacing = 4;
            var legend = oldsvg.selectAll('.edgeLegend')
              .data(groupDomainEdge)
              .enter()
              .append('g')
              .attr('class', 'edgeLegend')
              .attr('transform', function(d, i) {
                var legend_height = legendRectSize + legendSpacing;
                var offset =  legend_height* groupDomainEdge.length / 2;
                var horz = legendRectSize;
                var vert = i * legend_height+4;
		// console.log("horz " + width - horz + " vert " + vert);
                return 'translate('+ (width - horz) + ',' + vert + ')';
              });

            legend.append('text')
	    .attr('x', function(d){
		    return (-(legendRectSize - legendSpacing))*(d.length - 4);
	    })
              .attr('y', legendRectSize - legendSpacing)
              .text(function(d) { 
                    return d;
              });

            legend.append('rect')
              .attr('width', legendRectSize)
              .attr('height', legendRectSize)
	      .style('fill', function (d){
		      if (d == "Positive Edges") {
		      	return "#008000";
		      }
		      if (d == "Negative Edges") {
		      	return "#FF0000";
		      }
	          })
	      .style('stroke', function (d){
		      if (d == "Positive Edges") {
		      	return "#008000";
		      }
		      if (d == "Negative Edges") {
		      	return "#FF0000";
		      }
	          });
        }
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
      
    function addNodes(d){ //ok!
      sons[d.name] = [];
      var toAdd = subCategories[d.group];
      for(var t in toAdd){
          var fakeNodeToAdd = JSON.parse(JSON.stringify(d));
          fakeNodeToAdd.name = subCategories[d.group][t];
          fakeNodeToAdd.group = d.group;
	        fakeNodeToAdd.subclass = subCategories[d.group][t];
          fakeNodeToAdd.fixed = false;
	        //count degree must count the number of elements in a category
          fakeNodeToAdd.degree = countDegree(fakeNodeToAdd.subclass);
          fakeNodeToAdd.dim = Math.floor(fakeNodeToAdd.degree / maxdim);
          if(!(fakeNodeToAdd.degree == 0)){
            graph.nodes.push(fakeNodeToAdd);
            var lin = JSON.parse('{"source":' +  graph.nodes.indexOf(d) + ', "target": ' + graph.nodes.indexOf(fakeNodeToAdd) + ', "value": 1}');
            graph.links.push(lin);
            openedNodes[d.name].push(lin);
            fatherOf[fakeNodeToAdd.name] = d.name;
	    sons[d.name].push(fakeNodeToAdd);
          }
      }
      restartAdd();
    }

    function addTrueNode(d){
      // repopulated at the end 
      openedNodes[d.name] = [];
      // alert(father);
     
      var sourceIndex = graph.nodes.indexOf(d);
      var sourceObj = graph.nodes[sourceIndex];
      var sourceSubClass = sourceObj.subclass;

      var toAddLink = [];
      var toAddNodes = [];
      var toIntrLink = [];
      var IndNodes = graph.nodes.length;

      var numlin = 0;
      //primo ciclo: individuare tutti i nodi di una certa subclass ed azzeccarli al padre
      for(j=0; j<imported_nodes.length; ++j){
        current = imported_nodes[j];
        // ci sono alcuni nodi di chem o di drug che hanno come sottoclasse NC e quindi ogni volta 
        //che vedono sto if ci entrano dentro e quindi sti cazzi
        if((imported_nodes[j].subclass == sourceSubClass)  && (imported_nodes[j].group == sourceObj.group)){

              //alert("Aggiungo");
              //alert(FullGraph.links.source[j] + " " + FullGraph.links.target[j]);
              var nameNodeToAdd = imported_nodes[j].name;
              var groupNodeToAdd = imported_nodes[j].group;
              var toParse = '{"name":"' +nameNodeToAdd+ '", "group":"' + groupNodeToAdd + '", "subclass":"' + nameNodeToAdd +'"}';
              var objNodeToAdd = JSON.parse(toParse);
              objNodeToAdd.index = j;
              objNodeToAdd.dim = defaultdim;
              var newIndex = IndNodes;
              objNodeToAdd.newIndex = newIndex;
              toAddNodes.push(objNodeToAdd);
	      //value 0 so edges aren't rendered
              var value = 0;  
              var forparser = '{"source":' + sourceIndex + ', "target":' + newIndex + ', "value":' + value + '}';
              //alert(forparser);      
              var lin = JSON.parse(forparser);
              IndNodes++;
              toAddLink.push(lin);
              
        }
      }

      // Secondo ciclo: tra i nodi aggiunti, aggiungere gli archi se esistono
      // COMPLESSITA' n^2*m       n= nodi sottocategoria  m= numero archi del grafo
      // esempio 29*29*1.5kk
      for (var i = 0; i < toAddNodes.length-1; i++) {
        var actual_source = toAddNodes[i];
        for (var j = i+1 ;  j < toAddNodes.length; j++) {
            var actual_target = toAddNodes[j];

            for (var k = 0; k < imported_links.length; k++) {

                var actual_link = imported_links[k];
            
                if (imported_links[k].source == actual_source.name && imported_links[k].target == actual_target.name){

                  var lin = JSON.parse(JSON.stringify(imported_links[k]));

                  lin.source = actual_source.newIndex;
                  lin.target = actual_target.newIndex;

                  toAddLink.push(lin);

                  break;
                }
            }
        }
      }

      // alert("---------------NUMERO NODI: " + numlin);

      // alert(toAddLink.length);
      // alert(toAddNodes.length);

      openedNodes[d.name].push.apply(openedNodes[d.name],toAddLink);

      // console.log(toAddNodes);

      graph.nodes.push.apply(graph.nodes,toAddNodes);
      graph.links.push.apply(graph.links,toAddLink);

      restartAdd();
    }

    function removeNodes(d){
      console.log("Prima della remove sono: " + graph.nodes.length);
      console.log("Prima della remove sono: " + graph.links.length);

      var toremove = openedNodes[d.name];
      
      if(d.name in sons){
      	for (var i = 0, len = sons[d.name].length; i < len; i++) {
      	  if (sons[d.name][i].name in openedNodes) {
      	    removeNodes(sons[d.name][i]);
      	  }	
        }
      }

      toremove.forEach(function(link_to_remove) {

          graph.nodes.splice(graph.nodes.indexOf(link_to_remove.target),1);
          graph.links.splice(graph.links.indexOf(link_to_remove,1));

      });

      delete openedNodes[d.name];
      delete sons[d.name];

      restartRemove();
    }

    function restartAdd(){

      // alert("Lunghezza link prima restart:"+ link.data().length);
      // alert("Lunghezza node prima restart:"+ node.data().length);
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
        .style("stroke",function(d){
          if(d.value == 1){
            return "#000000";
          }
          if(d.value>0){
            return "#008000";
          }else{
            return "#FF0000";
          }
        })
        .style("stroke-width", function(d) { return d.value; });

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
        })
        .on("click", function(d){
           var event = d3.event;
           ctrlPressed =event.ctrlKey;
           if (ctrlPressed) {
            if (d.fixed) {
             d.fixed = false; 
            } 
           }
          }
        )
        .on("dblclick",function(d){
          if (!(d.name in openedNodes)){
            if(d.subclass in subCategories){
              openedNodes[d.name] = [];
              addNodes(d);
              return;
            }
            else{
              addTrueNode(d);
	      return;
            }
          }
          else{
	    //d.name is in openedNodes
            removeNodes(d);
            return;
          }
        })
        .call(drag);

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
      drawLegend();
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
        .style("stroke-width", function(d) { return d.value; });

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
      drawLegend();
      force.stop();
      force.start();

    }

    function countDegree(subtype){//OK
      //once founded, count degree by iterating on edges
      var degree = 0;
      for(j=0; j<imported_nodes.length; ++j){
	if (imported_nodes[j].subclass == subtype) {
	  degree++;	
	}
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

      return defaultdim;
      //node is NOT one of the beginners
      if ("dim" in d){
        if (d.dim < maxdim){
          if (d.dim < defaultdim){
            return defaultdim+1;
          }else{
            return d.dim;
          }
        }else{
          return (maxdim-2);
        }
      }
      //nodes is one of the beginners
      else{
	      return maxdim;
      }
    }

    function getText(d){
      //super trick: negli ultimi nodi la subclass e' uguale al nome
      return d.name;
    }

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(graph.nodes);
      return function(d) {
        var rb = 2*this.r.baseVal.value + padding,
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
    
    function LinkOver(){

    l = d3.select(this);

    l.select(".link")
            .style("opacity", options.opacity);

    l.select(".link").transition()
        .duration(750);
      //console.log(d3.select(this).select("text"));


      //console.log(l.select("text")[0]);

      l.append('svg:text')
        .text(function(d) { return (d.value).toFixed(2); })
        .style("fill",function(d){
          if(d.value>0){
            return "#008000";
          }else{
            return "#FF0000";
          }
         })
        .style("stroke-width", ".5px")
        .style("stroke","#fff")
        .style("font", options.fontSize + "px " + options.fontFamily)
        .transition()
          .duration(750)
          .attr("x",33)
          .attr("class", "nodetext")
          .attr("dx", 12)
          .attr("dy", ".35em")
        .style("opacity", 1)
        .style("pointer-events", "none")
        .style("font", options.clickTextSize + "px ")
        .attr("x", function (d) {
              x1 = d.source.x;
              //console.log(x1);
              x2 = d.target.x;
              //console.log(x2);
              ris = (x1+x2)/2;
              //console.log(ris)
              return ris;
        })
        .attr("y", function (d) {
              y1 = d.source.y;
              //console.log(y1);
              y2 = d.target.y;
              //console.log(y2);
              ris = (y1+y2)/2;
              //console.log(ris);
              return ris;
        
        });
    }

    function LinkOut(){
      l = d3.select(this);

      l.select(".link") 
              .style("opacity", options.opacity/2);


      //console.log(l.select("text")[0]);

      if (l.select("text")[0][0] != null){

        l.select("text").remove();
        return;

      }
    }  
    
    function connectedNodes(d) {

    //console.log(linkedByIndex);
      var glinks = d3.selectAll(".glink");

      if (toggle == 0) {
          //Reduce the opacity of all but the neighbouring nodes
          //console.log(d);
          gnodes.select("circle").style("opacity", function (o) {
              return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
          });
          link.style("opacity", function (o) {
              return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
          });
          
          //Reduce the op
          toggle = 1;
	  glinks.on("mouseover", null);
	  glinks.on("mouseout", null);
      } else {
          //Put them back to opacity=1
          gnodes.select("circle").style("opacity", 1);
          link.style("opacity", options.opacity/2);
          toggle = 0;
	  glinks.on("mouseover", LinkOver);
	  glinks.on("mouseout", LinkOut);
      }

  }

  function neighboring(a, b) {
    //console.log("Source: " + a.index + " Target: " + b.index)
      return linkedByIndex[a.index + "," + b.index];
  }  
    
  }//end render
}) //end htmlwidget
  
  

