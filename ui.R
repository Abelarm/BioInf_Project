library(shiny)
library(nanocluster)

shinyUI(fluidPage(
  titlePanel("title panel"),
  
  sidebarLayout(
    sidebarPanel( "sidebar panel"),
    mainPanel("main panel", nanoClusterOutput("nanocluster"))
  )
))
