devtools::install()
library(graphexplorer)
load("~/wkspace.RData")
graphexplorer(Links = trueLinks, Nodes = trueNodes, Source = "source", Target = "target", Value = "value", NodeID = "name", Group = "group", opacity = 1, zoom = F, bounded = T)

