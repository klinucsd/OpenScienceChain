let getDefaultCondition = () => {
    //return 'NOT SITE_GROUP_NME = \'\' AND NOT HISTOLOGIC_ICDO3_TYP=\'\' '
    return ' 1 = 1 ';
}

let getCoditionForCancerEndpoint = (cancer_endpoint) => {
    let sql = '((';
    if (cancer_endpoint) {
        let site_group_name = null;
        for (var j = 0; j < cancer_endpoint.length; j++) {
            if (j > 0) sql += ') OR (';
            let item = cancer_endpoint[j];
            if (j === 0) {
                site_group_name = item.SITE_GROUP_NME;
            }
            sql += ' SITE_GROUP_NME=\'' + item.SITE_GROUP_NME + '\'';
            sql += ' AND SEER_ID=\'' + item.SEER_ID + '\'';
            sql += ' AND ICD_O3_CDE=\'' + item.ICD_O3_CDE + '\'';
            sql += ' AND HISTOLOGIC_ICDO3_TYP=\'' + item.HISTOLOGIC_ICDO3_TYP + '\'';
        }

        if (site_group_name !== 'Breast' || cancer_endpoint.length > 1) {
            sql += ' AND NOT BREAST_CANCER_RES_ONLY_IND = 1 ';
        }
        // AND (SITE_GROUP_NME = 'Breast' OR NOT BREAST_CANCER_RES_ONLY_IND = 1)
    }
    sql += '))';
    return sql;
}

let getConditionForStartFollowup = (start_of_follow_up) => {
    let sql = "";
    if (start_of_follow_up && start_of_follow_up.start_of_follow_up) {
        if (start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
            sql += " DATE_DT >= " + start_of_follow_up.start_of_follow_up +
                " AND " + start_of_follow_up.start_of_follow_up + " IS NOT NULL " +
                " AND NOT " + start_of_follow_up.start_of_follow_up + " = '' " +
                " AND NOT " + start_of_follow_up.start_of_follow_up + " = '.' ";
        } else if (start_of_follow_up.start_of_follow_up.startsWith("Other") && start_of_follow_up.start_of_follow_up_specified) {
            sql += " DATE_DT >= \'" + start_of_follow_up.start_of_follow_up_specified.split('T')[0] + "\'";
        }
    }
    return sql;
}

let getConditionForExcludePrevalent = () => {

    /*
    let sql = " NOT brca_selfsurvey='Y' ";
    sql += " AND NOT endoca_self_q1='A' ";
    sql += " AND NOT cervca_self_q1='A'  ";
    sql += " AND NOT ovryca_self_q1='A' ";
    sql += " AND NOT lungca_self_q1='A' ";
    sql += " AND NOT leuk_self_q1='A' ";
    sql += " AND NOT hodg_self_q1='A' ";
    sql += " AND NOT colnca_self_q1='A' ";
    sql += " AND NOT thyrca_self_q1='A' ";
    sql += " AND NOT meln_self_q1='A' ";
     */

    let sql = " NOT ( ";
    sql += " NOT date_dt is NULL and date_dt < ";



    sql += " OR brca_selfsurvey='Y' or endoca_self_q1='A' or cervca_self_q1='A' or ovryca_self_q1='A' or lungca_self_q1='A' or leuk_self_q1='A' or hodg_self_q1='A' or colnca_self_q1='A' or thyrca_self_q1='A' or meln_self_q1='A' ";
    sql += ") "

    return sql;
}

