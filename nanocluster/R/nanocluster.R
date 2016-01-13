#' @import htmlwidgets
#' @export
nanocluster <- function(Links,
                        Nodes,
                        Source,
                        Target,
                        Value,
                        NodeID,
                        Nodesize,
                        Group,
                        height = NULL,
                        width = NULL,
                        fontSize = 7,
                        fontFamily = "serif",
                        linkDistance = 50,
                        charge = -120,
                        linkColour = "#666",
                        opacity = 0.6,
                        zoom = FALSE,
                        legend = FALSE,
                        bounded = FALSE,
                        opacityNoHover = 0,
                        clickAction = NULL)
{
  # Subset data frames for network graph
  if (!is.data.frame(Links)) {
    stop("Links must be a data frame class object.")
  }
  if (!is.data.frame(Nodes)) {
    stop("Nodes must be a data frame class object.")
  }
  if (missing(Value)) {
    LinksDF <- data.frame(Links[, Source], Links[, Target])
    names(LinksDF) <- c("source", "target")
  }
  else if (!missing(Value)) {
    LinksDF <- data.frame(Links[, Source], Links[, Target], Links[, Value])
    names(LinksDF) <- c("source", "target", "value")
  }
  if (!missing(Nodesize)){
    NodesDF <- data.frame(Nodes[, NodeID], Nodes[, Group], Nodes[, Nodesize])
    names(NodesDF) <- c("name", "group", "nodesize")
    nodesize = TRUE
  }else{
    NodesDF <- data.frame(Nodes[, NodeID], Nodes[, Group])
    names(NodesDF) <- c("name", "group")
    nodesize = FALSE
  }
  LinksDF <- data.frame(LinksDF, colour=linkColour)
  LinksDF$colour = as.character(LinksDF$colour)
  
  # create options
  options = list(
    NodeID = NodeID,
    Group = Group,
    fontSize = fontSize,
    fontFamily = fontFamily,
    clickTextSize = fontSize * 2.5,
    linkDistance = linkDistance,
    charge = charge,
    # linkColour = linkColour,
    opacity = opacity,
    zoom = zoom,
    legend = legend,
    nodesize = nodesize,
    bounded = bounded,
    opacityNoHover = opacityNoHover,
    clickAction = clickAction
  )
  
  # create widget
  htmlwidgets::createWidget(
    name = "nanocluster",
    x = list(links = LinksDF, nodes = NodesDF, options = options),
    width = width,
    height = height,
    htmlwidgets::sizingPolicy(padding = 10, browser.fill = TRUE),
    package = "nanocluster"
  )
}

# Binding for shiny
#' @export
nanoClusterOutput <- function(outputId, width = "100%", height = "500px") {
  shinyWidgetOutput(outputId, "nanocluster", width, height, package = "nanocluster")
}

#' @export
renderNanoCluster <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { 
    expr <- substitute(expr) 
  } 
  # force quoted
  shinyRenderWidget(expr, nanoClusterOutput, env, quoted = TRUE)
}
