
const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const {Parser} = require('json2csv');
const sas_data_type_format = path.join(__dirname, '../../templates/MASTER_SSAP_Dictionary_for_users_08122020.csv');

function createSSAPDictionary(project, final_columns, dir, filename, shared_dir) {

    fs.readFile(sas_data_type_format, function (err, fileData) {
        parse(fileData, {columns: true, trim: true}, function(err, rows) {

            //console.log(JSON.stringify(rows, null, 2));

            var csvFile = fs.createWriteStream(`${shared_dir}/${filename}_dictionary.csv`);
            const json2csv = new Parser();

            for (var i=0; i<rows.length; i++) {
                if (final_columns.includes(rows[i]["Variable name"])) {
                    let csv = json2csv.parse(rows[i]);
                    if (i !== 1) {
                        csv = csv.split('\n')[1];
                    }
                    csvFile.write(csv + '\n');
                }
            }
            csvFile.end();
        })
    })
}

module.exports = createSSAPDictionary;


