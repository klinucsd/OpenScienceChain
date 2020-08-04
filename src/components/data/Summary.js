import React from 'react';
import {Typography, Card} from 'antd';
import axios from "axios";

const {Text} = Typography;

class Summary extends React.Component {

    constructor(props) {
        super(props);
        this.cancer_endpoints = JSON.parse(this.props.project.cancer_endpoint);
        this.start_of_followup = JSON.parse(this.props.project.start_of_follow_up);
        this.censoring_rules = JSON.parse(this.props.project.censoring_rules);
        this.questionnarie = JSON.parse(this.props.project.questionnarie);
        this.state = {
            variable_details: []
        };
    }

    componentDidMount() {
        let thisState = this;
        axios.post('/api/questionnarie',
            {
                search: {
                    questionnarie: ['Q1', 'Q2', 'Q3', 'Q4', 'Q4mini', 'Q5', 'Q5mini', 'Q6'],
                }
            })
            .then(function (response) {
                thisState.setState({
                    variable_details: response.data
                })
            });
    }

    getDetails = (questionnarie, variable) => {
        for (var i = 0; i < this.state.variable_details.length; i++) {
            if (questionnarie === this.state.variable_details[i].questionnarie &&
                variable === this.state.variable_details[i].variable) {
                return this.state.variable_details[i].description;
            }
        }
        return "";
    }

