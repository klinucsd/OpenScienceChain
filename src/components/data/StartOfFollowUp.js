import React from 'react';
import Typography from '@material-ui/core/Typography/index';
import Button from '@material-ui/core/Button';
import 'antd/dist/antd.css';
import {Radio, DatePicker} from 'antd';
import moment from 'moment';
import Tooltip from "@material-ui/core/Tooltip/Tooltip";

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

class StartOfFollowUp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            start_of_follow_up: null,
            start_of_follow_up_specified: null,
            start_of_follow_up_exclude: null
        }
    }

    componentDidMount() {
        if (this.props.project && this.props.project.start_of_follow_up) {
            let start_of_follow_up = JSON.parse(this.props.project.start_of_follow_up);
            if (start_of_follow_up)  {
                this.setState({
                    start_of_follow_up: start_of_follow_up.start_of_follow_up,
                    start_of_follow_up_specified: start_of_follow_up.start_of_follow_up_specified ?
                        moment.utc(start_of_follow_up.start_of_follow_up_specified) : null,
                    start_of_follow_up_exclude: start_of_follow_up.start_of_follow_up_exclude
                })
            }
        }
    }

    reset = () => {
        this.setState({
            start_of_follow_up: null,
            start_of_follow_up_specified: null,
            start_of_follow_up_exclude: null
        });
    }

    setStartOfFollowUp = () => {
        let obj = {
            start_of_follow_up: this.state.start_of_follow_up,
            start_of_follow_up_specified: this.state.start_of_follow_up_specified,
            start_of_follow_up_exclude: this.state.start_of_follow_up_exclude
        }
        this.props.setup_start_of_follow_up(obj);
    }

    saveStartOfFollowUp = () => {
        let obj = {
            start_of_follow_up: this.state.start_of_follow_up,
            start_of_follow_up_specified: this.state.start_of_follow_up_specified,
            start_of_follow_up_exclude: this.state.start_of_follow_up_exclude
        }
        this.props.save_start_of_follow_up(obj);
    }

    onChangeStart = e => {
        this.setState({
            start_of_follow_up: e.target.value,
        }, this.saveStartOfFollowUp);
    };

    onChangeDate = (date, str) => {
        this.setState({
            start_of_follow_up_specified: date
        }, this.saveStartOfFollowUp);
    }

    onChangeExclude = e => {
        this.setState({
            start_of_follow_up_exclude: e.target.value,
        }, this.saveStartOfFollowUp);
    };

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
                    The next questions ask about follow-up time and whether to exclude prevalent cancers.
                </Typography>

                <Typography style={{padding: '5pt 10pt 0pt 10pt', width: '100%'}}>
                    For your analysis, when should follow-up begin?
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeStart} value={this.state.start_of_follow_up}>
                        <Radio style={radioStyle} value={'QNR_1_FILL_DT'}>
                            CTS Baseline - Questionnaire 1 (1995-1996)
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
                                this.state.start_of_follow_up === 'Other' ?
                                    <DatePicker
                                        required
                                        disabledDate={disabledDate}
                                        style={{marginLeft: '10pt'}}
                                        value={this.state.start_of_follow_up_specified}
                                        format={dateFormat}
                                        onChange={this.onChangeDate}
                                    /> : null
                            }
                        </Radio>
                    </Radio.Group>
                </div>

                <Typography style={{padding: '5pt 10pt 0pt 10pt', width: '100%'}}>
                    Participants with prevalent cancer at the start of your follow-up can be included or excluded.
                    Please choose whether to exclude participants who had cancer at the start of follow-up:
                </Typography>

                <div style={{padding: '5pt 20pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeExclude} value={this.state.start_of_follow_up_exclude}>
                        <table>
                            <tbody style={{verticalAlign: 'super'}}>
                                <tr>
                                    <td><Radio style={radioStyle} value={'exclude all'}></Radio></td>
                                    <td>
                                        Exclude all participants who had a prevalent cancer of any
                                        type at the start of follow-up.
                                    </td>
                                </tr>
                                <tr>
                                    <td><Radio style={radioStyle} value={'exclude interest'}></Radio></td>
                                    <td>
                                        Exclude only the participants who had a prevalent cancer
                                        of interest (i.e., the cancer endpoint for your analysis)
                                        at the start of follow-up.
                                    </td>
                                </tr>
                                <tr>
                                    <td><Radio style={radioStyle} value={'include all'}></Radio></td>
                                    <td>Include all participants, even those with prevalent cancer
                                        at the start of follow-up.</td>
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
                                onClick={() => this.setStartOfFollowUp()}
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

export default StartOfFollowUp;
