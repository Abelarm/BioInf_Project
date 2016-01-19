library(shiny)
library(nanocluster)

shinyUI(fluidPage(
  titlePanel("INSIdEnano"),
  sidebarPanel(
    fluidRow(
        column(6, uiOutput("nano_input")),
        column(6, uiOutput("drug_input"))
    ),
    fluidRow(
      column(6, uiOutput("disease_input")),
      column(6, uiOutput("chemical_input"))  
    ),
    fluidRow(
      column(9, sliderInput("repulseration", label = "Repulseration Strenght",
                            min = 100, max = 10000, value = 4000,step=1))
    ),
    fluidRow(
      column(9, sliderInput("edge_length", label = "Edge length",
                            min = 2, max = 100, value =2 ,step=1))
    ),
    fluidRow(
      column(4, actionButton("action1", label = "Start", icon=icon("search",lib = "glyphicon")))
     
    )
  ), #end Sidebar
  mainPanel(
    wellPanel(nanoClusterOutput("cluster_output"))
  )
))
