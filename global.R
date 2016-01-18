ATC_choice_list = list("ALL" = "ALL",
                       "(A) Alimentary tract and metabolism" = "A", 
                       "(C) Cardiovascular system" = "C", 
                       "(D) Dermatologicals" = "D",
                       "(G) Genito-urinary system and sex hormones" = "G",
                       "(H) Systemic hormonal preparations, excluding sex hormones and insulins" = "H",
                       "(J) Antiinfective for systemic use" = "J",
                       "(L) Antineoplastic and immunomodulating agents" = "L",
                       "(M) Musculo-skeletal system" = "M",
                       "(N) Nervous system" = "N",
                       "(P) Antiparasitics products, insecticides and repellent" = "P",
                       "(R) Respiratory system" = "R",
                       "(S) Sensory organs" = "S")

ATC_letter_vector = c("A","C","D","G","H","J","L","M","N","P","R","S")

chemical_choice_list = list("ALL" = "ALL",
                            "Amino acids" = "Amino acids",
                            "Biological factor" = "Biological factor",
                            "Carbohydrates" = "Carbohydrates",
                            "Nucleic Acids" = "Nucleic Acids",
                            "Chemical Actions" = "Chemical Actions",
                            "Complex Mixtures" = "Complex Mixtures",
                            "Enzymes and Coenzymes" = "Enzymes and Coenzymes",
                            "Heterocyclic Compounds" = "Heterocyclic Compounds",
                            "Hormones" = "Hormones",
                            "Inorganic Chemicals" = "Inorganic Chemicals",
                            "Lipids" = "Lipids",
                            "Organic Chemicals" = "Organic Chemicals",
                            "Polycyclic Compounds" = "Polycyclic Compounds")

chemical_group_vector = c("Amino acids","Biological factor","Carbohydrates","Nucleic Acids","Chemical Actions","Complex Mixtures",
                          "Enzymes and Coenzymes","Heterocyclic Compounds","Hormones","Inorganic Chemicals","Lipids",
                          "Organic Chemicals","Polycyclic Compounds")

UI_query = function(input,output,nano,drugs,chemical,disease){
  output$nano_input = renderUI({
    selectizeInput('nano_input', label = "Nanomaterials", choices = c("ALL",nano), multiple = TRUE,
                   options = list(create = TRUE),selected= "MWCNT")
  })
  
  output$drug_input = renderUI({
    selectizeInput('drug_input', label = "Drugs", choices = c(unlist(ATC_choice_list),drugs), multiple = TRUE,
                   options = list(create = TRUE))
  })
  
  output$disease_input = renderUI({
    selectizeInput('disease_input', label = "Diseases", choices = c("ALL",disease), multiple = TRUE,
                   options = list(create = TRUE))
  })
  
  output$chemical_input = renderUI({
    selectizeInput('chemical_input', label = "Chemicals", choices = c(unlist(chemical_choice_list),chemical), multiple = TRUE,
                   options = list(create = TRUE))
  })
}

from_igraph_to_data_frame= function(g_clust,ADJ2){

  
  edges = get.data.frame(x = g_clust,what = "edge")
  colnames(edges) = c("source","target","value")
  vertices = data.frame(V(g_clust)$name,V(g_clust)$type)
  colnames(vertices) = c("name","group")
  vertices$size = igraph::degree(g_clust)
  
  edges$source = match(edges$source,vertices$name) - 1
  edges$target = match(edges$target,vertices$name) - 1
  
  return(list(edges=edges,vertices=vertices))
}

