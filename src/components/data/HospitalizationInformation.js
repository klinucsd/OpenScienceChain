import React from 'react';
import 'antd/dist/antd.css';
import './index.css';
import './hospitalization.css';
import Typography from '@material-ui/core/Typography/index';
import {Input, Radio, DatePicker, Checkbox, Card} from 'antd';
import moment from 'moment';
import HospitalizationRecordTypeSorter from './HospitalizationRecordTypeSorter';
import {Typography as AntTypography} from 'antd';
import EditableTable from "./EditableTable";

const {Text} = AntTypography;
const {TextArea} = Input;

const root_style = {
    width: '100%',
}

const dateFormat = 'MM/DD/YYYY';

function disabledDate(current) {
    // Can not select days after today and today
    return current && current > moment().endOf('day');
}

function getTypeName(name) {
    let names = name.split('_');
    return names[0].charAt(0).toUpperCase() + names[0].substring(1) + ' ' +
        names[1].charAt(0).toUpperCase() + names[1].substring(1);
}

class HospitalizationInformation extends React.Component {

    static getTitle = () => {
        return 'Enter hospitalization information';
    }

    static isComplete = (state) => {

        return state.hospitalization_info !== null && state.hospitalization_info !== undefined &&
            state.hospitalization_info.hospitalization_record !== null &&
            (state.hospitalization_info.hospitalization_record === 'First of selected' ?
                    (
                        state.hospitalization_info.patient_discharge === true ||
                        state.hospitalization_info.ambulatory_surgery === true ||
                        state.hospitalization_info.emergency_department === true
                    ) : true
            ) &&
            (state.hospitalization_info.hospitalization_record === 'First of selected' &&
                (
                    (state.hospitalization_info.patient_discharge === true && state.hospitalization_info.ambulatory_surgery === true) ||
                    (state.hospitalization_info.patient_discharge === true && state.hospitalization_info.emergency_department === true) ||
                    (state.hospitalization_info.ambulatory_surgery === true && state.hospitalization_info.emergency_department === true)
                ) ?
                    state.hospitalization_info.hospitalization_record_order !== null &&
                    state.hospitalization_info.hospitalization_record_order.length > 0
                    : true
            ) &&
            (
                state.hospitalization_info.diagnosis_endpoint === true ||
                state.hospitalization_info.procedure_endpoint === true
            ) &&
            (
                state.hospitalization_info.diagnosis_endpoint === true ?
                    state.hospitalization_info.diagnosis_endpoint_type !== null : true
            ) &&
            (
                state.hospitalization_info.procedure_endpoint === true ?
                    state.hospitalization_info.procedure_endpoint_type !== null : true
            ) &&
            state.hospitalization_info.hospitalization_endpoints !== null &&
            state.hospitalization_info.hospitalization_endpoints.length > 0 &&
            state.hospitalization_info.endpoint_priority !== null &&
            (state.hospitalization_info.endpoint_priority === 'Depends on' ?
                    state.hospitalization_info.endpoint_priority_detail !== null &&
                    state.hospitalization_info.endpoint_priority_detail.trim().length > 0
                    : true
            ) &&
            state.hospitalization_info.start_date !== null &&
            (state.hospitalization_info.start_date === 'Other' ? state.hospitalization_info.specified_start_date !== null : true) &&
            state.hospitalization_info.include_prevalent !== null &&
            state.hospitalization_info.include_eligible !== null &&
            (state.hospitalization_info.include_eligible === 'no' ?
                    (
                        state.hospitalization_info.end_date !== null &&
                        (
                            state.hospitalization_info.end_date === 'Other' ? state.hospitalization_info.specified_end_date !== null : true
                        )
                    ) : true
            );
    }

