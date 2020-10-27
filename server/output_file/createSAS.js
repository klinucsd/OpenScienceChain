
const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const sas_data_type_format = path.join(__dirname, '../../templates/MASTER_Data_Type_and_Formats.csv');

function getSASInformatvalue(rows, variable) {
    for (var i=0; i<rows.length; i++) {
        if (rows[i].Variable === variable || variable === 'participant_key' && rows[i].Variable ==='ssap_id') {
            return rows[i].SASInformat;
        }
    }
    return null;
}

function getSASFormatvalue(rows, variable) {
    for (var i=0; i<rows.length; i++) {
        if (rows[i].Variable === variable || variable === 'participant_key' && rows[i].Variable ==='ssap_id') {
            return rows[i].SASFormat;
        }
    }
    return null;
}

function getSASLabelvalue(rows, variable) {
    for (var i=0; i<rows.length; i++) {
        if (rows[i].Variable === variable || variable === 'participant_key' && rows[i].Variable ==='ssap_id') {
            return rows[i].SASLabel;
        }
    }
    return null;
}


function createSAS(project, final_columns, dir, filename) {

    fs.readFile(sas_data_type_format, function (err, fileData) {
        parse(fileData, {columns: true, trim: true}, function(err, rows) {

            //console.log(JSON.stringify(rows, null, 2));

            var csvFile = fs.createWriteStream(`${dir}/${filename}_assign_data_type_code.sas`, {
                flags: 'a'
            });

            csvFile.write('\tdata analytic_data;\n');
            csvFile.write(`\t\tinfile '${dir}/${filename}_analytic_data.csv' delimiter = ',' MISSOVER DSD firstobs=2;\n`);
            csvFile.write(`\n`);

            for (var i=0; i<final_columns.length; i++) {
                let variable = final_columns[i];
                if (variable === 'ssap_id') {
                    variable = 'participant_key';
                }
                let SASInformatvalue = getSASInformatvalue(rows, variable);
                csvFile.write(`\t\t\tinformat ${variable} ${SASInformatvalue};\n`);
            }

            csvFile.write(`\n`);
            for (var i=0; i<final_columns.length; i++) {
                let variable = final_columns[i];
                if (variable === 'ssap_id') {
                    variable = 'participant_key';
                }
                let SASFormatvalue = getSASFormatvalue(rows, variable);
                csvFile.write(`\t\t\tformat ${variable} ${SASFormatvalue};\n`);
            }

            csvFile.write(`\n`);
            for (var i=0; i<final_columns.length; i++) {
                let variable = final_columns[i];
                if (variable === 'ssap_id') {
                    variable = 'participant_key';
                }
                let SASLabelvalue = getSASLabelvalue(rows, variable);
                csvFile.write(`\t\t\tlabel ${variable}="${SASLabelvalue}";\n`);
            }

            csvFile.write(`\n`);
            csvFile.write(`\t\t\tinput\n`);
            for (var i=0; i<final_columns.length; i++) {
                let variable = final_columns[i];
                if (variable === 'ssap_id') {
                    variable = 'participant_key';
                }
                if (i < final_columns.length-1) {
                    csvFile.write(`\t\t\t\t${variable}\n`);
                } else {
                    csvFile.write(`\t\t\t\t${variable};\n`);
                }
            }

            csvFile.write(`\n`);
            csvFile.write(`\trun;\n`);
            csvFile.end();
        })
    })
}

module.exports = createSAS;


