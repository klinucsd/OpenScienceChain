
const fs = require('fs');
const parse = require('csv-parse');
const path = require('path');
const {Parser} = require('json2csv');
const sas_data_type_format = path.join(__dirname, '../../templates/MASTER_SSAP_Dictionary_for_users_08122020.csv');

const convertCsvToXlsx = require('@aternus/csv-to-xlsx');

function createSSAPDictionary(project, final_columns, dir, filename, shared_dir) {

    fs.readFile(sas_data_type_format, function (err, fileData) {
        parse(fileData, {columns: true, trim: true}, function(err, rows) {

            //console.log(JSON.stringify(rows, null, 2));

            var csvFile = fs.createWriteStream(`${shared_dir}/${filename}_dictionary.csv`);
            const json2csv = new Parser();

            for (var i=0; i<rows.length; i++) {
                if (final_columns.includes(rows[i]["Variable name"])) {
                    let csv = json2csv.parse(rows[i]);
                    if (i !== 0) {
                        let csv_array = csv.split('\n');
                        for (var j=1; j<csv_array.length; j++) {
                            csvFile.write(csv_array[j] + '\n');
                        }
                        //csv = csv.split('\n')[1];
                    } else {
                        csvFile.write(csv + '\n');
                    }

                    //csvFile.write(csv + '\n');
                }
            }

            csvFile.on('finish', () => {
                try {
                    convertCsvToXlsx(`${shared_dir}/${filename}_dictionary.csv`,
                        `${shared_dir}/${filename}_dictionary.xlsx`);
                    fs.unlinkSync(`${shared_dir}/${filename}_dictionary.csv`);
                } catch (e) {
                }
            });
            csvFile.end();


        })
    })
}

module.exports = createSSAPDictionary;


