devtools::install()
library(graphexplorer)
load("~/graphexplorer.RData")
graphexplorer(Links = trueLinks, Nodes = trueNodes, Source = "source", Target = "target", Value = "value", NodeID = "name", Group = "group", opacity = 1, zoom = T, bounded = T, legend = T)

