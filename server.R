shinyServer(function(input, output) {
 
  
  UI_query(input,output,nano,drugs,chemical,disease)
  
  
  observeEvent(input$action1, {
      res = ADJ_matrix(W_ADJ, input,output,nano,drugs,chemical,disease,chemMat,join10)
      ADJ2 = res$ADJ2
      g_clust = res$g_clust
      
      message("class(g_clust)",class(g_clust),"\n")
      
      data_frame = from_igraph_to_data_frame(g_clust,ADJ2)
      edges = data_frame$edges
      vertices = data_frame$vertices
      
      message("class(g_clust)",class(g_clust),"\n")
            
      output$cluster_output<- renderNanoCluster(
                  nanocluster(Links = edges, Nodes = vertices,
                   Source = "source", Target = "target",
                   Value = "value", NodeID = "name",
                   Group = "group",zoom = TRUE,opacity = 0.95,fontSize = 20,
                   legend = TRUE,
                   charge = -input$repulseration,
                   linkDistance = JS(paste0("function(d){return d.value*",input$edge_length,
                                            "}")))
                   )

  })
  
})

# forceNetwork(Links = edges, Nodes = vertices,
#             Source = "source", Target = "target",
#             Value = "value", NodeID = "name",
#             Group = "group",zoom = TRUE,opacity = 0.95,fontSize = 20,
#             legend = TRUE,
#             charge = -500,
#             linkDistance = JS(paste0("function(d){return d.value*",2,
#                                      "}")))

# nanocluster(Links = edges, Nodes = vertices,
#             Source = "source", Target = "target",
#             Value = "value", NodeID = "name",
#             Group = "group",zoom = TRUE,opacity = 0.95,fontSize = 20,
#             legend = TRUE,
#             charge = -500,
#             linkDistance = JS(paste0("function(d){return d.value*",2,
#                                      "}")))

