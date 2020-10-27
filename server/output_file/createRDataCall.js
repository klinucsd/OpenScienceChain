
const fs = require('fs');
const path = require('path');
const sas_data_call_template = path.join(__dirname, '../../templates/Template_R_Data_Call.R');

function createRDataCall(project, dir, filename, shared_dir) {

    let data = fs.readFileSync(sas_data_call_template, 'UTF-8');

    data = data.replace(
        '${PROJECT_NAME}',
        `${project.name}`);

    data = data.replace(
        '${PROJECT_FOLDER_FILEPATH}',
        `${shared_dir}`);

    data = data.replace(
        '${ASSIGN_DATA_TYPE_FILENAME}',
        `${dir.replace('/OutputData', 'O:')}/${filename}_formats.csv`);

    data = data.replace(
        '${OUTPUT_DATA_SET_FILENAME}',
        `${dir.replace('/OutputData', 'O:')}/${filename}_analytic_data.csv`);

    var rOutputFile = fs.createWriteStream(`${shared_dir}/${filename}_R_data_call.R`);
    rOutputFile.write(data);
    rOutputFile.end();

}

module.exports = createRDataCall;


