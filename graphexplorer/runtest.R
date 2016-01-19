devtools::install()
library(graphexplorer)
load("~/dataframe_graph_explorer.RData")
graphexplorer(Links = edges, Nodes = nodes, Source = "source", Target = "target", Value = "value", NodeID = "name", Group = "group", opacity = 1, zoom = T, bounded = T, legend = T)

