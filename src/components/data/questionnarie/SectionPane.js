import React from 'react';
import {Checkbox} from 'antd';
import 'antd/dist/antd.css';
import '../index.css';
import './questionnarie.css';

const questionnarie = [
    {
        name: 'Questionnaire 1 (1995-1996)',
        key: 'Q1',
        selected: false,
        sections: [
            "background & environment",
            "reproductive history",
            "health history",
            "personal & family medical history",
            "physical activity",
            "diet", "alcohol & tobacco use",
        ]
    },
    {
        name: 'Questionnaire 2 (1997-1998)',
        key: 'Q2',
        selected: false,
        sections: [
            "secondhand smoke",
            "pregnancy update",
            "x-ray & radiation treatment",
            "body measurements",
        ]
    },
    {
        name: 'Questionnaire 3 (2000-2002)',
        key: 'Q3',
        selected: false,
        sections: [
            "stress and social support",
            "contraception and menopause",
            "illness",
            "medication",
            "drawing and writing",
        ]
    },
    {
        name: 'Questionnaire 4 (2005-2008)',
        key: 'Q4',
        selected: false,
        sections: [
            "residency",
            "medications",
            "menopausal status",
            "menopausal hormone therapy",
            "health",
            "physical activity",
            "weight",
            "family cancer history",
            "diet",
            "vitamin supplements",
            "smoking & pregnancy",
            "general",
        ]
    },
    {
        name: 'Questionnaire 4mini',
        key: 'Q4mini',
        selected: false,
        sections: [
            "front cover",
            "rear cover",
        ]
    },
    {
        name: 'Questionnaire 5 (2012-2015)',
        key: 'Q5',
        selected: false,
        sections: [
            "residency, marital status and employment",
            "sleep habits",
            "current life experiences",
            "physical activity",
            "medications",
            "oral contraceptives",
            "menstrual periods",
            "menopausal hormone therapy",
            "medical imaging",
            "medical screening",
            "medical conditions",
            "health",
            "vitamins and supplements",
            "body size",
            "personal care practices"
        ]
    },
    {
        name: 'Questionnaire 5mini',
        key: 'Q5mini',
        selected: false,
        sections: [
            "residency, marital status and employment",
            "physical activity",
            "health",
            "menopausal hormone therapy",
            "menstrual periods",
        ]
    },
    {
        name: 'Questionnaire 6 (2017-2019)',
        key: 'Q6',
        selected: false,
        sections: [
            "happiness",
            "physical activity",
            "social connection",
            "medical screening",
            "health conditions",
            "genetic testing",
            "body size",
            "sleep habits",
            "drinking water",
            "current home water",
            "residency, marital status and employment",
            "financial stress",
            "income",
            "medicinal cannabis",
            "menopausal hormone therapy",
            "menstrual periods",
        ]
    },
];

class SectionPane extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            sections: [
                {name: "alcohol & tobacco use", selected: false, show: false},
                {name: "background & environment", selected: false, show: false},
                {name: "body measurements", selected: false, show: false},
                {name: "body size", selected: false, show: false},
                {name: "contraception and menopause", selected: false, show: false},
                {name: "current home water", selected: false, show: false},
                {name: "current life experiences", selected: false, show: false},
                {name: "diet", selected: false, show: false},
                {name: "drawing and writing", selected: false, show: false},
                {name: "drinking water", selected: false, show: false},
                {name: "family cancer history", selected: false, show: false},
                {name: "financial stress", selected: false, show: false},
                {name: "front cover", selected: false, show: false},
                {name: "general", selected: false, show: false},
                {name: "genetic testing", selected: false, show: false},
                {name: "happiness", selected: false, show: false},
                {name: "health", selected: false, show: false},
                {name: "health conditions", selected: false, show: false},
                {name: "health history", selected: false, show: false},
                {name: "illness", selected: false, show: false},
                {name: "income", selected: false, show: false},
                {name: "medical conditions", selected: false, show: false},
                {name: "medical imaging", selected: false, show: false},
                {name: "medical screening", selected: false, show: false},
                {name: "medication", selected: false, show: false},
                {name: "medications", selected: false, show: false},
                {name: "medicinal cannabis", selected: false, show: false},
                {name: "menopausal hormone therapy", selected: false, show: false},
                {name: "menopausal status", selected: false, show: false},
                {name: "menstrual periods", selected: false, show: false},
                {name: "oral contraceptives", selected: false, show: false},
                {name: "personal & family medical history", selected: false, show: false},
                {name: "personal care practices", selected: false, show: false},
                {name: "physical activity", selected: false, show: false},
                {name: "pregnancy update", selected: false, show: false},
                {name: "rear cover", selected: false, show: false},
                {name: "reproductive history", selected: false, show: false},
                {name: "residency", selected: false, show: false},
                {name: "residency, marital status and employment", selected: false, show: false},
                {name: "secondhand smoke", selected: false, show: false},
                {name: "sleep habits", selected: false, show: false},
                {name: "smoking & pregnancy", selected: false, show: false},
                {name: "social connection", selected: false, show: false},
                {name: "stress and social support", selected: false, show: false},
                {name: "vitamin supplements", selected: false, show: false},
                {name: "vitamins and supplements", selected: false, show: false},
                {name: "weight", selected: false, show: false},
                {name: "x-ray &radiation treatment", selected: false, show: false}
            ],
        }
    }

    onSectionChange = (val) => {
        let copy = [...this.state.sections];
        copy.splice(
            val.target.value,
            1,
            {
                name: this.state.sections[val.target.value].name,
                selected: !this.state.sections[val.target.value].selected,
                show: this.state.sections[val.target.value].show,
            }
        )
        this.setState({
            sections: copy
        });
    }

    isValidSection = (sect) => {
        for (var i = 0; i < questionnarie.length; i++) {
            let questions = questionnarie[i];
            if (questionnarie.selected === true) {
                for (var j = 0; j < questionnarie.sections.length; j++) {
                    let section = questionnarie.sections[j];
                    if (section === sect.name) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isValid = (qs, section_name) => {
        for (var i=0; i<questionnarie.length; i++) {
            for (var j=0; j<questionnarie[i].sections.length; j++) {
                if (section_name === questionnarie[i].sections[j]) {
                    for (var k=0; k<qs.length; k++) {
                        if (questionnarie[i].name === qs[k].name) {
                            return qs[k].selected;
                        }
                    }
                }
            }
        }
    }

    refresh = (qs) => {
        let sections = [];
        for (var i = 0; i < this.state.sections.length; i++) {
            sections.push({
                name: this.state.sections[i].name,
                selected: this.state.sections[i].selected,
                show: this.isValid(qs, this.state.sections[i].name)
            });
        }

        this.setState({
            sections: sections
        });

        this.props.sections_changed(sections);
    }

    render() {
        return (
            <table style={{fontSize: 12, marginBottom: 20}}>
                <tbody>
                {
                    this.state.sections.map((section, j) => (
                        (
                            section.show ?
                                <tr key={'section-' + j} style={{verticalAlign: 'top'}}>
                                    <td>
                                        <Checkbox checked={section.selected}
                                                  value={j}
                                                  onChange={this.onSectionChange}
                                        />
                                    </td>
                                    <td style={{paddingLeft: '5pt'}}>
                                        {section.name.charAt(0).toUpperCase() + section.name.slice(1)}
                                    </td>
                                </tr> : null
                        )

                    ))

                }
                </tbody>
            </table>
        );
    }

}

export default SectionPane;
