# create widget

#' @import htmlwidgets

library(htmlwidgets)

#' @export
nanocluster <- function(height = NULL, width = NULL){
    htmlwidgets::createWidget(
        name = "nanocluster",
        width = width,
        height = height,
        htmlwidgets::sizingPolicy(padding = 10, browser.fill = TRUE)
      )
}

#' @export
nanoClusterOutput <- function(outputId, width = "100%", height = "500px") {
  shinyWidgetOutput(outputId, "nanocluster", width, height)
}

#' @export
renderNanoCluster <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { 
    expr <- substitute(expr) 
  } 
  # force quoted
  shinyRenderWidget(expr, nanoClusterOutput, env, quoted = TRUE)
}
