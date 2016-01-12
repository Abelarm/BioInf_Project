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

    // Compute the node radius  using the javascript math expression specified
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

    force
        .charge(-400)
        .linkDistance(50)
        .friction(0.95)
        .size([width, height]);

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    var link,node,gnodes,FullGraph;
    var openedNode = {};
    var numChem=0,numDrug=0,numDise=0;

      FullGraph = JSON.parse(JSON.stringify(x));;
      console.log(fullgraph);
      console.log("LEN FULL GRAPH LINKS: " + fullgraph.links.length)

      graph = JSON.parse('{"nodes":[], "links":[]}');

      nodi = [];
      linki = [];
      nod_len = FullGraph.nodes.length;
      for (index = 0; index < nod_len; ++index) {
        nd = fullgraph.nodes[index]
        if (nd.group==1){
          newnd = JSON.parse(JSON.stringify(nd));
          nodi.push(newnd);
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

      for (var i = 0; i < FullGraph.links.length; i++) {
        ln=FullGraph.links[i]
        if((ln.source<=28) && ((ln.target<=28))){
          linki.push(ln);
        }
      };
      //console.log(nodi);
      //console.log(linki);

      graph.nodes = nodi;
      graph.links = linki;

      //console.log(graph);

      force
        .nodes(graph.nodes)
        .links(graph.links);

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
          .on("dblclick", function(d){
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
                    //console.log("Rimuovo "+name);
                    removeNodes(graph.nodes[i]);
                    //console.log("-------FATTO-------");
                    break;
                  }
                }

              }
              if (("PharOf"+d.name) in openedNode){
                name = "PharOf"+d.name;
                for(i =0; i<graph.nodes.length; ++i){
                  if(graph.nodes[i].name = name){
                    //console.log("Rimuovo "+name);
                    removeNodes(graph.nodes[i]);
                    //console.log("-------FATTO-------");
                    break;
                  }
                }
              }
              if (("DiseOf"+d.name) in openedNode){
                name = "DiseOf"+d.name;
                for(i =0; i<graph.nodes.length; ++i){
                  if(graph.nodes[i].name = name){
                    //console.log("Rimuovo "+name);
                    removeNodes(graph.nodes[i]);
                    //console.log("-------FATTO-------");
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
          

      //console.log(gnodes);
      console.log(node);
      

      force.on("tick", function() {
        //console.log("entro");
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
          
      });

      force.on("end",function(){

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

      });

      force.start();
  }

      function addNodes(d){
        //console.log(d);

        //d.append("Opened","True");
        
        chem = JSON.parse(JSON.stringify(d));
        chem.name = "ChemOf"+d.name;
        chem.group = 4;
        chemdegree = countDegree(d,chem.group);
        chem.degree = chemdegree;
        chem.dim = Math.floor(chemdegree/6);
        //console.log("Degree: "+chemdegree + " Dim: " + chem.dim);

        phar = JSON.parse(JSON.stringify(d));
        phar.name = "PharOf"+d.name;
        phar.group = 3;
        phardegree = countDegree(d,phar.group);
        console.log("---------------------"+ (numDrug/phardegree));
        phar.degree = phardegree;
        phar.dim = Math.floor(phardegree/6);
        //console.log("Degree: " +phardegree + " Dim: " + phar.dim);

        dise = JSON.parse(JSON.stringify(d));
        dise.name = "DiseOf"+d.name;
        dise.group = 2;
        disedegree = countDegree(d,dise.group);
        dise.degree = disedegree;
        dise.dim = Math.floor(disedegree/6);
        //console.log("Degree: "+disedegree + " Dim: " + dise.dim);

        graph.nodes.push(chem);
        
        //openedNode[d.name].push(chem);
        graph.nodes.push(phar);
        
        //openedNode[d.name].push(phar);
        graph.nodes.push(dise);
        //openedNode[d.name].push(dise);
     
        lin1 = JSON.parse('{"source":' +  nodi.indexOf(d) + ', "target": ' + nodi.indexOf(chem) + ', "value": 1}');
        graph.links.push(lin1);
        openedNode[d.name].push(lin1);
        lin2 = JSON.parse('{"source":' + nodi.indexOf(d)+ ', "target": ' + nodi.indexOf(phar) + ', "value": 1}');
        graph.links.push(lin2);
        openedNode[d.name].push(lin2);
        lin3 = JSON.parse('{"source":' + nodi.indexOf(d) + ', "target": ' + nodi.indexOf(dise) + ', "value": 1}');
        graph.links.push(lin3);
        openedNode[d.name].push(lin3);

        console.log(graph.nodes);
        console.log(graph.links);

        restartAdd();
      }

      function addTrueNode(d,type){

        fathers = Object.keys(openedNode);

        var father;

        for(index = 0; index < fathers.length; ++index){

          f = fathers[index];

          if (d.name == ("ChemOf"+f.name)){

            father = f;
            break;

          }else{
            
            if (d.name == ("PharOf"+f.name)){

              father = f;
              break;

            }else{

              father = f;
              break;

              }
            }
        }

        

        var index;
        for(i =0; i<FullGraph.nodes.length; ++i){

            console.log(father);
            console.log(FullGraph.nodes[i].name);
            console.log(FullGraph.nodes[i].name == father);
            if(FullGraph.nodes[i].name == father){
              index=i;
              break;
            }
        }

        //console.log("Father: " +father);
        //console.log("index of father: " + index);

        toAddLink = [];
        toAddNodes = [];
        IndNodes = graph.nodes.length;
        console.log("LEN FULL GRAPH LINKS: " + FullGraph.links.length)

        var numlin = 0;
        for(j=0; j<FullGraph.links.length; ++j){


          if ((FullGraph.links[j].source == index) && (FullGraph.nodes[FullGraph.links[j].target].group == type)){
            
            //console.log("Aggiungo");
            //console.log(FullGraph.links[j]);
            toAddNodes.push(JSON.parse(JSON.stringify(FullGraph.nodes[FullGraph.links[j].target])));

            lin = JSON.parse(JSON.stringify(FullGraph.links[j]));
            lin.source = graph.nodes.indexOf(d);
            lin.target = IndNodes;
            IndNodes++;
            toAddLink.push(lin);
          }
        }

        //console.log("---------------NUMERO NODI: " + numlin);

        console.log(toAddLink.length);
        console.log(toAddNodes.length);

        openedNode[d.name].push.apply(openedNode[d.name],toAddLink);

        graph.nodes.push.apply(graph.nodes,toAddNodes);
        graph.links.push.apply(graph.links,toAddLink);

        restartAdd();

      }

      function removeNodes(d){

        console.log("Lunghezza link prima removeNodes:"+ link.data().length);
        console.log("Lunghezza node prima removeNodes:"+ node.data().length);

        toremove = openedNode[d.name];
        //console.log(toremove.length);

        toremove.forEach(function(link) {

            graph.nodes.splice(graph.nodes.indexOf(link.target),1);
            graph.links.splice(graph.links.indexOf(link),1);

        });

        delete openedNode[d.name];

        console.log("Lunghezza link dopo removeNodes:"+ graph.links.length);
        console.log("Lunghezza node dopo removeNodes:"+ graph.nodes.length);
        

        restartRemove();

      }

      function restartAdd(){

        console.log("Lunghezza link prima restart:"+ link.data().length);
        console.log("Lunghezza node prima restart:"+ node.data().length);

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
          .style("stroke-width", function(d) { return stroke_width; });

        console.log("Lunghezza link dopo restart:"+  link.data().length);
        gnodes = gnodes.data(graph.nodes);

        var wrongnode =gnodes.enter()
          .append("g")
            .classed('gnode', true)
            .attr("dim",function(d){
              console.log(nodeSize(d));
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
            //console.log(d);
            return color(d.group); 
          })
          .on("dblclick",function(d){

            console.log("clicked "+ d.name);
            console.log("openedNode " + openedNode[d.name]);

            if (d.name.indexOf("ChemOf") > -1){

                if (!(d.name in openedNode) || openedNode[d.name] == 0){
                  console.log("Inserisco nodi di: "+ d.name);
                  openedNode[d.name] = [];
                  addTrueNode(d,4);
                  return;
                }else{
                  console.log("Rimuovo nodi di: "+ d.name);
                  removeNodes(d);
                  return;
                }
            }
            if (d.name.indexOf("PharOf") > -1){

                if (! (d.name in openedNode) || openedNode[d.name] == 0 ){
                  console.log("Inserisco nodi di: "+ d.name);
                  openedNode[d.name] = [];          
                  addTrueNode(d,3);
                  return;
                }else{
                  console.log("Rimuovo nodi di: "+ d.name);
                  removeNodes(d);
                  return;
                }
            }
            if (d.name.indexOf("DiseOf") > -1){
              
              if (! (d.name in openedNode) || openedNode[d.name] == 0 ){
                  console.log("Inserisco nodi di: "+ d.name);
                  openedNode[d.name] = [];
                  addTrueNode(d,2);
                  return;
                }else{
                  console.log("Rimuovo nodi di: "+ d.name);
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
      
        console.log("Gnode");
        console.log(gnodes);
        console.log("gnodes_data")
        console.log(gnodes.data());
        console.log("node");
        console.log(node);
        console.log("node_data");
        console.log(node.data());

        console.log("Lunghezza node dopo restart:"+ node.data().length);
        force.stop();
        force.start();
      }

      function restartRemove(){

        console.log("Lunghezza link prima restart:"+ link.data().length);
        console.log("Lunghezza node prima restart:"+ node.data().length);

        link = link.data(graph.links);

        link.exit()
            .remove();

        link.enter()
          .insert("line", ".node")
          .attr("class", "link")
          .style("stroke-width", function(d) { return d.value; });

        console.log("Lunghezza link dopo restart:"+  link.data().length);
        gnodes = gnodes.data(graph.nodes);

        gnodes.exit()
            .remove(); 

        
        console.log("gnodes");
        console.log(gnodes);
        console.log("gnodes_data");
        console.log(gnodes.data());
        node = node.data(gnodes.data());
        console.log("nodes");
        console.log(node);
        console.log("nodes_data");
        console.log(node.data());
      

        console.log("Lunghezza node dopo restart:"+ node.data().length);
        force.stop();
        force.start();

      }

      function countDegree(d,type){

        for(i =0; i<FullGraph.nodes.length; ++i){

            if(FullGraph.nodes[i].name == d.name){
              index=i;
              break;
            }
        }
        degree =0;
        for(j=0; j<FullGraph.links.length; ++j){

          if ((FullGraph.links[j].source == index) && (FullGraph.nodes[FullGraph.links[j].target].group == type))
            degree++;
        }

        return degree;

      }

      function mouseover() {
          d3.select(this).select("circle").transition()
            .duration(750)
            .attr("r", function(d){return nodeSize(d)+5;});
          //console.log(d3.select(this).select("text"));

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
              //console.log(nodeSize(d));
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
          //console.log(d3.select(this).select("text"));
          d3.select(this).select("text")
          .transition()
            .duration(1250)
            .style("font", options.fontSize + "px ") 
            .style("opacity", options.opacityNoHover)
            .remove();

        }

      function nodeSize(d){
        //console.log(d);
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
});