    getStartOfFollowUpDisplay = (value) => {
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

    getEndOfFollowUpDisplay = (value) => {
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

    render() {
        return (
            <div style={{padding: '10pt 50pt 20pt 50pt'}}>
                <Card size="small"
                      title="Cancer Endpoint"
                      headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                      style={{width: '100%'}}>
                    {
                        this.cancer_endpoints === undefined || this.cancer_endpoints === null || this.cancer_endpoints.length === 0 ?
                            <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                                <Text type="danger">
                                    No selected cancer points.
                                </Text>
                            </div>
                            :
                            <table style={{width: '100%'}}>
                                <tbody>
                                <tr>
                                    <th style={{
                                        paddingLeft: '20pt',
                                        fontSize: 12,
                                        width: 150,
                                    }}>
                                        Site Group Name
                                    </th>

                                    <th style={{
                                        paddingLeft: '20pt',
                                        fontSize: 12,
                                        width: 150,
                                    }}>SEER ID
                                    </th>

                                    <th style={{
                                        paddingLeft: '20pt',
                                        fontSize: 12,
                                        width: 150,
                                    }}>ICD O3 CDE
                                    </th>

                                    <th style={{
                                        paddingLeft: '20pt',
                                        fontSize: 12,
                                        width: 150,
                                    }}>Histologic Type
                                    </th>

                                </tr>
                                {this.cancer_endpoints.map((cp, i) => (
                                    <tr key={'cancer_endpoint-' + i}>
                                        <td style={{
                                            paddingLeft: '20pt',
                                            fontSize: 12,
                                            width: 150,
                                            backgroundColor: (i % 2 === 1 ? 'white' : '#eee')
                                        }}>
                                            {cp.SITE_GROUP_NME}
                                        </td>
                                        <td style={{
                                            paddingLeft: '20pt',
                                            fontSize: 12,
                                            width: 150,
                                            backgroundColor: (i % 2 === 1 ? 'white' : '#eee')
                                        }}>
                                            {cp.SEER_ID}
                                        </td>
                                        <td style={{
                                            paddingLeft: '20pt',
                                            fontSize: 12,
                                            width: 150,
                                            backgroundColor: (i % 2 === 1 ? 'white' : '#eee')
                                        }}>
                                            {cp.ICD_O3_CDE}
                                        </td>
                                        <td style={{
                                            paddingLeft: '20pt',
                                            fontSize: 12,
                                            width: 150,
                                            backgroundColor: (i % 2 === 1 ? 'white' : '#eee')
                                        }}>
                                            {cp.HISTOLOGIC_ICDO3_TYP === '' ? 'Unknown' : cp.HISTOLOGIC_ICDO3_TYP}
                                        </td>
                                    </tr>
                                ))
                                }
                                </tbody>
                            </table>
                    }

                </Card>

                <Card size="small"
                      title="Start of Follow-up"
                      headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                      style={{width: '100%', margin: '20pt 0pt 0pt 0pt'}}>

                    {
                        this.start_of_followup === undefined || this.start_of_followup === null ?
                            <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                                <Text type="danger">
                                    No selected start of followup.
                                </Text>
                            </div>
                            :
                            <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                                <table>
                                    <tbody>
                                    <tr>
                                        <td>
                                            <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                                Follow-up begins:
                                            </Text>
                                        </td>
                                        <td>
                                            {
                                                this.start_of_followup.start_of_follow_up ?
                                                    <Text
                                                        type={this.getStartOfFollowUpDisplay(this.start_of_followup) === 'Not selected' ?
                                                            'danger' : null
                                                        }>
                                                        {this.getStartOfFollowUpDisplay(this.start_of_followup)}
                                                    </Text>
                                                    :
                                                    <Text type="danger">
                                                        Not selected.
                                                    </Text>
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{verticalAlign: 'top'}}>
                                            <Text style={{
                                                fontWeight: 'bold',
                                                paddingRight: '10pt',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                Participants with prevalent cancer :
                                            </Text>
                                        </td>
                                        <td>
                                            {
                                                this.start_of_followup.start_of_follow_up_exclude ?
                                                    <Text>
                                                        {
                                                            this.start_of_followup.start_of_follow_up_exclude === 'exclude all' ?
                                                                <Text>
                                                                    Exclude all participants who had a prevalent
                                                                    cancer of any type at the start of follow-up.
                                                                </Text>
                                                                :
                                                                this.start_of_followup.start_of_follow_up_exclude === 'exclude interest' ?
                                                                    <Text>
                                                                        Exclude only the participants who had a
                                                                        prevalent cancer of interest (i.e., the cancer
                                                                        endpoint for your analysis) at the start of
                                                                        follow-up.
                                                                    </Text>
                                                                    :
                                                                    this.start_of_followup.start_of_follow_up_exclude === 'include all' ?
                                                                        <Text>
                                                                            Include all participants, even those with
                                                                            prevalent cancer at the start of follow-up.
                                                                        </Text>
                                                                        :
                                                                        <Text type="danger">
                                                                            Not selected.
                                                                        </Text>
                                                        }
                                                    </Text>
                                                    :
                                                    <Text type="danger">
                                                        Not selected.
                                                    </Text>
                                            }
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>


                    }

                </Card>

                <Card size="small"
                      title="Censoring Rules"
                      headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                      style={{width: '100%', margin: '20pt 0pt 0pt 0pt'}}>

                    {
                        this.censoring_rules === undefined || this.censoring_rules === null ?
                            <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                                <Text type="danger">
                                    No selected censoring rules.
                                </Text>
                            </div>
                            :
                            <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                                <table>
                                    <tbody>
                                    <tr>
                                        <td style={{verticalAlign: 'top'}}>
                                            <Text style={{
                                                fontWeight: 'bold',
                                                paddingRight: '10pt',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                Follow-up ends :
                                            </Text>
                                        </td>
                                        <td>
                                            {
                                                this.censoring_rules.through_2015_12_31 ?
                                                    <Text style={{paddingRight: '10pt'}}>
                                                        Include all eligible cases diagnosed through 12/31/2017.
                                                    </Text>
                                                    :
                                                    this.censoring_rules.end_of_follow_up ?
                                                        <Text
                                                            type={this.getEndOfFollowUpDisplay(this.censoring_rules) === 'Not selected' ?
                                                                'danger' : null
                                                            }>
                                                            {this.getEndOfFollowUpDisplay(this.censoring_rules)}
                                                        </Text>
                                                        :
                                                        <Text type="danger">
                                                            Not include all eligible cases diagnosed through 12/31/2017.
                                                            But no specified time.
                                                        </Text>
                                            }
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{verticalAlign: 'top'}}>
                                            <Text style={{
                                                fontWeight: 'bold',
                                                paddingRight: '10pt',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                Participants with any other cancer:
                                            </Text>
                                        </td>
                                        <td>
                                            {
                                                this.censoring_rules.end_of_follow_up_exclude ?
                                                    (
                                                        this.censoring_rules.end_of_follow_up_exclude === 'default' ?
                                                            <Text>
                                                                Use the default CTS rules. Follow-up time will end at
                                                                the earliest of the dates described above.
                                                            </Text>
                                                            :
                                                            <Text>
                                                                Do not censor at diagnosis of any other cancer.
                                                                Follow-up time will end at the earliest of the other
                                                                dates described above.
                                                            </Text>
                                                    ) :
                                                    <Text type="danger">
                                                        Not specified.
                                                    </Text>
                                            }
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                    }

                </Card>

                <Card size="small"
                      title="Selected Variables in Questionnaire"
                      headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                      style={{width: '100%', margin: '20pt 0pt 0pt 0pt'}}>
                    {
                        Object.keys(this.questionnarie).map((questionnarie, i) => (
                            Object.keys(this.questionnarie[questionnarie]).length > 0 ?
                                <div key={'my-selections-' + i}>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    fontSize: 12,
                                                    paddingTop: '4pt'
                                                }}>
                                                {
                                                    questionnarie === 'Q4mini' ?
                                                        'Q4 Mini'
                                                        :
                                                        questionnarie === 'Q5mini' ?
                                                            'Q5 Mini'
                                                            :
                                                            questionnarie
                                                }
                                                </span>

                                    <table style={{width: '100%'}}>
                                        <tbody>
                                        {
                                            Object.keys(this.questionnarie[questionnarie]).sort().map((variable, j) => (
                                                <tr key={'variable-' + i + '-' + j}>
                                                    <td style={{
                                                        paddingLeft: '20pt',
                                                        fontSize: 12,
                                                        width: 230,
                                                        verticalAlign: 'top',
                                                        backgroundColor: (j % 2 === 1 ? 'white' : '#eee')
                                                    }}
                                                    >
                                                        {variable}
                                                    </td>

                                                    <td style={{
                                                        paddingLeft: '20pt',
                                                        fontSize: 12,
                                                        backgroundColor: (j % 2 === 1 ? 'white' : '#eee')
                                                    }}>
                                                        {this.getDetails(questionnarie, variable)}
                                                    </td>
                                                </tr>
                                            ))
                                        }

                                        <tr>
                                            <td style={{height: '2pt'}}></td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                                :
                                null
                        ))
                    }

                </Card>
            </div>
        );
    }

}

export default Summary;
