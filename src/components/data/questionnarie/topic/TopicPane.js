import React from 'react';
import {Checkbox} from 'antd';
import 'antd/dist/antd.css';
import '../../index.css';
import '../questionnarie.css';

class TopicPane extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            topics: [
                {
                    name: 'Pre-selected variables',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Pre-selected variables') !== -1 : true
                },
                {
                    name: 'Alcohol use',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Alcohol use') !== -1 : false
                },
                {
                    name: 'Anthropomorphic measurements',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Anthropomorphic measurements') !== -1 : false
                },
                //{name: 'Children\'s health history', selected: false},
                {
                    name: 'Cognitive status',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Cognitive status') !== -1 : false
                },
                {
                    name: 'Diet',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Diet') !== -1 : false
                },
                {
                    name: 'Employment',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Employment') !== -1 : false
                },
                {
                    name: 'Environment',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Environment') !== -1 : false
                },
                {
                    name: 'Family history of cancer',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Family history of cancer') !== -1 : false
                },
                {
                    name: 'Family history of other medical conditions',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Family history of other medical conditions') !== -1 : false
                },
                {
                    name: 'Female health history',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Female health history') !== -1 : false
                },
                {
                    name: 'Female surgery',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Female surgery') !== -1 : false
                },
                {
                    name: 'Financial stress',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Financial stress') !== -1 : false
                },
                {
                    name: 'Happiness and social support',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Happiness and social support') !== -1 : false
                },
                {
                    name: 'Mammograms and other health screenings',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Mammograms and other health screenings') !== -1 : false
                },
                {
                    name: 'Medications',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Medications') !== -1 : false
                },
                {
                    name: 'Medicinal cannabis',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Medicinal cannabis') !== -1 : false
                },
                {
                    name: 'Menopause/menstrual Periods',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Menopause/menstrual Periods') !== -1 : false
                },
                {
                    name: 'Menopausal hormone therapy',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Menopausal hormone therapy') !== -1 : false
                },
                {
                    name: 'Oral contraceptives',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Oral contraceptives') !== -1 : false
                },
                {
                    name: 'Participant characteristics',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Participant characteristics') !== -1 : false
                },
                {
                    name: 'Personal medical history',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Personal medical history') !== -1 : false
                },
                {
                    name: 'Personal history of cancer',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Personal history of cancer') !== -1 : false
                },
                {
                    name: 'Physical activity',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Physical activity') !== -1 : false
                },
                {
                    name: 'Pregnancy',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Pregnancy') !== -1 : false
                },
                {
                    name: 'Residency',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Residency') !== -1 : false
                },
                {
                    name: 'Secondhand smoke',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Secondhand smoke') !== -1 : false
                },
                {
                    name: 'Sexual orientation',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Sexual orientation') !== -1 : false
                },
                {
                    name: 'Sleep habits',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Sleep habits') !== -1 : false
                },
                {
                    name: 'Smoking',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Smoking') !== -1 : false
                },
                {
                    name: 'Vitamins',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Vitamins') !== -1 : false
                },
                {
                    name: 'X-Rays imaging and radiation',
                    selected: this.props.topics ?
                        this.props.topics.indexOf('X-Rays imaging and radiation') !== -1 : false
                },
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

        this.props.onTopicChanged(copy);
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
