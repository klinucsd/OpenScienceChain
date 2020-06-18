import React from 'react';
import 'antd/dist/antd.css';
import {Select} from 'antd';
import {Table, Checkbox} from 'antd';
import Button from "@material-ui/core/Button";
import './index.css';
import site_groups_name from '../../model/site_group_name';
import axios from 'axios';
import Tooltip from "@material-ui/core/Tooltip/Tooltip";

const {Option, OptGroup} = Select;

const categorized_site_group_names = [
    {
        category: 'Oral Cavity and Pharynx',
        names: ['Lip', 'Tongue', 'Salivary Gland', 'Floor of Mouth', 'Gum and Other Mouth',
            'Nasopharynx', 'Tonsil', 'Oropharynx', 'Hypopharynx', 'Other Oral Cavity and Pharynx']
    },
    {
        category: 'Digestive System',
        names: ['Esophagus', 'Stomach', 'Small Intestine']
    },
    {
        category: 'Colon and Rectum',
        names: ['Cecum', 'Appendix', 'Ascending Colon', 'Hepatic Flexure',
            'Transverse Colon', 'Splenic Flexure', 'Descending Colon', 'Sigmoid Colon',
            'Large Intestine, NOS', 'Rectosigmoid Junction', 'Rectum']
    },
    {
        category: 'Digestive System',
        names: ['Anus, Anal Canal and Anorectum']
    },
    {
        category: 'Liver and Intrahepatic Bile Duct',
        names: ['Liver', 'Intrahepatic Bile Duct']
    },
    {
        category: 'Digestive System',
        names: ['Gallbladder', 'Other Biliary', 'Pancreas', 'Retroperitoneum',
            'Peritoneum', 'Omentum and Mesentery', 'Other Digestive Organs']
    },
    {
        category: 'Respiratory System',
        names: ['Nose, Nasal Cavity and Middle Ear',
            'Larynx',
            'Lung and Bronchus',
            'Pleura',
            'Trachea, Mediastinum and Other Respirato']
    },
    {
        category: 'Bones and Joints',
        names: ['Bones and Joints']
    },
    {
        category: 'Soft Tissue',
        names: ['Soft Tissue including Heart']
    },
    {
        category: 'Skin excluding Basal and Squamous',
        names: ['Melanoma of the Skin',
            'Other Non-Epithelial Skin']
    },
    {
        category: 'Breast',
        names: ['Breast']
    },
    {
        category: 'Female Genital System',
        names: ['Cervix Uteri']
    },
    {
        category: 'Corpus and Uterus, NOS',
        names: ['Corpus Uteri',
            'Uterus, NOS']
    },
    {
        category: 'Female Genital System',
        names: ['Ovary',
            'Vagina',
            'Vulva',
            'Other Female Genital Organs']
    },
    {
        category: 'Urinary System',
        names: ['Urinary Bladder',
            'Kidney and Renal Pelvis',
            'Ureter',
            'Other Urinary Organs']
    },
    {
        category: 'Eye and Orbit',
        names: ['Eye and Orbit']
    },
    {
        category: 'Brain and Other Nervous System',
        names: ['Brain',
            'Cranial Nerves Other Nervous System']
    },
    {
        category: 'Endocrine System',
        names: ['Thyroid',
            'Other Endocrine including Thymus']
    },
    {
        category: 'Hodgkin Lymphoma',
        names: ['Hodgkin - Nodal',
            'Hodgkin - Extranodal']
    },
    {
        category: 'Non-Hodgkin Lymphoma',
        names: ['NHL - Nodal',
            'NHL - Extranodal']
    },
    {
        category: 'Myeloma',
        names: ['Myeloma']
    },
    {
        category: 'Lymphocytic Leukemia',
        names: ['Acute Lymphocytic Leukemia',
            'Chronic Lymphocytic Leukemia',
            'Other Lymphocytic Leukemia']
    },
    {
        category: 'Myeloid and Monocytic Leukemia',
        names: ['Acute Myeloid Leukemia',
            'Chronic Myeloid Leukemia',
            'Other Myeloid/Monocytic Leukemia',
            'Acute Monocytic Leukemia']
    },
    {
        category: 'Other Leukemia',
        names: ['Other Acute Leukemia',
            'Aleukemic, subleukemic and NOS']
    },
    {
        category: 'Mesothelioma',
        names: ['Mesothelioma']
    },
    {
        category: 'Kaposi Sarcoma',
        names: ['Kaposi Sarcoma']
    },
    {
        category: 'Miscellaneous',
        names: ['Miscellaneous']
    }
];


