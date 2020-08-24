import React from 'react';
import Typography from '@material-ui/core/Typography';
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
//import CircularProgress from '@material-ui/core/CircularProgress';
import Tooltip from '@material-ui/core/Tooltip';
import StartOfFollowUp from './StartOfFollowUp';
import CensoringRules from './CensoringRules';
import CancerEndpoint from './CancerEndpoint';
import QuestionnaireData from './questionnarie/QuestionnaireData';
import SelectedDataSummary from './SelectedDataSummary';
import Summary from './Summary';
import axios from "axios";
import MuiButton from "@material-ui/core/Button";
import Paper from '@material-ui/core/Paper';
import {Tabs, Button, Space, Modal, Progress} from 'antd';
import 'antd/dist/antd.css';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';

const {TabPane} = Tabs;
const moment = require('moment');

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
            next_step_valid: false,

            showWaitDowwnload: false,
            percent: 30,

        }
        this.summaryRef = React.createRef();
        this.cancerEndpointRef = React.createRef();
        this.startOfFollowUpRef = React.createRef();
        this.censoringRulesRef = React.createRef();
        this.questionnarieRef = React.createRef();

        this.makeProgressFunct = null;
    }

    componentDidMount() {
        if (this.state.activeStep === 0) {
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

        console.log("questionnarie = " + JSON.stringify(this.state.questionnarie, null, 2));
        console.log("updates = " + JSON.stringify(updates, null, 2));

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

        let preselected = {
            "Q1": {
                'age_at_baseline': true,
                'adopted': true,
                'twin': true,
                'birthplace': true,
                'birthplace_mom': true,
                'birthplace_dad': true,
                'participant_race': true,
                'nih_ethnic_cat': true,
                'age_mom_atbirth': true,
                'age_dad_atbirth': true,
                'menarche_age': true,
                'oralcntr_ever_q1': true,
                'oralcntr_yrs': true,
                'fullterm_age1st': true,
                'preg_ever_q1': true,
                'preg_total_q1': true,
                'meno_stattype': true,
                'height_q1': true,
                'weight_q1': true,
                'bmi_q1': true,
                'endoca_self_q1': true,
                'cervca_self_q1': true,
                'ovryca_self_q1': true,
                'lungca_self_q1': true,
                'leuk_self_q1': true,
                'hodg_self_q1': true,
                'colnca_self_q1': true,
                'thyrca_self_q1': true,
                'meln_self_q1': true,
                'diab_self_q1': true,
                'hbp_self_q1': true,
                'brca_selfsurvey': true,
                'allex_hrs_q1': true,
                'allex_life_hrs': true,
                'vit_mulvit_q1': true,
                'alchl_analyscat': true,
                'smoke_expocat': true,
                'smoke_totyrs': true,
                'smoke_totpackyrs': true,
                'cig_day_avg': true,
            }, "Q2": {}, "Q3": {}, "Q4": {}, "Q4mini": {}, "Q5": {}, "Q5mini": {}, "Q6": {}
        };

        let project = this.state.project;
        project.cancer_endpoint = null;
        project.start_of_follow_up = null;
        project.censoring_rules = null;
        project.questionnarie = JSON.stringify(preselected);

        this.setState({
            cancer_endpoint: null,
            start_of_follow_up: null,
            censoring_rules: null,
            questionnarie: preselected,
            project: project,
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
        if (this.state.activeStep < 4) {
            let activeStep = this.state.activeStep + 1;
            this.setState({
                activeStep,
                next_step_valid:
                    activeStep === 1 ?
                        this.validate('start of follow-up') :
                        activeStep === 2 ?
                            this.validate('censoring rules') :
                            true
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

    makeProgress = () => {
        if (this.state.percent < 100) {
            let thisState = this;
            axios.get('/api/task_status/' + this.state.task_id)
                .then(function (response) {
                    console.log("task status: " + JSON.stringify(response.data));
                    thisState.setState({
                        task_status: response.data.status
                    });
                })
                .catch(function (error) {
                    console.log(error);
                })
                .then(function () {
                    // always executed
                });

            this.setState({
                percent: this.state.percent + 1
            });
        }
    }

    downloadData = () => {

        let task_id = new Date().getTime();

        // show dialog
        this.setState({
            showWaitDowwnload: true,
            percent: 0,
            task_id: task_id,
            task_status: 'wait for processing your task.'
        });

        this.makeProgressFunct = setInterval(this.makeProgress, 1800);
        let thisState = this;

        const format = "YYYYMMDD_HHmm";
        let date_rep = moment(new Date()).format(format);
        axios({
            url: `/api/download/data/${this.state.project.id}/${this.state.project.abbrev}/${task_id}/${date_rep}`,
            method: 'GET',
            responseType: 'blob', // important
        }).then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            let filename =
                `${thisState.state.project.project_number}_${thisState.state.project.abbrev}_v${thisState.state.project.version < 10 ? '0' + thisState.state.project.version : thisState.state.project.version}_${date_rep}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            clearInterval(this.makeProgressFunct);
            let project = thisState.state.project;
            project.version = project.version + 1;
            this.setState({
                showWaitDowwnload: false,
                project
            });
        }).catch(function (error) {

            if (thisState.makeProgressFunct) {
                clearInterval(thisState.makeProgressFunct);
            }

            thisState.setState({
                showWaitDowwnload: false
                //task_status: 'Server is busy. Please wait...'
            });

            Modal.warning(
                {
                    title: 'Warning',
                    content:
                        `The server is too busy to generate data for other users. 
                         An out of memory error may crush the system.
                         Please wait for two minutes to request again. 
                        `
                });

        });
    }

    handleOk = () => {
        clearInterval(this.makeProgressFunct);
        this.setState({
            showWaitDowwnload: false
        });
    }

    handleCancel = () => {
        clearInterval(this.makeProgressFunct);
        this.setState({
            showWaitDowwnload: false
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
                                  <Button size={'small'} style={{marginRight: '10pt'}} onClick={this.startOver}>
                                      Start Over
                                  </Button>
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
                                        <Step>
                                            <StepLabel completed={
                                                this.state.cancer_endpoint &&
                                                this.state.cancer_endpoint.length > 0 &&
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
                                                ) &&
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
                                                ) &&
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

                                                       onClick={() => this.stepTo(4)}
                                            >
                                                {'Summary'}
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

                                    {
                                        this.state.activeStep === 4 ?
                                            <Summary project={this.state.project}/> : null
                                    }

                                    <div style={{width: '100%', textAlign: 'center'}}>
                                        <Space>
                                            {
                                                this.state.activeStep > 0 ?
                                                    <MuiButton variant="contained"
                                                               color="primary"
                                                               disabled={this.state.activeStep === 0}
                                                               onClick={this.backStep}
                                                               style={{
                                                                   margin: '10pt 0pt 8pt 0pt',
                                                                   textTransform: 'none'
                                                               }}>
                                                        BACK
                                                    </MuiButton>
                                                    :
                                                    null
                                            }

                                            {
                                                this.state.activeStep < 4 ?
                                                    <MuiButton variant="contained"
                                                               color="primary"
                                                               disabled={this.state.activeStep === 4}
                                                               onClick={this.nextStep}
                                                               style={{
                                                                   margin: '10pt 0pt 8pt 0pt',
                                                                   textTransform: 'none'
                                                               }}>
                                                        NEXT
                                                    </MuiButton> :
                                                    null
                                            }

                                            {
                                                this.state.activeStep === 4 ?
                                                    <MuiButton variant="contained"
                                                               color="primary"


                                                               disabled={!(
                                                                   this.state.cancer_endpoint &&
                                                                   this.state.cancer_endpoint.length > 0 &&
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
                                                                   ) &&
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
                                                                   ) &&
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
                                                               )}


                                                               onClick={this.downloadData}
                                                               style={{
                                                                   margin: '10pt 0pt 8pt 0pt',
                                                                   textTransform: 'none'
                                                               }}>
                                                        DOWNLOAD DATA
                                                    </MuiButton>
                                                    :
                                                    null
                                            }

                                        </Space>
                                    </div>

                                </Paper>
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

                            {/*
                            <TabPane key="datalog"
                                     tab={
                                         <span style={{padding: '0pt 32pt 0pt 32pt'}}>Data Generation Log</span>
                                     }>
                                <div style={{minHeight: '90vh'}}>
                                    <Datalog project={this.state.project} />
                                </div>
                            </TabPane>
                            */}
                        </Tabs>

                    </div>
                </div>

                <Modal
                    title="Please wait for downloading data"
                    visible={this.state.showWaitDowwnload}
                    centered
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={[
                        <Button key="back" onClick={this.handleCancel}>
                            Cancel
                        </Button>,
                    ]}
                >
                    <div style={{textAlign: 'center'}}>
                        <Typography>
                            It may take 1-2 minutes to generate the data.
                        </Typography>
                        <Progress type="circle"
                                  width={60}
                                  percent={this.state.percent}
                                  style={{color: 'green', marginTop: '10pt'}}
                        />
                        <Typography style={{paddingTop: '5pt'}}>
                            {this.state.task_status}
                        </Typography>
                    </div>
                </Modal>
            </div>
        );
    }

}

export default ProjectConfigPane;
