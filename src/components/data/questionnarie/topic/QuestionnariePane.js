import React from 'react';
import {Checkbox} from 'antd';
import 'antd/dist/antd.css';
import '../../index.css';
import '../questionnarie.css';

class QuestionnariePane extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            questionnarie: [
                {
                    name: 'Questionnaire 1 (1995-1996)',
                    key: 'Q1',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q1') !== -1 : true,
                },
                {
                    name: 'Questionnaire 2 (1997-1998)',
                    key: 'Q2',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q2') !== -1 : true,
                },
                {
                    name: 'Questionnaire 3 (2000-2002)',
                    key: 'Q3',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q3') !== -1 : true,
                },
                {
                    name: 'Questionnaire 4 (2005-2008)',
                    key: 'Q4',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q4') !== -1 : true,
                },
                {
                    name: 'Questionnaire 4mini',
                    key: 'Q4mini',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q4mini') !== -1 : true,
                },
                {
                    name: 'Questionnaire 5  (2012-2015)',
                    key: 'Q5',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q5') !== -1 : true,
                },
                {
                    name: 'Questionnaire 5mini',
                    key: 'Q5mini',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q5mini') !== -1 : true,
                },
                {
                    name: 'Questionnaire 6  (2017-2019)',
                    key: 'Q6',
                    selected: this.props.questionnarie ?
                        this.props.questionnarie.indexOf('Q6') !== -1 : true,
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

        this.props.onQuestionnarieChanged(copy);
    }

    getSelectedQuestionnarie = () => {
        let result = [];
        for (var i=0; i<this.state.questionnarie.length; i++) {
            if (this.state.questionnarie[i].selected) {
                result.push(this.state.questionnarie[i].key);
            }
        }
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
