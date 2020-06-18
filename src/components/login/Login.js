import React from "react";
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography/index';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import axios from 'axios';

const root_style = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
}

const title_style = {
    fontFamily: "'Google Sans','Noto Sans Myanmar UI',arial,sans-serif",
    fontSize: '24px',
    fontWeight: 400,
    lineHeight: 1.3333,
    paddingTop: '20pt'
}

const subtitle_style = {
    color: '#202124',
    fontSize: '16px',
    fontWeight: 400,
    letterSpacing: '.1px',
    lineHeight: 1.5,
    paddingTop: '7pt'
}

class Login extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            email_error_message: ''
        }
    }

    loadUserByEmail = () => {

        let thisProps = this.props;
        let thisState = this;
        axios.get('/api/user', {
            params: {
                email: this.state.email
            }
        }).then(function (response) {
            if (response.data.length && response.data.length > 0) {
                thisProps.set_user(response.data[0]);
            } else {
                thisState.setState({
                    email_error_message: 'Found no user for this email.'
                });
            }
        }).catch(function (error) {
            console.log(error);
        }).then(function () {
            // always executed
        });
    }

    handleChange = name => event => {
        this.setState({
            [name]: event.target.value,
            email_error_message: ''
        });
    };

    render() {
        return (
            <div style={root_style}>
                <Paper elevation={3} style={{width: '400px', height: '300px', textAlign: 'center'}}>
                    <div>
                        <Typography style={title_style}>
                            Sign in
                        </Typography>
                        <Typography style={subtitle_style}>
                            to continue to CTS
                        </Typography>
                        <TextField
                            required
                            style={{marginTop: '20pt', width: '300px'}}
                            id="login_email"
                            label="Email"
                            variant="outlined"
                            value={this.state.email}
                            onChange={this.handleChange('email')}
                            helperText={this.state.email_error_message}
                            FormHelperTextProps={{style: {color: 'red'}}}
                        />
                        <div style={{width: '100%', textAlign: 'right'}}>
                            <Button variant="contained"
                                    color="primary"
                                    onClick={() => this.loadUserByEmail()}
                                    style={{margin: '40pt'}}>
                                Next
                            </Button>
                        </div>
                    </div>
                </Paper>
            </div>
        );
    }

}

export default Login;