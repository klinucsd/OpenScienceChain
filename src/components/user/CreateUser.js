import React from "react";
import Typography from '@material-ui/core/Typography/index';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Button from "@material-ui/core/Button";

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

class CreateUser extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            first_name: '',
            last_name: '',
            email: '',
        }
    }

    handleChange = name => event => {
        this.setState({
            [name]: event.target.value,
        });
    };

    isValid = () => {
        return this.state.first_name.length > 0 &&
            this.state.last_name.length > 0 &&
            this.state.email.length > 0;
    }

    createUser = () => {
        this.props.create_user(this.state.first_name,
            this.state.last_name,
            this.state.email);
    }

    cancelEdit = () => {
        this.props.cancel();
    }

    render() {
        return (
            <div style={root_style}>
                <Paper elevation={3} style={{width: '600px'}}>
                    <Typography style={title_style}>
                        Edit User
                    </Typography>

                    <div style={{padding: '0pt 20pt 20pt 20pt'}}>
                        <form style={{paddingRight: '15px'}} autoComplete="off">
                            <TextField
                                required
                                fullWidth
                                id="first_name"
                                label="First Name"
                                style={{margin: 8}}
                                value={this.state.first_name}
                                error={this.state.first_name.length === 0}
                                onChange={this.handleChange('first_name')}
                                margin="normal"
                                variant="filled"
                            />

                            <TextField
                                required
                                fullWidth
                                id="last_name"
                                label="Last Name"
                                style={{margin: 8}}
                                value={this.state.last_name}
                                error={this.state.last_name.length === 0}
                                onChange={this.handleChange('last_name')}
                                margin="normal"
                                variant="filled"
                            />

                            <TextField
                                required
                                fullWidth
                                id="email"
                                label="Email"
                                style={{margin: 8}}
                                value={this.state.email}
                                error={this.state.email.length === 0}
                                onChange={this.handleChange('email')}
                                margin="normal"
                                variant="filled"
                            />

                            <div style={{textAlign: 'right'}}>
                                <Button onClick={this.cancelEdit}
                                        variant="contained"
                                        color="primary"
                                        style={{margin: '10pt 10pt 8pt 0pt', textTransform: 'none'}}>
                                    Cancel
                                </Button>
                                <Button onClick={this.createUser}
                                        disabled={!this.isValid()}
                                        variant="contained"
                                        color="primary"
                                        style={{margin: '10pt 0pt 8pt 0pt', textTransform: 'none'}}>
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </div>
                </Paper>
            </div>
        );
    }
}

export default CreateUser;