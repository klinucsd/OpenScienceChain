import React from 'react';
import {Checkbox} from 'antd';
import 'antd/dist/antd.css';
import '../../index.css';
import '../questionnarie.css';
import axios from "axios";

class TopicPane extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            searchTerm: null,
            topics: [
                {
                    name: 'Pre-selected variables',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Pre-selected variables') !== -1 : true
                },
                {
                    name: 'Alcohol use',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Alcohol use') !== -1 : false
                },
                {
                    name: 'Anthropomorphic measurements',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Anthropomorphic measurements') !== -1 : false
                },
                //{name: 'Children\'s health history', selected: false},
                {
                    name: 'Cognitive status',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Cognitive status') !== -1 : false
                },
                {
                    name: 'Diet',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Diet') !== -1 : false
                },
                {
                    name: 'Employment',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Employment') !== -1 : false
                },
                {
                    name: 'Environment',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Environment') !== -1 : false
                },
                {
                    name: 'Family history of cancer',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Family history of cancer') !== -1 : false
                },
                {
                    name: 'Family history of other medical conditions',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Family history of other medical conditions') !== -1 : false
                },
                {
                    name: 'Female health history',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Female health history') !== -1 : false
                },
                {
                    name: 'Female surgery',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Female surgery') !== -1 : false
                },
                {
                    name: 'Financial stress',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Financial stress') !== -1 : false
                },
                {
                    name: 'Happiness and social support',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Happiness and social support') !== -1 : false
                },
                {
                    name: 'Mammograms and other health screenings',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Mammograms and other health screenings') !== -1 : false
                },
                {
                    name: 'Medications',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Medications') !== -1 : false
                },
                {
                    name: 'Medicinal cannabis',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Medicinal cannabis') !== -1 : false
                },
                {
                    name: 'Menopause/menstrual Periods',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Menopause/menstrual Periods') !== -1 : false
                },
                {
                    name: 'Menopausal hormone therapy',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Menopausal hormone therapy') !== -1 : false
                },
                {
                    name: 'Oral contraceptives',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Oral contraceptives') !== -1 : false
                },
                {
                    name: 'Participant characteristics',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Participant characteristics') !== -1 : false
                },
                {
                    name: 'Personal medical history',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Personal medical history') !== -1 : false
                },
                {
                    name: 'Personal history of cancer',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Personal history of cancer') !== -1 : false
                },
                {
                    name: 'Physical activity',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Physical activity') !== -1 : false
                },
                {
                    name: 'Pregnancy',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Pregnancy') !== -1 : false
                },
                {
                    name: 'Residency',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Residency') !== -1 : false
                },
                {
                    name: 'Secondhand smoke',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Secondhand smoke') !== -1 : false
                },
                {
                    name: 'Sexual orientation',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Sexual orientation') !== -1 : false
                },
                {
                    name: 'Sleep habits',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Sleep habits') !== -1 : false
                },
                {
                    name: 'Smoking',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Smoking') !== -1 : false
                },
                {
                    name: 'Vitamins',
                    valid: true,
                    selected: this.props.topics ?
                        this.props.topics.indexOf('Vitamins') !== -1 : false
                },
                {
                    name: 'X-Rays imaging and radiation',
                    valid: true,
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
                valid: this.state.topics[val.target.value].valid,
                selected: !this.state.topics[val.target.value].selected,
            }
        )
        this.setState({
            topics: copy
        });

        this.props.onTopicChanged(copy);
    }

    setSearchTerm = (searchTerm) => {
        this.setState({
            searchTerm
        });

        let thisState = this;
        axios.post('/api/topic_search',
            {
                searchTerm
            })
            .then(function (response) {
                let valid_topics = response.data;
                let topics = [...thisState.state.topics];
                for (var i = 0; i < topics.length; i++) {
                    var found = false;
                    for (var j = 0; j < valid_topics.length; j++) {
                        if (topics[i].name === valid_topics[j]) {
                            found = true;
                            topics[i].valid = true;
                            break;
                        }
                    }
                    if (!found) {
                        topics[i].valid = false;
                    }
                }
                thisState.setState({
                    topics: topics
                });
            });


    }

    render() {
        return (
            <table style={{fontSize: 12, marginBottom: 20}}>
                <tbody>
                {
                    this.state.topics.map((topic, i) => (
                        topic.valid?
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
                            :
                            null
                    ))
                }
                </tbody>
            </table>
        );
    }
}

export default TopicPane;
