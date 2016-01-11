library(shiny)
library(nanocluster)

shinyServer(function(input, output) {
  output$nanocluster <- renderNanoCluster(nanocluster("/home/marco/BioInf_Project/nano_cluster.json"))
})
