import React from 'react';
import 'antd/dist/antd.css';
import './index.css';
import './cancer_endpoint.css';
import Typography from '@material-ui/core/Typography/index';
import {Card, Input} from 'antd';

import {Typography as AntTypography} from 'antd';
const {Text} = AntTypography;

const {TextArea} = Input;

const root_style = {
    width: '100%',
}

class Biospecimens extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            biospecimen: null,
        }
    }

    componentDidMount() {
        if (this.props.project && this.props.project.biospecimen_info) {
            let biospecimen_info = JSON.parse(this.props.project.biospecimen_info);
            if (biospecimen_info) {
                this.setState({
                    biospecimen: biospecimen_info.biospecimen
                })
            }
        }
    }

    static getTitle = () => {
        return 'Enter biospecimen information';
    }

    static isComplete = (state) => {
        return state.biospecimen_info !== undefined &&
            state.biospecimen_info !== null &&
            state.biospecimen_info.biospecimen !== null &&
            state.biospecimen_info.biospecimen !== undefined &&
            state.biospecimen_info.biospecimen.trim().length !== 0;
    }

    static getSummary = (project, index) => {
        return (
            <Card key={'module-' + index}
                  size="small"
                  title={'Biospecimen Information'}
                  headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                  style={{width: '100%', margin: index > 0 ? '20pt 0pt 0pt 0pt' : '0pt'}}>

                {
                    project.biospecimen_info === undefined ||
                    project.biospecimen_info === null ||
                    JSON.parse(project.biospecimen_info).biospecimen === null ||
                    JSON.parse(project.biospecimen_info).biospecimen === undefined ||
                    JSON.parse(project.biospecimen_info).biospecimen.trim().length === 0 ?
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text type="danger">
                                No biospecimen information available
                            </Text>
                        </div>
                        :
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text>
                                {JSON.parse(project.biospecimen_info).biospecimen}
                            </Text>
                        </div>
                }
            </Card>
        )
    }

    reset = () => {
        this.setState({
            biospecimen: null,
        });
    }

    onChangeBiospecimen = (e) => {
        this.setState({
            biospecimen: e.target.value,
        }, this.saveBiospecimenInformation);
    }

    saveBiospecimenInformation = () => {
        let obj = {
            biospecimen: this.state.biospecimen,
        }
        this.props.save_biospecimen_info(obj);
    }

    render() {
        return (
            <div style={root_style}>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    This is the biospecimen information you provided in your feasibility review.
                    Please confirm or modify the text as needed.
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.biospecimen}
                              onChange={this.onChangeBiospecimen}
                              allowClear/>
                </div>

            </div>
        );
    }

}

export default Biospecimens;