    static getSummary = (project, index) => {

        let hospitalization_info = project.hospitalization_info ?
            JSON.parse(project.hospitalization_info) : null;

        return (
            <Card key={'module-' + index}
                  size="small"
                  title={'Hospitalization Information'}
                  headStyle={{backgroundColor: 'rgb(216, 236, 243)'}}
                  style={{width: '100%', margin: index > 0 ? '20pt 0pt 0pt 0pt' : '0pt'}}>

                {
                    hospitalization_info === null ?
                        <div style={{padding: '10pt 20pt 10pt 20pt'}}>
                            <Text type="danger">
                                No hospitalization information available
                            </Text>
                        </div>
                        :
                        <div style={{padding: '10pt 0pt 10pt 10pt'}}>
                            <table border={0}>
                                <tbody>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Types of hospitalization records:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                hospitalization_info.hospitalization_record === null ?
                                                    'Not specified' :
                                                    (
                                                        hospitalization_info.hospitalization_record === 'First of any source' ?
                                                            'First of any source'
                                                            :
                                                            `First of 
                                                             ${hospitalization_info.patient_discharge ? 'Patient Discharge' : ''}${
                                                                hospitalization_info.ambulatory_surgery ?
                                                                    (hospitalization_info.patient_discharge ? ', ' : '') + 'Ambulatory Surgery' : ''
                                                                }${
                                                                hospitalization_info.emergency_department ?
                                                                    (
                                                                        hospitalization_info.patient_discharge ||
                                                                        hospitalization_info.ambulatory_surgery ? ', ' : ''
                                                                    ) + 'Emergency Department' : ''
                                                                }
                                                            `
                                                    )
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                {
                                    hospitalization_info.hospitalization_record === 'First of selected' ?
                                        <tr>
                                            <td>
                                                <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                                    Order hospitalization records by:
                                                </Text>
                                            </td>
                                            <td>
                                                <Text>
                                                    {
                                                        hospitalization_info.hospitalization_record_order === undefined ||
                                                        hospitalization_info.hospitalization_record_order === null ||
                                                        hospitalization_info.hospitalization_record_order.length === 0 ?
                                                            'Not specified' :
                                                            hospitalization_info.hospitalization_record_order.map((type, i) =>
                                                                i > 0 ? ', ' + getTypeName(type) : getTypeName(type)
                                                            )
                                                    }
                                                </Text>
                                            </td>
                                        </tr> : null
                                }
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Types of hospitalization endpoint codes:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                hospitalization_info.diagnosis_endpoint === false &&
                                                hospitalization_info.procedure_endpoint === false ?
                                                    'Not specified' : ''
                                            }
                                            {
                                                hospitalization_info.diagnosis_endpoint === true ?
                                                    hospitalization_info.diagnosis_endpoint_type : ''
                                            }
                                            {
                                                hospitalization_info.procedure_endpoint === true ?
                                                    (hospitalization_info.diagnosis_endpoint ? ', ' : '') +
                                                    hospitalization_info.procedure_endpoint_type : ''
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Hospitalization endpoints:
                                        </Text>
                                    </td>
                                    <td>
                                        {
                                            hospitalization_info.hospitalization_endpoints === null ||
                                            hospitalization_info.hospitalization_endpoints === undefined ||
                                            hospitalization_info.hospitalization_endpoints.length === 0 ?
                                                <Text>Not specified</Text>
                                                : null
                                        }
                                    </td>
                                </tr>
                                {
                                    hospitalization_info.hospitalization_endpoints !== null &&
                                    hospitalization_info.hospitalization_endpoints !== undefined &&
                                    hospitalization_info.hospitalization_endpoints.length > 0 ?
                                        <tr>
                                            <td colSpan={2}>
                                                <table border={0} style={{margin: '5px 50px 5px 50px', width: '100%'}}>
                                                    <tbody>
                                                    <tr style={{}}>
                                                        <td style={{
                                                            width: '25%',
                                                            padding: '3px 5px 3px 5px',
                                                            fontSize: '9pt',
                                                            fontWeight: 'bold',
                                                            backgroundColor: 'lightgray',
                                                            border: 'solid 1px white'
                                                        }}>Condition
                                                        </td>
                                                        <td style={{
                                                            width: '25%',
                                                            padding: '3px 5px 3px 5px',
                                                            fontSize: '9pt',
                                                            fontWeight: 'bold',
                                                            backgroundColor: 'lightgray',
                                                            border: 'solid 1px white'
                                                        }}>ICD-9 codes
                                                        </td>
                                                        <td style={{
                                                            width: '25%',
                                                            padding: '3px 5px 3px 5px',
                                                            fontSize: '9pt',
                                                            fontWeight: 'bold',
                                                            backgroundColor: 'lightgray',
                                                            border: 'solid 1px white'
                                                        }}>ICD-10 codes
                                                        </td>
                                                        <td style={{
                                                            width: '25%',
                                                            padding: '3px 5px 3px 5px',
                                                            fontSize: '9pt',
                                                            fontWeight: 'bold',
                                                            backgroundColor: 'lightgray',
                                                            border: 'solid 1px white'
                                                        }}>Other criteria
                                                        </td>
                                                    </tr>
                                                    {hospitalization_info.hospitalization_endpoints.map((endpoint, i) => {
                                                        return <tr>
                                                            <td style={{
                                                                width: '25%',
                                                                padding: '3px 5px 3px 5px',
                                                                fontSize: '9pt',
                                                                backgroundColor: i % 2 === 0 ? 'white' : '#f0f0f0',
                                                                border: 'solid 1px white',
                                                                verticalAlign: 'top'
                                                            }}>
                                                                {endpoint.condition}
                                                            </td>
                                                            <td style={{
                                                                width: '25%',
                                                                padding: '3px 5px 3px 5px',
                                                                fontSize: '9pt',
                                                                backgroundColor: i % 2 === 0 ? 'white' : '#f0f0f0',
                                                                border: 'solid 1px white',
                                                                verticalAlign: 'top'
                                                            }}>
                                                                {endpoint.icd9}
                                                            </td>
                                                            <td style={{
                                                                width: '25%',
                                                                padding: '3px 5px 3px 5px',
                                                                fontSize: '9pt',
                                                                backgroundColor: i % 2 === 0 ? 'white' : '#f0f0f0',
                                                                border: 'solid 1px white',
                                                                verticalAlign: 'top'
                                                            }}>
                                                                {endpoint.icd10}
                                                            </td>
                                                            <td style={{
                                                                width: '25%',
                                                                padding: '3px 5px 3px 5px',
                                                                fontSize: '9pt',
                                                                backgroundColor: i % 2 === 0 ? 'white' : '#f0f0f0',
                                                                border: 'solid 1px white',
                                                                verticalAlign: 'top'
                                                            }}>
                                                                {endpoint.other}
                                                            </td>
                                                        </tr>
                                                    })
                                                    }
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        : null
                                }
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt', whiteSpace: 'nowrap'}}>
                                            Prioritize diagnoses/procedures on the same day:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                hospitalization_info.endpoint_priority === null ?
                                                    'Not specified' :
                                                    hospitalization_info.endpoint_priority !== 'Depends on' ?
                                                        hospitalization_info.endpoint_priority :
                                                        hospitalization_info.endpoint_priority_detail === null ?
                                                            'Not specified' :
                                                            'Depends on the endpoint - ' + hospitalization_info.endpoint_priority_detail
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Analysis follow-up begin:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                hospitalization_info.start_date !== 'Other' ?
                                                    hospitalization_info.start_date :
                                                    hospitalization_info.specified_start_date === null ?
                                                        'Not specified' :
                                                        hospitalization_info.specified_start_date.split('T')[0]
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Include participants with prevalent cases:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                hospitalization_info.include_prevalent === null ?
                                                    'Not specified' :
                                                    hospitalization_info.include_prevalent
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Include eligible cases through 12/31/2018:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                hospitalization_info.include_eligible === null ?
                                                    'Not specified' :
                                                    hospitalization_info.include_eligible
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                {
                                    hospitalization_info.include_eligible !== null &&
                                    hospitalization_info.include_eligible === 'no' ?
                                        <tr>
                                            <td>
                                                <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                                    Analysis follow-up end date:
                                                </Text>
                                            </td>
                                            <td>
                                                <Text>
                                                    {
                                                        hospitalization_info.end_date !== 'Other' ?
                                                            hospitalization_info.end_date :
                                                            hospitalization_info.specified_end_date === null ?
                                                                'Not specified' :
                                                                hospitalization_info.specified_end_date.split('T')[0]
                                                    }
                                                </Text>
                                            </td>
                                        </tr> : null
                                }

                                <tr>
                                    <td>
                                        <Text style={{fontWeight: 'bold', paddingRight: '10pt'}}>
                                            Additional censoring criteria or other information:
                                        </Text>
                                    </td>
                                    <td>
                                        <Text>
                                            {
                                                hospitalization_info.additional_info === null ||
                                                hospitalization_info.additional_info.trim().length === 0 ?
                                                    'Not specified' :
                                                    hospitalization_info.additional_info
                                            }
                                        </Text>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                }
            </Card>
        )
    }


