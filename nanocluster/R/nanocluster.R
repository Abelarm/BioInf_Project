#' @import htmlwidgets
#' @export
nanocluster <- function(json_path, height = NULL, width = NULL){
    x = jsonlite::fromJSON(json_path)
    htmlwidgets::createWidget("nanocluster", x, width = width, height = height, htmlwidgets::sizingPolicy(padding = 10, browser.fill = TRUE), package = "nanocluster")
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
