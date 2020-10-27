import React from 'react';
import 'antd/dist/antd.css';
import {Checkbox, Card} from 'antd';
import './index.css';
import './cancer_endpoint.css';
import Typography from '@material-ui/core/Typography/index';
import {Input} from 'antd';
import {Typography as AntTypography} from 'antd';

const {Text} = AntTypography;

const {TextArea} = Input;

const root_style = {
    width: '100%',
}

class MortalityInformation extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            all_cause_mortality: false,
            cause_specific_mortality: false,
            mortality_code: null,
            additional_info: null
        }
    }

    componentDidMount() {
        if (this.props.project && this.props.project.mortality_info) {
            let mortality_info = JSON.parse(this.props.project.mortality_info);
            if (mortality_info) {
                this.setState({
                    all_cause_mortality: mortality_info.all_cause_mortality === undefined ? false : mortality_info.all_cause_mortality,
                    cause_specific_mortality: mortality_info.cause_specific_mortality === undefined ? false : mortality_info.cause_specific_mortality,
                    mortality_code: mortality_info.mortality_code,
                    additional_info: mortality_info.additional_info
                })
            }
        }
    }

    static getTitle = () => {
        return 'Enter mortality information';
    }

    static isComplete = (state) => {
        return state.mortality_info !== undefined &&
            state.mortality_info !== null &&
            state.mortality_info.mortality_code != null && state.mortality_info.mortality_code.trim().length !== 0 &&
            state.mortality_info.additional_info != null && state.mortality_info.additional_info.trim().length !== 0;
    }

    static getSummary = (project, index) => {

        let mortality_info = project.mortality_info ?
            JSON.parse(project.mortality_info) : null;

        return (
            <Card key={'module-' + index}
                  size="small"
                  title={'Mortality Information'}
                  headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                  style={{width: '100%', margin: index > 0 ? '20pt 0pt 0pt 0pt' : '0pt'}}>

                {
                    mortality_info === undefined || mortality_info === null ?
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text type="danger">
                                No mortality information available
                            </Text>
                        </div>
                        :
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <table border={0}>
                                <tbody>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Included mortality endpoint types:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                mortality_info.all_cause_mortality === false &&
                                                mortality_info.cause_specific_mortality === false ?
                                                    'Not specified' : null
                                            }
                                            {
                                                mortality_info.all_cause_mortality === true ?
                                                    'All-cause mortality' : null
                                            }
                                            {
                                                mortality_info.cause_specific_mortality === true ?
                                                    (mortality_info.all_cause_mortality === true ? ', ' : '') +
                                                    'Cause-specific mortality' : null
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            The cause of death or ICD mortality code(s):
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                mortality_info.mortality_code === null ||
                                                mortality_info.mortality_code.trim().length === 0 ?
                                                    'Not specified' :
                                                    mortality_info.mortality_code
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Any censoring criteria or other information:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                mortality_info.additional_info === null &&
                                                mortality_info.additional_info.trim().length === 0 ?
                                                    'Not specified' :
                                                    mortality_info.additional_info
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
            all_cause_mortality: false,
            cause_specific_mortality: false,
            mortality_code: null,
            additional_info: null
        });
    }

    onChangeAllCauseMortality = (event) => {
        this.setState({
            all_cause_mortality: event.target.checked
        }, this.saveMortalityInformation)
    }

    onChangeCauseSpecificMortality = (event) => {
        this.setState({
            cause_specific_mortality: event.target.checked
        }, this.saveMortalityInformation)
    }

    onChangeMortalityCode = (event) => {
        this.setState({
            mortality_code: event.target.value
        }, this.saveMortalityInformation)
    }

    onChangeAdditionalInfo = (event) => {
        this.setState({
            additional_info: event.target.value,
        }, this.saveMortalityInformation);
    }

    saveMortalityInformation = () => {
        let obj = {
            all_cause_mortality: this.state.all_cause_mortality,
            cause_specific_mortality: this.state.cause_specific_mortality,
            mortality_code: this.state.mortality_code,
            additional_info: this.state.additional_info
        }

        //console.log(`saveMortalityInformation: ${JSON.stringify(obj, null, 2)}`);

        this.props.save_mortality_information(obj);
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
                    What type of mortality endpoint does you analysis include?
                </Typography>

                <div style={{padding: '5pt 80pt 10pt 25pt'}}>
                    <Checkbox style={radioStyle}
                              checked={this.state.all_cause_mortality}
                              onChange={this.onChangeAllCauseMortality}>
                        All-cause mortality
                    </Checkbox>
                    <Checkbox style={radioStyle}
                              checked={this.state.cause_specific_mortality}
                              onChange={this.onChangeCauseSpecificMortality}>
                        Cause-specific mortality
                    </Checkbox>
                </div>

                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    How is the mortality endpoint defined? Enter the cause of death or ICD mortality code(s) below:
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.mortality_code}
                              onChange={this.onChangeMortalityCode}
                              allowClear/>
                </div>

                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    Please specify any censoring criteria or other information about your project:
                </Typography>
                <Typography style={{padding: '2pt 10pt 0pt 10pt', width: '100%', fontStyle: 'italic'}}>
                    By default, CTS analyses censor participants when they die, move out of California,
                    or reach the administrative censoring date.
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.additional_info}
                              onChange={this.onChangeAdditionalInfo}
                              allowClear/>
                </div>


            </div>
        );
    }
}


export default MortalityInformation;
