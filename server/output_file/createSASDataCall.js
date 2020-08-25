
const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const sas_data_call_template = path.join(__dirname, '../../templates/Template_SAS_Data_Call.sas');

function createSASDataCall(project, dir, filename, shared_dir) {

    let data = fs.readFileSync(sas_data_call_template, 'UTF-8');
    data = data.replace(
        'ASSIGN_DATA_TYPE_CODE.SAS',
        `${dir}/${filename}_assign_data_type_code.sas`);

    var sasOutputFile = fs.createWriteStream(`${shared_dir}/${filename}_SAS_data_call.sas`);
    sasOutputFile.write(data);
    sasOutputFile.end();

}

module.exports = createSASDataCall;


