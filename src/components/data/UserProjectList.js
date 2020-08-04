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
import SettingsIcon from '@material-ui/icons/Settings';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import axios from "axios";
import ProjectConfigPane from "../data/ProjectConfigPane";

import {Typography} from 'antd';

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
            projects: this.props.projects,
            action: 'list_projects',
            edit: null
        }
    }

    componentDidMount() {
        let thisState = this;
        axios.get('/api/project')
            .then(function (response) {
                let projects = [];
                for (var i = 0; i < thisState.state.projects.length; i++) {
                    for (var j = 0; j < response.data.length; j++) {
                        if (thisState.state.projects[i].id === response.data[j].id) {
                            projects.push(response.data[j]);
                            break;
                        }
                    }
                }
                thisState.setState({
                    projects: projects
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });
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
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    viewProject = (i) => {
        this.setState({
            action: 'view_project',
            view_project: this.state.projects[i]
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
            for (var i=0; i<elements.length; i++) {
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
                                    My Projects
                                </Title>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <List style={{width: '100%', minWidth: '60vw'}}>

                                    {
                                        this.state.projects.length === 0 ?
                                            <div>
                                                <Text style={{
                                                    fontSize: 16
                                                }}>Your project list is empty.</Text>
                                            </div>
                                            :
                                            null
                                    }

                                    {
                                        this.state.projects.map((project, i) => (
                                            <div key={"project-" + i}>
                                                <ListItem alignItems="flex-start">
                                                    <ListItemAvatar>
                                                        <Tooltip title="Configure Project Data" placement="left">
                                                            <Avatar
                                                                alt={project.name}
                                                                //src={"/static/images/avatar/"}
                                                                style={
                                                                    project.study_design === 'Cohort' ?
                                                                        small_green_style
                                                                        :
                                                                        (project.study_design === 'Cross-Sectional' ?
                                                                            small_coral_style : small_blue_style)
                                                                }
                                                                onClick={() => this.viewProject(i)}
                                                            >
                                                                { this.getLettersForAvatar(project.name) }
                                                            </Avatar>
                                                        </Tooltip>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={
                                                            <Text strong
                                                                  style={{width: '45vw'}}
                                                                  onClick={() => this.viewProject(i)}
                                                            >
                                                                {project.name}
                                                            </Text>
                                                        }
                                                        secondary={
                                                            <React.Fragment>

                                                                <Text style={subtitle_style}>Abbreviation: </Text>
                                                                <Text>{project.abbrev}</Text>
                                                                <br/>

                                                                <Text style={subtitle_style}>Study Design: </Text>
                                                                <Text>{project.study_design}</Text>
                                                                <br/>

                                                                <Text style={subtitle_style}>Endpoint: </Text>
                                                                <Text>{project.endpoint}</Text>
                                                                <br/>

                                                                {project.biospecimens || project.geospatial_data ? (
                                                                    <>
                                                                        <Text style={subtitle_style}>Include
                                                                            Data: </Text>
                                                                        <Text>
                                                                            {project.biospecimens ? "Biospecimens" : null}
                                                                            {project.biospecimens && project.geospatial_data ? ", " : null}
                                                                            {project.geospatial_data ? "Geospatial Data" : null}
                                                                        </Text>
                                                                    </>
                                                                ) : null}

                                                                {
                                                                    project.biospecimens || project.geospatial_data ?
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
                                                                            " No user in this project." : null
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
                                                                        aria-label="edit"
                                                                        onClick={() => this.viewProject(i)}>
                                                                <SettingsIcon style={{fill: 'rgb(57, 116, 207, 0.5)'}}/>
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
                this.state.action === 'view_project' ? (
                    <ProjectConfigPane project={this.state.view_project}
                                       back={this.listProjects}
                                       update_project_in_list={this.updateProjectInList}
                    />
                ) : null
            )
        )
    }
}

export default ProjectList;
