import React from 'react';
import {Checkbox} from 'antd';
import 'antd/dist/antd.css';
import '../index.css';
import './questionnarie.css';

class QuestionnariePane extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            questionnarie: [
                {
                    name: <div>Questionnaire 1<br/>(1995-1996)</div>,
                    key: 'Q1',
                    selected: false,
                },
                {
                    name: <div>Questionnaire 2<br/>(1997-1998)</div>,
                    key: 'Q2',
                    selected: false,
                },
                {
                    name: <div>Questionnaire 3<br/>(2000-2002)</div>,
                    key: 'Q3',
                    selected: false,
                },
                {
                    name: <div>Questionnaire 4<br/>(2005-2008)</div>,
                    key: 'Q4',
                    selected: false,
                },
                {
                    name: <div>Questionnaire 4mini</div>,
                    key: 'Q4mini',
                    selected: false,
                },
                {
                    name: <div>Questionnaire 5<br/> (2012-2015)</div>,
                    key: 'Q5',
                    selected: false,
                },
                {
                    name: <div>Questionnaire 5mini</div>,
                    key: 'Q5mini',
                    selected: false,
                },
                {
                    name: <div>Questionnaire 6<br/> (2017-2019)</div>,
                    key: 'Q6',
                    selected: false,
                },
            ],
        }
    }

    onQuestionnaireChange = (val) => {
        let copy = [...this.state.questionnarie];
        copy.splice(
            val.target.value,
            1,
            {
                name: this.state.questionnarie[val.target.value].name,
                key: this.state.questionnarie[val.target.value].key,
                selected: !this.state.questionnarie[val.target.value].selected,
            }
        )
        this.setState({
            questionnarie: copy
        });

        this.props.questionnarie_changed(copy);
    }


    getSelectedQuestionnarie = () => {

        console.log("getSelectedQuestionnarie");

        let result = [];
        for (var i=0; i<this.state.questionnarie.length; i++) {
            console.log("check " + JSON.stringify(this.state.questionnarie[i]));
            if (this.state.questionnarie[i].selected) {
                result.push(this.state.questionnarie[i].key);
            }
        }
        console.log("result: "+JSON.stringify(result));
        return result;
    }

    render() {
        return (
            <table style={{fontSize: 12, marginBottom: 20}}>
                <tbody>
                {
                    this.state.questionnarie.map((questionnarie, i) => (
                        <tr key={'questionnarie-' + i} style={{verticalAlign: 'top'}}>
                            <td>
                                <Checkbox checked={questionnarie.selected}
                                          value={i}
                                          onChange={this.onQuestionnaireChange}
                                />
                            </td>
                            <td style={{paddingLeft: '5pt'}}>
                                {questionnarie.name}
                            </td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
        );
    }
}

export default QuestionnariePane;
