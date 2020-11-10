import React, {useContext, useState, useEffect, useRef} from 'react';
import {Table, Input, Button, Popconfirm, Form} from 'antd';
import './EditableTable.css';
import {DeleteTwoTone, PlusOutlined} from '@ant-design/icons';

const EditableContext = React.createContext();

const EditableRow = ({index, ...props}) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

const EditableCell = ({
                          title,
                          editable,
                          children,
                          dataIndex,
                          record,
                          handleSave,
                          ...restProps
                      }) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef();
    const form = useContext(EditableContext);
    useEffect(() => {
        if (editing) {
            inputRef.current.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({
            [dataIndex]: record[dataIndex],
        });
    };

    const save = async (e) => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({...record, ...values});
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <div style={{paddingRight: '8pt'}}>
                <Form.Item
                    style={{margin: 0}}
                    name={dataIndex}
                    rules={[{required: false, message: `${title} is required.`,}]}
                >
                    <Input size="small"
                           placeholder={
                               'e.g. ' + (dataIndex === 'condition' ? 'Atrial fibrillation' :
                                   dataIndex === 'icd9' ? '427.31' :
                                       dataIndex === 'icd10' ?
                                           'I48.91, I48.20, I48.19, I48.91, I48.0' :
                                           'N/A')
                           }
                           ref={inputRef}
                           onPressEnter={save}
                           onBlur={save}/>
                </Form.Item>
            </div>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{
                    paddingRight: 24,
                    marginRight: 8
                }}
                onClick={toggleEdit}
            >
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};

class EditableTable extends React.Component {
    constructor(props) {
        super(props);
        this.columns = [
            {
                title: 'Condition',
                dataIndex: 'condition',
                width: '23%',
                editable: true,
                render: (text, row, index) => {
                    return {
                        props: {
                            style: {verticalAlign: 'top', backgroundColor: index === 0 ? '#d0d0d0' : 'white'},
                        },
                        children: <div>{text}</div>
                    };
                }
            },
            {
                title: 'ICD-9 codes',
                dataIndex: 'icd9',
                width: '23%',
                editable: true,
                render: (text, row, index) => {
                    return {
                        props: {
                            style: {verticalAlign: 'top', backgroundColor: index === 0 ? '#d0d0d0' : 'white'},
                        },
                        children: <div>{text}</div>
                    };
                }
            },
            {
                title: 'ICD-10 codes',
                dataIndex: 'icd10',
                width: '23%',
                editable: true,
                render: (text, row, index) => {
                    return {
                        props: {
                            style: {verticalAlign: 'top', backgroundColor: index === 0 ? '#d0d0d0' : 'white'},
                        },
                        children: <div>{text}</div>
                    };
                }
            },
            {
                title: 'Other criteria',
                dataIndex: 'other',
                editable: true,
                render: (text, row, index) => {
                    return {
                        props: {
                            style: {verticalAlign: 'top', backgroundColor: index === 0 ? '#d0d0d0' : 'white'},
                        },
                        children: <div>{text}</div>
                    };
                }
            },
            {
                title: '',
                dataIndex: 'action',
                width: '30px',
                render: (text, record, index) => {
                    return {
                        props: {
                            style: {backgroundColor: index === 0 ? '#d0d0d0' : 'white'},
                        },
                        children: this.state.dataSource.length >= 1 && record.key !== '0' ? (
                            <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record.key)}>
                                <DeleteTwoTone/>
                            </Popconfirm>
                        ) : null
                    }
                }
            },
        ];

        this.state = {
            dataSource: [
                {
                    key: '0',
                    condition: 'Atrial fibrillation',
                    icd9: '427.31',
                    icd10: 'I48.91, I48.20, I48.19, I48.91, I48.0',
                    other: 'N/A'
                },
                ...this.props.endpoints,
                {
                    key: '1',
                    condition: undefined,
                    icd9: undefined,
                    icd10: undefined,
                    other: undefined
                },
            ],
            count: 2,
        };
    }

    handleDelete = (key) => {
        const dataSource = [...this.state.dataSource];
        this.setState({
            dataSource: dataSource.filter((item) => item.key !== key),
        }, this.setEndpoints);
    };

    handleAdd = () => {
        const {count, dataSource} = this.state;
        const newData = {
            key: count,
            condition: undefined,
            icd9: undefined,
            icd10: undefined,
            other: undefined
        };
        this.setState({
            dataSource: [...dataSource, newData],
            count: count + 1,
        }, this.setEndpoints);
    };

    handleSave = (row) => {
        const newData = [...this.state.dataSource];
        const index = newData.findIndex((item) => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {...item, ...row});
        this.setState({
            dataSource: newData,
        }, this.setEndpoints);
    };

    setEndpoints = () => {
        this.props.set_endpoints(this.state.dataSource);
    }

    setData = (data) => {

        let dataSource = [
            {
                key: '0',
                condition: 'Atrial fibrillation',
                icd9: '427.31',
                icd10: 'I48.91, I48.20, I48.19, I48.91, I48.0',
                other: 'N/A'
            },
            ...data,
        ];

        if (dataSource.length === 1) {
            dataSource.push({
                key: '1',
                condition: undefined,
                icd9: undefined,
                icd10: undefined,
                other: undefined
            });
        }

        this.setState({
            dataSource
        });
    }

    render() {
        const {dataSource} = this.state;
        const components = {
            body: {
                row: EditableRow,
                cell: EditableCell,
            },
        };
        const columns = this.columns.map((col) => {
            if (!col.editable) {
                return col;
            }

            return {
                ...col,
                onCell: (record) => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave,
                }),
            };
        });

        return (
            <div>
                <Table
                    size="small"
                    pagination={false}
                    components={components}
                    rowClassName={() => 'editable-row'}
                    bordered
                    dataSource={dataSource}
                    columns={columns}
                />
                <Button
                    onClick={this.handleAdd}
                    type="primary"
                    style={{margin: 16}}
                    shape="circle"
                >
                    <PlusOutlined/>
                </Button>
            </div>
        );
    }
}

export default EditableTable;
