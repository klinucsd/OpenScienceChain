
var pdf = require("pdf-creator-node");
var fs = require('fs');

let getStartOfFollowUpDisplay = (value) => {
    switch (value.start_of_follow_up) {
        case 'QNR_1_FILL_DT' :
            return 'CTS Baseline - Questionnaire 1 (1995-1996)';
        case 'QNR_2_FILL_DT' :
            return 'Questionnaire 2 (1997-1998)';
        case 'QNR_3_FILL_DT' :
            return 'Questionnaire 3 (2000-2002)';
        case 'QNR_4_FILL_DT' :
            return 'Questionnaire 4 (2005-2008)';
        case 'QNR_5_FILL_DT' :
            return 'Questionnaire 5 (2012-2015)';
        case 'QNR_6_FILL_DT' :
            return 'Questionnaire 6 (2017-2019)';
        case 'Other' :
            if (value.start_of_follow_up_specified) {
                let index = value.start_of_follow_up_specified.indexOf('T');
                return value.start_of_follow_up_specified.substr(0, index);
            } else {
                return 'Not selected';
            }
        default:
            return 'Not selected';
    }
}

let getEndOfFollowUpDisplay = (value) => {
    switch (value.end_of_follow_up) {
        case 'QNR_1_FILL_DT' :
            return 'CTS Baseline - Questionnaire 1 (1995-1996)';
        case 'QNR_2_FILL_DT' :
            return 'Questionnaire 2 (1997-1998)';
        case 'QNR_3_FILL_DT' :
            return 'Questionnaire 3 (2000-2002)';
        case 'QNR_4_FILL_DT' :
            return 'Questionnaire 4 (2005-2008)';
        case 'QNR_5_FILL_DT' :
            return 'Questionnaire 5 (2012-2015)';
        case 'QNR_6_FILL_DT' :
            return 'Questionnaire 6 (2017-2019)';
        case 'Other' :
            if (value.end_of_follow_up_specified) {
                let index = value.end_of_follow_up_specified.indexOf('T');
                return value.end_of_follow_up_specified.substr(0, index);
            } else {
                return 'Not selected';
            }
        default:
            return 'Not selected';
    }
}


