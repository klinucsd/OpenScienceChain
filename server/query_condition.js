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

        if (site_group_name !== 'Breast') {
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
    let sql = " NOT BRCANLX = 'Y' ";
    sql += " AND NOT ENDOSELF = 'A' ";
    sql += " AND NOT CERVSELF = 'A' ";
    sql += " AND NOT LUNGSELF = 'A' ";
    sql += " AND NOT LEUKSELF = 'A' ";
    sql += " AND NOT HODGSELF = 'A' ";
    sql += " AND NOT COLNSELF = 'A' ";
    sql += " AND NOT THYRSELF = 'A' ";
    sql += " AND NOT MELNSELF = 'A' ";
    sql += " AND NOT OVRYSELF = 'A' ";
    return sql;
}

let getConditionForExcludeInterest = (cancer_endpoint, start_of_follow_up) => {

    let sql = "NOT SSAP_ID IN (";
    sql += " SELECT SSAP_ID FROM ssap_data ";
    sql += " WHERE " + getDefaultCondition();
    if (cancer_endpoint) {
        sql += " AND " + getCoditionForCancerEndpoint(cancer_endpoint);
    }
    if (start_of_follow_up) {
        sql += " AND NOT ( " + getConditionForStartFollowup(start_of_follow_up) + ")";
    }
    sql += " AND (BRCANLX = 'Y' OR ENDOSELF = 'A' OR CERVSELF = 'A' OR LUNGSELF = 'A' OR ";
    sql += " LEUKSELF = 'A' OR HODGSELF = 'A' OR COLNSELF = 'A' OR THYRSELF = 'A' OR ";
    sql += " MELNSELF = 'A' OR OVRYSELF = 'A') ";
    sql += ")";
    return sql;
}

let getConditionForCensoringRules = (censoring_rules) => {
    let sql = "";
    if (censoring_rules) {
        if (censoring_rules.through_2015_12_31) {
            sql += ' AND DATE_DT <= \'2015-12-31\' ';
        } else if (censoring_rules.end_of_follow_up.startsWith("QNR_")) {
            sql += " AND DATE_DT <= " + censoring_rules.end_of_follow_up +
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

let getCondition = (cancer_endpoint, start_of_follow_up, censoring_rules) => {

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

    /*
    if ((!cancer_endpoint || !cancer_endpoint.length || cancer_endpoint.length === 0)  && !start_of_follow_up) {
        sql += " AND 1=0 ";
    }
     */

    return sql;
}


module.exports = getCondition;
