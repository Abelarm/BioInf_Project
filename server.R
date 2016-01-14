library(shiny)
library(nanocluster)
setwd("~/BioInf_Project/")

shinyServer(function(input, output) {
  DEBUGGING = TRUE
  
  UI_query(input,output,nano,drugs,chemical,disease)
  
  source("global.R")
  load("www/nano_based_clustering.RData")
  load("www/graph_without_genes_also_intra_classes_edges_network_estimation80_2.RData")
  load("www/entities.RData")
  load("www/join10.RData")
  load("www/chemicals_classes.RData")
  
  rm(W2_ADJ)
  
  observeEvent(input$action1, {
      res = ADJ_matrix(W_ADJ, input,output,nano,drugs,chemical,disease,chemMat,join10)
      ADJ2 = res$ADJ2
      g_clust = res$g_clust
      
      
      data_frame = from_igraph_to_data_frame(g_clust,ADJ2)
      edges = data_frame$edges
      vertices = data_frame$vertices
    
      output$cluster_output<- renderNanoCluster(
                  nanocluster(Links = edges, Nodes = vertices,
                   Source = "source", Target = "target",
                   Value = "value", NodeID = "name",
                   Group = "group",zoom = TRUE,opacity = 0.95,fontSize = 10,
                   legend = TRUE,
                   charge = -input$repulseration,
                   linkDistance = JS(paste0("function(d){return d.value*",input$edge_length,
                                            "}")))
                   )
  })
  
})
