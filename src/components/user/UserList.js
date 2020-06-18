import React from "react";
import {createMuiTheme} from '@material-ui/core/styles/index';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography/index';
import Divider from '@material-ui/core/Divider';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import IconButton from '@material-ui/core/IconButton';
import users from '../../model/users';
import EditUser from './EditUser';
import CreateUser from './CreateUser';

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
    padding: '10px 0',
}

const title_style = {
    fontFamily: "'Google Sans','Noto Sans Myanmar UI',arial,sans-serif",
    fontSize: '24px',
    fontWeight: 400,
    lineHeight: 1.3333,
    paddingLeft: '18px'
}

const small_style = {
    width: theme.spacing(5),
    height: theme.spacing(5),
    marginRight: '5pt'
};

class UserList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            users: users,
            action: 'list_users',
            edit: null
        }
    }

    deleteUser = (id) => {
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === id) {
                users.splice(i, 1);
                this.setState({
                    users: users
                });
                break;
            }
        }
    }

    listUsers = () => {
        this.setState({
            edit: null,
            action: 'list_users',
        });
    }

    editUser = (id) => {
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === id) {
                this.setState({
                    edit: users[i],
                    action: 'edit_user',
                });
                break;
            }
        }
    }

    updateUser = (id, first_name, last_name, email) => {
        for (var i = 0; i < users.length; i++) {
            if (users[i].id === id) {
                users[i].first_name = first_name;
                users[i].last_name = last_name;
                users[i].email = email;
                this.setState({
                    edit: users[i],
                    action: 'list_users',
                });
                break;
            }
        }
    }

    createUser = () => {
        this.setState({
            edit: null,
            action: 'create_user',
        });
    }

    createUserCommit = (first_name, last_name, email) => {

        let user = {
            id: new Date().getTime(),
            first_name: first_name,
            last_name: last_name,
            email: email,
            role: 'user',
            //avatar: '1.jpg'
        }

        users.push(user);
        this.setState({
            users: users,
            action: 'list_users',
        });
    }

    render() {
        return (
            this.state.action === 'list_users' ? (
                <div style={root_style}>
                    <table border="0">
                        <tbody>
                        <tr>
                            <td>
                                <Typography style={title_style}>
                                    Users
                                </Typography>
                            </td>
                            <td style={{textAlign: 'right', paddingRight: '20px'}}>
                                <IconButton edge="end"
                                            aria-label="personAdd"
                                            onClick={() => this.createUser()}
                                >
                                    <PersonAddIcon/>
                                </IconButton>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <List style={{width: '100%', minWidth: 460}}>
                                    {this.state.users.map((user, i) => (
                                        <div id={"user-" + i}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar
                                                        alt={user.first_name + ' ' + user.last_name}
                                                        style={small_style}
                                                    />
                                                </ListItemAvatar>
                                                <ListItemText primary={user.first_name + ' ' + user.last_name}
                                                              secondary={user.email}/>
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end"
                                                                aria-label="edit"
                                                                onClick={() => this.editUser(user.id)}
                                                    >
                                                        <EditIcon/>
                                                    </IconButton>
                                                    <IconButton edge="end"
                                                                aria-label="delete"
                                                                onClick={() => this.deleteUser(user.id)}
                                                    >
                                                        <DeleteIcon/>
                                                    </IconButton>
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
                this.state.action === 'edit_user' ? (
                    <EditUser user={this.state.edit}
                              update_user={this.updateUser}
                              cancel={this.listUsers}
                    />
                ) : (
                    this.state.action === 'create_user' ? (
                        <CreateUser create_user={this.createUserCommit}
                                    cancel={this.listUsers}/>
                    ): null
                )
            )
        );


    }
}

export default UserList;