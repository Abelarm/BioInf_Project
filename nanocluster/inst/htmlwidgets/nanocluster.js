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

    var maxdim = 20;
    var defaultdim = 5;
    var stroke_width = 2;
    var padding = 2;

    var options = {};
    var force = force;
    
    options['fontSize'] = 20;
    options['fontFamily'] = "serif";
    options['opacityNoHover'] = 0;
    options['clickTextSize'] = 25;

    var color = d3.scale.category20();
    
    var svg = d3.select(el).select("svg");    
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    var link,node,gnodes,FullGraph;
    var openedNode = {};
    var numChem=0,numDrug=0,numDise=0;
    
    FullGraph = JSON.parse(JSON.stringify(x));;

    graph = JSON.parse('{"nodes":[], "links":[]}');

    nodi = [];
    linki = [];
    
    nod_len = FullGraph.nodes.name.length;
    for (index = 0; index < nod_len; ++index) {
      nd = FullGraph.nodes.name[index];
      group = FullGraph.nodes.group[index];
      if (group==1){
        forparser = '{"name":"' +nd+ '", "group":' + group + '}';
        newnd = JSON.parse(forparser);
        nodi.push(newnd);
      }else{
        if(group==2){
          numDise++;
        }else{
          if(group==3){
            numDrug++;
          }else{
            numChem++;
          }
        }
      }
    }

    for (var i = 0; i < FullGraph.links.source.length; i++) {
      source = FullGraph.links.source[i];
      target = FullGraph.links.target[i];
      value = FullGraph.links.value[i];
      if((source<=28) && ((target<=28))){
        forparser = '{"source":' + source + ', "target":' + target + ', "value":' + value + '}';
        ln = JSON.parse(forparser);
        linki.push(ln);
      }
    };
    
    // alert(numDrug);
    // alert(numChem);
    // alert(numDise);
    //alert(nodi);
    //alert(linki);
    
    //END DATA PARSING
    
    

    graph.nodes = nodi;
    graph.links = linki;
    
    //BEGIN RENDERING
    
    var zoom = d3.behavior.zoom();

    
    force
      .nodes(graph.nodes)
      .links(graph.links)
      .charge(-400)
      .linkDistance(50)
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
      
     svg = svg
        .append("g").attr("class","zoom-layer")
        .append("g")
      
    function redraw() {
      d3.select(el).select(".zoom-layer").attr("transform",
        "translate(" + d3.event.translate + ")"+
        " scale(" + d3.event.scale + ")");
    }
    
    zoom.on("zoom", redraw);

    d3.select(el).select("svg")
      .attr("pointer-events", "all")
      .call(zoom);

    
    

    //draw links
    link = svg.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("class", "link")
        .on("mouseover", function(d) {
            d3.select(this)
              .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            d3.select(this)
              .style("opacity", 0.5);
        })
        .style("opacity",0.5)
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
            .style("stroke-width", "1.5px");


    node = gnodes
        .append("circle")
        .attr("class","node")
        .attr("r", maxdim)
        .style("fill", function(d) { return color(d.group); })
        .on("click", function(d){
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
      graph.nodes.push(chem);
      
      //openedNode[d.name].push(chem);
      graph.nodes.push(phar);
      
      //openedNode[d.name].push(phar);
      graph.nodes.push(dise);
      //openedNode[d.name].push(dise);
    
      //alert("aggiungo arco tra source = " + nodi.indexOf(d) + "e target = " + nodi.indexOf(chem));
      lin1 = JSON.parse('{"source":' +  nodi.indexOf(d) + ', "target": ' + nodi.indexOf(chem) + ', "value": 1}');
      graph.links.push(lin1);
      openedNode[d.name].push(lin1);
      //alert("aggiungo arco tra source = " + nodi.indexOf(d) + "e target = " + nodi.indexOf(phar));
      lin2 = JSON.parse('{"source":' + nodi.indexOf(d)+ ', "target": ' + nodi.indexOf(phar) + ', "value": 1}');
      graph.links.push(lin2);
      openedNode[d.name].push(lin2);
      //alert("aggiungo arco tra source = " + nodi.indexOf(d) + "e target = " + nodi.indexOf(dise));
      lin3 = JSON.parse('{"source":' + nodi.indexOf(d) + ', "target": ' + nodi.indexOf(dise) + ', "value": 1}');
      graph.links.push(lin3);
      openedNode[d.name].push(lin3);
      
      //alert("Num Archi dopo: " + graph.links.length);

      //alert(graph.nodes);
      //alert(graph.links);

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
      for(i =0; i<FullGraph.nodes.name.length; ++i){

          if(FullGraph.nodes.name[i].indexOf(father) == 0){
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
      for(j=0; j<FullGraph.links.source.length; ++j){


        if ((FullGraph.links.source[j] == index) && (FullGraph.nodes.group[FullGraph.links.target[j]] == type)){
          
          //alert("Aggiungo");
          //alert(FullGraph.links.source[j] + " " + FullGraph.links.target[j]);
          nameNodeToAdd = FullGraph.nodes.name[FullGraph.links.target[j]];
          groupNodeToAdd = FullGraph.nodes.group[FullGraph.links.target[j]];
          toParse = '{"name":"' +nameNodeToAdd+ '", "group":' + groupNodeToAdd + '}';
          toAddNodes.push(JSON.parse(toParse));

          source = graph.nodes.indexOf(d);
          //alert(source);
          target = IndNodes;
          value = FullGraph.links.value[j];  
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
              .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            d3.select(this)
              .style("opacity", 0.5);
        })
        .style("opacity",0.5)
        .style("stroke", "#000")
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
        .on("click",function(d){

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

      for(i =0; i<FullGraph.nodes.name.length; ++i){

          if(FullGraph.nodes.name[i] == d.name){
            index=i;
            //alert("found " + d.name + " at index " + i); OK
            break;
          }
      }
      degree =0;
      for(j=0; j<FullGraph.links.source.length; ++j){

        if ((FullGraph.links.source[j] == index) && (FullGraph.nodes.group[FullGraph.links.target[j]] == type))
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
        .style("opacity", 1)
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
    
  }//end render
}) //end htmlwidget
  
  