let getConditionForExcludeInterest = (cancer_endpoint, start_of_follow_up) => {

    let sql = "NOT SSAP_ID IN (";
    sql += " SELECT SSAP_ID FROM ssap_data_2 ";
    sql += " WHERE " + getDefaultCondition();
    if (cancer_endpoint) {
        sql += " AND " + getCoditionForCancerEndpoint(cancer_endpoint);
    }
    if (start_of_follow_up) {
        sql += " AND ( " + getConditionForStartFollowup(start_of_follow_up) + ")";
    }

    let seer_ids = [];
    for (var j = 0; j < cancer_endpoint.length; j++) {
        let item = cancer_endpoint[j];
        seer_ids.push(item.SEER_ID);
    }

    if (seer_ids.includes('26000')) {
        sql += " AND brca_selfsurvey='Y' ";
    }

    if (seer_ids.includes('27020') || seer_ids.includes('27030')) {
        sql += " AND endoca_self_q1='A' ";
    }

    if (seer_ids.includes('27010')) {
        sql += " AND cervca_self_q1 = 'A' ";
    }

    if (seer_ids.includes('27040')) {
        sql += " AND ovryca_self_q1 = 'A' ";
    }

    if (seer_ids.includes('27030')) {
        sql += " AND lungca_self_q1 = 'A' ";
    }

    if (seer_ids.includes('35011') ||
        seer_ids.includes('35012') ||
        seer_ids.includes('35013') ||
        seer_ids.includes('35014') ||
        seer_ids.includes('35015') ||
        seer_ids.includes('35016') ||
        seer_ids.includes('35017') ||
        seer_ids.includes('35018') ||
        seer_ids.includes('35019') ||
        seer_ids.includes('35020') ||

        seer_ids.includes('35021') ||
        seer_ids.includes('35022') ||
        seer_ids.includes('35023') ||
        seer_ids.includes('35024') ||
        seer_ids.includes('35025') ||
        seer_ids.includes('35026') ||
        seer_ids.includes('35027') ||
        seer_ids.includes('35028') ||
        seer_ids.includes('35029') ||
        seer_ids.includes('35030') ||

        seer_ids.includes('35031') ||
        seer_ids.includes('35032') ||
        seer_ids.includes('35033') ||
        seer_ids.includes('35034') ||
        seer_ids.includes('35035') ||
        seer_ids.includes('35036') ||
        seer_ids.includes('35037') ||
        seer_ids.includes('35038') ||
        seer_ids.includes('35039') ||
        seer_ids.includes('35040') ||

        seer_ids.includes('35041') ||
        seer_ids.includes('35042') ||
        seer_ids.includes('35043')) {
        sql += " AND leuk_self_q1='A' = 'A' ";
    }

    if (seer_ids.includes('33011') || seer_ids.includes('33012')) {
        sql += " AND hodg_self_q1 = 'A'"
    }

    if (seer_ids.includes('21041') ||
        seer_ids.includes('21042') ||
        seer_ids.includes('21043') ||
        seer_ids.includes('21044') ||
        seer_ids.includes('21045') ||
        seer_ids.includes('21046') ||
        seer_ids.includes('21047') ||
        seer_ids.includes('21048') ||
        seer_ids.includes('21049') ||
        seer_ids.includes('21050') ||
        seer_ids.includes('21051') ||
        seer_ids.includes('21052') ||
        seer_ids.includes('21053') ||
        seer_ids.includes('21054') ||
        seer_ids.includes('21055') ||
        seer_ids.includes('21056') ||
        seer_ids.includes('21057') ||
        seer_ids.includes('21058') ||
        seer_ids.includes('21059') ||
        seer_ids.includes('21060')) {
        sql += " AND colnca_self_q1 = 'A' ";
    }

    if (seer_ids.includes('32010')) {
        sql += " AND thyrca_self_q1 = 'A' ";
    }

    if (seer_ids.includes('25010')) {
        sql += " AND meln_self = 'A' ";
    }

    sql += ")";
    return sql;
}

let getConditionForCensoringRules = (censoring_rules) => {
    let sql = "";
    if (censoring_rules) {
        if (censoring_rules.through_2015_12_31) {
            sql += ' AND DATE_DT <= \'2017-12-31\' ';
        } else if (censoring_rules.end_of_follow_up.startsWith("QNR_")) {
            sql +=
                " AND DATE_DT <= " + censoring_rules.end_of_follow_up +
                " AND " + censoring_rules.end_of_follow_up + " IS NOT NULL " +
                " AND NOT " + censoring_rules.end_of_follow_up + " = '' " +
                " AND NOT " + censoring_rules.end_of_follow_up + " = '.' ";
        } else if (censoring_rules.end_of_follow_up.startsWith("Other") &&
            censoring_rules.end_of_follow_up_specified) {
            sql += " AND DATE_DT <= \'" + censoring_rules.end_of_follow_up_specified.split('T')[0] + "\'";
        }
    }
    return sql;
}

