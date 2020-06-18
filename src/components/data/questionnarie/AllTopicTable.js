import React from 'react';
import {Checkbox, Table, Tabs} from 'antd';
import {PlusSquareOutlined, MinusSquareOutlined} from '@ant-design/icons';
import Tooltip from "@material-ui/core/Tooltip/Tooltip";
import axios from "axios";
import './card_container.css';

const topic_to_questionnarie = {};
topic_to_questionnarie['Alcohol use'] = ['Q1'];
topic_to_questionnarie['Anthropomorphic measurements'] = ['Q1', 'Q2', 'Q4', 'Q4mini', 'Q5', 'Q6'];
topic_to_questionnarie['Cognitive status'] = ['Q3'];
topic_to_questionnarie['Diet'] = ['Q1', 'Q4', 'Q5'];
topic_to_questionnarie['Employment'] = ['Q1', 'Q3', 'Q5', 'Q6'];
topic_to_questionnarie['Environment'] = ['Q1', 'Q4', 'Q5', 'Q6'];
topic_to_questionnarie['Family history of cancer'] = ['Q1'];
topic_to_questionnarie['Female health history'] = ['Q1', 'Q2', 'Q3', 'Q4', 'Q4mini', 'Q5', 'Q5mini', 'Q6'];
topic_to_questionnarie['Female surgery'] = ['Q1', 'Q3'];
topic_to_questionnarie['Financial stress'] = ['Q6'];
topic_to_questionnarie['Happiness and social support'] = ['Q3', 'Q5', 'Q6'];
topic_to_questionnarie['Mammograms and other health screenings'] = ['Q1', 'Q2', 'Q5', 'Q6'];
topic_to_questionnarie['Medications'] = ['Q1', 'Q3', 'Q4', 'Q5'];
topic_to_questionnarie['Medicinal cannabis'] = ['Q6'];
topic_to_questionnarie['Menopausal hormone therapy'] = ['Q1', 'Q3', 'Q4', 'Q4mini', 'Q5', 'Q5mini', 'Q6'];
topic_to_questionnarie['Menopause/menstrual Periods'] = ['Q1', 'Q3', 'Q4', 'Q4mini', 'Q5', 'Q5mini', 'Q6'];
topic_to_questionnarie['Oral contraceptives'] = ['Q1', 'Q3', 'Q5'];
topic_to_questionnarie['Participant characteristics'] = ['Q1', 'Q3', 'Q4', 'Q5', 'Q6'];
topic_to_questionnarie['Personal history of cancer'] = ['Q1', 'Q4'];
topic_to_questionnarie['Personal medical history'] = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q5mini', 'Q6'];
topic_to_questionnarie['Physical activity'] = ['Q1', 'Q4', 'Q5', 'Q5mini', 'Q6'];
topic_to_questionnarie['Pre-selected variables'] = ['Q1'];
topic_to_questionnarie['Pregnancy'] = ['Q1', 'Q2', 'Q4'];
topic_to_questionnarie['Residency'] = ['Q4', 'Q5mini'];
topic_to_questionnarie['Secondhand smoke'] = ['Q1', 'Q2', 'Q4'];
topic_to_questionnarie['Sleep habits'] = ['Q5', 'Q6'];
topic_to_questionnarie['Smoking'] = ['Q1', 'Q2', 'Q4'];
topic_to_questionnarie['Vitamins'] = ['Q1', 'Q4', 'Q5'];
topic_to_questionnarie['X-Rays imaging and radiation'] = ['Q2', 'Q5', 'Q6'];


class AllTopicTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            columns: [],
            data: [],
            loading: false,
            questionnarie: ['Q1', 'Q2', 'Q3', 'Q4', 'Q4mini', 'Q5', 'Q5mini', 'Q6'],
            variable_selected: this.props.getSelectedVariables(),
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
        axios.post('/api/topic',
            {
                search: {
                    questionnarie: this.state.questionnarie,
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

        axios.post('/api/topic_variable',
            {
                search: {
                    questionnarie: ['Q1', 'Q2', 'Q3', 'Q4', 'Q4mini', 'Q5', 'Q5mini', 'Q6'],
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
                    let variable = {
                        variable: response.data[i].variable,
                        questionnarie: response.data[i].questionnarie
                    };
                    variables.push(variable);
                    section_to_variable[response.data[i].section] = variables;
                }

                //console.log("section_to_variable = " + JSON.stringify(section_to_variable));

                thisState.setState({
                    section_to_variable,
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
        axios.post('/api/topic',
            {
                search: {
                    questionnarie:  this.state.questionnarie,
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
            document.getElementById('expend_all_' + this.props.type).style.display = 'none';
            document.getElementById('collapse_all_' + this.props.type).style.display = 'inline';

            Object.keys(expends).forEach(function (key) {
                expends[key] = true;
            });
        } else {
            document.getElementById('expend_all_' + this.props.type).style.display = 'inline';
            document.getElementById('collapse_all_' + this.props.type).style.display = 'none';

            Object.keys(expends).forEach(function (key) {
                expends[key] = false;
            });
        }

        this.setState({
            loading: true
        });

        let thisState = this;
        axios.post('/api/topic',
            {
                search: {
                    questionnarie:  this.state.questionnarie,
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

        //console.log("onVariableCheckboxChange = " + JSON.stringify(evt));

        let variable_selected = this.state.variable_selected;
        if (evt.target.checked) {
            variable_selected[evt.target.value.questionnarie][evt.target.value.variable] = true;
        } else {
            variable_selected[evt.target.value.questionnarie][evt.target.value.variable] = undefined;
        }

        //console.log("variable_selected = " + JSON.stringify(variable_selected));

        this.setState({
            variable_selected
        });

        /*
        let variable_selected_qs = {};
        for (let [variable, selected] of Object.entries(variable_selected)) {
            let questionnarie = this.state.variable_to_questionnarie[variable];
            let variables = variable_selected_qs[questionnarie];
            if (variables === undefined) {
                variables = {};
            }
            variables[variable] = selected;
            variable_selected_qs[questionnarie] = variables;
        }

        this.props.setSelectedVariablesWithQuestionnarie(variable_selected_qs);
         */

        this.props.setSelectedVariablesWithQuestionnarie(variable_selected);


        //this.props.setSelectedVariables(this.props.type, variable_selected);
    }

    onSectionCheckboxChange = (evt) => {

        //console.log("onSectionCheckboxChange section_to_variable = " + JSON.stringify(this.state.section_to_variable));

        let section_selected = this.state.section_selected;
        let variable_selected = this.state.variable_selected;
        if (evt.target.checked) {
            section_selected[evt.target.value] = true;
            let variables = this.state.section_to_variable[evt.target.value];
            for (var i = 0; i < variables.length; i++) {
                variable_selected[variables[i].questionnarie][variables[i].variable] = true;
            }
        } else {
            section_selected[evt.target.value] = undefined;
            let variables = this.state.section_to_variable[evt.target.value];
            for (var i = 0; i < variables.length; i++) {
                variable_selected[variables[i].questionnarie][variables[i].variable] = undefined;
            }
        }

        this.setState({
            variable_selected,
            section_selected
        });

        this.props.setSelectedVariablesWithQuestionnarie(variable_selected);
        //console.log("variable_selected: " + JSON.stringify(variable_selected));

        /*
        let variable_selected_qs = {};
        for (let [variable, selected] of Object.entries(variable_selected)) {
            let questionnarie = this.state.variable_to_questionnarie[variable];
            let variables = variable_selected_qs[questionnarie];
            if (variables === undefined) {
                variables = {};
            }
            variables[variable] = selected;
            variable_selected_qs[questionnarie] = variables;
        }

        this.props.setSelectedVariablesWithQuestionnarie(variable_selected_qs);
         */
        //this.props.setSelectedVariables(this.props.type, variable_selected);
    }

    getTopicQuestionnarie = (topic) => {
        let questionnarie = [];
        for (var i = 0; i < topic_to_questionnarie[topic].length; i++) {
            if (topic_to_questionnarie[topic][i] !== this.props.type) {
                questionnarie.push(topic_to_questionnarie[topic][i]);
            }
        }
        return questionnarie;
    }

    viewTopic = (topic) => {

        this.expendIt(topic);

        document.getElementById('expend_all_' + this.props.type).style.display = 'inline';
        document.getElementById('collapse_all_' + this.props.type).style.display = 'none';

        let expends = {...this.state.expends};
        Object.keys(expends).forEach(function (key) {
            expends[key] = key === topic;
        });

        this.setState({
            loading: true,
            expends,
            expendAll: true
        });

        let thisState = this;
        axios.post('/api/topic',
            {
                search: {
                    questionnarie: [this.props.type],
                    expends
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

    countSelectedVariables = (section) => {
        let all_variables = this.state.section_to_variable[section];
        let result = 0;
        for (var i = 0; i < all_variables.length; i++) {
            let variableSelectedMap = this.state.variable_selected[all_variables[i].questionnarie];
            if (variableSelectedMap[all_variables[i].variable] === true) {
                result++;
            }

            /*
            if (this.state.variable_selected[all_variables[i]] === true) {
                result++;
            }
             */
        }
        return result;
    }

    onSearchTermChanged = (searchTerm) => {

        this.setState({
            searchTerm,
            loading: true
        });

        let thisState = this;
        axios.post('/api/topic',
            {
                search: {
                    questionnarie:  this.state.questionnarie,
                    //expends: this.state.expends,
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
                    expandAll: true
                });
            })


        axios.post('/api/topic_variable',
            {
                search: {
                    questionnarie: ['Q1', 'Q2', 'Q3', 'Q4', 'Q4mini', 'Q5', 'Q5mini', 'Q6'],
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
                    let variable = {
                        variable: response.data[i].variable,
                        questionnarie: response.data[i].questionnarie
                    };
                    variables.push(variable);
                    section_to_variable[response.data[i].section] = variables;
                }

                //console.log("section_to_variable = " + JSON.stringify(section_to_variable));

                thisState.setState({
                    section_to_variable,
                });
            });


    }

    onChangeSelectAll = (evt) => {

        if (evt.target.checked) {
            let section_selected = {};
            let variable_selected = {
                Q1: {},
                Q2: {},
                Q3: {},
                Q4: {},
                Q4mini: {},
                Q5: {},
                Q5mini: {},
                Q6: {}
            };

            let thisState = this;
            Object.keys(this.state.section_to_variable).forEach(function(topic) {
                var variables = thisState.state.section_to_variable[topic];
                section_selected[topic] = true;
                for (var i=0; i<variables.length; i++) {
                    let questionnarie = variables[i].questionnarie;
                    let variable = variables[i].variable;
                    variable_selected[questionnarie][variable] = true;
                }
            });

            this.setState({
                variable_selected,
                section_selected,
            });

            this.props.setSelectedVariablesWithQuestionnarie(variable_selected);

        } else {
            let thisState = this;
            let variable_selected = {};
            Object.keys(this.state.variable_selected).forEach(function(key) {
                variable_selected[key] = {};
            });

            this.setState({
                variable_selected: variable_selected,
                section_selected: {},
            });
            this.props.setSelectedVariablesWithQuestionnarie(variable_selected);
        }
    }

    reset = () => {
        let thisState = this;
        let variable_selected = {};
        Object.keys(this.state.variable_selected).forEach(function(key) {
            variable_selected[key] = {};
        });

        this.setState({
            variable_selected: variable_selected,
            section_selected: {},
        });
        this.props.setSelectedVariablesWithQuestionnarie(variable_selected);
    }

    onTableChange = (pagination, filters, sorter, extra) => {
        console.log("filter: " + JSON.stringify(filters));
    }

    getColumns = (data) => {

        let thisState = this;
        return [
            {
                title: <div>
                    <PlusSquareOutlined id={'expend_all_' + this.props.type}
                                        style={{color: '#1890ff', display: 'inline'}}
                                        onClick={() => this.expendAll()}
                    />
                    <MinusSquareOutlined id={'collapse_all_' + this.props.type}
                                         style={{color: '#1890ff', display: 'none'}}
                                         onClick={() => this.expendAll()}
                    />
                    <span style={{padding: '0pt 5pt 0pt 5pt'}}>Variable Name</span>
                </div>,
                dataIndex: 'variable',
                width:
                    130,
                render:
                    (text, row, index) => {
                        if (row.section === row.variable && row.section === row.description) {
                            return {
                                props: {
                                    style: {
                                        fontWeight: 'bold',
                                        verticalAlign: 'top',
                                        fontSize: 12,
                                        backgroundColor: '#dbccbd'
                                    },
                                    colSpan: 3
                                },
                                children: (
                                    <div style={{width: '100%'}}>
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
                                        Topic: {row.section.toLowerCase().charAt(0).toUpperCase() + row.section.toLowerCase().slice(1)}
                                        </span>

                                        <span style={{
                                            float: 'right',
                                            color: '#787878',
                                            fontWeight: 'normal',
                                            padding: '2pt 8pt 0pt 0pt',
                                        }}>

                                            <div style={{
                                                width: 70,
                                                display: 'inline-block',
                                                fontWeight: 'normal',
                                                //color: '#909090',
                                                marginLeft: '14pt'
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
                                                        {thisState.state.section_to_variable[row.section].length}
                                                        )
                                                    </span>

                                                    :
                                                    null
                                            }
                                            </div>
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
                render:
                    (text, row, index) => {
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
            }
            ,
            {
                title: 'Questionnaire',
                dataIndex: 'questionnarie',
                width: 50,
                filters: [
                    { text: 'Q1', value: 'Q1'},
                    { text: 'Q2', value: 'Q2'},
                    { text: 'Q3', value: 'Q3'},
                    { text: 'Q4', value: 'Q4'},
                    { text: 'Q4mini', value: 'Q4mini'},
                    { text: 'Q5', value: 'Q5'},
                    { text: 'Q5mini', value: 'Q5mini'},
                    { text: 'Q6', value: 'Q6'},
                ],
                render(text, row, index) {
                    if (row.section === row.variable && row.section === row.description) {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
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
                }
            }
            ,
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
                                    backgroundColor: '#dbccbd',
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
                            children: <Checkbox value={row}
                                                checked={thisState.state.variable_selected[row.questionnarie][row.variable]}
                                                onChange={thisState.onVariableCheckboxChange}>
                            </Checkbox>
                        };
                    }
                }
            }
        ]
            ;
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
                onChange={this.onTableChange}
                style={{fontSize: 12}}
                rowKey={() => 'key-' + new Date().getTime()}
            />
        )

    }
}

export default AllTopicTable;
