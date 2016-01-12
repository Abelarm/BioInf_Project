library(shiny)
library(nanocluster)

shinyUI(fluidPage(
  titlePanel("Nanocluster"),
    mainPanel(nanoClusterOutput("nanocluster"))
))