const root_style = {
    width: '100%',
}

let all_options = [];
for (var i = 0; i < site_groups_name.length; i++) {
    all_options.push({value: site_groups_name[i]});
}

let getDistinctValues = (data, name) => {

    let values;
    if (data && data.length > 0) {
        values = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i][name]) {
                var found = false;
                for (var j = 0; j < values.length; j++) {
                    if (values[j].text === data[i][name]) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    values.push({
                        text: data[i][name],
                        value: data[i][name],
                    });
                }
            }
        }
    } else {
        values = null;
    }

    return values;
}

class CancerEndpoint extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            autocomplete_open: false,
            value: '',
            searchInput: '',
            options: [],
            columns: this.getColumns([], []),
            data: [],
            data_backup: [],
            loading: false,
            selected_rows: [],
            selected_rows_backup: [],
            control_checkbox_checked: true,

            auto_values: []
        };
        this.tableRef = React.createRef();
    }

    componentDidMount() {
        if (this.props.project && this.props.project.cancer_endpoint) {
            let cancer_endpoints = JSON.parse(this.props.project.cancer_endpoint);
            if (cancer_endpoints && cancer_endpoints.length > 0) {
                let site_group_name = cancer_endpoints[0].SITE_GROUP_NME;
                this.setState({
                    options: all_options,
                    searchInput: site_group_name,
                    loading: true,
                }, () => {
                    let thisState = this;
                    axios.post('/api/cancer_endpoint', {search: this.state.searchInput})
                        .then(function (response) {
                            let selected_rows = thisState.initSelectedRows(response.data);
                            for (var i = 0; i < cancer_endpoints.length; i++) {
                                for (var j = 0; j < response.data.length; j++) {
                                    if (JSON.stringify(cancer_endpoints[i]) === JSON.stringify(response.data[j])) {
                                        selected_rows[j] = true;
                                        break;
                                    }
                                }
                            }
                            thisState.setState({
                                data: response.data,
                                data_backup: response.data,
                                selected_rows: selected_rows,
                                selected_rows_backup: selected_rows,
                                columns: thisState.getColumns(response.data, response.data),
                                loading: false,
                            });
                        })
                        .catch(function (error) {
                            console.log(error);
                        })
                        .then(function () {
                            // always executed
                        });
                });
            }
        }
    }

    uncheckControlCheckbox = () => {
        let inputElement = document.querySelector("#cancer\\ endpoint-content > div > div > div:nth-child(1) > div > div > div > div > div > div > table > thead > tr > th:nth-child(6) > label > span > input");
        if (inputElement) {
            let spanElement = inputElement.parentElement;
            if (spanElement.classList.contains('ant-checkbox-checked')) {
                inputElement.click();
            }
        }
    }

    reset = () => {
        this.uncheckControlCheckbox();
        this.setState({
            autocomplete_open: false,
            value: '',
            searchInput: '',
            options: all_options,
            columns: this.getColumns([]),
            data: [],
            data_backup: [],
            loading: false,
            selected_rows: [],
            selected_rows_backup: [],
            control_checkbox_checked: false,
            auto_values: []
        });
    }

    onSelect = (data) => {
        //console.log('onSelect', data);
        this.setState({
            searchInput: data
        });

        setTimeout(this.doSearch, 300);
    };

    onChange = (data) => {
        this.setState({
            value: data
        });
    };

    onChangeAutoValues = (values) => {
        //console.log("---------- onChangeAutoValues ----------");
        //console.log("old values: " + JSON.stringify(this.state.auto_values));
        //console.log("new values: " + JSON.stringify(values));

        let old_auto_values = this.state.auto_values;
        this.siteGroupNameSelect.blur();

        this.setState({
            auto_values: values,
            old_auto_values
        }, this.doSearchOnAutoValues);
    }

    doSearchOnAutoValues = () => {

        //console.log("---------- doSearchOnAutoValues ----------");
        //console.log("old values: " + JSON.stringify(this.state.old_auto_values));
        //console.log("new values: " + JSON.stringify(this.state.auto_values));

        // memorize selected data
        let selected_data = [];
        for (var i = 0; i < this.state.data_backup.length - 1; i++) {
            if (this.state.selected_rows_backup[i]) {
                selected_data.push(JSON.stringify(this.state.data_backup[i]));
            }
        }
        //console.log("selected data: " + JSON.stringify(selected_data));

        this.uncheckControlCheckbox();

        this.setState({
            loading: true,
            control_checkbox_checked: false
        });

        let search = [];
        for (i = 0; i < this.state.auto_values.length; i++) {
            search.push(this.state.auto_values[i]);
        }
        //console.log("doSearchOnAutoValues: " + JSON.stringify(search));

        let thisState = this;
        axios.post('/api/cancer_endpoints', {search})
            .then(function (response) {
                //console.log(JSON.stringify(response.data));

                let row_selects = [];
                for (var i = 0; i < response.data.length - 1; i++) {
                    if (selected_data.indexOf(JSON.stringify(response.data[i])) !== -1) {
                        row_selects.push(true);
                    } else {
                        row_selects.push(false);
                    }
                }

                thisState.setState({
                    data: response.data,
                    data_backup: response.data,
                    selected_rows: row_selects,  //thisState.initSelectedRows(response.data),
                    selected_rows_backup: row_selects, //thisState.initSelectedRows(response.data),
                    columns: thisState.getColumns(response.data, response.data),
                    loading: false,
                    control_checkbox_checked: false
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    doSearch = () => {
        console.log("doSearch: " + this.state.searchInput);
        this.uncheckControlCheckbox();

        this.setState({
            loading: true,
            control_checkbox_checked: false
        });

        let thisState = this;
        axios.post('/api/cancer_endpoint', {search: this.state.searchInput})
            .then(function (response) {
                thisState.setState({
                    data: response.data,
                    data_backup: response.data,
                    selected_rows: thisState.initSelectedRows(response.data),
                    selected_rows_backup: thisState.initSelectedRows(response.data),
                    columns: thisState.getColumns(response.data, response.data),
                    loading: false,
                    control_checkbox_checked: false
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    onSearch = searchText => {

        //console.log("onSearch: searchText: ==="+searchText+"---");

        let candidates = [];
        if (searchText) {
            for (var i = 0; i < site_groups_name.length; i++) {
                let option = site_groups_name[i].toLowerCase();
                let text = searchText.trim().toLowerCase();
                if (option.startsWith(text)) {
                    candidates.push({value: site_groups_name[i]});
                    //} else if (option.indexOf(' ' + text) != -1) {
                    //    candidates.push({value: site_groups_name[i]});
                }
            }
        }

        this.setState({
            searchInput: searchText,
            options: !searchText ? all_options : candidates,
        });
    };

    onFocus = () => {
        if (this.state.searchInput === '') {
            this.setState({
                options: all_options
            });
        }
    };

    onTableChange = (pagination, filters, sorter, extra) => {
        //console.log("filter: " + JSON.stringify(filters));
        //console.log("sorter: " + JSON.stringify(sorter));

        this.setState({
            loading: true,
        });

        // memorize selected data
        let selected_data = [];
        for (var i = 0; i < this.state.data_backup.length - 1; i++) {
            if (this.state.selected_rows_backup[i]) {
                selected_data.push(JSON.stringify(this.state.data_backup[i]));
            }
        }

        let thisState = this;
        axios.post('/api/cancer_endpoints',
            {
                //search: this.state.searchInput,
                search: this.state.auto_values,
                filters: filters,
                sorter: sorter
            })
            .then(function (response) {

                let row_selects = [];
                for (var i = 0; i < response.data.length - 1; i++) {
                    if (selected_data.indexOf(JSON.stringify(response.data[i])) !== -1) {
                        row_selects.push(true);
                    } else {
                        row_selects.push(false);
                    }
                }

                thisState.setState({
                    data: response.data,
                    //columns: thisState.getColumns(response.data),
                    columns: thisState.getColumns(response.data, thisState.state.data_backup),
                    selected_rows: row_selects,
                    loading: false,
                }, thisState.saveCancerEndpoint);
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

    }

    onGeneralCheckboxChange = (val) => {

        let copy = [...this.state.selected_rows];
        copy.splice(val.target.value, 1, !this.state.selected_rows[val.target.value])
        this.setState({
            selected_rows: copy,
        });

        let result_backup = [];
        for (var j = 0; j < this.state.data_backup.length - 1; j++) {
            if (JSON.stringify(this.state.data[val.target.value]) === JSON.stringify(this.state.data_backup[j])) {
                result_backup.push(!this.state.selected_rows_backup[j]);
            } else {
                result_backup.push(this.state.selected_rows_backup[j]);
            }
        }

        //console.log("selected_rows="+JSON.stringify(result));
        //console.log("selected_rows_backup="+JSON.stringify(result_backup));

        this.setState({
            //selected_rows: result,
            selected_rows_backup: result_backup
        }, this.saveCancerEndpoint);
    }

    onControlCheckboxChange = (val) => {

        this.setState({
            control_checkbox_checked: val.target.checked,
        });

        let result = [];
        for (var i = 0; i < this.state.selected_rows.length; i++) {
            result.push(val.target.checked);
        }

        let result_backup = [];
        for (var j = 0; j < this.state.data_backup.length - 1; j++) {
            var found = false;
            for (i = 0; i < this.state.data.length; i++) {
                if (JSON.stringify(this.state.data[i]) === JSON.stringify(this.state.data_backup[j])) {
                    found = true;
                }
            }
            if (found) {
                result_backup.push(val.target.checked);
            } else {
                result_backup.push(this.state.selected_rows_backup[j]);
            }
        }

        //console.log("selected_rows="+JSON.stringify(result));
        //console.log("selected_rows_backup="+JSON.stringify(result_backup));

        this.setState({
            selected_rows: result,
            selected_rows_backup: result_backup
        }, this.saveCancerEndpoint);
    }

    initSelectedRows = (data) => {
        let result = [];
        for (var i = 0; i < data.length - 1; i++) {
            result.push(false);
        }
        return result;
    }

    saveCancerEndpoint = () => {
        let selected_data = [];
        for (var i = 0; i < this.state.data.length; i++) {
            if (this.state.selected_rows[i]) {
                selected_data.push(this.state.data[i]);
            }
        }
        this.props.save_cancer_endpoint(selected_data);
    }

    setCancerEndpoint = () => {
        let selected_data = [];
        for (var i = 0; i < this.state.data.length; i++) {
            if (this.state.selected_rows[i]) {
                selected_data.push(this.state.data[i]);
            }
        }
        this.props.setup_cancer_endpoint(selected_data);
    }

    getColumns = (data, data_backup) => {

        let thisState = this;
        return [
            {
                title: 'Cancer Site Group',
                dataIndex: 'SITE_GROUP_NME',
                render: (text, row, index) => {
                    if (index === 0 || (index < data.length - 1 && data[index].SITE_GROUP_NME !== data[index - 1].SITE_GROUP_NME)) {
                        var count = 1;
                        for (var i = index + 1; i < data.length; i++) {
                            if (data[i].SITE_GROUP_NME === data[index].SITE_GROUP_NME) {
                                count++;
                            } else {
                                break;
                            }
                        }
                        return {
                            props: {
                                style: {fontWeight: 'normal', verticalAlign: 'top'},
                                rowSpan: count,
                            },
                            children: <div>{text}</div>
                        };
                    } else if (index === data.length - 1) {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                style: {fontWeight: 'bold', verticalAlign: 'top', backgroundColor: '#d8ecf3'},
                                colSpan: 4
                            },
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }

                },
            },
            {
                title: 'SEER Code',
                dataIndex: 'SEER_ID',
                render(text, row, index) {
                    if (index === 0 || (index < data.length - 1 && data[index].SEER_ID !== data[index - 1].SEER_ID)) {
                        var count = 1;
                        for (var i = index + 1; i < data.length; i++) {
                            if (data[i].SEER_ID === data[index].SEER_ID) {
                                count++;
                            } else {
                                break;
                            }
                        }
                        return {
                            props: {
                                style: {fontWeight: 'normal', verticalAlign: 'top'},
                                rowSpan: count,
                            },
                            children: <div>{text}</div>
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }
                }
            },
            {
                title: 'ICD-O-3 Site',
                dataIndex: 'ICD_O3_CDE',
                filters: getDistinctValues(data_backup, 'ICD_O3_CDE'),
                render(text, row, index) {
                    if (index === 0 || (index < data.length - 1 && data[index].ICD_O3_CDE !== data[index - 1].ICD_O3_CDE)) {
                        var count = 1;
                        for (var i = index + 1; i < data.length; i++) {
                            if (data[i].ICD_O3_CDE === data[index].ICD_O3_CDE) {
                                count++;
                            } else {
                                break;
                            }
                        }
                        return {
                            props: {
                                style: {fontWeight: 'normal', verticalAlign: 'top'},
                                rowSpan: count,
                            },
                            children: <div>{text}</div>
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }
                }
            },
            {
                title: 'ICD-O-3 Histology',
                dataIndex: 'HISTOLOGIC_ICDO3_TYP',
                filters: getDistinctValues(data_backup, 'HISTOLOGIC_ICDO3_TYP'),
                render(text, row, index) {
                    if (index < data.length - 1) {
                        return {
                            props: {
                                style: {
                                    fontWeight: 'normal',
                                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f8f8'
                                },
                            },
                            children: <div>{text === '' ? 'Unknown' : text}</div>
                        };
                    } else {
                        return {
                            children: <div>{text}</div>,
                            props: {
                                colSpan: 0
                            },
                        };
                    }
                }
            },
            {
                title: 'Total',
                dataIndex: 'TOTAL',
                sorter: (a, b) => {
                },
                render(text, row, index) {
                    return {
                        props: {
                            style: {
                                fontWeight: index === data.length - 1 ? 'bold' : 'normal',
                                backgroundColor: index === data.length - 1 ?
                                    '#d8ecf3' : (index % 2 === 0 ? 'white' : '#f8f8f8')
                            }
                        },
                        children: <div>{text}</div>
                    };
                }
            },
            {
                title: <Checkbox onChange={thisState.onControlCheckboxChange}></Checkbox>,
                width: 50,
                render(text, row, index) {
                    if (index < data.length - 1) {
                        return {
                            props: {
                                style: {
                                    width: '20px',
                                    fontWeight: 'normal',
                                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f8f8',
                                    textAlign: 'left'
                                }
                            },
                            children: <Checkbox
                                value={index}
                                checked={thisState.state.selected_rows.length > index ? thisState.state.selected_rows[index] : false}
                                onChange={thisState.onGeneralCheckboxChange}
                            ></Checkbox>
                        };
                    } else {
                        return {
                            props: {
                                style: {
                                    backgroundColor: '#d8ecf3'
                                }
                            },
                            children: <div></div>
                        };
                    }
                }
            },
        ];
    }

    render() {
        return (
            <div style={root_style}>

                <div style={{margin: '8px 2px 16px 5px', fontWeight: 'bold'}}>

                    <span style={{display: 'flex'}}>
                        <span style={{flex: '0 0 50'}}>
                            <span className="ant-input-group-addon-aux">
                                Cancer Site Group
                            </span>
                        </span>
                        <span style={{flex: '1'}}>
                             <Select mode="multiple"
                                     allowClear="true"
                                     placeholder="enter or select cancer site groups"
                                     value={this.state.auto_values}
                                     ref={(select) => this.siteGroupNameSelect = select}
                                     onChange={this.onChangeAutoValues}
                                     style={{width: '100%'}}>
                                 {categorized_site_group_names.map((group, i) => (
                                     <OptGroup label={group.category} key={'group' + i}>
                                         {group.names.map((name, j) => (
                                             <Option value={name} key={'group-' + i + '-' + j}>
                                                 {name}
                                             </Option>
                                         ))}
                                     </OptGroup>
                                 ))}
                            </Select>
                        </span>
                    </span>

                    <Table
                        columns={this.state.columns}
                        dataSource={this.state.data}
                        size="small"
                        style={{paddingTop: '10pt'}}
                        bordered
                        pagination={false}
                        onChange={this.onTableChange}
                        loading={this.state.loading}
                        rowKey={() => 'key-' + new Date().getTime()}
                    />

                </div>

                {/*
                <div style={{width: '100%', textAlign: 'center'}}>
                    <Tooltip title="Save and configure the next part">
                        <Button variant="contained"
                                color="primary"
                                onClick={() => this.setCancerEndpoint()}
                                style={{margin: '10pt 0pt 8pt 0pt', textTransform: 'none'}}
                        >
                            NEXT
                        </Button>
                    </Tooltip>
                </div>
                */}

            </div>
        );

    }

}

export default CancerEndpoint;
