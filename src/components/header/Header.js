import React from 'react';
import {createMuiTheme} from '@material-ui/core/styles/index';
import AppBar from '@material-ui/core/AppBar/index';
import MenuItem from '@material-ui/core/MenuItem';
import Toolbar from '@material-ui/core/Toolbar/index';
import Typography from '@material-ui/core/Typography/index';
import Avatar from '@material-ui/core/Avatar';
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

const right_toolbar_style = {
    marginLeft: 'auto',
    marginRight: 10,
}

const title_style = {
    flexGrow: 1,
    color: 'white',
};

const small_style = {
    width: theme.spacing(3),
    height: theme.spacing(3),
    marginRight: '5pt',
    backgroundColor: 'PERU'
};

const user_bottom_style = {
    fontSize: '8pt',
    lineHeight: '1.0',
    verticalAlign: 'bottom',
};

const user_top_style = {
    fontSize: '8pt',
    lineHeight: '1.0',
    verticalAlign: 'top',
};

class Header extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            user: null
        }
    }

    setUser = (user) => {
        this.setState({
            user: user
        });
    }

    logout = () => {

        axios.post('/api/logout', {
            params: {
                email: this.state.user.email,
            }
        }).then(function (response) {
            console.log("logout: " + JSON.stringify(response.data));
        }).catch(function (error) {
            console.log(error);
        }).then(function () {
            // always executed
        });


        this.setState({
            user: null
        });
        this.props.reset_user();
        localStorage.removeItem("user");
    }

    render() {
        return (
            <AppBar position="static">
                <Toolbar>
                    {/*
                    <IconButton edge="start" color="inherit" aria-label="menu">
                        <MenuIcon/>
                    </IconButton>
                    */}
                    <div style={{paddingLeft: '20pt'}}>
                        <Typography variant="h6" style={title_style}>
                            California Teachers Study
                        </Typography>
                    </div>

                    {this.state.user ? (
                        <section style={right_toolbar_style}>
                            <table border="0">
                                <tbody>
                                <tr>
                                    {/*
                                        this.state.user.role === 'admin' && this.state.user.authenticated ? (
                                        <td rowSpan="2" style={{verticalAlign: 'middle'}}>
                                            <MenuItem onClick={() => this.props.show_user_list()}>
                                                Users
                                            </MenuItem>
                                        </td>
                                    ) : null
                                    */}

                                    {/*
                                        this.state.user.role === 'admin' && this.state.user.authenticated ? (
                                        <td rowSpan="2" style={{verticalAlign: 'middle'}}>
                                            <MenuItem  onClick={() => this.props.show_project_list()}>
                                                Projects
                                            </MenuItem>
                                        </td>
                                    ) : null
                                    */}

                                    {this.state.user.authenticated ? (
                                        <td rowSpan="2">
                                            <MenuItem style={{paddingRight: '30px'}}
                                                      onClick={() => this.logout()}>
                                                Logout
                                            </MenuItem>
                                        </td>
                                    ) : null}

                                    <td rowSpan="2">
                                        <Avatar
                                            alt={this.state.user.first_name + ' ' + this.state.user.last_name}
                                            //src={"static/images/avatar/" + this.state.user.avatar}
                                            style={small_style}
                                        />
                                    </td>
                                    <td style={{verticalAlign: 'bottom'}}>
                                        <Typography style={user_bottom_style}>
                                            {this.state.user.first_name + ' ' + this.state.user.last_name}
                                        </Typography>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{verticalAlign: 'top'}}>
                                        <Typography style={user_top_style}>{this.state.user.email}</Typography>
                                    </td>
                                </tr>
                                </tbody>
                            </table>

                        </section>
                    ) : null
                    }
                </Toolbar>
            </AppBar>
        )
    }
}

export default Header;