    constructor(props) {
        super(props);
        this.state = {
            hospitalization_record: null,
            patient_discharge: false,
            ambulatory_surgery: false,
            emergency_department: false,
            diagnosis_endpoint: false,
            procedure_endpoint: false,
            diagnosis_endpoint_type: null,
            procedure_endpoint_type: null,
            endpoint_priority: null,
            endpoint_priority_detail: null,
            hospitalization_endpoint: null,
            hospitalization_endpoint_10: null,
            hospitalization_endpoints: [],
            start_date: 'QNR_1_FILL_DT',
            specified_start_date: null,
            include_prevalent: null,
            include_eligible: null,
            end_date: 'QNR_1_FILL_DT',
            specified_end_date: null,
            additional_info: null,
            hospitalization_record_order: null
        }

        this.sorterRef = React.createRef();
        this.endpointsRef = React.createRef();
    }

    componentDidMount() {
        if (this.props.project && this.props.project.hospitalization_info) {
            let hospitalization_info = JSON.parse(this.props.project.hospitalization_info);
            if (hospitalization_info) {
                this.setState({
                    hospitalization_record: hospitalization_info.hospitalization_record,
                    patient_discharge: hospitalization_info.patient_discharge,
                    ambulatory_surgery: hospitalization_info.ambulatory_surgery,
                    emergency_department: hospitalization_info.emergency_department,
                    diagnosis_endpoint: hospitalization_info.diagnosis_endpoint,
                    procedure_endpoint: hospitalization_info.procedure_endpoint,
                    diagnosis_endpoint_type: hospitalization_info.diagnosis_endpoint_type,
                    procedure_endpoint_type: hospitalization_info.procedure_endpoint_type,
                    endpoint_priority: hospitalization_info.endpoint_priority,
                    endpoint_priority_detail: hospitalization_info.endpoint_priority_detail,
                    hospitalization_endpoint: hospitalization_info.hospitalization_endpoint,
                    hospitalization_endpoint_10: hospitalization_info.hospitalization_endpoint_10,
                    hospitalization_endpoints: hospitalization_info.hospitalization_endpoints,
                    start_date: hospitalization_info.start_date,
                    specified_start_date: hospitalization_info.specified_start_date ? moment.utc(hospitalization_info.specified_start_date) : null,
                    include_prevalent: hospitalization_info.include_prevalent,
                    include_eligible: hospitalization_info.include_eligible,
                    end_date: hospitalization_info.end_date,
                    specified_end_date: hospitalization_info.specified_end_date ? moment.utc(hospitalization_info.specified_end_date) : null,
                    additional_info: hospitalization_info.additional_info,
                    hospitalization_record_order: hospitalization_info.hospitalization_record_order
                });

                if (this.endpointsRef.current && this.endpointsRef.current.setData) {
                    this.endpointsRef.current.setData(hospitalization_info.hospitalization_endpoints);
                }

            }
        }
    }

