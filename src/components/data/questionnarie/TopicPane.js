import React from 'react';
import {Checkbox} from 'antd';
import 'antd/dist/antd.css';
import '../index.css';
import './questionnarie.css';

class TopicPane extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            topics: [
                {name: 'Pre-selected variables', selected: true},
                {name: 'Alcohol use', selected: false},
                {name: 'Anthropomorphic measurements', selected: false},
                {name: 'Children\'s health history', selected: false},
                {name: 'Cognitive status', selected: false},
                {name: 'Diet', selected: false},
                {name: 'Employment', selected: false},
                {name: 'Environment', selected: false},
                {name: 'Family history of cancer', selected: false},
                {name: 'Family history of other medical conditions', selected: false},
                {name: 'Female health history', selected: false},
                {name: 'Female surgery', selected: false},
                {name: 'Financial stress', selected: false},
                {name: 'Happiness and social support', selected: false},
                {name: 'Mammograms and other health screenings', selected: false},
                {name: 'Medications', selected: false},
                {name: 'Medicinal cannabis', selected: false},
                {name: 'Menopause/menstrual Periods', selected: false},
                {name: 'Menopausal hormone therapy', selected: false},
                {name: 'Oral contraceptives', selected: false},
                {name: 'Participant characteristics', selected: false},
                {name: 'Personal medical history', selected: false},
                {name: 'Personal history of cancer', selected: false},
                {name: 'Physical activity', selected: false},
                {name: 'Pregnancy', selected: false},
                {name: 'Residency', selected: false},
                {name: 'Secondhand smoke', selected: false},
                {name: 'Sexual orientation', selected: false},
                {name: 'Sleep habits', selected: false},
                {name: 'Smoking', selected: false},
                {name: 'Vitamins', selected: false},
                {name: 'X-Rays imaging and radiation', selected: false},
            ],
        }
    }

    onTopicChange = (val) => {
        let copy = [...this.state.topics];
        copy.splice(
            val.target.value,
            1,
            {
                name: this.state.topics[val.target.value].name,
                selected: !this.state.topics[val.target.value].selected,
            }
        )
        this.setState({
            topics: copy
        });
    }

    render() {
        return (
            <table style={{fontSize: 12, marginBottom: 20}}>
                <tbody>
                {
                    this.state.topics.map((topic, i) => (
                        <tr key={'topic-' + i} style={{verticalAlign: 'top'}}>
                            <td>
                                <Checkbox checked={topic.selected}
                                          value={i}
                                          onChange={this.onTopicChange}
                                />
                            </td>
                            <td style={{paddingLeft: '5pt'}}>
                                {topic.name}
                            </td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
        );
    }
}

export default TopicPane;