let getDataGenerationCondition = (cancer_endpoint, start_of_follow_up, censoring_rules) => {

    let sql = getDefaultCondition();

    if (cancer_endpoint && cancer_endpoint.length) {
        if (cancer_endpoint.length > 0) {
            sql += ' AND ' + getCoditionForCancerEndpoint(cancer_endpoint);
        }
    }

    if (start_of_follow_up && start_of_follow_up.start_of_follow_up) {
        sql += ' AND ' + getConditionForStartFollowup(start_of_follow_up);
        if (start_of_follow_up.start_of_follow_up_exclude) {
            if (start_of_follow_up.start_of_follow_up_exclude === 'exclude all') {
                sql += ' AND ' + getConditionForExcludePrevalent();
            } else if (start_of_follow_up.start_of_follow_up_exclude === 'exclude interest') {
                sql += ' AND ' + getConditionForExcludeInterest(cancer_endpoint, start_of_follow_up);
            } else if (start_of_follow_up.start_of_follow_up_exclude === 'include all') {
                // do nothing
            }
        }
    }

    if (censoring_rules) {
        sql += getConditionForCensoringRules(censoring_rules);
    }

    return sql;
}


let getAnalysisStartDate = (start_of_follow_up) => {
    if (start_of_follow_up && start_of_follow_up.start_of_follow_up) {
        if (start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
            return start_of_follow_up.start_of_follow_up;
        } else if (start_of_follow_up.start_of_follow_up.startsWith("Other") && start_of_follow_up.start_of_follow_up_specified) {
            return  "'" + start_of_follow_up.start_of_follow_up_specified.split('T')[0] +"'";
        }
    }
    return " 'undefined' ";
}

let getEndOfFollowupDate = (censoring_rules) => {
    if (censoring_rules) {
        if (censoring_rules.through_2015_12_31) {
            return "'2017-12-31'";
        } else if (censoring_rules.end_of_follow_up.startsWith("QNR_")) {
            return censoring_rules.end_of_follow_up;
        } else if (censoring_rules.end_of_follow_up.startsWith("Other") && censoring_rules.end_of_follow_up_specified) {
            return "' " + censoring_rules.end_of_follow_up_specified.split('T')[0] + "'";
        }
    }
}

let getCaseIndicator =  (cancer_endpoint, start_of_follow_up) => {
    let sql = '((';
    if (cancer_endpoint) {
        let site_group_name = null;
        for (var j = 0; j < cancer_endpoint.length; j++) {
            if (j > 0) sql += ') OR (';
            let item = cancer_endpoint[j];
            if (j === 0) {
                site_group_name = item.SITE_GROUP_NME;
            }
            sql += ' SITE_GROUP_NME=\'' + item.SITE_GROUP_NME + '\'';
            sql += ' AND SEER_ID=\'' + item.SEER_ID + '\'';
            sql += ' AND ICD_O3_CDE=\'' + item.ICD_O3_CDE + '\'';
            sql += ' AND HISTOLOGIC_ICDO3_TYP=\'' + item.HISTOLOGIC_ICDO3_TYP + '\'';
        }
    }

    sql += '))';

    if (start_of_follow_up) {
        if (start_of_follow_up && start_of_follow_up.start_of_follow_up) {
            if (start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
                sql += " AND date_dt > " + start_of_follow_up.start_of_follow_up;
            } else if (start_of_follow_up.start_of_follow_up.startsWith("Other") && start_of_follow_up.start_of_follow_up_specified) {
                sql += " AND date_dt > " + start_of_follow_up.start_of_follow_up_specified.split('T')[0];
            }
        }
    }

    return sql;
}


let getPrevalent = (start_of_follow_up) => {
    let sql = "NOT date_dt is NULL and date_dt <";
    if (start_of_follow_up && start_of_follow_up.start_of_follow_up) {
        if (start_of_follow_up.start_of_follow_up.startsWith("QNR_")) {
            sql += " AND date_dt > " + start_of_follow_up.start_of_follow_up;
        } else if (start_of_follow_up.start_of_follow_up.startsWith("Other") && start_of_follow_up.start_of_follow_up_specified) {
            sql += " AND date_dt > " + start_of_follow_up.start_of_follow_up_specified.split('T')[0];
        }
    }
}

module.exports = {
    getCaseIndicator,
    getCoditionForCancerEndpoint,
    getAnalysisStartDate,
    getEndOfFollowupDate,
    getDataGenerationCondition,
    getPrevalent
};
