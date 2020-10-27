import React from "react";
import {createMuiTheme} from '@material-ui/core/styles/index';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Avatar from '@material-ui/core/Avatar';
//import Typography from '@material-ui/core/Typography/index';
import Divider from '@material-ui/core/Divider';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import EditProject from "../project/EditProject";
import CreateProject from "../project/CreateProject";
import axios from "axios";
import ProjectConfigPane from "../data/ProjectConfigPane";
import {Typography} from 'antd';
//import VisibilityRoundedIcon from "@material-ui/core/SvgIcon/SvgIcon";
//import VisibilityIcon from '@material-ui/icons/Visibility';
import SettingsIcon from '@material-ui/icons/Settings';

import 'antd/dist/antd.css';
import {Input, Modal} from 'antd';

const {Search} = Input;

const {Title} = Typography;
const {Text} = Typography;

const theme = createMuiTheme({
    overrides: {
        MuiToolbar: {
            regular: {
                backgroundColor: "#1976d2",
                color: "#fff",
                height: "32px",
                minHeight: "32px",
                '@media(min-width:600px)': {
                    minHeight: "54px"
                }
            }
        }
    }
});

const root_style = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
}

const subtitle_style = {
    fontWeight: 'bold',
    color: '#808080'
}

const small_green_style = {
    width: theme.spacing(5),
    height: theme.spacing(5),
    marginRight: '5pt',
    backgroundColor: '#669966'
};

const small_coral_style = {
    width: theme.spacing(5),
    height: theme.spacing(5),
    marginRight: '5pt',
    backgroundColor: 'coral'
};

const small_blue_style = {
    width: theme.spacing(5),
    height: theme.spacing(5),
    marginRight: '5pt',
    backgroundColor: '#3987c9'
};

