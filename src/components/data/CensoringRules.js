import React from 'react';
import Typography from '@material-ui/core/Typography/index';
import 'antd/dist/antd.css';
import {Radio, DatePicker} from 'antd';
import moment from 'moment';

const dateFormat = 'MM/DD/YYYY';

function disabledDate(current) {
    // Can not select days after today and today
    return current && current > moment().endOf('day');
}

const root_style = {
    width: '100%',
    //display: 'flex',
    //alignItems: 'center',
    //justifyContent: 'center',
    //padding: '80px 0',
}

class CensoringRules extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            through_2015_12_31: null,
            end_of_follow_up: null,
            end_of_follow_up_specified: null,
            end_of_follow_up_exclude: null
        }
    }

    componentDidMount() {
        if (this.props.project && this.props.project.censoring_rules) {
            let censoring_rules = JSON.parse(this.props.project.censoring_rules);
            if (censoring_rules)  {
                this.setState({
                    through_2015_12_31: censoring_rules.through_2015_12_31,
                    end_of_follow_up: censoring_rules.end_of_follow_up,
                    end_of_follow_up_specified: censoring_rules.end_of_follow_up_specified ?
                        moment.utc(censoring_rules.end_of_follow_up_specified) : null,
                    end_of_follow_up_exclude: censoring_rules.end_of_follow_up_exclude
                })
            }
        }
    }

    reset = () => {
        this.setState({
            through_2015_12_31: null,
            end_of_follow_up: null,
            end_of_follow_up_specified: null,
            end_of_follow_up_exclude: null
        });
    }

    onChangeThrough2015 = e => {
        this.setState({
            through_2015_12_31: e.target.value,
        }, this.saveCensoringRules);
    };

    onChangeEnd = e => {
        this.setState({
            end_of_follow_up: e.target.value,
        }, this.saveCensoringRules);
    };

    onChangeDate = (date, str) => {
        this.setState({
            end_of_follow_up_specified: date
        }, this.saveCensoringRules);
    }

    onChangeExclude = e => {
        this.setState({
            end_of_follow_up_exclude: e.target.value,
        }, this.saveCensoringRules);
    };

    setCensoringRules = () => {
        let obj = {
            through_2015_12_31: this.state.through_2015_12_31,
            end_of_follow_up: this.state.end_of_follow_up,
            end_of_follow_up_specified: this.state.end_of_follow_up_specified,
            end_of_follow_up_exclude: this.state.end_of_follow_up_exclude,
        }
        this.props.setup_censoring_rules(obj);
    }

    saveCensoringRules = () => {
        let obj = {
            through_2015_12_31: this.state.through_2015_12_31,
            end_of_follow_up: this.state.end_of_follow_up,
            end_of_follow_up_specified: this.state.end_of_follow_up_specified,
            end_of_follow_up_exclude: this.state.end_of_follow_up_exclude,
        }
        this.props.save_censoring_rules(obj);
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
                    The next questions ask about the end of follow-up and censoring rules.
                </Typography>

                <Typography style={{padding: '5pt 10pt 0pt 10pt', width: '100%'}}>
                    CTS follow-up data are currently complete through 12/31/2017. Will your
                    analysis include all eligible cases diagnosed through 12/31/2017?
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeThrough2015} value={this.state.through_2015_12_31}>
                        <Radio style={radioStyle} value={true}>
                            Yes
                        </Radio>
                        <Radio style={radioStyle} value={false}>
                            No
                        </Radio>
                    </Radio.Group>
                </div>

                {
                    this.state.through_2015_12_31 === false? (
                        <div>
                            <Typography style={{padding: '5pt 10pt 0pt 10pt', width: '100%'}}>
                                If no, please specify the date on which your analysis follow-up will end:
                            </Typography>
                            <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                                <Radio.Group onChange={this.onChangeEnd} value={this.state.end_of_follow_up}>
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
                                            this.state.end_of_follow_up === 'Other' ?
                                                <DatePicker
                                                    required
                                                    disabledDate={disabledDate}
                                                    style={{marginLeft: '10pt'}}
                                                    value={this.state.end_of_follow_up_specified}
                                                    format={dateFormat}
                                                    onChange={this.onChangeDate}
                                                /> : null
                                        }
                                    </Radio>
                                </Radio.Group>
                            </div>
                        </div>
                    ) : null
                }

                <Typography style={{padding: '5pt 10pt 0pt 10pt', width: '100%'}}>
                    By default, CTS analyses censor participants when they are diagnosed
                    with any other cancer; die; move out of California; if applicable,
                    undergo risk-eliminating surgery (hysterectomy, bilateral oophorectomy,
                    or bilateral mastectomy for analyses of uterine, ovarian, or breast cancers,
                    respectively); or reach the administrative censoring date (12/31/2017).
                    You can choose whether to censor participants who are diagnosed with
                    any other cancer. Please specify your choice for censoring rules:”
                </Typography>

                <div style={{padding: '5pt 20pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeExclude} value={this.state.end_of_follow_up_exclude}>
                        <table>
                            <tbody style={{verticalAlign: 'super'}}>
                            <tr>
                                <td><Radio style={radioStyle} value={'default'}></Radio></td>
                                <td>
                                    Use the default CTS rules. Follow-up time will end at the earliest of
                                    the dates described above.
                                </td>
                            </tr>
                            <tr>
                                <td><Radio style={radioStyle} value={'no censor at diagnosis for any other'}></Radio></td>
                                <td>
                                    Do not censor at diagnosis of any other cancer. Follow-up time will
                                    end at the earliest of the other dates described above.
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </Radio.Group>
                </div>

                {/*
                <div style={{width: '100%', textAlign: 'center'}}>
                    <Tooltip title="Save and configure the next part">
                        <Button variant="contained"
                                color="primary"
                                onClick={() => this.setCensoringRules()}
                                style={{margin: '0pt'}}>
                            Next
                        </Button>
                    </Tooltip>
                </div>
                */}

            </div>
        );
    }

}

export default CensoringRules;
