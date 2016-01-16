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
			cluster_group = "nano",
			last_level = 3,
			groups = list("nano", "dise", "drug", "chem"),
                        height = NULL,
                        width = NULL,
                        colourScale = JS("d3.scale.category20()"),
                        fontSize = 7,
                        fontFamily = "serif",
                        linkDistance = 50,
                        linkWidth = JS("function(d) { return Math.sqrt(d.value); }"),
                        radiusCalculation = JS(" Math.sqrt(d.nodesize)+6"),
                        charge = -120,
                        linkColour = "#666",
                        opacity = 0.6,
                        zoom = FALSE,
                        legend = FALSE,
                        bounded = FALSE,
                        opacityNoHover = 0,
                        clickAction = NULL)
{
  colourScale <- as.character(colourScale)
  linkWidth <- as.character(linkWidth)
  radiusCalculation <- as.character(radiusCalculation)
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
        colourScale = colourScale,
        fontSize = fontSize,
        fontFamily = fontFamily,
        clickTextSize = fontSize * 2.5,
        linkDistance = linkDistance,
        linkWidth = linkWidth,
        charge = charge,
        # linkColour = linkColour,
        opacity = opacity,
        zoom = zoom,
        legend = legend,
        nodesize = nodesize,
        radiusCalculation = radiusCalculation,
        bounded = bounded,
        opacityNoHover = opacityNoHover,
        clickAction = clickAction
  )

  #hardcoding just for tests 
  # create widget
  htmlwidgets::createWidget(
    name = "nanocluster",
    x = list(links = LinksDF, nodes = NodesDF, options = options, groups = groups, cluster_group = cluster_group, last_level = last_level),
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
