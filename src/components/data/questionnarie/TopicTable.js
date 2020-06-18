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


class TopicTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            columns: [],
            data: [],
            loading: false,
            variable_selected: this.props.selectedVariables,
            section_selected: {},
            section_to_variable: {},
            expandAll: true
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
                    questionnarie: [this.props.type],
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
                    questionnarie: [this.props.type],
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

    expendAll = () => {

        let expends = {...this.state.expends};
        if (this.state.expandAll) {
            document.getElementById('expend_all_'+ this.props.type).style.display = 'none';
            document.getElementById('collapse_all_'+ this.props.type).style.display = 'inline';

            Object.keys(expends).forEach(function (key) {
                expends[key] = true;
            });
        } else {
            document.getElementById('expend_all_'+ this.props.type).style.display = 'inline';
            document.getElementById('collapse_all_'+ this.props.type).style.display = 'none';

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
                    expandAll: !thisState.state.expandAll
                });
            })

    }

    onVariableCheckboxChange = (evt) => {
        let variable_selected = this.state.variable_selected;

        /*
        if (variable_selected === undefined) {
            variable_selected = {};
        }
         */
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

        this.setState({
            variable_selected,
            section_selected
        });

        this.props.setSelectedVariables(this.props.type, variable_selected);
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

        document.getElementById('expend_all_'+ this.props.type).style.display = 'inline';
        document.getElementById('collapse_all_'+ this.props.type).style.display = 'none';

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
        for (var i=0; i<all_variables.length; i++) {
            if (this.state.variable_selected[all_variables[i]] === true) {
                result++;
            }
        }
        return result;
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
                                    colSpan: 2
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


                                        {/*
                                            this.getTopicQuestionnarie(row.section).length > 0 ?
                                                <span style={{
                                                    float: 'right',
                                                    fontWeight: 'normal',
                                                    padding: '2pt 10pt 0pt 10pt'
                                                }}>
                                                <span style={{color: 'gray', paddingRight: '2pt'}}>also in</span>

                                                    {this.getTopicQuestionnarie(row.section).map((questionnarie, i) => (
                                                        <span key={'row-' + index + '-' + i}
                                                              style={{padding: '0pt 0pt 0pt 0pt'}}
                                                              onClick={() => thisState.props.switchTo(questionnarie, row.section)}
                                                        >
                                                           { (i>0? ', ' : '') + questionnarie}
                                                        </span>
                                                    ))}

                                                </span>
                                                :
                                                null
                                        */}

                                        <span style={{
                                            float: 'right',
                                            color: '#787878',
                                            fontWeight: 'normal',
                                            padding: '2pt 8pt 0pt 0pt',
                                        }}>

                                            {
                                                this.getTopicQuestionnarie(row.section).length > 0 ?
                                                    <span style={{
                                                        paddingRight: '2pt'
                                                    }}>
                                                        also in
                                                    </span>
                                                    :
                                                    null
                                            }


                                                {this.getTopicQuestionnarie(row.section).map((questionnarie, i) => (
                                                        <span key={'row-' + index + '-' + i}
                                                              style={{padding: '0pt 0pt 0pt 0pt'}}
                                                              onClick={() => thisState.props.switchTo(questionnarie, row.section)}
                                                        >
                                                           { (i>0? ', ' : '') + questionnarie}
                                                        </span>
                                                    ))}


                                            <div style={{
                                                width: 50,
                                                display: 'inline-block',
                                                fontWeight: 'normal',
                                                //color: '#909090',
                                                marginLeft: '14pt'
                                            }}>
                                            {
                                                thisState.state.section_to_variable[row.section] ?
                                                    '('+
                                                    thisState.countSelectedVariables(row.section)
                                                    + '/' +
                                                    thisState.state.section_to_variable[row.section].length
                                                    + ')'
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
                dataIndex:
                    'description',
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
                title: <Checkbox></Checkbox>,
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
                            children: <Checkbox value={row.variable}
                                                checked={thisState.state.variable_selected[row.variable]}
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
                style={{fontSize: 12}}
                rowKey={() => 'key-' + new Date().getTime()}
            />
        )

    }
}

export default TopicTable;
