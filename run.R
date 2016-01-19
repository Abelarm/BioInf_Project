library(shiny)
library(nanocluster)
library(igraph)
setwd("~/")

source("BioInf_Project/global.R")
load("BioInf_Project/www/nano_based_clustering.RData")
load("BioInf_Project/www/graph_without_genes_also_intra_classes_edges_network_estimation80_2.RData")
load("BioInf_Project/www/entities.RData")
load("BioInf_Project/www/join10.RData")
join10 = unique(join10)
join10$ATC_lev1 = substr(x = join10$code,start = 1,stop = 1)
load("BioInf_Project/www/chemicals_classes.RData")
rm(W2_ADJ)
DEBUGGING = TRUE

runApp("./BioInf_Project")
