import React from 'react';
import 'antd/dist/antd.css';
import {Radio, DatePicker, Card} from 'antd';
import './index.css';
import './cancer_endpoint.css';
import Typography from '@material-ui/core/Typography/index';
import {Input} from 'antd';
import moment from 'moment';
import {Typography as AntTypography} from 'antd';

const {Text} = AntTypography;
const {TextArea} = Input;

const root_style = {
    width: '100%',
}

const dateFormat = 'MM/DD/YYYY';

function disabledDate(current) {
    // Can not select days after today and today
    return current && current > moment().endOf('day');
}

class CancerInformation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            seer_code_and_other: undefined,
            start_date: 'QNR_1_FILL_DT',
            specified_date: undefined,
            inclusion_exclusion_criteria: undefined
        }
    }

    componentDidMount() {
        if (this.props.project && this.props.project.cancer_info) {
            let cancer_info = JSON.parse(this.props.project.cancer_info);
            if (cancer_info) {
                this.setState({
                    seer_code_and_other: cancer_info.seer_code_and_other,
                    start_date: cancer_info.start_date,
                    specified_date: cancer_info.specified_date ? moment.utc(cancer_info.specified_date) : null,
                    inclusion_exclusion_criteria: cancer_info.inclusion_exclusion_criteria
                })
            }
        }
    }

    static getTitle = () => {
        return 'Enter cancer information';
    }

    static isComplete = (state) => {

        return state.cancer_info !== null && state.cancer_info !== undefined &&
            state.cancer_info.seer_code_and_other !== null &&
            state.cancer_info.seer_code_and_other !== undefined &&
            state.cancer_info.seer_code_and_other.length !== 0 &&
            state.cancer_info.inclusion_exclusion_criteria !== null &&
            state.cancer_info.inclusion_exclusion_criteria !== undefined &&
            state.cancer_info.inclusion_exclusion_criteria.length !== 0 &&
            (state.cancer_info.start_date !== null || state.cancer_info.specified_date !== null)
    }

    static getSummary = (project, index) => {

        let cancer_info = project.cancer_info ?
            JSON.parse(project.cancer_info) : null;

        return (
            <Card key={'module-' + index}
                  size="small"
                  title={'Caner Information'}
                  headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                  style={{width: '100%', margin: index > 0 ? '20pt 0pt 0pt 0pt' : '0pt'}}>

                {
                    cancer_info === undefined || cancer_info === null ?
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text type="danger">
                                No cancer information available
                            </Text>
                        </div>
                        :
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <table border={0}>
                                <tbody>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Cancer endpoints:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                cancer_info.seer_code_and_other === null ||
                                                cancer_info.seer_code_and_other === undefined ||
                                                cancer_info.seer_code_and_other.trim().length === 0 ?
                                                    'Not specified' : cancer_info.seer_code_and_other
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Diagnosis/endpoint period:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                cancer_info.start_date === null ?
                                                    'Not specified' :
                                                    cancer_info.start_date !== 'Other' ?
                                                        cancer_info.start_date :
                                                        cancer_info.specified_date === null ?
                                                            'Not specified' :
                                                            cancer_info.specified_date.split('T')[0]
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Specific inclusion and exclusion criteria:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                cancer_info.inclusion_exclusion_criteria === null ||
                                                cancer_info.inclusion_exclusion_criteria === undefined ||
                                                cancer_info.inclusion_exclusion_criteria.trim().length === 0 ?
                                                    'Not specified' : cancer_info.inclusion_exclusion_criteria
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                }
            </Card>
        )
    }

    reset = () => {
        this.setState({
            seer_code_and_other: undefined,
            start_date: 'QNR_1_FILL_DT',
            specified_date: undefined,
            inclusion_exclusion_criteria: undefined
        });
    }

    onChangeStartDate = (e) => {
        this.setState({
            start_date: e.target.value,
        }, this.saveCancerInformation);
    }

    onChangeSpecifiedDate = (date) => {
        this.setState({
            specified_date: date
        }, this.saveCancerInformation);
    }

    onChangeSeerCode = (e) => {
        this.setState({
            seer_code_and_other: e.target.value,
        }, this.saveCancerInformation);
    }

    onChangeInclusionExclusionCriteria = (e) => {
        this.setState({
            inclusion_exclusion_criteria: e.target.value,
        }, this.saveCancerInformation);
    }

    saveCancerInformation = () => {
        let obj = {
            seer_code_and_other: this.state.seer_code_and_other,
            start_date: this.state.start_date,
            specified_date: this.state.specified_date,
            inclusion_exclusion_criteria: this.state.inclusion_exclusion_criteria
        }
        this.props.save_cancer_information(obj);
    }


    render() {
        const radioStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px',
            whiteSpace: 'auto',
        };

        return (
            <div style={root_style}>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    How is (or are) the cancer endpoint(s) defined? Enter your SEER code(s) or
                    ICD-03 code(s) below, as well as histology code(s) if applicable:
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.seer_code_and_other}
                              onChange={this.onChangeSeerCode}
                              allowClear/>
                </div>

                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    What is your diagnosis/endpoint period?
                </Typography>
                <Typography style={{padding: '2pt 10pt 0pt 10pt', width: '100%'}}>
                    For case-control, all eligible cancers diagnosed on or
                    before this date will be included as cases for your analysis.
                </Typography>
                <Typography style={{padding: '2pt 10pt 0pt 10pt', width: '100%'}}>
                    For cross-sectional, all eligible cancers as of this date will be
                    included in your endpoint group.
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeStartDate} value={this.state.start_date}>
                        <Radio style={radioStyle} value={'QNR_1_FILL_DT'}>
                            CTS Baseline, i.e. Questionnaire 1 (1995-1996)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_2_FILL_DT'}>
                            Questionnaire 2 (1997-1998)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_3_FILL_DT'}>
                            Questionnaire 3 (2000-2002)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_4_FILL_DT'}>
                            Questionnaire 4 (2005-2008)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_5_FILL_DT'}>
                            Questionnaire 5 (2012-2015)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_6_FILL_DT'}>
                            Questionnaire 6 (2017-2019)
                        </Radio>
                        <Radio style={radioStyle} value={'Other'}>
                            Other (please specify):
                            {
                                this.state.start_date === 'Other' ?
                                    <DatePicker
                                        required
                                        disabledDate={disabledDate}
                                        style={{marginLeft: '10pt'}}
                                        value={this.state.specified_date}
                                        format={dateFormat}
                                        onChange={this.onChangeSpecifiedDate}
                                    /> : null
                            }
                        </Radio>
                    </Radio.Group>
                </div>

                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    What are the specific inclusion and exclusion criteria for your comparison group?
                    Please provide as much detail as possible.
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.inclusion_exclusion_criteria}
                              onChange={this.onChangeInclusionExclusionCriteria}
                              allowClear/>
                </div>

            </div>
        );

    }
}

export default CancerInformation;
