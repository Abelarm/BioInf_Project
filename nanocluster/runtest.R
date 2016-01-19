devtools::install()
library(nanocluster)
load("~/wkspace_labels_strings.RData")
nanocluster(Links = trueLinks, Nodes = trueNodes, Source = "source", Target = "target", Value = "value", NodeID = "name", Group = "group", opacity = 1, zoom = T, bounded = T, legend = T, linkDistance = JS(paste0("function(d){return d.value*",50,"}")));

