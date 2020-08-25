
const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const sas_data_call_template = path.join(__dirname, '../../templates/Template_R_Data_Call.R');

function createRDataCall(project, dir, filename, shared_dir) {

    let data = fs.readFileSync(sas_data_call_template, 'UTF-8');
    data = data.replace(
        '${PROJECT_FOLDER_FILEPATH}',
        `${dir}`);

    data = data.replace(
        '${ASSIGN_DATA_TYPE_FILENAME}',
        `${dir}/${filename}_assign_data_type_code.sas`);

    data = data.replace(
        '${OUTPUT_DATA_SET_FILENAME}',
        `${dir}/${filename}_analytic_data.csv`);

    var rOutputFile = fs.createWriteStream(`${shared_dir}/${filename}_R_data_call.R`);
    rOutputFile.write(data);
    rOutputFile.end();

}

module.exports = createRDataCall;