    reset = () => {
        this.setState({
            hospitalization_record: null,
            patient_discharge: false,
            ambulatory_surgery: false,
            emergency_department: false,
            diagnosis_endpoint: false,
            procedure_endpoint: false,
            diagnosis_endpoint_type: null,
            procedure_endpoint_type: null,
            endpoint_priority: null,
            endpoint_priority_detail: null,
            hospitalization_endpoint: null,
            hospitalization_endpoint_10: null,
            hospitalization_endpoints: [],
            start_date: 'QNR_1_FILL_DT',
            specified_start_date: null,
            include_prevalent: null,
            include_eligible: null,
            end_date: 'QNR_1_FILL_DT',
            specified_end_date: null,
            additional_info: null,
            hospitalization_record_order: null
        });
    }


    onChangeHospitalizationRecord = (event) => {
        this.setState({
            hospitalization_record: event.target.value
        }, this.saveHospitalizationInformation)
    }

    onChangePatientDischarge = (event) => {
        this.setState({
            patient_discharge: event.target.checked
        }, this.saveHospitalizationInformation);

        if (event.target.checked) {
            if (this.sorterRef.current && this.sorterRef.current.removeItem) {
                this.sorterRef.current.addItem('item-0');
            }
        } else {
            if (this.sorterRef.current && this.sorterRef.current.addItem) {
                this.sorterRef.current.removeItem('item-0');
            }
        }

    }

