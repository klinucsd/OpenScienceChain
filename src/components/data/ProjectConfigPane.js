import React from 'react';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import {withStyles} from '@material-ui/core/styles';
import MuiExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import Tooltip from '@material-ui/core/Tooltip';
import StartOfFollowUp from './StartOfFollowUp';
import CensoringRules from './CensoringRules';
import CancerEndpoint from './CancerEndpoint';
import QuestionnaireData from './questionnarie/QuestionnaireData';
import SelectedDataSummary from './SelectedDataSummary';
import axios from "axios";
import MuiButton from "@material-ui/core/Button";
import Paper from '@material-ui/core/Paper';

import {Tabs, Button, Space} from 'antd';
import 'antd/dist/antd.css';

import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';


const {TabPane} = Tabs;

/*
const ExpansionPanel2 = withStyles({
    root: {
        border: '1px solid rgba(0, 0, 0, .125)',
        boxShadow: 'none',
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        '&:before': {
            display: 'none',
        },
        '&$expanded': {
            margin: 'auto',
        },
    },
    expanded: {},
})(MuiExpansionPanel);
*/

const ExpansionPanelSummary2 = withStyles({
    root: {
        //backgroundColor: 'rgba(0, 0, 0, .03)',
        backgroundColor: 'rgba(128, 128, 128, .18)',
        borderBottom: '1px solid rgba(0, 0, 0, .125)',
        marginBottom: -1,
        minHeight: 46,
        '&$expanded': {
            minHeight: 46,
        },
    },
    content: {
        '&$expanded': {
            margin: '12px 0',
        },
    },
    expanded: {},
})(MuiExpansionPanelSummary);

/*
const ExpansionPanelDetails2 = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiExpansionPanelDetails);
*/

/*
const getModules = (project) => {
    let modules = [];
    if (project.study_design === 'Cohort') {
        if (project.endpoint === 'Cancer') {
            modules = ['cancer endpoint', 'start of follow-up', 'censoring rules', 'questionnaire data'];
        } else if (project.endpoint === 'Hospitalization') {
            modules = ['start of follow-up', 'questionnaire data'];
        } else if (project.endpoint === 'Mortality') {
            modules = ['start of follow-up', 'questionnaire data'];
        }
    } else if (project.study_design === 'Case-Control') {
        if (project.endpoint === 'Cancer') {
            modules = ['cancer endpoint', 'questionnaire data'];
        } else if (project.endpoint === 'Hospitalization') {
            modules = ['questionnaire data'];
        } else if (project.endpoint === 'Mortality') {
            modules = ['questionnaire data'];
        }
    } else if (project.study_design === 'Cross-Sectional') {
        if (project.endpoint === 'Cancer') {
            modules = ['cancer endpoint', 'questionnaire data'];
        } else if (project.endpoint === 'Hospitalization') {
            modules = ['questionnaire data'];
        } else if (project.endpoint === 'Mortality') {
            modules = ['questionnaire data'];
        }
    }
    return modules;
}
 */

const getExpanded = (project) => {
    let size = 0;
    if (project.study_design === 'Cohort') {
        if (project.endpoint === 'Cancer') {
            size = 4;
        } else if (project.endpoint === 'Hospitalization') {
            size = 4;
        } else if (project.endpoint === 'Mortality') {
            size = 4;
        }
    } else if (project.study_design === 'Case-Control') {
        if (project.endpoint === 'Cancer') {
            size = 4;
        } else if (project.endpoint === 'Hospitalization') {
            size = 4;
        } else if (project.endpoint === 'Mortality') {
            size = 4;
        }
    } else if (project.study_design === 'Cross-Sectional') {
        if (project.endpoint === 'Cancer') {
            size = 4;
        } else if (project.endpoint === 'Hospitalization') {
            size = 4;
        } else if (project.endpoint === 'Mortality') {
            size = 4;
        }
    }
    let result = [];
    if (size > 0) {
        result.push(true);
        for (var i = 0; i < size - 1; i++) {
            result.push(false);
        }
    }
    return result;
}


