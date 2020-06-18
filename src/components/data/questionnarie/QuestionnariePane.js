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
                    name: 'Questionnaire 1 (1995-1996)',
                    key: 'Q1',
                    selected: false,
                },
                {
                    name: 'Questionnaire 2 (1997-1998)',
                    key: 'Q2',
                    selected: false,
                },
                {
                    name: 'Questionnaire 3 (2000-2002)',
                    key: 'Q3',
                    selected: false,
                },
                {
                    name: 'Questionnaire 4 (2005-2008)',
                    key: 'Q4',
                    selected: false,
                },
                {
                    name: 'Questionnaire 4mini',
                    key: 'Q4mini',
                    selected: false,
                },
                {
                    name: 'Questionnaire 5 (2012-2015)',
                    key: 'Q5',
                    selected: false,
                },
                {
                    name: 'Questionnaire 5mini',
                    key: 'Q5mini',
                    selected: false,
                },
                {
                    name: 'Questionnaire 6 (2017-2019)',
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
