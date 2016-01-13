devtools::install()
library(nanocluster)
load("~/wkspace.RData")
nanocluster(Links = trueLinks, Nodes = trueNodes, Source = "source", Target = "target", Value = "value", NodeID = "name", Group = "group", opacity = 1, zoom = F, bounded = T)

