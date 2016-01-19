setwd("~/")
library(igraph)
load("inside_nano/chemicals_classes.RData")
load("inside_nano/entities.RData")
#load("inside_nano/graph_without_genes_also_intra_classes_edges_network_estimation80_2.RData")
load("inside_nano/grafo_t80.RData")
load("inside_nano/join10.RData")

tab = table(V(graph_gw)$name)
idx = which(tab>1)
graph_gw = delete.vertices(graph_gw,v = names(idx))

join10 = unique(join10); #toglie i replicati
atc_lev_1 = substring(join10$code, 1, 1)
join10 = cbind(join10, atc_lev_1)

list_of_nodes_name = igraph::get.vertex.attribute(graph_gw, name = "name")
sub_classes = c()

list_of_nodes_name = unlist(list_of_nodes_name)


for(i in 1:length(list_of_nodes_name)){
  if(list_of_nodes_name[i] %in% join10$name){
    #cat("Found drug in ", i , " position\n")
    index_of_obj = which(join10$name %in% list_of_nodes_name[i])
    sub_classes[i] = paste(join10[index_of_obj,]$atc_lev_1, collapse = ";")
    next;
  }
  if(list_of_nodes_name[i] %in% chemMat[,1]){
    #cat("Found chemical in ", i , " position\n")
    index_of_obj = which(chemMat[,1] %in% list_of_nodes_name[i])
    sub_classes[i] = paste(chemMat[index_of_obj,2], collapse = ";")
    next;
  }
  sub_classes[i] = "NC"
}

sub_classes[list_of_nodes_name %in% drugs]
table(sub_classes[list_of_nodes_name %in% disease])

graph_gw = set_vertex_attr(graph_gw, name = "subclass", value = sub_classes)
cbind(V(graph_gw)$name[2000:3800],
V(graph_gw)$subclass[2000:3800])
vcount(graph_gw)

graph_data_frame = get.data.frame(graph_gw,"both")
