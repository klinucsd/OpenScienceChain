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

class GeospatialData extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            geospatial_data: null,
        }
    }

    componentDidMount() {
        if (this.props.project && this.props.project.geospatial_info) {
            let geospatial_info = JSON.parse(this.props.project.geospatial_info);
            if (geospatial_info) {
                this.setState({
                    geospatial_data: geospatial_info.geospatial_data
                })
            }
        }
    }

    static getTitle = () => {
        return 'Enter geospatial information';
    }

    static isComplete = (state) => {
        return state.geospatial_info !== undefined &&
            state.geospatial_info !== null &&
            state.geospatial_info.geospatial_data !== null &&
            state.geospatial_info.geospatial_data.trim().length !== 0;
    }

    static getSummary = (project, index) => {
        return (
            <Card key={'module-' + index}
                  size="small"
                  title={'Geospatial Information'}
                  headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                  style={{width: '100%', margin: index > 0 ? '20pt 0pt 0pt 0pt' : '0pt'}}>

                {
                    project.geospatial_info === undefined ||
                    project.geospatial_info === null ||
                    JSON.parse(project.geospatial_info).geospatial_data === null ||
                    JSON.parse(project.geospatial_info).geospatial_data.trim().length === 0 ?
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text type="danger">
                                No geospatial_data information available
                            </Text>
                        </div>
                        :
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text>
                                {JSON.parse(project.geospatial_info).geospatial_data}
                            </Text>
                        </div>
                }
            </Card>
        )
    }

    reset = () => {
        this.setState({
            geospatial_data: null
        });
    }

    onChangeGeospatialData = (e) => {
        this.setState({
            geospatial_data: e.target.value,
        }, this.saveGeospatialInformation);
    }

    saveGeospatialInformation = () => {
        let obj = {
            geospatial_data: this.state.geospatial_data,
        }
        this.props.save_geospatial_info(obj);
    }

    render() {
        return (
            <div style={root_style}>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    This is the geospatial information you provided in your feasibility review.
                    Please confirm or modify the text as needed.
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.geospatial_data}
                              onChange={this.onChangeGeospatialData}
                              allowClear/>
                </div>

            </div>
        );
    }

}

export default GeospatialData;
