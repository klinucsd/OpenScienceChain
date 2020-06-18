import React from "react";
import {createMuiTheme} from '@material-ui/core/styles/index';
import Typography from '@material-ui/core/Typography/index';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Button from "@material-ui/core/Button";
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';
import axios from "axios";

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

const title_style = {
    fontFamily: "'Google Sans','Noto Sans Myanmar UI',arial,sans-serif",
    fontSize: '24px',
    fontWeight: 400,
    lineHeight: 1.3333,
    paddingLeft: '18px',
    padding: '20pt 20pt 5pt 30pt'
}

const formControlStyle = {
    margin: theme.spacing(1),
    minWidth: '100%',
}

class CreateProject extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: '',
            abbrev: '',
            study_design: 'Cohort',
            endpoint: 'Cancer',
            biospecimens: false,
            geospatial_data: false,
            data_sharing: false,
            users: [],
            available: [],
            original_users: {}
        }
    }

    componentDidMount() {
        let thisState = this;
        axios.get('/api/user')
            .then(function (response) {
                let options = [];
                let map = {};
                for (var i = 0; i < response.data.length; i++) {
                    map[response.data[i].id] = response.data[i];
                    options.push({
                        value: response.data[i].id,
                        label: response.data[i].first_name + " " + response.data[i].last_name + ", " + response.data[i].email
                    });
                }
                thisState.setState({
                    available: options,
                    original_users: map
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    handleChange = name => event => {

        if (name.startsWith('biospecimens')) {
            this.setState({
                biospecimens: !this.state.biospecimens
            });
        } else if (name.startsWith('geospatial_data')) {
            this.setState({
                geospatial_data: !this.state.geospatial_data
            });
        } else if (name.startsWith('data_sharing')) {
            this.setState({
                data_sharing: !this.state.data_sharing
            });
        } else {
            this.setState({
                [name]: event.target.value,
            });
        }
    };

    isValid = () => {
        return this.state.name.length > 0 &&
            this.state.abbrev.length > 0 &&
            this.state.study_design.length > 0 &&
            this.state.endpoint.length > 0;
    }

    createProject = () => {

        let selected_users = [];
        for (var i=0; i<this.state.users.length; i++) {
            selected_users.push(this.state.original_users[this.state.users[i]]);
        }

        let project = {
            name: this.state.name,
            abbrev: this.state.abbrev,
            study_design: this.state.study_design,
            endpoint: this.state.endpoint,
            biospecimens: this.state.biospecimens,
            geospatial_data: this.state.geospatial_data,
            data_sharing: this.state.data_sharing,
            users: selected_users
        }
        this.props.create_project(project);
    }

    cancelEdit = () => {
        this.props.cancel();
    }

    onChange = (users) => {
        this.setState({users});
    }

    render() {
        return (
            <div style={root_style}>
                <Paper elevation={3} style={{width: '800px'}}>
                    <Typography style={title_style}>
                        Create Project
                    </Typography>

                    <div style={{padding: '0pt 20pt 20pt 20pt'}}>
                        <form style={{paddingRight: '15px'}} autoComplete="off">
                            <TextField
                                required
                                fullWidth
                                id="name"
                                label="Name"
                                style={{margin: 8}}
                                value={this.state.name}
                                error={this.state.name.length === 0}
                                onChange={this.handleChange('name')}
                                margin="normal"
                                variant="filled"
                            />

                            <TextField
                                required
                                fullWidth
                                id="abbrev"
                                label="Abbreviation"
                                style={{margin: 8}}
                                value={this.state.abbrev}
                                error={this.state.abbrev.length === 0}
                                onChange={this.handleChange('abbrev')}
                                margin="normal"
                                variant="filled"
                            />

                            <FormControl variant="filled" required style={formControlStyle}>
                                <InputLabel id="study-design-label">Study Design</InputLabel>
                                <Select
                                    labelId="study-design-label"
                                    id="study-design-select"
                                    value={this.state.study_design}
                                    onChange={this.handleChange('study_design')}
                                >
                                    <MenuItem value={'Case-Control'}>Case Control</MenuItem>
                                    <MenuItem value={'Cohort'}>Cohort</MenuItem>
                                    <MenuItem value={'Cross-Sectional'}>Cross Sectional</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl variant="filled" required style={formControlStyle}>
                                <InputLabel id="endpoint-label">Endpoint</InputLabel>
                                <Select
                                    labelId="endpoint-label"
                                    id="endpoint-select"
                                    value={this.state.endpoint}
                                    onChange={this.handleChange('endpoint')}
                                >
                                    <MenuItem value={'Cancer'}>Cancer</MenuItem>
                                    <MenuItem value={'Hospitalization'}>Hospitalization</MenuItem>
                                    <MenuItem value={'Mortality'}>Mortality</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl variant="filled" component="fieldset" style={formControlStyle}>
                                <FormLabel component="legend">Does analysis include data from:</FormLabel>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox color="primary"
                                                      checked={this.state.biospecimens}
                                                      onChange={this.handleChange('biospecimens')}
                                                      name="biospecimens"/>
                                        }
                                        label="Biospecimens"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox color="primary"
                                                      checked={this.state.geospatial_data}
                                                      onChange={this.handleChange('geospatial_data')}
                                                      name="geospatial_data"/>
                                        }
                                        label="Geospatial data"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox color="primary"
                                                      checked={this.state.data_sharing}
                                                      onChange={this.handleChange('data_sharing')}
                                                      name="geospatial_data"/>
                                        }
                                        label="Data-sharing"
                                    />
                                </FormGroup>
                            </FormControl>

                            <div style={{padding: '2pt 10pt 10pt 10pt', backgroundColor: 'rgba(0, 0, 0, 0.09)'}}>
                                {/* <span style={userStyle}>Users</span> */}
                                <div style={{
                                    fontFamily: '"Open Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
                                    fontSize: '16px',
                                    lineHeight: 1.5,
                                    color: '#606c71'
                                }}>
                                    <table style={{width: '100%', fontSize: '12px', color: 'black'}}>
                                        <tbody>
                                        <tr>
                                            <td style={{textAlign: 'center'}}>Users Available</td>
                                            <td style={{width: '42pt'}}></td>
                                            <td style={{textAlign: 'center'}}>Users Selected</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                    <DualListBox
                                        options={this.state.available}
                                        selected={this.state.users}
                                        onChange={this.onChange}
                                    />
                                </div>
                            </div>

                            <div style={{textAlign: 'right'}}>
                                <Button onClick={this.cancelEdit}
                                        variant="contained"
                                        color="primary"
                                        style={{margin: '10pt 10pt 8pt 0pt', textTransform: 'none'}}>
                                    Cancel
                                </Button>
                                <Button onClick={this.createProject}
                                        disabled={!this.isValid()}
                                        variant="contained"
                                        color="primary"
                                        style={{margin: '10pt 0pt 8pt 0pt', textTransform: 'none'}}>
                                    Create Project
                                </Button>
                            </div>
                        </form>
                    </div>
                </Paper>
            </div>
        );
    }

}

export default CreateProject;
