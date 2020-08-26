#########################
#### ${PROJECT_NAME} ####
#########################

params <- c("${PROJECT_FOLDER_FILEPATH}",
            "${ASSIGN_DATA_TYPE_FILENAME}",
            "${OUTPUT_DATA_SET_FILENAME}")


setwd(params[1])

# reading in data types 
data_types_file <- read.csv(file = params[2],  
                            na.strings = "",                    
                            colClasses = "character")            

# creating a named character vector to use in assigning character and Date types
data_types <- data_types_file[, 2]             
names(data_types) <- data_types_file[, 1]  
data_types <- data_types[data_types=="character" | data_types=="Date"]     

# importing data set and assigning datatypes
analytic_data <- read.csv(file = params[3],
                          na.strings = "",
                          stringsAsFactors = FALSE,
                          colClasses = data_types)