    onChangeAmbulatorySurgery = (event) => {
        this.setState({
            ambulatory_surgery: event.target.checked
        }, this.saveHospitalizationInformation);

        if (event.target.checked) {
            if (this.sorterRef.current && this.sorterRef.current.removeItem) {
                this.sorterRef.current.addItem('item-1');
            }
        } else {
            if (this.sorterRef.current && this.sorterRef.current.addItem) {
                this.sorterRef.current.removeItem('item-1');
            }
        }
    }

    onChangeEmergencyDepartment = (event) => {
        this.setState({
            emergency_department: event.target.checked
        }, this.saveHospitalizationInformation);

        if (event.target.checked) {
            if (this.sorterRef.current && this.sorterRef.current.removeItem) {
                this.sorterRef.current.addItem('item-2');
            }
        } else {
            if (this.sorterRef.current && this.sorterRef.current.addItem) {
                this.sorterRef.current.removeItem('item-2');
            }
        }
    }

    hospitalization_record_type_count = () => {
        let result = 0;
        if (this.state.patient_discharge === true) {
            result++;
        }
        if (this.state.ambulatory_surgery === true) {
            result++;
        }
        if (this.state.emergency_department === true) {
            result++;
        }
        return result;
    }

    onChangeDiagnosisEndpoint = (event) => {
        this.setState({
            diagnosis_endpoint: event.target.checked
        }, this.saveHospitalizationInformation)
    }

    onChangeProcedureEndpoint = (event) => {
        this.setState({
            procedure_endpoint: event.target.checked
        }, this.saveHospitalizationInformation)
    }

    onChangeDiagnosisEndpointType = (event) => {
        this.setState({
            diagnosis_endpoint_type: event.target.value
        }, this.saveHospitalizationInformation);
    }

    onChangeProcedureEndpointType = (event) => {
        this.setState({
            procedure_endpoint_type: event.target.value
        }, this.saveHospitalizationInformation);
    }

    onChangeEndpointPriority = (event) => {
        this.setState({
            endpoint_priority: event.target.value
        }, this.saveHospitalizationInformation);
    }

    onChangeEndpointPriorityDetail = (event) => {
        this.setState({
            endpoint_priority_detail: event.target.value
        }, this.saveHospitalizationInformation);
    }

    onChangeStartDate = (event) => {
        this.setState({
            start_date: event.target.value,
        }, this.saveHospitalizationInformation);
    }

    onChangeSpecifiedStartDate = (date) => {
        this.setState({
            specified_start_date: date
        }, this.saveHospitalizationInformation);
    }

    onChangeIncludePrevalent = (event) => {
        this.setState({
            include_prevalent: event.target.value,
        }, this.saveHospitalizationInformation);
    }

    onChangeEndDate = (event) => {
        this.setState({
            end_date: event.target.value,
        }, this.saveHospitalizationInformation);
    }

    onChangeSpecifiedEndDate = (date) => {
        this.setState({
            specified_end_date: date
        }, this.saveHospitalizationInformation);
    }

    onChangeHospitalizationEndpoint = (event) => {
        this.setState({
            hospitalization_endpoint: event.target.value
        }, this.saveHospitalizationInformation)
    }

    onChangeHospitalizationEndpoint10 = (event) => {
        this.setState({
            hospitalization_endpoint_10: event.target.value
        }, this.saveHospitalizationInformation)
    }

    onChangeIncludeEligible = (event) => {
        this.setState({
            include_eligible: event.target.value,
        }, this.saveHospitalizationInformation);
    }

    onChangeAdditionalInfo = (event) => {
        this.setState({
            additional_info: event.target.value,
        }, this.saveHospitalizationInformation);
    }

    setHospitalizationRecordOrder = (order) => {
        let hospitalization_record_order = [];
        for (var i = 0; i < order.length; i++) {
            hospitalization_record_order.push(order[i].content.toLowerCase().replace(' ', '_'));
        }
        this.setState({
            hospitalization_record_order
        }, this.saveHospitalizationInformation)
    }

