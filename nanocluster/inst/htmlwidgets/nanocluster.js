HTMLWidgets.widget({

  name: "nanocluster",

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
  
    var options = x.options;
    
    //alert(JSON.stringify(options));

    // convert links and nodes data frames to d3 friendly format
    var imported_links = HTMLWidgets.dataframeToD3(x.links);
    var imported_nodes = HTMLWidgets.dataframeToD3(x.nodes);
    
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
    var linkDistance = eval(options.linkDistance);
    //alert(options.linkDistance);
    //alert(linkDistance);
    var oldsvg = d3.select(el).select("svg");    
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    var link,node,gnodes;
    var openedNode = {};
    var indexMap = {};
    var numChem=0,numDrug=0,numDise=0;

    graph = JSON.parse('{"nodes":[], "links":[]}');
    
    nod_len = imported_nodes.length;
    for (index = 0; index < nod_len; ++index) {
      nd = imported_nodes[index];
      if (nd.group==1){
        //alert("Sto aggiungendo: " + index);
        indexMap[index] = graph.nodes.length; 
        graph.nodes.push(nd);
      }else{
        if(nd.group==2){
          numDise++;
        }else{
          if(nd.group==3){
            numDrug++;
          }else{
            numChem++;
          }
        }
      }
    }

    for (var i = 0; i < imported_links.length; i++) {
      ln = imported_links[i];
      
      if((imported_nodes[ln.source].group == 1) && ((imported_nodes[ln.target].group == 1))){
        newln = JSON.parse(JSON.stringify(ln));
        newln.source = indexMap[ln.source]; 
        newln.target = indexMap[ln.target];
        graph.links.push(newln);
        //alert("from imported: source: " + ln.source + " target: " + ln.target);
        //alert(" group source: " + imported_nodes[ln.source].group + "group target: " + imported_nodes[ln.target].group);
      }
    }
    
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
    
    function dragend(d, i){
      //fixed scazza tutto, bisogna aggiungere dei controlli quando si "apre" un nodo
      //d.fixed = true;
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


    
    

    //draw links
    link = svg.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("g")
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


    node = gnodes
        .append("circle")
        .attr("class","node")
        .attr("r", maxdim)
        .style("fill", function(d) { return color(d.group); })
        .on("dblclick", function(d){
          //alert("Ho cliccato " + d.name + " vaffanculo Dario Greco");
          if (! (d.name in openedNode)){
                  openedNode[d.name] = [];
                  addNodes(d);
                  return;
          }
          else{
            if (("ChemOf"+d.name) in openedNode){
              name = "ChemOf"+d.name;
              for(i =0; i<graph.nodes.length; ++i){
                if(graph.nodes[i].name = name){
                  //alert("Rimuovo "+name);
                  removeNodes(graph.nodes[i]);
                  //alert("-------FATTO-------");
                  break;
                }
              }

            }
            if (("PharOf"+d.name) in openedNode){
              name = "PharOf"+d.name;
              for(i =0; i<graph.nodes.length; ++i){
                if(graph.nodes[i].name = name){
                  //alert("Rimuovo "+name);
                  removeNodes(graph.nodes[i]);
                  //alert("-------FATTO-------");
                  break;
                }
              }
            }
            if (("DiseOf"+d.name) in openedNode){
              name = "DiseOf"+d.name;
              for(i =0; i<graph.nodes.length; ++i){
                if(graph.nodes[i].name = name){
                  //alert("Rimuovo "+name);
                  removeNodes(graph.nodes[i]);
                  //alert("-------FATTO-------");
                  break;
                }
              }
            }
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
          .text(function(d) { return "Nano"; });
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
      //alert(JSON.stringify(d));

      //d.append("Opened","True");
      
      //alert("Num Archi prima: " + graph.links.length);
      
      chem = JSON.parse(JSON.stringify(d));
      chem.name = "ChemOf"+d.name;
      chem.group = 4;
      chemdegree = countDegree(d,chem.group);
      chem.degree = chemdegree;
      chem.dim = Math.floor(chemdegree/6);
      //alert("Degree: "+chemdegree + " Dim: " + chem.dim);

      phar = JSON.parse(JSON.stringify(d));
      phar.name = "PharOf"+d.name;
      phar.group = 3;
      phardegree = countDegree(d,phar.group);
      //alert("---------------------"+ (numDrug/phardegree));
      phar.degree = phardegree;
      phar.dim = Math.floor(phardegree/6);
      //alert("Degree: " +phardegree + " Dim: " + phar.dim);

      dise = JSON.parse(JSON.stringify(d));
      dise.name = "DiseOf"+d.name;
      dise.group = 2;
      disedegree = countDegree(d,dise.group);
      dise.degree = disedegree;
      dise.dim = Math.floor(disedegree/6);
      //alert("Degree: "+disedegree + " Dim: " + dise.dim);
      
      if(chem.degree != 0){
        graph.nodes.push(chem);
        lin1 = JSON.parse('{"source":' +  graph.nodes.indexOf(d) + ', "target": ' + graph.nodes.indexOf(chem) + ', "value": 1}');
        graph.links.push(lin1);
        openedNode[d.name].push(lin1);
      }
      //openedNode[d.name].push(chem);
      if(phar.degree != 0){
        graph.nodes.push(phar);
        lin2 = JSON.parse('{"source":' + graph.nodes.indexOf(d)+ ', "target": ' + graph.nodes.indexOf(phar) + ', "value": 1}');
        graph.links.push(lin2);
        openedNode[d.name].push(lin2);
      }
      //openedNode[d.name].push(phar);
      if(dise.degree != 0){
        graph.nodes.push(dise);
        lin3 = JSON.parse('{"source":' + graph.nodes.indexOf(d) + ', "target": ' + graph.nodes.indexOf(dise) + ', "value": 1}');
        graph.links.push(lin3);
        openedNode[d.name].push(lin3);
      }
      //openedNode[d.name].push(dise);
      restartAdd();
    }

    function addTrueNode(d,type){
      // alert("Entrato nella funzione addTrueNode, chiamato da: " + d.name);
      fathers = Object.keys(openedNode);
      // alert(JSON.stringify(fathers));
      var father;

      for(index = 0; index < fathers.length; ++index){

        f = fathers[index];
        fullname = "PharOf" + f;
        // alert(fullname);
        // alert(d.name.indexOf("DiseOf"+f));
        // alert(d.name.indexOf("ChemOf"+f));
        // alert(d.name.indexOf("PharOf"+f));
        if (d.name.indexOf("ChemOf"+f) == 0){
          father = f;
          // alert(father);
          break;

        }
        if(d.name.indexOf("DiseOf"+f) == 0){
          father = f;
          // alert(father);
          break;
        }
        if(d.name.indexOf("PharOf"+f) == 0){
          father = f;
          // alert(father);
          break;
        }
          
      }
      openedNode[d.name] = [];
      // alert(father);

      var index;
      for(i =0; i<imported_nodes.length; ++i){

          if(imported_nodes[i].name.indexOf(father) == 0){
            index=i;
            break;
          }
      }

      // alert("index of father: " + index);

      toAddLink = [];
      toAddNodes = [];
      IndNodes = graph.nodes.length;
      //alert("LEN FULL GRAPH LINKS: " + FullGraph.links.source.length)

      var numlin = 0;
      for(j=0; j<imported_links.length; ++j){


        if ((imported_links[j].source == index) && (imported_nodes[imported_links[j].target].group == type)){
          
          //alert("Aggiungo");
          //alert(FullGraph.links.source[j] + " " + FullGraph.links.target[j]);
          nameNodeToAdd = imported_nodes[imported_links[j].target].name;
          groupNodeToAdd = imported_nodes[imported_links[j].target].group;
          toParse = '{"name":"' +nameNodeToAdd+ '", "group":' + groupNodeToAdd + '}';
          toAddNodes.push(JSON.parse(toParse));

          source = graph.nodes.indexOf(d);
          //alert(source);
          target = IndNodes;
          value = imported_links[j].value;  
          forparser = '{"source":' + source + ', "target":' + target + ', "value":' + value + '}';
          //alert(forparser);      
          lin = JSON.parse(forparser);
          IndNodes++;
          toAddLink.push(lin);
        }
      }

      // alert("---------------NUMERO NODI: " + numlin);

      // alert(toAddLink.length);
      // alert(toAddNodes.length);

      openedNode[d.name].push.apply(openedNode[d.name],toAddLink);

      graph.nodes.push.apply(graph.nodes,toAddNodes);
      graph.links.push.apply(graph.links,toAddLink);

      restartAdd();

    }

    function removeNodes(d){

      //alert("Lunghezza link prima removeNodes:"+ link.data().length);
      //alert("Lunghezza node prima removeNodes:"+ node.data().length);

      toremove = openedNode[d.name];
      //alert(toremove.length);

      toremove.forEach(function(link) {

          graph.nodes.splice(graph.nodes.indexOf(link.target),1);
          graph.links.splice(graph.links.indexOf(link),1);

      });

      delete openedNode[d.name];

      //alert("Lunghezza link dopo removeNodes:"+ graph.links.length);
      //alert("Lunghezza node dopo removeNodes:"+ graph.nodes.length);
      

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
        .style("stroke-width", function(d) { return stroke_width; });

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
        .on("dblclick",function(d){
          //alert("clicked "+ d.name);
          //alert("openedNode " + openedNode[d.name]);

          if (d.name.indexOf("ChemOf") > -1){

              if (!(d.name in openedNode) || openedNode[d.name] == 0){
                // alert("Inserisco nodi di: "+ d.name);
                addTrueNode(d,4);
                return;
              }else{
                //alert("Rimuovo nodi di: "+ d.name);
                removeNodes(d);
                return;
              }
          }
          if (d.name.indexOf("PharOf") > -1){

              if (! (d.name in openedNode) || openedNode[d.name] == 0 ){
                // alert("Inserisco nodi di: "+ d.name);
                addTrueNode(d,3);
                return;
              }else{
               //alert("Rimuovo nodi di: "+ d.name);
                removeNodes(d);
                return;
              }
          }
          if (d.name.indexOf("DiseOf") > -1){
            
            if (! (d.name in openedNode) || openedNode[d.name] == 0 ){
                // alert("Inserisco nodi di: "+ d.name);
                addTrueNode(d,2);
                return;
              }else{
                //alert("Rimuovo nodi di: "+ d.name);
                removeNodes(d);
                return;
              }
          }
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
            //alert(nodeSize(d));
            if(d.group!=1){
              if (d.name.indexOf("ChemOf") > -1){
                  return nodeSize(d);
              }
              if (d.name.indexOf("PharOf") > -1){
                  return nodeSize(d);
              }
              if (d.name.indexOf("DiseOf") > -1){
                  return nodeSize(d);
              }
              return nodeSize(d)+5;
            }else{
              return nodeSize(d);
            }
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
      }else{
        if (d.group==1){
          return maxdim;
        }else{
          return defaultdim;
        } 
      }
    }

    function getText(d){
      name = d.name;
      if (d.name.indexOf("ChemOf") > -1){
        return "Chemical ("+ ((d.degree*100)/numChem).toFixed(2) +"%)";
      }
      if (d.name.indexOf("PharOf") > -1){
        return "Drug ("+ ((d.degree*100)/numDrug).toFixed(2) +"%)";
      }
      if (d.name.indexOf("DiseOf") > -1){
        return "Disease ("+ ((d.degree*100)/numDise).toFixed(2) +"%)";
      }
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
    
    function LinkOver(){

    l = d3.select(this);

    l.select(".link")
            .style("opacity", options.opacity);

    l.select(".link").transition()
        .duration(750);
      //console.log(d3.select(this).select("text"));


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
    
  }//end render
}) //end htmlwidget
  
  

