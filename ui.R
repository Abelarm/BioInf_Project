library(shiny)
library(nanocluster)

ui = shinyUI(fluidPage(
  nanoClusterOutput('nanocluster')
))

server = function(input, output) {
  output$nanocluster <- renderNanoCluster(nanocluster())
}

shinyApp(ui = ui, server = server)
