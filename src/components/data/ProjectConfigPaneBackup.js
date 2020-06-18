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

import {Tabs, Button} from 'antd';
import 'antd/dist/antd.css';


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

            activeTabKey: "config",
        }
        this.summaryRef = React.createRef();
        this.cancerEndpointRef = React.createRef();
        this.startOfFollowUpRef = React.createRef();
        this.censoringRulesRef = React.createRef();
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
        this.setState({
            start_of_follow_up,
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
        this.setState({
            censoring_rules
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
        this.setState({
            cancer_endpoint
        }, this.saveProjectConfig);
    }

    saveProjectConfig = async () => {
        let thisProps = this.props;
        let updates = {
            cancer_endpoint: this.state.cancer_endpoint? JSON.stringify(this.state.cancer_endpoint) : null,
            start_of_follow_up: this.state.start_of_follow_up? JSON.stringify(this.state.start_of_follow_up) : null,
            censoring_rules: this.state.censoring_rules? JSON.stringify(this.state.censoring_rules) : null,
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
        this.setState({
            cancer_endpoint:  null,
            start_of_follow_up:  null,
            censoring_rules: null,
            activeTabKey: 'config'
        }, this.saveProjectConfig);
        this.cancerEndpointRef.current.reset();
        this.startOfFollowUpRef.current.reset();
        this.censoringRulesRef.current.reset();
    }

    render() {
        return (
            <div>
                <div style={{display: 'flex', width: '100%'}}>
                    <div style={{
                        flex: '0 0 50',
                        width: '250px',
                        top: '200px',
                        height: '50hv',
                        display: 'flex',
                        outline: 0,
                        zIndex: 1200,
                        overflowY: 'auto',
                        flexDirection: 'column',
                        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                        padding: '10pt 0pt 0pt 0pt'
                    }}>
                        <List>
                            {this.state.modules.map((module, i) => (
                                !this.validate(module) ? (
                                    <ListItem button key={module} onClick={() => this.showExpansionPanel(i)}>
                                        <CheckCircleOutlineIcon style={{marginRight: '5pt', color: 'lightgray'}}/>
                                        <ListItemText primary={`Select ${module}`} style={{marginLfet: '-12pt'}}/>
                                    </ListItem>
                                ) : (
                                    <ListItem button key={module} onClick={() => this.showExpansionPanel(i)}>
                                        <CheckCircleIcon style={{marginRight: '5pt', color: 'green'}}/>
                                        <ListItemText primary={`Select ${module}`}/>
                                    </ListItem>
                                )
                            ))}
                        </List>
                    </div>
                    <div style={{flex: '1', padding: '10pt 20pt 0pt 20pt', width: '70%', backgroundColor: 'white'}}>
                        <div style={{padding: '10pt 0pt 5pt 0pt'}}>
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
                                  <Button size={'small'} style={{marginRight: '10pt'}} onClick={this.startOver}>Start Over</Button>
                              }
                              size="default"
                              type="line">

                            <TabPane key="config"
                                     tab={<span style={{padding: '0pt 12pt 0pt 12pt'}}>Select Data</span>}
                                     style={{padding: '4pt 2pt 0pt 2pt'}}
                            >


                                {this.state.modules.map((module, i) => (
                                    <div key={'module-' + i} style={{marginBottom: '20px'}}>
                                        <ExpansionPanel style={{margin: "0 auto"}}
                                                        expanded={this.state.expanded[i]}
                                                        onChange={() => this.onClickExpansionPanel(i)}
                                        >
                                            <ExpansionPanelSummary2
                                                expandIcon={<ExpandMoreIcon/>}
                                                aria-controls={module + "-content"}
                                                id={module + "-header"}
                                            >
                                                <Typography>Select {module}</Typography>
                                            </ExpansionPanelSummary2>
                                            <ExpansionPanelDetails
                                                style={{backgroundColor: 'rgba(128, 128, 128, .05)'}}>
                                                {module === 'start of follow-up' ?
                                                    <StartOfFollowUp project={this.state.project}
                                                                     setup_start_of_follow_up={this.setStartOfFollowUp}
                                                                     save_start_of_follow_up={this.saveStartOfFollowUp}
                                                                     ref={this.startOfFollowUpRef}
                                                    />
                                                    : null
                                                }
                                                {module === 'censoring rules' ?
                                                    <CensoringRules project={this.state.project}
                                                                    setup_censoring_rules={this.setCensoringRules}
                                                                    save_censoring_rules={this.saveCensoringRules}
                                                                    ref={this.censoringRulesRef}
                                                    />
                                                    : null
                                                }
                                                {module === 'cancer endpoint' ?
                                                    <CancerEndpoint project={this.state.project}
                                                                    setup_cancer_endpoint={this.setCancerEndpoint}
                                                                    save_cancer_endpoint={this.saveCancerEndpoint}
                                                                    ref={this.cancerEndpointRef}
                                                    />
                                                    : null
                                                }
                                                {module === 'questionnaire data' ?
                                                    <QuestionnaireData/> : null
                                                }
                                            </ExpansionPanelDetails>
                                        </ExpansionPanel>
                                    </div>
                                ))}

                                <div style={{height: '200px'}}></div>


                            </TabPane>
                            <TabPane key="summary"
                                     tab={
                                         <span style={{padding: '0pt 12pt 0pt 12pt'}}>Summary Charts</span>
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