class ProjectList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            projects: [],
            action: 'list_projects',
            edit: null,
            searchTerm: null
        }
    }

    componentDidMount() {
        let thisState = this;
        axios.get('/api/project')
            .then(function (response) {
                thisState.setState({
                    projects: response.data
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
    }

    onSearch = () => {
        let thisState = this;
        axios.post('/api/project/search', {
            searchTerm: this.state.searchTerm
        }).then(function (response) {
            thisState.setState({
                projects: response.data
            });
        }).catch(function (error) {
            console.log(error);
        }).then(function () {
            // always executed
        });
    }

    onSearchTermChange = (evt) => {
        this.setState({
            searchTerm: evt.target.value
        }, evt.type === 'click' ? this.onSearch : null);


    }

    createProject = () => {
        this.setState({
            edit: null,
            action: 'create_project',
        });
    }

    deleteProject = (id) => {
        let thisState = this;
        axios.delete('/api/project/' + id)
            .then(function (response) {
                for (var i = 0; i < thisState.state.projects.length; i++) {
                    if (thisState.state.projects[i].id === id) {
                        thisState.state.projects.splice(i, 1);
                        thisState.setState({
                            projects: thisState.state.projects
                        });
                        break;
                    }
                }
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
    }

    editProject = (id) => {
        for (var i = 0; i < this.state.projects.length; i++) {
            if (this.state.projects[i].id === id) {
                this.setState({
                    edit: this.state.projects[i],
                    action: 'edit_project',
                });
                break;
            }
        }
    }

    listProjects = () => {
        this.setState({
            edit: null,
            action: 'list_projects',
        });
    }

    updateProject = async (project) => {
        let thisState = this;
        await axios.put('/api/project/' + project.id, project)
            .then(function (response) {
                let result = response.data;
                for (var i = 0; i < thisState.state.projects.length; i++) {
                    if (thisState.state.projects[i].id === result.id) {
                        thisState.state.projects[i] = result;
                        thisState.setState({
                            edit: thisState.state.projects[i],
                            action: 'list_projects',
                        });
                        break;
                    }
                }

            })
            .catch(function (error) {
                Modal.error({
                    title: 'Error',
                    content: JSON.stringify(error.response.data.error),
                });
            })
            .then(function () {
                // always executed
            });

    }

    createProjectCommit = async (project) => {

        let thisState = this;
        await axios.post('/api/project', project)
            .then(function (response) {
                let result = response.data;
                project.id = result.id;

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
                        'cig_day_avg': true
                    }, "Q2": {}, "Q3": {}, "Q4": {}, "Q4mini": {}, "Q5": {}, "Q5mini": {}, "Q6": {}
                };
                project.questionnarie = JSON.stringify(preselected);

                thisState.state.projects.push(project);
                thisState.setState({
                    action: 'list_projects',
                });
            })
            .catch(function (error) {
                Modal.error({
                    title: 'Error',
                    content: JSON.stringify(error.response.data.error),
                });
            })
            .then(function () {
                // always executed
            });
    }

    viewProject = (project) => {
        this.setState({
            action: 'view_project',
            view_project: project
        })
    }

    updateProjectInList = (project) => {
        let projects = [];
        for (var i = 0; i < this.state.projects.length; i++) {
            if (this.state.projects[i].id === project.id) {
                projects.push(project);
            } else {
                projects.push(this.state.projects[i]);
            }
        }
        this.setState({
            projects: projects
        });
    }

    getLettersForAvatar = (name) => {
        let result = '';
        if (name) {
            var elements = name.split(' ');
            let candidate = '';
            for (var i = 0; i < elements.length; i++) {
                let letter = elements[i].charAt(0);
                if (letter.toUpperCase() === letter) {
                    result += letter;
                }
                if (result.length === 2) {
                    break;
                }
                if (candidate.length < 2) {
                    candidate += letter;
                }
            }
            if (result.length === 0) {
                result = candidate.toUpperCase();
            }
        }

        return result;
    }

    render() {
        return (
            this.state.action === 'list_projects' ? (
                <div style={root_style}>
                    <table border="0">
                        <tbody>
                        <tr>
                            <td>
                                <Title level={3}>
                                    Projects
                                </Title>
                            </td>
                            <td style={{textAlign: 'right', paddingRight: '20px'}}>

                                <Search placeholder="input text to search projects"
                                        allowClear
                                        onSearch={this.onSearch}
                                        value={this.state.searchTerm}
                                        onChange={this.onSearchTermChange}
                                        style={{width: '300px', marginRight: '3pt'}}
                                />

                                <Tooltip title="Create Project" placement="right">
                                    <IconButton edge="end"
                                                aria-label="projectAdd"
                                                onClick={() => this.createProject()}>
                                        <AddCircleOutlineIcon style={{fill: 'rgb(57, 116, 207, 0.5)'}}/>
                                    </IconButton>
                                </Tooltip>


                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">

                                {
                                    this.state.projects.length === 0 ?
                                        <div>
                                            <Text style={{
                                                fontSize: 16
                                            }}>No projects were found.</Text>
                                        </div>
                                        :
                                        null
                                }

                                <List style={{width: '100%', minWidth: '60vw'}}>
                                    {this.state.projects.map((project, i) => (
                                        <div key={"project-" + i}>
                                            <ListItem alignItems="flex-start">
                                                <ListItemAvatar>
                                                    <Tooltip title="Configure Project Data" placement="left">
                                                        <Avatar
                                                            alt={project.name}
                                                            //src={"/static/images/avatar/"}
                                                            style={project.study_design === 'Cohort' ?
                                                                small_green_style :
                                                                (project.study_design === 'Cross-Sectional' ?
                                                                    small_coral_style : small_blue_style)
                                                            }
                                                            onClick={() => this.viewProject(project)}
                                                        >
                                                            {this.getLettersForAvatar(project.name)}
                                                        </Avatar>
                                                    </Tooltip>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Text strong
                                                              style={{width: '45vw'}}
                                                              onClick={() => this.viewProject(project)}>
                                                            {project.name}
                                                        </Text>
                                                    }
                                                    secondary={
                                                        <React.Fragment>
                                                            <Text style={subtitle_style}>Abbreviation: </Text>
                                                            <Text>{project.abbrev}</Text>
                                                            <br/>

                                                            <Text style={subtitle_style}>Project Number: </Text>
                                                            <Text>{project.project_number}</Text>
                                                            <br/>

                                                            <Text style={subtitle_style}>Study Design: </Text>
                                                            <Text>{project.study_design}</Text>
                                                            <br/>

                                                            <Text style={subtitle_style}>Endpoint: </Text>
                                                            <Text>{project.endpoint}</Text>
                                                            <br/>

                                                            {project.biospecimens || project.geospatial_data || project.data_sharing? (
                                                                <>
                                                                    <Text style={subtitle_style}>Include Data: </Text>
                                                                    <Text>
                                                                        {project.biospecimens ? "Biospecimens" : null}
                                                                        {project.biospecimens && project.geospatial_data ? ", " : null}
                                                                        {project.geospatial_data ? "Geospatial Data" : null}
                                                                        {(project.biospecimens || project.geospatial_data) && project.data_sharing ? ", " : null}
                                                                        {project.data_sharing ? "Data-sharing" : null}
                                                                    </Text>
                                                                </>
                                                            ) : null}

                                                            {
                                                                project.biospecimens || project.geospatial_data || project.data_sharing ?
                                                                    <br/> : null
                                                            }

                                                            <span style={{display: 'flex'}}>
                                                                <span style={{flex: '0 0 50'}}>
                                                                    <Text style={subtitle_style}>Users: </Text>
                                                                </span>
                                                                <span style={{flex: '1', paddingLeft: '5pt'}}>
                                                                    {project.users === undefined ||
                                                                    project.users === null ||
                                                                    project.users.length === 0 ?
                                                                        <Text>No user in this project.</Text> : null
                                                                    }

                                                                    {project.users ?
                                                                        project.users.map((user, j) => (
                                                                            <span key={j + "-" + i}
                                                                                  style={{display: 'list-item'}}>
                                                                                <Text>
                                                                                    {
                                                                                        user.first_name + " " +
                                                                                        user.last_name + ", " +
                                                                                        user.email
                                                                                    }
                                                                                </Text>
                                                                            </span>
                                                                        )) : null
                                                                    }
                                                                </span>
                                                            </span>
                                                        </React.Fragment>
                                                    }/>
                                                <ListItemSecondaryAction style={{top: '14%'}}>
                                                    <Tooltip title="Configure Project Data">
                                                        <IconButton edge="end"
                                                                    aria-label="config"
                                                                    size="small"
                                                                    onClick={() => this.viewProject(project)}>
                                                            <SettingsIcon style={{fill: 'rgb(57, 116, 207, 0.5)'}}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Project Metadata">
                                                        <IconButton edge="end"
                                                                    aria-label="edit"
                                                                    size="small"
                                                                    onClick={() => this.editProject(project.id)}>
                                                            <EditIcon style={{fill: 'rgb(57, 116, 207, 0.5)'}}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Project">
                                                        <IconButton edge="end"
                                                                    aria-label="delete"
                                                                    size="small"
                                                                    onClick={() => this.deleteProject(project.id)}>
                                                            <DeleteIcon style={{fill: 'rgb(57, 116, 207, 0.5)'}}/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                            <Divider variant="inset" component="li"/>
                                        </div>
                                    ))}
                                </List>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                this.state.action === 'edit_project' ? (
                    <div>
                        <EditProject project={this.state.edit}
                                     update_project={this.updateProject}
                                     cancel={this.listProjects}/>
                    </div>
                ) : (
                    this.state.action === 'create_project' ? (
                        <CreateProject create_project={this.createProjectCommit}
                                       cancel={this.listProjects}/>

                    ) : (
                        this.state.action === 'view_project' ? (
                            <ProjectConfigPane project={this.state.view_project}
                                               back={this.listProjects}
                                               update_project_in_list={this.updateProjectInList}
                            />
                        ) : null
                    )
                )
            )
        )
    }
}

export default ProjectList;