    saveHospitalizationInformation = () => {
        let obj = {
            hospitalization_record: this.state.hospitalization_record,
            patient_discharge: this.state.patient_discharge,
            ambulatory_surgery: this.state.ambulatory_surgery,
            emergency_department: this.state.emergency_department,
            diagnosis_endpoint: this.state.diagnosis_endpoint,
            procedure_endpoint: this.state.procedure_endpoint,
            diagnosis_endpoint_type: this.state.diagnosis_endpoint_type,
            procedure_endpoint_type: this.state.procedure_endpoint_type,
            endpoint_priority: this.state.endpoint_priority,
            endpoint_priority_detail: this.state.endpoint_priority_detail,
            hospitalization_endpoint: this.state.hospitalization_endpoint,
            hospitalization_endpoint_10: this.state.hospitalization_endpoint_10,
            hospitalization_endpoints: this.state.hospitalization_endpoints,
            start_date: this.state.start_date,
            specified_start_date: this.state.specified_start_date,
            include_prevalent: this.state.include_prevalent,
            include_eligible: this.state.include_eligible,
            end_date: this.state.end_date,
            specified_end_date: this.state.specified_end_date,
            additional_info: this.state.additional_info,
            hospitalization_record_order: this.state.hospitalization_record_order
        }
        this.props.save_hospitalization_info(obj);
    }

    setEndpoints = (endpoints) => {
        let hospitalization_endpoints = [];
        endpoints.map((endpoint, i) => {
            if ((endpoint.condition || endpoint.icd9 || endpoint.icd10 || endpoint.other) && i > 0) {
                hospitalization_endpoints.push(endpoint);
            }
        });

        this.setState({
            hospitalization_endpoints
        }, this.saveHospitalizationInformation);
    }

