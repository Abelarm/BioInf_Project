library(shiny)
library(nanocluster)

shinyServer(function(input, output) {
  output$nanocluster <- renderNanoCluster(nanocluster)
})
