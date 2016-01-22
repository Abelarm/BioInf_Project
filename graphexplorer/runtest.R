devtools::install()
library(graphexplorer)
load("~/thr_network/edges_vertices_dummy_nodes_th.RData")
graphexplorer(Links = edges, Nodes = vertices, Source = "source", Target = "target", Value = "value", NodeID = "name", Group = "type", opacity = 1, zoom = T, bounded = T, legend = T)