ADJ_matrix = function(W_ADJ,input,output,nano,drugs,chemical,disease,chemMat,join10,nNano = 29,nNodes = 3866){
  ADJ = matrix(0,length(cluster),length(cluster))
  rownames(ADJ) = colnames(ADJ) = V(graph_gw)$name
  
  for(i in 1:nNano){
    idx = which(cluster==i)
    ADJ[i,idx]=1
    ADJ[idx,i]=1
  }
  
  ADJ2 = ADJ * as.matrix(W_ADJ)
  ADJ2[1:nNano,1:nNano] = W_ADJ[1:nNano,1:nNano]
  
  CQN = conditional_query_nodes(input,output,TRUE,nano,drugs,chemical,disease,chemMat,join10)
  selected_nodes = CQN$selected_nodes
  
  message("ADJ_matrix. selected_nodes: ",selected_nodes,"\n")
  
  if(length(selected_nodes)< nNodes){
    clustering_idx = unique(cluster[selected_nodes])
    sel_n = names(cluster)[cluster %in% clustering_idx]
    sel_n = unique(c(selected_nodes,sel_n)) 
    ADJ2 = ADJ2[sel_n,sel_n]
    nano_selected = sel_n[sel_n %in% nano]
    ADJ2[nano_selected,nano_selected] = W_ADJ[nano_selected,nano_selected]
    
    message("dim(ADJ2) ",dim(ADJ2),"\n")
    
    g_clust = graph.adjacency(adjmatrix = ADJ2,mode = "undirected",weighted = TRUE)
    idx_n = which(colnames(ADJ2) %in% nano)
    idx_dr = which(colnames(ADJ2) %in% drugs)
    idx_c = which(colnames(ADJ2) %in% chemical)
    idx_di = which(colnames(ADJ2) %in% disease)
    
    V(g_clust)$type = rep("nano",dim(ADJ2)[1])
    V(g_clust)$type[idx_dr] ="drugs"
    V(g_clust)$type[idx_c] ="chem"
    V(g_clust)$type[idx_di] ="dise"
    
    message("V(g_clust)$type  ",V(g_clust)$type ,"\n")
    return(list(ADJ2=ADJ2,g_clust=g_clust))
    

  }else{
    g_clust = graph.adjacency(adjmatrix = ADJ2,mode = "undirected",weighted = TRUE)
    V(g_clust)$type = V(graph_gw)$type  
    return(list(ADJ2=ADJ2,g_clust=g_clust))
    
  }
  
}

conditional_query_nodes = function(input,output,DEBUGGING,nano,drugs,chemical,disease,chemMat,join10){
  selected_nodes = c()
  disease_list = list()
  
  xx = paste(input$nano_input,input$drug_input, input$chemical_input, input$disease_input,sep="")
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes. Concatenazione: ",xx,"\n")
    message("query_utilities::conditional_query_nodes. length(xx): ",length(xx),"\n")
  }
  if(length(xx)==0){
    output$info2_1 <- renderUI({
      HTML("Please insert at least one object for the query!")
    }) 
    validate(need(length(xx)>0, "Please insert at least one object for the query!"))
  }
  
  nano_query = input$nano_input
  if(length(nano_query) !=0 ){
    if(nano_query=="ALL"){
      nano_query = nano
    }
  }
  
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes {nano_query = ",nano_query, "}\n")
  }
  
  drug_query = input$drug_input
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes {drug_query before checking= ",drug_query, "}\n")
  }
  
  if(length(drug_query) !=0 ){
    if(drug_query=="ALL"){
      drug_query = drugs
    }
    if(drug_query=="A" || drug_query=="C" || drug_query=="D" || 
         drug_query=="G" || drug_query=="H" || drug_query=="J" || 
         drug_query=="L" || drug_query=="M" || drug_query=="N" ||
         drug_query=="P" || drug_query=="R" || drug_query=="S"){
      index_D= which(join10$ATC_lev1 ==drug_query)
      drug_query = unique(join10[index_D,]$name)
    }
  }
  
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes {drug_query = ",drug_query, "}\n")
  }
  
  chemical_query = input$chemical_input
  if(length(chemical_query) != 0){
    if(chemical_query=="ALL"){
      chemical_query = chemical
    }
    if(chemical_query %in% names(table(chemMat[,2]))){
      index_C = which(chemMat[,2] == chemical_query)
      chemical_query = unique(chemMat[index_C,1])
    }
  }
  
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes {chemical_query = ",chemical_query, "}\n")
  }
  
  disease_query = input$disease_input
  if(length(disease_query)!=0){
    if(disease_query=="ALL"){
      disease_query = disease
    }
  }
  
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes {disease_query = ",disease_query, "}\n")
  }
  query_nodes = c(nano_query,drug_query,disease_query,chemical_query)
  type_qn = c(rep("nano",length(nano_query)),
              rep("drugs",length(drug_query)),
              rep("disease",length(disease_query)),
              rep("chemical",length(chemical_query)))
  
  for(i in query_nodes){
    disease_list[[i]] = i
    selected_nodes = c(selected_nodes,i)
  }
  
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes {query_nodes = ",query_nodes, "}\n")
  }
  
  combination_vect=c(length(nano_query),length(drug_query),length(disease_query),length(chemical_query))
  combination_vect[combination_vect>0]=1
  names(combination_vect)=c("nano","drug","dis","chem")
  
  if(DEBUGGING){
    message("query_utilities::conditional_query_nodes {combination_vect = ",combination_vect, "}\n")
  }
  
  return(list(query_nodes=query_nodes,
              nano_query = nano_query,
              drug_query = drug_query,
              chemical_query = chemical_query,
              disease_query = disease_query,
              combination_vect=combination_vect,
              disease_list=disease_list,selected_nodes=selected_nodes))
}