function createPDF(project, variable_desciption, path, shared_dir) {

    var options = {
        format: "A4",
        orientation: "portrait",
        border: "10mm",
        header: {
            height: "0mm",
            contents: '<div style="text-align: center; font-size: 6pt; font-style: italic">California Teachers Study</div>'
        },
        "footer": {
            "height": "10mm",
            "contents": {
                default: '<div style="color: #444; text-align: center; font-size: 8pt;">{{page}}</div>',
            }
        }
    };

    var html =
        `
<!DOCTYPE html>
<html>
    <head>
        <mate charest="utf-8" />
        <title>The Data Selection for ${project.name}</title>
    </head>
    <body>
        <div style="font-size: 8pt; text-align: center; font-weight: bold;">
            The Data Selection for ${project.name}
        </div>
        
        <div style="font-size: 6pt; text-align: center; padding-top: 5pt; font-style: italic">
            version ${project.version < 10 ? '0' + project.version : project.version}
        </div>
        
        <div style="font-size: 8pt; margin-top: 10pt; text-align: center;">
        
            <div style="width: 90%; background-color: #dceafd; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Cancer Endpoints</b>             
            </div>
                    
            <table cellpadding="4pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 15pt; font-size: 6pt;">
                
                <tr>
                    <td style="text-align: left; color: #484848; width: 25%;">
                        <b>Site Group Name</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 25%;">
                        <b>SEER ID</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 25%;">
                        <b>ICD O3 CDE</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 25%;">
                        <b>Histologic Type</b
                    </td>
                </tr>
                `;

    for (var i=0; i<project.cancer_endpoint.length; i++) {
        html +=
            `
                    <tr style="background-color: ${ i%2 === 0 ? '#eee' : 'white' };">
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${project.cancer_endpoint[i].SITE_GROUP_NME}</b>
                        </td>
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${ project.cancer_endpoint[i].SEER_ID }</b>
                        </td>
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${ project.cancer_endpoint[i].ICD_O3_CDE }</b>
                        </td>
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${ project.cancer_endpoint[i].HISTOLOGIC_ICDO3_TYP }</b>
                        </td>
                    </tr>
            `;
    }

    // start of follow up
    html += `
             </table>
            
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Start of Follow-up</b>
            </div>
            `;

    //let start_of_follow_up = JSON.parse(project.start_of_follow_up);
    let start_of_follow_up = project.start_of_follow_up;
    html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Follow-up begins:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                        ${
                            start_of_follow_up.start_of_follow_up ?
                                 getStartOfFollowUpDisplay(start_of_follow_up)
                                 :
                                 'Not selected.'
                        }
                     </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Participants with prevalent cancer:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                        ${

                            start_of_follow_up.start_of_follow_up_exclude ?
                                (start_of_follow_up.start_of_follow_up_exclude === 'exclude all' ?
                                    'Exclude all participants who had a prevalent cancer of any type at the start of follow-up. '
                                    :
                                    (start_of_follow_up.start_of_follow_up_exclude === 'exclude interest' ?
                                        'Exclude only the participants who had a prevalent cancer of interest (i.e., the cancer endpoint for your analysis) at the start of follow-up.'
                                        :
                                        (start_of_follow_up.start_of_follow_up_exclude === 'include all' ?
                                            'Include all participants, even those with prevalent cancer at the start of follow-up.'
                                            :
                                            'Not selected.')
                                    )  
                                )
                                :
                                'Not selected.'
                        }
                    </td>
                </tr>
              </table>
            `;

    // censoring rules
    html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Censoring Rules</b>
            </div>
            `;

    html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Follow-up ends:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                       ${
                          project.censoring_rules.through_2015_12_31 ?
                              'Include all eligible cases diagnosed through 12/31/2017.'
                              :
                              project.censoring_rules.end_of_follow_up ?
                                  getEndOfFollowUpDisplay(project.censoring_rules)
                                  :
                                  'Not include all eligible cases diagnosed through 12/31/2017.\nBut no specified time.'
                       }
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Participants with any other cancer:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                        ${
                            project.censoring_rules.end_of_follow_up_exclude ?
                                (
                                    project.censoring_rules.end_of_follow_up_exclude === 'default' ?
                                        'Use the default CTS rules. Follow-up time will end at the earliest of the dates described above.'
                                        :
                                        'Do not censor at diagnosis of any other cancer. Follow-up time will end at the earliest of the other dates described above.'
                                )
                                :
                                'Not specified.'
                        }
                    </td>
                </tr>
              </table>
            `;

    // questionaire
    html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Selected Variables in Questionnaire</b>
             </div>
            `;

        let keys = Object.keys(project.questionnarie);
        for (var i=0; i<keys.length; i++) {
            let variables = Object.keys(project.questionnarie[keys[i]]);
            if (variables.length > 0) {

                html +=
                    `
                     <div style="width: 90%; padding: 10pt 5pt 3pt 12pt; text-align: left; font-size: 6pt; font-weight: bold;">
                        ${keys[i]}
                     </div>
                     <table cellpadding="3pt" cellspacing="0" style="width: 92%; padding: 3pt 5pt 3pt 10pt; font-size: 6pt;">
                   `;


                for (var j = 0; j < variables.length; j++) {
                    html +=
                        `
                           <tr style="background-color: ${ j%2 === 0 ? '#eee' : 'white' };">
                                <td style=" text-align: left; font-size: 6pt; width: 30%; vertical-align: top; font-style: italic;">
                                   ${variables[j]}
                                </td>
                                <td style=" text-align: left; font-size: 6pt; width: 70%; line-height: 1.6;">
                                   ${variable_desciption[variables[j]]}
                                </td>
                           </tr>
                        `;
                }

                html +=
                    ` </table>
                    `;

            }
        }


    html += `
        </div>
    </body>
</html>
        `;


    //console.log(html);

    var document = {
        html: html,
        data: {},
        path: path
    };

    pdf.create(document, options)
        .then(res => {
            console.log(res)
        })
        .catch(error => {
            console.error(error)
        });

}

module.exports = createPDF;