class ProjectConfigPane extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            project: this.props.project,
            modules: ['cancer endpoint', 'start of follow-up', 'censoring rules', 'questionnaire data'],
            //getModules(this.props.project),
            expanded: getExpanded(this.props.project),

            cancer_endpoint: this.props.project.cancer_endpoint ? JSON.parse(this.props.project.cancer_endpoint) : null,
            start_of_follow_up: this.props.project.start_of_follow_up ? JSON.parse(this.props.project.start_of_follow_up) : null,
            censoring_rules: this.props.project.censoring_rules ? JSON.parse(this.props.project.censoring_rules) : null,
            questionnarie: this.props.project.questionnarie ? JSON.parse(this.props.project.questionnarie) : null,

            activeTabKey: "config",  // manage tabs
            activeStep: 0,
            next_step_valid: false

        }
        this.summaryRef = React.createRef();
        this.cancerEndpointRef = React.createRef();
        this.startOfFollowUpRef = React.createRef();
        this.censoringRulesRef = React.createRef();
        this.questionnarieRef = React.createRef();
    }

    componentDidMount() {
        if (this.state.activeStep == 0) {
            this.setState({
                next_step_valid: this.validate('cancer endpoint')
            });
        }
    }

    onClickExpansionPanel = (i) => {
        let newExpanded = [];
        for (var j = 0; j < this.state.expanded.length; j++) {
            if (i === j) {
                newExpanded.push(!this.state.expanded[j]);
            } else {
                newExpanded.push(this.state.expanded[j]);
            }
        }
        this.setState({
            expanded: newExpanded
        })
    }

    showExpansionPanel = (i) => {
        let newExpanded = [];
        for (var j = 0; j < this.state.expanded.length; j++) {
            if (i === j) {
                newExpanded.push(true);
            } else {
                newExpanded.push(false);
            }
        }
        this.setState({
            expanded: newExpanded,
            activeTabKey: "config"
        })
    }

    setStartOfFollowUp = (start_of_follow_up) => {
        let i = this.state.modules.indexOf('start of follow-up');
        let expands = [];
        for (var j = 0; j < this.state.expanded.length; j++) {
            if (j === i) {
                expands.push(false);
            } else if (j === i + 1) {
                expands.push(true);
            } else {
                expands.push(this.state.expanded[j]);
            }
        }
        this.setState({
            start_of_follow_up,
            expanded: expands
        }, this.saveProjectConfig);
    }

    saveStartOfFollowUp = (start_of_follow_up) => {

        let project = this.state.project;
        project.start_of_follow_up = JSON.stringify(start_of_follow_up);

        this.setState({
            start_of_follow_up,
            project
        }, this.saveProjectConfig);
    }

    setCensoringRules = (censoring_rules) => {
        let i = this.state.modules.indexOf('censoring rules');
        let expands = [];
        for (var j = 0; j < this.state.expanded.length; j++) {
            if (j === i) {
                expands.push(false);
            } else if (j === i + 1) {
                expands.push(true);
            } else {
                expands.push(this.state.expanded[j]);
            }
        }
        this.setState({
            expanded: expands,
            censoring_rules
        }, this.saveProjectConfig);
    }

    saveCensoringRules = (censoring_rules) => {

        let project = this.state.project;
        project.censoring_rules = JSON.stringify(censoring_rules);

        this.setState({
            censoring_rules,
            project
        }, this.saveProjectConfig);
    }

    setCancerEndpoint = (cancer_endpoint) => {
        let i = this.state.modules.indexOf('cancer endpoint');
        let expands = [];
        for (var j = 0; j < this.state.expanded.length; j++) {
            if (j === i) {
                expands.push(false);
            } else if (j === i + 1) {
                expands.push(true);
            } else {
                expands.push(this.state.expanded[j]);
            }
        }
        this.setState({
            expanded: expands,
            cancer_endpoint: cancer_endpoint
        }, this.saveProjectConfig);
    }

    saveCancerEndpoint = (cancer_endpoint) => {

        let project = this.state.project;
        project.cancer_endpoint = JSON.stringify(cancer_endpoint);

        this.setState({
            cancer_endpoint,
            project
        }, this.saveProjectConfig);
    }

    saveQuestionnarie = (variable_selected) => {

        let project = this.state.project;
        project.questionnarie = JSON.stringify(variable_selected);
        this.setState({
            questionnarie: variable_selected,
            project
        }, this.saveProjectConfig);
    }

    saveProjectConfig = async () => {

        let thisProps = this.props;
        let updates = {
            cancer_endpoint: this.state.cancer_endpoint ? JSON.stringify(this.state.cancer_endpoint) : null,
            start_of_follow_up: this.state.start_of_follow_up ? JSON.stringify(this.state.start_of_follow_up) : null,
            censoring_rules: this.state.censoring_rules ? JSON.stringify(this.state.censoring_rules) : null,
            questionnarie: this.state.questionnarie ? JSON.stringify(this.state.questionnarie) : null,
        }

        await axios.put('/api/project/' + this.state.project.id, updates)
            .then(function (response) {
                let result = response.data;
                thisProps.update_project_in_list(result);
            });

        if (this.summaryRef.current && this.summaryRef.current.refresh) {
            this.summaryRef.current.refresh(
                this.state.cancer_endpoint,
                this.state.start_of_follow_up,
                this.state.censoring_rules
            );
        }

        if (this.state.activeStep === 0) {
            this.setState({
                next_step_valid: this.validate('cancer endpoint')
            });
        } else if (this.state.activeStep === 1) {
            this.setState({
                next_step_valid: this.validate('start of follow-up')
            });
        } else if (this.state.activeStep === 2) {
            this.setState({
                next_step_valid: this.validate('censoring rules')
            });
        }
    }

    getCurrentState = () => {
        return {
            cancer_endpoint: this.state.cancer_endpoint,
            start_of_follow_up: this.state.start_of_follow_up,
            censoring_rules: this.state.censoring_rules
        }
    }

    validate = (module) => {
        if (module === 'start of follow-up') {
            let sofu = this.state.start_of_follow_up;
            if (sofu) {
                if (sofu.start_of_follow_up !== null) {
                    if (sofu.start_of_follow_up === 'Other') {
                        if (sofu.start_of_follow_up_specified !== null) {
                            return sofu.start_of_follow_up_exclude !== null;
                        } else {
                            return false;
                        }
                    } else {
                        return sofu.start_of_follow_up_exclude !== null;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        if (module === 'censoring rules') {
            let cr = this.state.censoring_rules;
            if (cr) {
                if (cr.through_2015_12_31 !== null) {
                    if (cr.through_2015_12_31 === true) {
                        return cr.end_of_follow_up_exclude !== null;
                    } else if (cr.through_2015_12_31 === false) {
                        if (cr.end_of_follow_up !== null) {
                            if (cr.end_of_follow_up === 'Other') {
                                if (cr.end_of_follow_up_specified !== null) {
                                    return cr.end_of_follow_up_exclude !== null;
                                } else {
                                    return false;
                                }
                            } else {
                                return cr.end_of_follow_up_exclude !== null;
                            }
                        } else {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        if (module === 'cancer endpoint') {
            let cr = this.state.cancer_endpoint;
            if (cr) {
                return cr.length > 0;
            } else {
                return false;
            }
        }

        return false;
    }

    onTabChange = activeKey => {
        this.setState({
            activeTabKey: activeKey
        }, this.refreshCharts);
    };

    refreshCharts = () => {
        if (this.state.activeTabKey === 'summary') {
            this.summaryRef.current.onChange();
        }
    }

    startOver = () => {

        let project = this.state.project;
        project.cancer_endpoint = null;
        project.start_of_follow_up = null;
        project.censoring_rules = null;
        project.questionnarie = null;

        this.setState({
            cancer_endpoint: null,
            start_of_follow_up: null,
            censoring_rules: null,
            questionnarie: null,
            project,
            activeTabKey: 'config',
            activeStep: 0,
            next_step_valid: false
        }, this.saveProjectConfig);

        if (this.cancerEndpointRef.current) {
            this.cancerEndpointRef.current.reset();
        }

        if (this.startOfFollowUpRef.current) {
            this.startOfFollowUpRef.current.reset();
        }

        if (this.censoringRulesRef.current) {
            this.censoringRulesRef.current.reset();
        }

        if (this.questionnarieRef.current) {
            this.questionnarieRef.current.reset();
        }
    }

    nextStep = () => {
        if (this.state.activeStep < 3) {
            let activeStep = this.state.activeStep + 1;
            this.setState({
                activeStep,
                next_step_valid: activeStep === 1 ? this.validate('start of follow-up') :
                    activeStep === 2 ? this.validate('censoring rules') : false
            });
        }
    }

    backStep = () => {
        if (this.state.activeStep > 0) {
            let activeStep = this.state.activeStep - 1;
            this.setState({
                activeStep,
                next_step_valid: activeStep === 0 ? this.validate('cancer endpoint') :
                    activeStep === 1 ? this.validate('start of follow-up') :
                        activeStep === 2 ? this.validate('censoring rules') : false
            });
        }
    }

    stepTo = (step) => {
        this.setState({
            activeStep: step
        });
    }

    render() {
        return (
            <div>
                <div style={{display: 'flex', width: '100%'}}>
                    <div style={{flex: '1', padding: '10pt 20pt 0pt 20pt', width: '70%', backgroundColor: 'white'}}>
                        <div style={{padding: '10pt 0pt 5pt 15pt'}}>
                            <Typography variant={"h6"}>
                                <table>
                                    <tbody>
                                    <tr>
                                        <td style={{paddingTop: '8pt', paddingRight: '8pt'}}>
                                            <Tooltip title="Back to Project List">
                                                <FormatListBulletedIcon onClick={() => this.props.back()}/>
                                            </Tooltip>
                                        </td>
                                        <td>
                                            Project: {this.state.project.name}
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </Typography>
                        </div>

                        <Tabs activeKey={this.state.activeTabKey}
                              onChange={this.onTabChange}
                              animated={false}
                              tabBarExtraContent={
                                  <Button size={'small'} style={{marginRight: '10pt'}} onClick={this.startOver}>Start
                                      Over</Button>
                              }
                              size="default"
                              type="line"
                              style={{margin: '5pt 10pt 20pt 10pt'}}
                        >

                            <TabPane key="config"
                                     tab={<span style={{padding: '0pt 32pt 0pt 32pt'}}>Select Data</span>}
                                     style={{padding: '4pt 2pt 0pt 2pt'}}
                            >

                                <Paper elevation={8}
                                       style={{
                                           padding: '20pt 20pt 20pt 20pt',
                                           margin: '10pt 5pt 10pt 5pt',
                                       }}>

                                    <Stepper activeStep={this.state.activeStep} alternativeLabel>
                                        <Step key={'Task1'}>
                                            <StepLabel completed=
                                                           {
                                                               this.state.cancer_endpoint &&
                                                               this.state.cancer_endpoint.length > 0
                                                           }
                                                       onClick={() => this.stepTo(0)}>
                                                {'Select cancer endpoint'}
                                            </StepLabel>
                                        </Step>
                                        <Step key={'Task2'}>
                                            <StepLabel completed=
                                                           {
                                                               this.state.start_of_follow_up !== undefined &&
                                                               this.state.start_of_follow_up !== null &&
                                                               this.state.start_of_follow_up.start_of_follow_up !== undefined &&
                                                               this.state.start_of_follow_up.start_of_follow_up !== null &&
                                                               (
                                                                   (
                                                                       this.state.start_of_follow_up.start_of_follow_up === 'Other' &&
                                                                       this.state.start_of_follow_up.start_of_follow_up_specified !== undefined &&
                                                                       this.state.start_of_follow_up.start_of_follow_up_specified !== null
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.start_of_follow_up.start_of_follow_up !== 'Other' &&
                                                                       this.state.start_of_follow_up.start_of_follow_up_exclude !== undefined &&
                                                                       this.state.start_of_follow_up.start_of_follow_up_exclude !== null
                                                                   )
                                                               )
                                                           }
                                                       onClick={() => this.stepTo(1)}>
                                                {'Select start of follow-up'}
                                            </StepLabel>
                                        </Step>
                                        <Step key={'Task3'}>
                                            <StepLabel completed=
                                                           {
                                                               //this.state.censoring_rules &&
                                                               //this.state.censoring_rules.through_2015_12_31 !== undefined
                                                               this.state.censoring_rules !== undefined &&
                                                               this.state.censoring_rules !== null &&
                                                               this.state.censoring_rules.through_2015_12_31 !== undefined &&
                                                               this.state.censoring_rules.through_2015_12_31 !== null &&
                                                               (
                                                                   (
                                                                       this.state.censoring_rules.through_2015_12_31 === true &&
                                                                       this.state.censoring_rules.end_of_follow_up_exclude !== undefined &&
                                                                       this.state.censoring_rules.end_of_follow_up_exclude !== null
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.censoring_rules.through_2015_12_31 === false &&
                                                                       this.state.censoring_rules.end_of_follow_up !== undefined &&
                                                                       this.state.censoring_rules.end_of_follow_up !== null &&
                                                                       (
                                                                           (
                                                                               this.state.censoring_rules.end_of_follow_up === 'Other' &&
                                                                               this.state.censoring_rules.end_of_follow_up_specified !== undefined &&
                                                                               this.state.censoring_rules.end_of_follow_up_specified !== null
                                                                           )
                                                                           ||
                                                                           (
                                                                               this.state.censoring_rules.end_of_follow_up !== 'Other' &&
                                                                               this.state.censoring_rules.end_of_follow_up_exclude !== undefined &&
                                                                               this.state.censoring_rules.end_of_follow_up_exclude !== null
                                                                           )
                                                                       )
                                                                   )
                                                               )


                                                           }
                                                       onClick={() => this.stepTo(2)}>
                                                {'Select censoring rules'}
                                            </StepLabel>
                                        </Step>
                                        <Step key={'Task4'}>
                                            <StepLabel completed=
                                                           {
                                                               this.state.questionnarie &&
                                                               (
                                                                   (
                                                                       this.state.questionnarie['Q1'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q1']) !== '{}'
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.questionnarie['Q2'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q2']) !== '{}'
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.questionnarie['Q3'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q3']) !== '{}'
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.questionnarie['Q4'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q4']) !== '{}'
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.questionnarie['Q4mini'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q4mini']) !== '{}'
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.questionnarie['Q5'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q5']) !== '{}'
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.questionnarie['Q5mini'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q5mini']) !== '{}'
                                                                   )
                                                                   ||
                                                                   (
                                                                       this.state.questionnarie['Q6'] &&
                                                                       JSON.stringify(this.state.questionnarie['Q6']) !== '{}'
                                                                   )
                                                               )
                                                           }
                                                       onClick={() => this.stepTo(3)}>
                                                {'Select questionnaire data'}
                                            </StepLabel>
                                        </Step>
                                    </Stepper>

                                    {
                                        this.state.activeStep === 0 ?
                                            <CancerEndpoint project={this.state.project}
                                                            setup_cancer_endpoint={this.setCancerEndpoint}
                                                            save_cancer_endpoint={this.saveCancerEndpoint}
                                                            ref={this.cancerEndpointRef}
                                            /> : null
                                    }

                                    {
                                        this.state.activeStep === 1 ?
                                            <StartOfFollowUp project={this.state.project}
                                                             setup_start_of_follow_up={this.setStartOfFollowUp}
                                                             save_start_of_follow_up={this.saveStartOfFollowUp}
                                                             ref={this.startOfFollowUpRef}
                                            />
                                            : null
                                    }

                                    {
                                        this.state.activeStep === 2 ?
                                            <CensoringRules project={this.state.project}
                                                            setup_censoring_rules={this.setCensoringRules}
                                                            save_censoring_rules={this.saveCensoringRules}
                                                            ref={this.censoringRulesRef}
                                            />
                                            : null
                                    }

                                    {
                                        this.state.activeStep === 3 ?
                                            <QuestionnaireData project={this.state.project}
                                                               save_questionnarie={this.saveQuestionnarie}
                                                               ref={this.questionnarieRef}
                                            />
                                            : null
                                    }

                                    <div style={{width: '100%', textAlign: 'center'}}>
                                        <Space>
                                            <MuiButton variant="contained"
                                                       color="primary"
                                                       disabled={this.state.activeStep === 0}
                                                       onClick={this.backStep}
                                                       style={{margin: '10pt 0pt 8pt 0pt', textTransform: 'none'}}>
                                                BACK
                                            </MuiButton>
                                            <MuiButton variant="contained"
                                                       color="primary"
                                                       disabled={this.state.activeStep === 3}
                                                       onClick={this.nextStep}
                                                       style={{margin: '10pt 0pt 8pt 0pt', textTransform: 'none'}}>
                                                NEXT
                                            </MuiButton>
                                        </Space>
                                    </div>

                                </Paper>

                                <div style={{height: '200px'}}></div>

                            </TabPane>
                            <TabPane key="summary"
                                     tab={
                                         <span style={{padding: '0pt 32pt 0pt 32pt'}}>Summary Charts</span>
                                     }>
                                <div style={{minHeight: '90vh'}}>
                                    <SelectedDataSummary
                                        project={this.state.project}
                                        caner_endpoint={this.state.cancer_endpoint}
                                        start_of_follow_up={this.state.start_of_follow_up}
                                        censoring_rules={this.state.censoring_rules}
                                        get_current_state={this.getCurrentState}
                                        ref={this.summaryRef}
                                    />
                                </div>
                            </TabPane>
                        </Tabs>

                    </div>
                </div>
            </div>
        );
    }

}

export default ProjectConfigPane;
