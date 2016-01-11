library(shiny)
library(nanocluster)

ui = shinyUI(fluidPage(
  nanoClusterOutput("nanocluster")
))

server = function(input, output) {
  output$nanocluster <- renderNanoCluster()
}

shinyApp(ui = ui, server = server)