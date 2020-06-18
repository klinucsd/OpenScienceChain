import React from "react";
import Header from "./components/header/Header";
import Login from "./components/login/Login";
import Password from "./components/login/Password";
import UserList from "./components/user/UserList";
import ProjectList from "./components/project/ProjectList";
import UserProjectList from "./components/data/UserProjectList";

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            user: null,
            operation: null,
            project: null
        };
        this.headerRef = React.createRef();
    }

    componentDidMount() {
        let userStr = localStorage.getItem("user");
        if (userStr) {
            let user = JSON.parse(userStr);
            this.setState({
                user: user,
                operation: 'list_projects',
                project: null
            });
            this.headerRef.current.setUser(user);
        }
    }

    setUser = (user) => {
        user['authenticated'] = user.role === 'user';
        this.setState({
            user: user
        });
        this.headerRef.current.setUser(user);
        if (user.role === 'user') {
            this.setState({
                operation: 'list_projects'
            });
            localStorage.setItem("user", JSON.stringify(user));
        }
    }

    setAuthenticated = (flag) => {
        let newUser = this.state.user;
        newUser.authenticated = flag;
        this.setState({
            user: newUser
        });

        if (flag) {
            this.headerRef.current.setUser(this.state.user);
            if (this.state.user.role === 'admin') {
                this.setState({
                    operation: 'list_projects'
                });
            }
        }
    }

    resetUser = () => {
        this.setState({
            user: null,
            operation: null,
            project: null
        });
    }

    showUserList = () => {
        this.setState({
            operation: 'list_users',
        });
    }

    showProjectList = () => {
        this.setState({
            operation: 'list_projects',
        });
    }

    renderOperation(operation) {
        switch (operation) {
            case 'list_users':
                return (
                    <UserList/>
                );
            case 'list_projects':
                return (
                    <ProjectList/>
                );
            default:
                return null;
        }
    }

    render() {
        return (
            <div>
                <Header ref={this.headerRef}
                        reset_user={this.resetUser}
                        show_user_list={this.showUserList}
                        show_project_list={this.showProjectList}
                />
                <div>
                    {this.state.user === null ? (
                        <Login set_user={this.setUser}/>
                    ) : (this.state.user.role === 'admin' && !this.state.user.authenticated ? (
                            <Password user={this.state.user}
                                      set_authenticated={this.setAuthenticated}/>
                        ) : (this.state.user.role === 'admin' && this.state.user.authenticated ? (
                                this.renderOperation(this.state.operation)
                            ) : (
                                <div style={{padding: '0pt 0pt 0pt 0pt'}}>

                                    <UserProjectList projects={this.state.user.projects} />

                                    {/*
                                    <ProjectConfigPane project={this.state.user.projects[0]} />
                                    */}
                                </div>
                            )
                        )
                    )}
                </div>
            </div>
        );
    }

}

export default App;

