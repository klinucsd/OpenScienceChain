
var pdf = require("pdf-creator-node");
var fs = require('fs');

let getQuestionnarieName = (value) => {
    switch (value) {
        case 'QNR_1_FILL_DT' :
            return 'Questionnaire 1';
        case 'QNR_2_FILL_DT' :
            return 'Questionnaire 2';
        case 'QNR_3_FILL_DT' :
            return 'Questionnaire 3';
        case 'QNR_4_FILL_DT' :
            return 'Questionnaire 4';
        case 'QNR_5_FILL_DT' :
            return 'Questionnaire 5';
        case 'QNR_6_FILL_DT' :
            return 'Questionnaire 6';
        default:
            return 'Not selected';
    }
}

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


let getTypeName = (name) => {
    let names = name.split('_');
    return names[0].charAt(0).toUpperCase() + names[0].substring(1) + ' ' +
        names[1].charAt(0).toUpperCase() + names[1].substring(1);
}


function createPDF(project, variable_desciption, path, statistics) {

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
        <title>Data Selection Summary for ${project.name}</title>
    </head>
    <body>
        <div style="font-size: 8pt; text-align: center; font-weight: bold;">
            Data Selection Summary for ${project.name}
        </div>
        
        <div style="font-size: 6pt; text-align: center; padding-top: 5pt; font-style: italic">
            version ${project.version-1 < 10 ? '0' + project.version-1 : project.version-1}
        </div>
        
        <div style="font-size: 8pt; margin-top: 10pt; text-align: center;">
        `;


    // start of follow up
    if (project.study_design === 'Cohort' && project.endpoint === 'Cancer' && project.start_of_follow_up) {
        html += `
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

    }

    if (project.study_design === 'Cohort' && project.endpoint === 'Cancer' && project.censoring_rules) {

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
                        'Use the default CTS rules: censor at diagnosis of another cancer.'
                        :
                        'Do not censor at diagnosis of another cancer.'
                )
                :
                'Not specified.'
            }
                    </td>
                </tr>
              </table>
            `;
    }

    if (project.study_design === 'Cohort' && project.endpoint === 'Cancer') {

        // Study Population
        html +=
            `
            <div style="width: 90%; background-color: #dceafd;  margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Study Population</b>             
            </div>
                    
            <table cellpadding="4pt" cellspacing="0" style="width: 60%; padding: 10pt 5pt 3pt 15pt; font-size: 6pt;">
                
                <tr>
                    <td style="text-align: left; color: #484848;">
                        <b>Original CTS analytic population</b>
                    </td>
                    <td style="text-align: left; color: #484848;">
                        <b>133,473</b>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848;">
                        <b>Lived outside CA at CTS baseline</b>
                    </td>
                    <td style="text-align: left; color: #484848;">
                        <b>8,335</b>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848;">
                        <b>Consented to breast cancer researcher only</b>
                    </td>
                    <td style="text-align: left; color: #484848;">
                        <b>${statistics.breast_only}</b>
                    </td>
                </tr>
            `;

        if (statistics.not_complete_questionnarie_name && statistics.not_complete_questionnarie) {
            html += `
                <tr>
                    <td style="text-align: left; color: #484848;">
                        <b>Did not complete ${getQuestionnarieName(statistics.not_complete_questionnarie_name)}</b>
                    </td>
                    <td style="text-align: left; color: #484848;">
                        <b>${statistics.not_complete_questionnarie}</b>
                    </td>
                </tr>
            `;
        }

        if (statistics.exclude_prevalent) {
            html += `
                <tr>
                    <td style="text-align: left; color: #484848;">
                        <b>Exclude; prevalent</b>
                    </td>
                    <td style="text-align: left; color: #484848;">
                        <b>${statistics.exclude_prevalent}</b>
                    </td>
                </tr>
            `;
        }

        html += `            
                <tr>
                    <td style="text-align: left; color: #484848;">
                        <b>Censored on or before start date</b>
                    </td>
                    <td style="text-align: left; color: #484848;">
                        <b>${statistics.censored_before_start}</b>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848;">
                        <b>Final analytic population</b>
                    </td>
                    <td style="text-align: left; color: #484848;">
                        <b>${statistics.final_population}</b>
                    </td>
                </tr>
            </table>
        `;
    }

    if (project.study_design === 'Cohort' && project.endpoint === 'Cancer' && project.cancer_endpoint) {

        // cancer endpoints
        html +=
            `
            <div style="width: 90%; background-color: #dceafd;  margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
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
                        <b>Histologic Type</b>
                    </td>
                </tr>
                `;

        for (var i = 0; i < project.cancer_endpoint.length; i++) {
            html +=
                `
                    <tr style="background-color: ${i % 2 === 0 ? '#eee' : 'white'};">
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${project.cancer_endpoint[i].SITE_GROUP_NME}</b>
                        </td>
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${project.cancer_endpoint[i].SEER_ID}</b>
                        </td>
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${project.cancer_endpoint[i].ICD_O3_CDE}</b>
                        </td>
                        <td style="text-align: left; color: #484848; font-size: 6pt;">
                            <b>${project.cancer_endpoint[i].HISTOLOGIC_ICDO3_TYP}</b>
                        </td>
                    </tr>
            `;
        }

        html += `
             </table>
             `;

    }

    // cancer_info
    if (project.study_design !== 'Cohort' && project.endpoint === 'Cancer' && project.cancer_info) {
        html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Cancer Information</b>
            </div>
            `;

        html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Cancer endpoints:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                         ${project.cancer_info.seer_code_and_other}
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Diagnosis/endpoint period:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                         ${
                             project.cancer_info.start_date === null ?
                                'Not specified' :
                                 project.cancer_info.start_date !== 'Other' ?
                                     project.cancer_info.start_date :
                                     project.cancer_info.specified_date === null ?
                                         'Not specified' : 
                                         project.cancer_info.specified_date.split('T')[0]
                         }
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Specific inclusion and exclusion criteria:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top">
                         ${
                            project.cancer_info.inclusion_exclusion_criteria === null ||
                            project.cancer_info.inclusion_exclusion_criteria === undefined ||
                            project.cancer_info.inclusion_exclusion_criteria.trim().length === 0 ?
                                'Not specified' : project.cancer_info.inclusion_exclusion_criteria
                         }
                    </td>
                </tr>
              </table>
            `;
    }

    // mortality_info
    if (project.endpoint === 'Mortality' && project.mortality_info) {
        html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Mortality Information</b>
            </div>
            `;

        html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Included mortality endpoint types:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top;">
                       ${
                          project.mortality_info.all_cause_mortality === false &&
                          project.mortality_info.cause_specific_mortality === false ?
                             'Not specified' : ''
                       }
                       ${
                          project.mortality_info.all_cause_mortality === true ? 
                            'All-cause mortality' : ''
                       }
                       ${
                          project.mortality_info.cause_specific_mortality === true ?
                            (project.mortality_info.all_cause_mortality === true ? ', ' : '') +
                             'Cause-specific mortality' : ''
                       }
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>The cause of death or ICD mortality code(s):</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top;">
                        ${
                            project.mortality_info.mortality_code === null ||
                            project.mortality_info.mortality_code.trim().length === 0 ?
                                'Not specified' :
                                project.mortality_info.mortality_code
                        }
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Any censoring criteria or other information:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top;">
                        ${
                            project.mortality_info.additional_info === null &&
                            project.mortality_info.additional_info.trim().length === 0 ?
                                'Not specified' :
                                project.mortality_info.additional_info
                        }
                    </td>
                </tr>
              </table>
            `;
    }

    // project.hospitalization_info
    if (project.endpoint === 'Hospitalization' && project.hospitalization_info) {
        html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Hospitalization Information</b>
            </div>
            `;

        html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt; line-height: 1.6;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                        <b>Types of hospitalization records:</b>
                    </td>
                    <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; ">
                        ${
                            project.hospitalization_info.hospitalization_record === null ?
                                'Not specified' :
                                (project.hospitalization_info.hospitalization_record === 'First of any source' ?
                                    'First of any source'
                                    :
                                    'First of ' + 
                                    (project.hospitalization_info.patient_discharge ? 'Patient Discharge' : '') +
                                    (project.hospitalization_info.ambulatory_surgery ?
                                        (project.hospitalization_info.patient_discharge ? ', ' : '') + 'Ambulatory Surgery' : ''
                                    ) +
                                    (project.hospitalization_info.emergency_department ?
                                        (project.hospitalization_info.patient_discharge || project.hospitalization_info.ambulatory_surgery ? ', ' : '') + 'Emergency Department' 
                                        : ''
                                    )
                                )
                         }
                        </td>
                    </tr>
                `;

        if (project.hospitalization_info.hospitalization_record === 'First of selected') {
            html += `          
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                            <b>Order hospitalization records by:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; ">
                            ${
                project.hospitalization_info.hospitalization_record_order === undefined ||
                project.hospitalization_info.hospitalization_record_order === null ||
                project.hospitalization_info.hospitalization_record_order.length === 0 ?
                    'Not specified' :
                    project.hospitalization_info.hospitalization_record_order.map((type, i) =>
                        getTypeName(type)+" "
                    )
                }
                        </td>
                    </tr>
                `;
        }

        html += ` 
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                            <b>Types of hospitalization endpoint codes:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; ">
                            ${
                                project.hospitalization_info.diagnosis_endpoint === false &&
                                project.hospitalization_info.procedure_endpoint === false ?
                                    'Not specified' : ''
                            }
                            ${
                                project.hospitalization_info.diagnosis_endpoint === true ?
                                project.hospitalization_info.diagnosis_endpoint_type : ''
                            }
                            ${
                                project.hospitalization_info.procedure_endpoint === true ?
                                    (project.hospitalization_info.diagnosis_endpoint ? ', ' : '') +
                                     project.hospitalization_info.procedure_endpoint_type : ''
                            }  
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                            <b>ICD-9 codes to identify endpoints:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                            ${
                                project.hospitalization_info.hospitalization_endpoint === null ||
                                project.hospitalization_info.hospitalization_endpoint === undefined ||
                                project.hospitalization_info.hospitalization_endpoint.trim().length === 0 ?
                                    'Not specified' :
                                    project.hospitalization_info.hospitalization_endpoint
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                            <b>ICD-10 codes to identify endpoints:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                            ${
                                project.hospitalization_info.hospitalization_endpoint_10 === null ||
                                project.hospitalization_info.hospitalization_endpoint_10 === undefined ||
                                project.hospitalization_info.hospitalization_endpoint_10.trim().length === 0 ?
                                    'Not specified' :
                                    project.hospitalization_info.hospitalization_endpoint_10
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                            <b>Prioritize diagnoses/procedures on the same day:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top;">
                            ${
                                project.hospitalization_info.endpoint_priority === null ?
                                    'Not specified' :
                                    project.hospitalization_info.endpoint_priority !== 'Depends on' ?
                                        project.hospitalization_info.endpoint_priority :
                                        project.hospitalization_info.endpoint_priority_detail === null ?
                                            'Not specified' :
                                            'Depends on the endpoint - ' + project.hospitalization_info.endpoint_priority_detail
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                            <b>Analysis follow-up begin:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top;">
                            ${
                                project.hospitalization_info.start_date !== 'Other' ?
                                    project.hospitalization_info.start_date :
                                    project.hospitalization_info.specified_start_date === null ?
                                        'Not specified' :
                                        project.hospitalization_info.specified_start_date.split('T')[0]
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; vertical-align: top;">
                            <b>Include participants with prevalent cases:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top;">
                            ${
                                project.hospitalization_info.include_prevalent === null ?
                                    'Not specified' :
                                    project.hospitalization_info.include_prevalent
                            }
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%;">
                            <b>Include eligible cases through 12/31/2018:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top;">
                            ${
                                project.hospitalization_info.include_eligible === null ?
                                    'Not specified' :
                                    project.hospitalization_info.include_eligible
                            }
                        </td>
                    </tr>
                    `;

        if (project.hospitalization_info.include_eligible !== null && project.hospitalization_info.include_eligible === 'no') {
            html += `
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; ">
                            <b>Analysis follow-up end date:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6;">
                            ${
                                project.hospitalization_info.end_date !== 'Other' ?
                                    project.hospitalization_info.end_date :
                                    project.hospitalization_info.specified_end_date === null ?
                                        'Not specified' :
                                        project.hospitalization_info.specified_end_date.split('T')[0]
                            }
                        </td>
                    </tr>
                   `;
        }
        html += `
                    <tr>
                        <td style="text-align: left; color: #484848; width: 35%; ">
                            <b>Additional censoring criteria or other information:</b>
                        </td>
                        <td style="text-align: left; color: #484848; width: 65%; line-height: 1.6; vertical-align: top; ">
                            ${
                                project.hospitalization_info.additional_info === null ||
                                project.hospitalization_info.additional_info.trim().length === 0 ?
                                    'Not specified' :
                                    project.hospitalization_info.additional_info
                            }
                        </td>
                    </tr>
                  </table>
            `;

    }

    // questionaire
    html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Selected Questionnaire Variables</b>
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

    if (project.biospecimen_info) {
        html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Biospecimen Information</b>
            </div>
            `;

        html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 100%; line-height: 1.6;">
                        ${project.biospecimen_info.biospecimen}
                    </td>
                </tr>
              </table>
            `;
    }

    if (project.geospatial_info) {
        html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Geospatial Information</b>
            </div>
            `;

        html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 100%; line-height: 1.6;">
                        ${project.geospatial_info.geospatial_data}
                    </td>
                </tr>
              </table>
            `;
    }

    if (project.data_sharing_info) {
        html += `
            <div style="width: 90%; background-color: #dceafd; margin-top: 10pt; padding: 3pt 5pt 3pt 5pt; text-align: left; font-size: 7pt;">
                <b>Data Sharing Information</b>
            </div>
            `;

        html += `
             <table cellpadding="2pt" cellspacing="0" style="width: 90%; padding: 10pt 5pt 3pt 10pt; font-size: 7pt;">
                <tr>
                    <td style="text-align: left; color: #484848; width: 100%; line-height: 1.6;">
                        ${project.data_sharing_info.data_sharing}
                    </td>
                </tr>
              </table>
            `;
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
