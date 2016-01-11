library(shiny)
library(nanocluster)

shinyUI(fluidPage(
  
  titlePanel("Shiny nanocluster"),
  
  sidebarLayout(
    sidebarPanel(
      numericInput("opacity", "Opacity", 0.6, min = 0.1, max = 1, step = .1)
    ),
    mainPanel(
      tabsetPanel(
        tabPanel("Nanocluster", nanoClusterOutput("nanocluster"))
      )
    )
  )
))
