import React from 'react';
import {Checkbox, Table, Tabs} from 'antd';
import {PlusSquareOutlined, MinusSquareOutlined} from '@ant-design/icons';
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import axios from "axios";
import './card_container.css';

class QuestionnaireTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            columns: [],
            data: [],
            loading: false,
            variable_selected: this.props.selectedVariables,
            section_selected: {},
            section_to_variable: {},
            expandAll: true,
            searchTerm: this.props.searchTerm
        };
    }

    componentDidMount() {
        this.setState({
            loading: true
        });

        let thisState = this;
        axios.post('/api/questionnarie2',
            {
                search: {
                    questionnarie: [this.props.type],
                    searchTerm: this.state.searchTerm
                }
            })
            .then(function (response) {
                thisState.setState({
                    data: response.data,
                    columns: thisState.getColumns(response.data),
                    expends: thisState.initExpends(response.data),
                    loading: false,
                });
            });

        axios.post('/api/questionnarie',
            {
                search: {
                    questionnarie: [this.props.type],
                    searchTerm: this.state.searchTerm
                }
            })
            .then(function (response) {
                let section_to_variable = {};
                for (var i = 0; i < response.data.length; i++) {
                    let variables = section_to_variable[response.data[i].section];
                    if (variables === undefined) {
                        variables = [];
                    }
                    variables.push(response.data[i].variable);
                    section_to_variable[response.data[i].section] = variables;
                }
                thisState.setState({
                    section_to_variable
                });
            });
    }

    initExpends = (data) => {
        let expends = {};
        for (var i = 0; i < data.length; i++) {
            if (data[i].section === data[i].variable) {
                expends[data[i].section] = false;
            }
        }
        return expends;
    }

    expendIt = (section) => {
        let expends = this.state.expends;
        expends[section] = !expends[section];

        this.setState({
            loading: true
        });

        let thisState = this;
        axios.post('/api/questionnarie2',
            {
                search: {
                    questionnarie: [this.props.type],
                    expends,
                    searchTerm: this.state.searchTerm
                }
            })
            .then(function (response) {
                thisState.setState({
                    data: response.data,
                    columns: thisState.getColumns(response.data),
                    expends: expends,
                    loading: false,
                });
            })
    }

    expendAll = () => {

        let expends = {...this.state.expends};
        if (this.state.expandAll) {

            document.getElementById('expend_all').style.display = 'none';
            document.getElementById('collapse_all').style.display = 'inline';

            Object.keys(expends).forEach(function (key) {
                expends[key] = true;
            });
        } else {
            document.getElementById('expend_all').style.display = 'inline';
            document.getElementById('collapse_all').style.display = 'none';

            Object.keys(expends).forEach(function (key) {
                expends[key] = false;
            });
        }

        this.setState({
            loading: true
        });

        let thisState = this;
        axios.post('/api/questionnarie2',
            {
                search: {
                    questionnarie: [this.props.type],
                    expends,
                    searchTerm: this.state.searchTerm
                }
            })
            .then(function (response) {
                thisState.setState({
                    data: response.data,
                    columns: thisState.getColumns(response.data),
                    expends: expends,
                    loading: false,
                    expandAll: !thisState.state.expandAll
                });
            })

    }

    onVariableCheckboxChange = (evt) => {
        let variable_selected = this.state.variable_selected;
        if (evt.target.checked) {
            variable_selected[evt.target.value] = true;
        } else {
            variable_selected[evt.target.value] = undefined;
        }

        this.setState({
            variable_selected
        });

        this.props.setSelectedVariables(this.props.type, variable_selected);
    }

    onSectionCheckboxChange = (evt) => {
        let section_selected = this.state.section_selected;
        let variable_selected = this.state.variable_selected;
        if (evt.target.checked) {
            section_selected[evt.target.value] = true;
            for (var i = 0; i < this.state.section_to_variable[evt.target.value].length; i++) {
                variable_selected[this.state.section_to_variable[evt.target.value][i]] = true;
            }
        } else {
            section_selected[evt.target.value] = undefined;
            for (var i = 0; i < this.state.section_to_variable[evt.target.value].length; i++) {
                variable_selected[this.state.section_to_variable[evt.target.value][i]] = undefined;
            }
        }

        this.props.setSelectedVariables(this.props.type, variable_selected);
        this.setState({
            variable_selected,
            section_selected
        });
    }

    countSelectedVariables = (section) => {
        let all_variables = this.state.section_to_variable[section];
        let result = 0;
        for (var i = 0; i < all_variables.length; i++) {
            if (this.state.variable_selected[all_variables[i]] === true) {
                result++;
            }
        }
        return result;
    }

    onSearchTermChanged = (searchTerm) => {

        //console.log("onSearchTermChanged = " + searchTerm);
        this.setState({
            searchTerm,
            loading: true
        });

        let thisState = this;
        axios.post('/api/questionnarie2',
            {
                search: {
                    questionnarie: [this.props.type],
                    searchTerm
                }
            })
            .then(function (response) {
                thisState.setState({
                    data: response.data,
                    columns: thisState.getColumns(response.data),
                    expends: thisState.initExpends(response.data),
                    section_selected: {},
                    loading: false,
                });
            });

        axios.post('/api/questionnarie',
            {
                search: {
                    questionnarie: [this.props.type],
                    searchTerm
                }
            })
            .then(function (response) {
                let section_to_variable = {};
                for (var i = 0; i < response.data.length; i++) {
                    let variables = section_to_variable[response.data[i].section];
                    if (variables === undefined) {
                        variables = [];
                    }
                    variables.push(response.data[i].variable);
                    section_to_variable[response.data[i].section] = variables;
                }
                thisState.setState({
                    section_to_variable
                });
            });
    }

    onChangeSelectAll = (evt) => {
        if (evt.target.checked) {
            let section_selected = {};
            let variable_selected = {};

            let thisState = this;
            Object.keys(this.state.section_to_variable).forEach(function(key) {
                var variables = thisState.state.section_to_variable[key];
                section_selected[key] = true;
                for (var i=0; i<variables.length; i++) {
                    variable_selected[variables[i]] = true;
                }
            });

            this.setState({
                variable_selected,
                section_selected,
            });
            this.props.setSelectedVariables(this.props.type, variable_selected);
        } else {
            this.setState({
                variable_selected: {},
                section_selected: {},
            });
            this.props.setSelectedVariables(this.props.type, {});
        }
    }

    reset = () => {
        this.setState({
            variable_selected: {},
            section_selected: {},
        });
        this.props.setSelectedVariables(this.props.type, {});
    }

    getColumns = (data) => {

        let thisState = this;
        return [
            {
                title: <div>
                    <PlusSquareOutlined id='expend_all'
                                        style={{color: '#1890ff', display: 'inline'}}
                                        onClick={() => this.expendAll()}
                    />
                    <MinusSquareOutlined id='collapse_all'
                                         style={{color: '#1890ff', display: 'none'}}
                                         onClick={() => this.expendAll()}
                    />
                    <span style={{padding: '0pt 5pt 0pt 5pt'}}>Variable Name</span>
                </div>,
                dataIndex: 'variable',
                width: 130,
                render: (text, row, index) => {
                    if (row.section === row.variable && row.section === row.description) {
                        return {
                            props: {
                                style: {
                                    fontWeight: 'bold',
                                    verticalAlign: 'top',
                                    fontSize: 12,
                                    backgroundColor: 'lightgray'
                                },
                                colSpan: 2
                            },
                            children: (
                                <div>
                                    {
                                        thisState.state.expends[row.section] ?
                                            <MinusSquareOutlined
                                                style={{color: '#1890ff'}}
                                                onClick={() => this.expendIt(row.section)}/>
                                            :
                                            <PlusSquareOutlined
                                                style={{color: '#1890ff'}}
                                                onClick={() => this.expendIt(row.section)}/>
                                    }
                                    <span style={{padding: '0pt 5pt 0pt 5pt'}}>
                                        Section:
                                        {
                                            row.section.toLowerCase().charAt(0).toUpperCase() +
                                            row.section.toLowerCase().slice(1)
                                        }
                                        <span style={{
                                            width: 48,
                                            display: 'inline-block',
                                            float: 'right',
                                            fontWeight: 'normal',
                                            padding: '2pt 0pt 0pt 0pt',
                                            color: '#787878',
                                        }}>
                                            {
                                                thisState.state.section_to_variable[row.section] ?
                                                    <span>
                                                        (
                                                        <span style={{
                                                            fontWeight: thisState.countSelectedVariables(row.section) > 0 ? 'bold' : 'normal',
                                                            color: thisState.countSelectedVariables(row.section) > 0 ? 'brown' : null
                                                        }}>
                                                            {thisState.countSelectedVariables(row.section)}
                                                        </span>
                                                        /
                                                        <span>{thisState.state.section_to_variable[row.section].length}</span>
                                                        )
                                                    </span>
                                                    :
                                                    null
                                            }
                                        </span>
                                    </span>
                                </div>
                            )
                        };
                    } else {
                        return {
                            children: <div style={{paddingLeft: '20pt'}}>{text}</div>,
                            props: {
                                style: {
                                    fontWeight: 'normal',
                                    verticalAlign: 'top',
                                    fontSize: 12,
                                    backgroundColor: (index % 2 === 0 ? 'white' : '#eee')
                                },
                            },
                        }
                    }
                    ;
                },
            },
            {
                title: 'Description',
                dataIndex: 'description',
                render: (text, row, index) => {
                    if (row.section === row.description) {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    } else {
                        return {
                            children:
                                (
                                    <Tooltip placement="bottom"
                                             title={
                                                 <React.Fragment>
                                                     {
                                                         row.values ?
                                                             row.values.split('\n').map((value, i) => (
                                                                 <div key={'row-' + index + '-' + i}>{value}</div>
                                                             )) : null
                                                     }
                                                 </React.Fragment>
                                             }
                                             color={'#334d99'}>
                                        <div>{text}</div>
                                    </Tooltip>
                                ),
                            props: {
                                style: {
                                    fontWeight: 'normal',
                                    verticalAlign: 'top',
                                    fontSize: 12,
                                    backgroundColor: (index % 2 === 0 ? 'white' : '#eee')
                                }
                            },
                        };
                    }
                },
            },
            {
                title: <Checkbox onChange={thisState.onChangeSelectAll}></Checkbox>,
                width: 25,
                render(text, row, index) {
                    if (row.section === row.description) {
                        return {
                            props: {
                                style: {
                                    width: '20px',
                                    fontWeight: 'normal',
                                    backgroundColor: 'lightgray',
                                    textAlign: 'left'
                                }
                            },
                            children:
                                <Checkbox value={row.section}
                                          checked={thisState.state.section_selected[row.section]}
                                          onChange={thisState.onSectionCheckboxChange}>
                                </Checkbox>
                        };
                    } else {
                        return {
                            props: {
                                style: {
                                    width: '20px',
                                    fontWeight: 'normal',
                                    backgroundColor: index % 2 === 0 ? 'white' : '#eee',
                                    textAlign: 'left'
                                }
                            },
                            children: <Checkbox value={row.variable}
                                                checked={thisState.state.variable_selected[row.variable]}
                                                onChange={thisState.onVariableCheckboxChange}>
                            </Checkbox>
                        };
                    }
                }
            }
        ];
    }


    render() {

        return (
            <Table
                columns={this.state.columns}
                dataSource={this.state.data}
                size="small"
                bordered
                pagination={false}
                loading={this.state.loading}
                style={{fontSize: 12}}
                rowKey={() => 'key-' + new Date().getTime()}
            />
        )

    }
}

export default QuestionnaireTable;
