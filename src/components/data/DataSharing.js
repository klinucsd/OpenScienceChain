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

class DataSharing extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data_sharing: null,
        }
    }

    componentDidMount() {
        if (this.props.project && this.props.project.data_sharing_info) {
            let data_sharing_info = JSON.parse(this.props.project.data_sharing_info);
            if (data_sharing_info) {
                this.setState({
                    data_sharing: data_sharing_info.data_sharing
                })
            }
        }
    }

    static getTitle = () => {
        return 'Enter data sharing information';
    }

    static isComplete = (state) => {
        return state.data_sharing_info !== undefined &&
            state.data_sharing_info !== null &&
            state.data_sharing_info.data_sharing !== null &&
            state.data_sharing_info.data_sharing.trim().length !== 0;
    }

    static getSummary = (project, index) => {
        return (
            <Card key={'module-' + index}
                  size="small"
                  title={'Data Sharing Information'}
                  headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                  style={{width: '100%', margin: index > 0 ? '20pt 0pt 0pt 0pt' : '0pt'}}>

                {
                    project.data_sharing_info === undefined ||
                    project.data_sharing_info === null ||
                    JSON.parse(project.data_sharing_info).data_sharing === null ||
                    JSON.parse(project.data_sharing_info).data_sharing.trim().length === 0 ?
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text type="danger">
                                No data sharing information available
                            </Text>
                        </div>
                        :
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text>
                                {JSON.parse(project.data_sharing_info).data_sharing}
                            </Text>
                        </div>
                }
            </Card>
        )
    }

    reset = () => {
        this.setState({
            data_sharing: null,
        });
    }

    onChangeDataSharing = (e) => {
        this.setState({
            data_sharing: e.target.value,
        }, this.saveDataSharingInformation);
    }

    saveDataSharingInformation = () => {
        let obj = {
            data_sharing: this.state.data_sharing,
        }
        this.props.save_data_sharing_info(obj);
    }

    render() {
        return (
            <div style={root_style}>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    If your project data builds upon or will later be joined with previously transferred CTS data,
                    please provide those details here. This information helps us provide the correct data
                    and participant identifiers.
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.data_sharing}
                              onChange={this.onChangeDataSharing}
                              allowClear/>
                </div>

            </div>
        );
    }

}

export default DataSharing;