    render() {
        const radioStyle = {
            display: 'block',
            height: '30px',
            lineHeight: '30px',
            whiteSpace: 'auto',
        };

        return (
            <div style={root_style}>

                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    OSHPD Patient Discharge data are complete for all CTS participants from CTS baseline through 2018.
                    Ambulatory Surgery and Emergency Department data are also available, beginning in 2005 and complete
                    through 2018.
                </Typography>

                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    What type(s) of hospitalization records does your analysis include?
                </Typography>

                <div style={{padding: '5pt 80pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeHospitalizationRecord}
                                 value={this.state.hospitalization_record}>
                        <Radio style={radioStyle} value={'First of any source'}>
                            First of any source (Patient Discharge, Ambulatory Surgery, Emergency Department)
                        </Radio>
                        <Typography variant="subtitle2" style={{padding: '0pt 0pt 0pt 18pt'}}>
                            OR
                        </Typography>
                        <Radio style={radioStyle} value={'First of selected'}>
                            First of these selected source(s):
                        </Radio>
                        <div style={{padding: '0pt 80pt 10pt 25pt'}}>
                            <Checkbox style={radioStyle}
                                      disabled={this.state.hospitalization_record !== 'First of selected'}
                                      checked={this.state.patient_discharge}
                                      onChange={this.onChangePatientDischarge}>
                                Patient Discharge
                            </Checkbox>
                            <Checkbox style={radioStyle}
                                      disabled={this.state.hospitalization_record !== 'First of selected'}
                                      checked={this.state.ambulatory_surgery}
                                      onChange={this.onChangeAmbulatorySurgery}>
                                Ambulatory Surgery
                            </Checkbox>
                            <Checkbox style={radioStyle}
                                      disabled={this.state.hospitalization_record !== 'First of selected'}
                                      checked={this.state.emergency_department}
                                      onChange={this.onChangeEmergencyDepartment}>
                                Emergency Department
                            </Checkbox>
                        </div>
                    </Radio.Group>
                </div>

                {
                    this.state.hospitalization_record === 'First of selected' &&
                    this.hospitalization_record_type_count() > 1 ?
                        <div style={{padding: '0pt 0pt 10pt 10pt', width: '100%'}}>
                            <Typography>
                                If a participant has more than one hospitalization record that meets your endpoint
                                criteria on the same day, which source should be prioritized?
                            </Typography>

                            <Typography style={{padding: '10pt 20pt 0pt 0pt', width: '100%', fontStyle: 'italic'}}>
                                Instructions: Drag items to the right column to order them.
                            </Typography>

                            <div style={{
                                margin: '10pt 50pt 10pt 30pt',
                                height: '125pt',
                            }}>
                                <HospitalizationRecordTypeSorter
                                    hospitalization_record_list={[
                                        this.state.patient_discharge,
                                        this.state.ambulatory_surgery,
                                        this.state.emergency_department
                                    ]}
                                    hospitalization_record_order={this.state.hospitalization_record_order}
                                    set_hospitalization_record_order={this.setHospitalizationRecordOrder}
                                    ref={this.sorterRef}
                                />
                            </div>
                        </div> : null
                }

                <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                    For each hospitalization record, we collect not only principal diagnosis and procedure but also up
                    to 24 other diagnosis codes and 20 procedure codes during that same visit.
                </Typography>

                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    What type of codes define your hospitalization endpoint(s)?
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Checkbox style={radioStyle}
                              checked={this.state.diagnosis_endpoint}
                              onChange={this.onChangeDiagnosisEndpoint}>
                        Diagnosis
                    </Checkbox>

                    <div style={{marginLeft: '25pt'}}>
                        <Radio.Group onChange={this.onChangeDiagnosisEndpointType}
                                     value={this.state.diagnosis_endpoint_type}>
                            <Radio disabled={this.state.diagnosis_endpoint !== true}
                                   style={radioStyle}
                                   value={'Principal diagnosis'}>
                                Principal diagnosis
                            </Radio>
                            <Radio disabled={this.state.diagnosis_endpoint !== true}
                                   style={radioStyle}
                                   value={'Any diagnosis'}>
                                Any diagnosis
                            </Radio>
                        </Radio.Group>
                    </div>

                    <Checkbox style={radioStyle}
                              checked={this.state.procedure_endpoint}
                              onChange={this.onChangeProcedureEndpoint}>
                        Procedure
                    </Checkbox>

                    <div style={{marginLeft: '25pt'}}>
                        <Radio.Group onChange={this.onChangeProcedureEndpointType}
                                     value={this.state.procedure_endpoint_type}>
                            <Radio disabled={this.state.procedure_endpoint !== true}
                                   style={radioStyle}
                                   value={'Principal procedure'}>
                                Principal procedure
                            </Radio>
                            <Radio disabled={this.state.procedure_endpoint !== true}
                                   style={radioStyle}
                                   value={'Any procedure'}>
                                Any procedure
                            </Radio>
                        </Radio.Group>
                    </div>
                </div>

                <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                    How is the hospitalization endpoint defined?
                </Typography>

                <Typography style={{padding: '0pt 10pt 0pt 10pt', width: '100%'}}>
                    For each condition, fill in the ICD-9 and ICD-10 codes, specifying all digits. If applicable, fill
                    in any other criteria that defines the endpoint. Click the + button to add another condition.
                </Typography>

                <div style={{padding: '10pt 60pt 10pt 10pt', width: '100%'}}>
                    <table style={{ width: '100%' }}>
                        <tbody>
                        <tr>
                            <td style={{
                                paddingTop: '32pt',
                                paddingRight: '5pt',
                                verticalAlign: 'top',
                                textAlign: 'right'
                            }}>
                                <text>Example</text>
                            </td>
                            <td>
                                <EditableTable set_endpoints={this.setEndpoints}
                                               endpoints={this.state.hospitalization_endpoints}
                                               ref={this.endpointsRef}
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                    A small number of participants have both diagnoses and procedures on the same day.
                    If any of your endpoint definitions include both diagnosis and procedure codes, how would you like
                    to prioritize diagnoses and procedures that fall on the same day?
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeEndpointPriority} value={this.state.endpoint_priority}>
                        <Radio style={radioStyle} value={'N/A or no preference'}>
                            N/A or no preference
                        </Radio>
                        <Radio style={radioStyle} value={'Prioritize diagnoses'}>
                            Prioritize diagnoses
                        </Radio>
                        <Radio style={radioStyle} value={'Prioritize procedures'}>
                            Prioritize procedures
                        </Radio>
                        <Radio style={radioStyle} value={'Depends on'}>
                            Depends on the endpoint (please provide details):
                            <Input disabled={this.state.endpoint_priority !== 'Depends on'}
                                   value={this.state.endpoint_priority_detail}
                                   onChange={this.onChangeEndpointPriorityDetail}
                                   style={{marginLeft: '10pt'}}/>
                        </Radio>
                    </Radio.Group>
                </div>

                <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                    For your analysis, when should follow-up begin?
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeStartDate} value={this.state.start_date}>
                        <Radio style={radioStyle} value={'QNR_1_FILL_DT'}>
                            CTS Baseline, i.e. Questionnaire 1 (1995-1996)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_2_FILL_DT'}>
                            Questionnaire 2 (1997-1998)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_3_FILL_DT'}>
                            Questionnaire 3 (2000-2002)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_4_FILL_DT'}>
                            Questionnaire 4 (2005-2008)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_5_FILL_DT'}>
                            Questionnaire 5 (2012-2015)
                        </Radio>
                        <Radio style={radioStyle} value={'QNR_6_FILL_DT'}>
                            Questionnaire 6 (2017-2019)
                        </Radio>
                        <Radio style={radioStyle} value={'Other'}>
                            Other (please specify):
                            <DatePicker
                                required
                                disabledDate={disabledDate}
                                style={{marginLeft: '10pt'}}
                                value={this.state.specified_start_date}
                                format={dateFormat}
                                onChange={this.onChangeSpecifiedStartDate}
                            />
                        </Radio>
                    </Radio.Group>
                </div>

                <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                    Should participants with prevalent cases of the endpoint(s) at
                    your start date be included in the analysis?
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeIncludePrevalent} value={this.state.include_prevalent}>
                        <Radio style={radioStyle} value={'no'}>
                            No; exclude all participants who had a prevalent hospitalization endpoint
                        </Radio>
                        <Radio style={radioStyle} value={'yes'}>
                            Yes; include all particiants even if they have a prevalent hospitalization endpoint
                        </Radio>
                    </Radio.Group>
                </div>

                <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                    CTS follow-up data are currently complete through 12/31/2018. Will your analysis include all
                    eligible cases through 12/31/2018?
                </Typography>
                <Typography style={{padding: '2pt 10pt 0pt 10pt', width: '100%', fontStyle: 'italic'}}>
                    By default, CTS analyses censor participants when they die, move out of California, or reach the
                    administrative censoring date.
                </Typography>

                <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                    <Radio.Group onChange={this.onChangeIncludeEligible} value={this.state.include_eligible}>
                        <Radio style={radioStyle} value={'yes'}>
                            Yes
                        </Radio>
                        <Radio style={radioStyle} value={'no'}>
                            No
                        </Radio>
                    </Radio.Group>
                </div>

                {
                    this.state.include_eligible === 'no' ?
                        <>
                            <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                                If no, please specify the date on which your analysis follow-up will end:
                            </Typography>

                            <div style={{padding: '5pt 0pt 10pt 25pt'}}>
                                <Radio.Group onChange={this.onChangeEndDate} value={this.state.end_date}>
                                    <Radio style={radioStyle} value={'QNR_1_FILL_DT'}>
                                        CTS Baseline, i.e. Questionnaire 1 (1995-1996)
                                    </Radio>
                                    <Radio style={radioStyle} value={'QNR_2_FILL_DT'}>
                                        Questionnaire 2 (1997-1998)
                                    </Radio>
                                    <Radio style={radioStyle} value={'QNR_3_FILL_DT'}>
                                        Questionnaire 3 (2000-2002)
                                    </Radio>
                                    <Radio style={radioStyle} value={'QNR_4_FILL_DT'}>
                                        Questionnaire 4 (2005-2008)
                                    </Radio>
                                    <Radio style={radioStyle} value={'QNR_5_FILL_DT'}>
                                        Questionnaire 5 (2012-2015)
                                    </Radio>
                                    <Radio style={radioStyle} value={'QNR_6_FILL_DT'}>
                                        Questionnaire 6 (2017-2019)
                                    </Radio>
                                    <Radio style={radioStyle} value={'Other'}>
                                        Other (please specify):
                                        <DatePicker
                                            required
                                            disabledDate={disabledDate}
                                            style={{marginLeft: '10pt'}}
                                            value={this.state.specified_end_date}
                                            format={dateFormat}
                                            onChange={this.onChangeSpecifiedEndDate}
                                        />
                                    </Radio>
                                </Radio.Group>
                            </div>
                        </> : null
                }

                <Typography style={{padding: '10pt 50pt 0pt 10pt', width: '100%'}}>
                    Please specify any additional censoring criteria or other information about your project:
                </Typography>

                <div style={{padding: '10pt 80pt 10pt 30pt'}}>
                    <TextArea rows={6}
                              value={this.state.additional_info}
                              onChange={this.onChangeAdditionalInfo}
                              allowClear/>
                </div>

            </div>
        );
    }

}

export default HospitalizationInformation;
