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

    var md5 = CryptoJS.MD5;
    var options = x.options;

    // convert links and nodes data frames to d3 friendly format
    var imported_links = HTMLWidgets.dataframeToD3(x.links);
    console.log("NUMERO ARCHI " + imported_links.length);
    var imported_nodes = HTMLWidgets.dataframeToD3(x.nodes);
    
    var all_links = {};
    var all_nodes = {};
    
    for (var i = 0; i < imported_links.length; i++){
        
        var source_name = imported_nodes[imported_links[i].source].name;
        var target_name = imported_nodes[imported_links[i].target].name;

        var name = source_name+target_name;
        var reverse_name = target_name+source_name; 
      	if (!(name in all_links) && !(reverse_name in all_links)) {
      	  all_links[md5(name)] = imported_links[i];
      	}
    }

    console.log("NUMERO ARCHI struttura: " + Object.keys(all_links).length);

    for (var i = 0; i < imported_nodes.length; i++){
        if (!(imported_nodes[i].group in all_nodes)){
            all_nodes[imported_nodes[i].group] = {};
        }
      	if (!(imported_nodes[i].subtype in all_nodes[imported_nodes[i].group])) {
      	  all_nodes[imported_nodes[i].group][imported_nodes[i].subtype] = {};
      	}
        all_nodes[imported_nodes[i].group][imported_nodes[i].subtype][imported_nodes[i].name] = imported_nodes[i];
    }


    console.log(all_nodes);
    console.log(all_links);

    // get the width and height
    var width = el.offsetWidth;
    var height = el.offsetHeight;
    var toggle_render_edges = {}

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
    var toggle_render_edges = {};

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
	      var actual_link = all_links[md5(name)];
	      if(md5(name) in all_links){
		      actual_link = all_links[md5(name)];
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
		actual_link = all_links[md5(reverse_name)];
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
      linkedByIndex[edgeToAdd.source + "," + edgeToAdd.target] = 1;
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
    link = svg.selectAll("g.glink")
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

    console.log(link);
    console.log(svg.selectAll("g.glink"));

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

    console.log(gnodes);

    //problem here
    node = gnodes
        .append("circle")
        .attr("class","node")
        .attr("r", maxdim)
        .style("fill", function(d){ 
          return color(d.group);
        })
    	  .on("dblclick", function(d){
    		  if (!(d.name in openedNodes)) {
    		    if('first_level' in all_nodes[d.group]){
    		      addNodes(d);	
            }else{
    		      addTrueNodes(d);
    		    }
    		  }else{
            removeNodes(d);
          }
    	  })
        .on("click", function(d){
           var event = d3.event;
           var ctrlPressed = event.ctrlKey;
           var shiftPressed = event.shiftKey;
           var altPressed = event.altKey;
           if(shiftPressed){
            connectedNodes(d);
           }
           else if (ctrlPressed) {
            if (d.fixed) {
             d.fixed = false; 
            }
	   }else if(altPressed){
	      //undefined is evaluated as false
	      if(!(toggle_render_edges[d.name]['opened']))
		  getEdgesFrom(d);
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
      
      var to_be_added = all_nodes[d.group]['first_level'];

      var toAddNodes = [];
      var toAddLinks = [];
      openedNodes[d.name] = [];

      console.log("NUMERO NODI PRIMA ADDNODES " + graph.nodes.length);
      console.log("NUMERO ARCHI PRIMA ADDNODES " + graph.links.length);

      sons[d.name] = [];

      (Object.keys(to_be_added)).forEach(function(tba){

        currentNode = all_nodes[d.group]['first_level'][tba];
        currentNode = JSON.parse(JSON.stringify(currentNode));
        currentNode.cat = currentNode.name.split(";")[0];
        currentNode.name = currentNode.name.split(";")[1];
        graph.nodes.push(currentNode);
        sons[d.name].push(currentNode);
        alreadyAddedNodes[currentNode.name] = currentNode;
        var name = d.name+currentNode.cat+";"+currentNode.name;
        if (md5(name) in all_links){
          var lin = all_links[md5(name)];
          lin.source = graph.nodes.indexOf(alreadyAddedNodes[d.name]);
          lin.target = graph.nodes.length-1;
          lin = JSON.parse(JSON.stringify(lin));
          graph.links.push(lin);
          openedNodes[d.name].push(lin);
          linkedByIndex[lin.source + "," + lin.target] = 1;

        }
        else{
          var reverse_name = currentNode.cat+";"+currentNode.name+d.name;
          if(md5(reverse_name) in all_links){
            var lin = all_links[md5(reverse_name)];
            lin.source = graph.nodes.length-1;
            lin.target = graph.nodes.indexOf(alreadyAddedNodes[d.name]); 
            lin = JSON.parse(JSON.stringify(lin));
            graph.links.push(lin);
            openedNodes[d.name].push(lin);
            linkedByIndex[lin.source + "," + lin.target] = 1;
             
          }else{

            lin = {};
            lin.source = graph.nodes.length-1;
            lin.target = graph.nodes.indexOf(alreadyAddedNodes[d.name]);
            lin.value = 0;
            graph.links.push(lin);
            openedNodes[d.name].push(lin);
            linkedByIndex[lin.source + "," + lin.target] = 1;

          }
        }

      });

      console.log("NUMERO NODI DOPO ADDNODES " + graph.nodes.length);
      console.log("NUMERO ARCHI DOPO ADDNODES " + graph.links.length);

      console.log(graph.links);


      restartAdd();
    }

    function addTrueNodes(d){

      console.log("Prima della addTrueNodes nodi: " + graph.nodes.length);
      console.log("Prima della addTrueNodes archi: " + graph.links.length);

      openedNodes[d.name] = [];

      if (typeof d.cat == 'undefined'){
        cat = 'NC';
      }else{
        cat = d.cat;
      }
      var to_be_added = all_nodes[d.group][cat];
      var keys = Object.keys(to_be_added);
      console.log(keys);
      for (var i = 0; i < keys.length; i++) {
        var currentNodei = JSON.parse(JSON.stringify(all_nodes[d.group][cat][keys[i]]));
        if(typeof alreadyAddedNodes[currentNodei.name] == 'undefined'){
          //console.log("AGGIUNGO: " + currentNodei.name)
          alreadyAddedNodes[currentNodei.name] = currentNodei;
          graph.nodes.push(currentNodei);
        }
        for (var j = i +1 ; j < keys.length; j++) {
          var currentNodej = JSON.parse(JSON.stringify(all_nodes[d.group][cat][keys[j]]));
          if (typeof alreadyAddedNodes[currentNodej.name] == 'undefined'){
            //console.log("AGGIUNGO: " + currentNodej.name)
            alreadyAddedNodes[currentNodej.name] = currentNodej;
            graph.nodes.push(currentNodej);
          }
          var name = currentNodei.name+currentNodej.name
          if (md5(name) in all_links){
            //console.log("Arco tra: " + currentNodei.name + " e " + currentNodej.name);
            lin = JSON.parse(JSON.stringify(all_links[md5(name)]));
            lin.source = graph.nodes.indexOf(alreadyAddedNodes[currentNodei.name]);
            lin.target = graph.nodes.indexOf(alreadyAddedNodes[currentNodej.name]);
            openedNodes[d.name].push(lin);
            graph.links.push(lin);
            linkedByIndex[lin.source + "," + lin.target] = 1;
          }else{
            var reverse_name = currentNodej.name+currentNodei.name;
            if (md5(reverse_name) in all_links){
              //console.log("Arco tra: " + currentNodej.name + " e " + currentNodei.name);
              lin = JSON.parse(JSON.stringify(all_links[md5(reverse_name)]));
              lin.source = graph.nodes.indexOf(alreadyAddedNodes[currentNodej.name]);
              lin.target = graph.nodes.indexOf(alreadyAddedNodes[currentNodei.name]);
              openedNodes[d.name].push(lin);
              graph.links.push(lin);
              linkedByIndex[lin.source + "," + lin.target] = 1;
            }
          }
        }

        lin = {};
        lin.source = graph.nodes.indexOf(alreadyAddedNodes[currentNodei.name]);
        lin.target = graph.nodes.indexOf(alreadyAddedNodes[d.name]);
        lin.value = 0;
        //console.log("STO AGGIUNGENDO");
        graph.links.push(lin);
        openedNodes[d.name].push(lin);
        linkedByIndex[lin.source + "," + lin.target] = 1;
      }

      console.log(graph.nodes);
      console.log(graph.links);
      console.log("Dopo della addTrueNodes nodi: " + graph.nodes.length);
      console.log("Dopo della addTrueNodes archi: " + graph.links.length);
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

        if (link_to_remove.source.name != d.name && link_to_remove.target.name != d.name){
          if (graph.nodes.indexOf(link_to_remove.target) != -1 && graph.nodes.indexOf(link_to_remove.source) != -1){
            delete alreadyAddedNodes[graph.nodes[graph.nodes.indexOf(link_to_remove.target)].name];
            delete alreadyAddedNodes[graph.nodes[graph.nodes.indexOf(link_to_remove.source)].name];
            graph.nodes.splice(graph.nodes.indexOf(link_to_remove.target),1);
            graph.nodes.splice(graph.nodes.indexOf(link_to_remove.source),1);
          }
        }else{     
          if (link_to_remove.source.subtype != 'default' && graph.nodes.indexOf(link_to_remove.source) != -1){
              delete alreadyAddedNodes[graph.nodes[graph.nodes.indexOf(link_to_remove.source)].name];
              graph.nodes.splice(graph.nodes.indexOf(link_to_remove.source),1);
          }else{
            if (link_to_remove.target.subtype != 'default' && graph.nodes.indexOf(link_to_remove.target) != -1){
                delete alreadyAddedNodes[graph.nodes[graph.nodes.indexOf(link_to_remove.target)].name];
                graph.nodes.splice(graph.nodes.indexOf(link_to_remove.target),1);            
            }
          }
        }
        //console.log(graph.links.indexOf(link_to_remove));
        if (graph.links.indexOf(link_to_remove) >= 0){
          graph.links.splice(graph.links.indexOf(link_to_remove),1);
          linkedByIndex[link_to_remove.source + "," + link_to_remove.target] = 0;
        }
      });

      delete openedNodes[d.name];
      console.log("Dopo della remove sono: " + graph.nodes.length);
      console.log("Dopo della remove sono: " + graph.links.length);
      //delete sons[d.name];

      restartRemove();
    }

    function restartAdd(flag){

      flag = flag || false;

      // alert("Lunghezza link prima restart:"+ link.data().length);
      // alert("Lunghezza node prima restart:"+ node.data().length);
      // alert("stroke_width = " + stroke_width);
      //link = svg.selectAll(".link")
                        //.data(graph.links)
      tmp = svg.selectAll("g.glink")
                .data(graph.links);

      link = svg.selectAll(".link")

      console.log("UNDEFINEDDD?")
      console.log(link);
      console.log(tmp);

      var op = options.opacity / 2;

      if(flag)
	       op = op * 2;
	
      var wronglink = tmp.enter()
        .append("g")
        .attr("class","glink")
        .on("mouseover", LinkOver)
        .on("mouseout", LinkOut)
        .append("line")
        .attr("class", "link")
        .style("opacity", op)
        .style("stroke",function(d){
          if(d.value>0){
            return "#008000";
          }else{
            return "#FF0000";
          }
        })
        .style("stroke-width", function(d) { return Math.abs(d.value); });

      console.log("------------");
      console.log("wronglink");
      console.log(wronglink);
      console.log("Link");
      console.log(link);

     for (i = 0; i < wronglink[0].length; i++) {
        nd = wronglink[0][i];
        if(!!nd){
          link[0].push(nd);
        }
     }

      console.log("------------");
      console.log("LINK");
      console.log(link);

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
           var ctrlPressed = event.ctrlKey;
           var shiftPressed = event.shiftKey;
           var altPressed = event.altKey;
           if(shiftPressed){
            connectedNodes(d);
           }
           else if (ctrlPressed) {
            if (d.fixed) {
             d.fixed = false; 
            }
	   }
	   else if(altPressed){
	      getEdgesFrom(d);
           } 
           }
        )
        .on("dblclick",function(d){
          if (!(d.name in openedNodes)){
            addTrueNodes(d);
          }else{
            return removeNodes(d);
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

      tmp = svg.selectAll("g.glink")
                .data(graph.links);

      tmp.exit().remove();

      console.log(link);
      
      link = svg.selectAll(".link");

      console.log(link);

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


      console.log(l);


      console.log(l.select("text")[0]);

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

      console.log(l.select("text")[0]);

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
  
  //useless to call if it is to close, but we will do it (we are tired of this code)
  function getEdgesFrom(d){
    var list_of_edges = [];
    for (var i = 0; i < graph.nodes.length; i++) {
      currentNode = graph.nodes[i];
      if (currentNode.name != d.name && currentNode.group != d.group){
	var current_edge_name = currentNode.name+d.name;
	if (md5(current_edge_name) in all_links){
	  list_of_edges.push(all_links[md5(current_edge_name)]);
	  console.log(all_links[md5(current_edge_name)]);
	  console.log(imported_nodes[all_links[md5(current_edge_name)].source]);
	  console.log(imported_nodes[all_links[md5(current_edge_name)].target]);
	}else{
	  var current_reverse_edge_name = d.name+currentNode.name;
	  if (md5(current_reverse_edge_name) in all_links){
	     list_of_edges.push(all_links[md5(current_reverse_edge_name)]);
	     console.log(all_links[md5(current_reverse_edge_name)]);
	     console.log(imported_nodes[all_links[md5(current_reverse_edge_name)].source]);
	     console.log(imported_nodes[all_links[md5(current_reverse_edge_name)].target]);
	  }else{ //Maybe the edge is with ; inside
	    var current_edge_name_cat = currentNode.cat+";"+currentNode.name+d.name;
	    if (md5(current_edge_name_cat) in all_links){
	      list_of_edges.push(all_links[md5(current_edge_name_cat)]);
	      console.log(all_links[md5(current_edge_name_cat)]);
	      console.log(imported_nodes[all_links[md5(current_edge_name_cat)].source]);
	      console.log(imported_nodes[all_links[md5(current_edge_name_cat)].target]);
	    }else{
	      var current_reverse_edge_name_cat = d.name+currentNode.cat+";"+currentNode.name;
	      if (md5(current_reverse_edge_name_cat) in all_links){
		list_of_edges.push(all_links[md5(current_reverse_edge_name_cat)]);
		console.log(all_links[md5(current_reverse_edge_name_cat)]);
		console.log(imported_nodes[all_links[md5(current_reverse_edge_name_cat)].source]);
		console.log(imported_nodes[all_links[md5(current_reverse_edge_name_cat)].target]);
	      }
	    }
	  }
	}
      }
    }
    renderAndDeRender(d.name,list_of_edges);
  }

  function renderAndDeRender(name, list_of_edges) {
	  if(!(name in toggle_render_edges)){
		  toggle_render_edges[name] = {}; 
		  toggle_render_edges[name]['opened'] = false;
		  toggle_render_edges[name]['edges'] = [];
	  }
	  if(!toggle_render_edges[name]['opened']){
		  if(list_of_edges.length > 0){
			  toggle_render_edges[name]['opened'] = true;
			  svg.selectAll('.link').style("opacity", 0);
			  svg.selectAll('.glink').on("mouseover", null);
			  svg.selectAll('.glink').on("mouseout", null);
			  for (var i = 0, len = list_of_edges.length; i < len; i++) {
			    var actual_edge = JSON.parse(JSON.stringify(list_of_edges[i]));
			    //maronn
			    var actual_source = graph.nodes.indexOf(alreadyAddedNodes[imported_nodes[actual_edge.source].name]);
			    var actual_target = graph.nodes.indexOf(alreadyAddedNodes[imported_nodes[actual_edge.target].name]);

			    if(actual_source == -1 || actual_target == -1)
				continue;
			    actual_edge.source = actual_source;
			    actual_edge.target = actual_target;
			
			    // console.log(actual_edge);
			    toggle_render_edges[name]['edges'].push(actual_edge);
			    linkedByIndex[actual_edge.source + "," + actual_edge.target] = 1;
			    graph.links.push(actual_edge);
			    
			  }
			  
			  restartAdd(true);
		  }	  
	  }else{
	    for (var i = 0, len = toggle_render_edges[name]['edges'].length; i < len; i++) {
	      graph.links.splice(graph.links.indexOf(toggle_render_edges[name]['edges'][i]), 1);	
	    }
	    svg.selectAll('.link').style("opacity", options.opacity/2);
	    svg.selectAll('.glink').on("mouseover", LinkOver);
	    svg.selectAll('.glink').on("mouseout", LinkOut);
	    toggle_render_edges[name]['opened'] = false;
	    delete toggle_render_edges[name];
	    restartRemove();
	  }
  }

  function neighboring(a, b) {
    //console.log("Source: " + a.index + " Target: " + b.index)
      return linkedByIndex[a.index + "," + b.index];
  }  
    
  }//end render
}) //end htmlwidget
