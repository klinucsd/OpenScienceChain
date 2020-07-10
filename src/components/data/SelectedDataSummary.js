import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import axios from "axios";

class SelectedDataSummary extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            total_selected: 0,
            ageChartOptions: {
                chart: {
                    type: 'scatter',
                    zoomType: 'xy',
                    backgroundColor: '#f8f8f8',
                    events: {
                        load() {
                            this.showLoading();
                            setTimeout(this.hideLoading.bind(this), 1000);
                        }
                    }
                },
                credits: false,
                title: {
                    text: 'Year of Diagnosis by Age at Diagnosis'
                },
                subtitle: {
                    text: 'Filtered by your data selection'
                },
                xAxis: {
                    type: 'integer',
                    allowDecimals: false,
                    min: 1995,
                    max: 2017,
                    tickInterval: 1,
                    title: {
                        enabled: true,
                        text: 'Year',
                        margin: 20
                    },
                    labels: {
                        rotation: 270
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    type: 'integer',
                    allowDecimals: false,
                    min: 0,
                    max: 100,
                    title: {
                        enabled: true,
                        text: 'Age at Diagnosis'
                    }
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 3,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '',
                            pointFormat: 'age: {point.y}<br/>year: {point.x}'
                        }
                    }
                },
                series: [{
                    showInLegend: false,
                    color: 'rgba(223, 83, 83, .5)',
                    data: []
                }]
            },
            pieChartOptions: {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie',
                    backgroundColor: '#f8f8f8',
                    events: {
                        load() {
                            this.showLoading();
                            setTimeout(this.hideLoading.bind(this), 2000);
                        }
                    }
                },
                title: {
                    text: 'Tumor Histology and Stage'
                },
                subtitle: {
                    text: 'Filtered by your data selection'
                },
                credits: false,
                tooltip: {
                    enabled: false
                },
                accessibility: {
                    point: {
                        valueSuffix: '%'
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        colors: [
                            '#7cb5ec', '#b366b7', '#e4d354', '#ffcae9',
                            '#af9164', '#98a6d4', '#ff37a6', '#6f1a07',
                            '#dd9118', '#8bbc21', '#335511', '#77a1e5',
                            '#f7a35c', '#8085e9', '#43b929', '#f15c80',
                            '#2b908f', '#f45b5b', '#91e8e1', '#2f7ed8',
                            '#dd03da', '#5cf64a', '#910000', '#1aadce',
                            '#eac435', '#345995', '#03cea4', '#fb4d3d',
                            '#ca1551', '#d9d950', '#f28f43', '#87e752'
                        ],
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: <span style="color: gray">{point.percentage:.1f}%</span>'
                        }
                    }
                },
                series: [{
                    name: 'ICD-O-3 Histology',
                    colorByPoint: true,
                    data: []
                }]
            },
            stageChartOptions: {
                chart: {
                    type: 'column',
                    backgroundColor: '#f8f8f8',
                    events: {
                        load() {
                            this.showLoading();
                            setTimeout(this.hideLoading.bind(this), 2000);
                        }
                    }
                },
                title: {
                    text: ''
                },
                credits: false,
                xAxis: {
                    //categories: ['Apples', 'Oranges'],
                    labels: {
                        enabled: false
                    }
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Number of Cancers'
                    },
                    stackLabels: {
                        enabled: false,
                        style: {
                            fontWeight: 'bold',
                            color: ( // theme
                                Highcharts.defaultOptions.title.style &&
                                Highcharts.defaultOptions.title.style.color
                            ) || 'gray'
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{point.name}</b><br/>',
                    pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                },
                plotOptions: {
                    column: {
                        stacking: 'normal',
                    }
                },
                series: []

                // 0: In situ, 1: Localized, 2: Regional by direct extension, 3: Regional by lymph nodes,
                // 4: Regional by direct extension and lymph nodes, 5: Regional, NOS, 7: Remote,
                // 8: Not abstracted, 9: Unknown or not specified
            }
        };
    }

    componentDidMount() {
        let current_state = this.props.get_current_state();
        this.setState({
            cancer_endpoint: current_state.cancer_endpoint || this.props.project.cancer_endpoint,
            start_of_follow_up: current_state.start_of_follow_up || this.props.project.start_of_follow_up,
            censoring_rules: current_state.censoring_rules || this.props.project.censoring_rules,
        }, this.onChange);
    }

    refresh = (cancer_endpoint, start_of_follow_up, censoring_rules) => {
        this.setState({
            cancer_endpoint,
            start_of_follow_up,
            censoring_rules,
        });

        // removed onChange after refresh
    }

    onChange = () => {
        let thisState = this;

        console.log("-----> refresh charts: first="+this.state.first);

        // setup total
        axios.post('/api/summary/total',
            {
                cancer_endpoint: this.state.cancer_endpoint,
                start_of_follow_up: this.state.start_of_follow_up,
                censoring_rules: this.state.censoring_rules,
            })
            .then(function (response) {
                thisState.setState({
                    total_selected: response.data[0].TOTAL
                });
            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

        // setup diagnosis and age chart
        axios.post('/api/summary/diagnosis_age',
            {
                cancer_endpoint: this.state.cancer_endpoint,
                start_of_follow_up: this.state.start_of_follow_up,
                censoring_rules: this.state.censoring_rules,
            })
            .then(function (response) {

                let minYear = 1995;
                for (var i=0; i<response.data.length; i++) {
                    if (response.data[i][0] < minYear) {
                        minYear = response.data[i][0];
                    }
                }

                thisState.setState({
                    ageChartOptions: {
                        ...thisState.state.ageChartOptions,
                        subtitle: {
                            text: (!thisState.state.cancer_endpoint || (!thisState.state.cancer_endpoint.length || !thisState.state.cancer_endpoint.length === 0)) && !thisState.state.start_of_follow_up ?
                                'No data was selected. Display all data.' : 'Filtered by your data selection'
                        },
                        xAxis: {
                            type: 'integer',
                            allowDecimals: false,
                            min: Math.min(1995, minYear),
                            max: 2017,
                            tickInterval: 1,
                            title: {
                                enabled: true,
                                text: 'Year',
                                margin: 20
                            },
                            labels: {
                                rotation: 270
                            },
                            startOnTick: true,
                            endOnTick: true,
                            showLastLabel: true
                        },
                        series: [{
                            showInLegend: false,
                            color: 'rgba(223, 83, 83, .5)',
                            data: response.data
                        }]
                    }
                })

            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

        // setup pie chart for Tumor Histology
        axios.post('/api/summary/tumor_histology',
            {
                cancer_endpoint: this.state.cancer_endpoint,
                start_of_follow_up: this.state.start_of_follow_up,
                censoring_rules: this.state.censoring_rules,
            })
            .then(function (response) {
                thisState.setState({
                    pieChartOptions: {
                        ...thisState.state.pieChartOptions,
                        subtitle: {
                            text: (!thisState.state.cancer_endpoint || (!thisState.state.cancer_endpoint.length || !thisState.state.cancer_endpoint.length === 0)) && !thisState.state.start_of_follow_up ?
                                'No data was selected. Display all data.' : 'Filtered by your data selection'
                        },
                        series: [{
                            name: 'ICD-O-3 Histology',
                            colorByPoint: true,
                            data: response.data
                        }]
                    }
                })

            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });

        // setup pie chart for stage
        axios.post('/api/summary/stage',
            {
                cancer_endpoint: this.state.cancer_endpoint,
                start_of_follow_up: this.state.start_of_follow_up,
                censoring_rules: this.state.censoring_rules,
            })
            .then(function (response) {
                thisState.setState({
                    stageChartOptions: {
                        ...thisState.state.stageChartOptions,
                        series: response.data
                    }
                })

            })
            .catch(function (error) {
                console.log(error);
            })
            .then(function () {
                // always executed
            });


    }

    render() {
        return (
            <div style={{width: '100%', padding: '10pt 0pt 10pt 20pt'}}>
                <Paper elevation={3} style={{width: '95%', backgroundColor: '#f8f8f8'}}>
                    <div style={{width: '100%', padding: '10pt 15pt 10pt 15pt'}}>
                        <table>
                            <tbody>
                            <tr>
                                <td style={{paddingLeft: '15pt'}}>
                                    <Typography>
                                        Number of Participants With Cancers Selected:
                                    </Typography>
                                </td>
                                <td style={{paddingLeft: '10pt'}}>
                                    <Typography variant={"subtitle1"}>
                                        {this.state.total_selected}
                                    </Typography>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </Paper>

                <Paper elevation={3}
                       style={{
                           width: '95%',
                           minHeight: '10vh',
                           textAlign: 'center',
                           marginTop: '20pt',
                           backgroundColor: '#f8f8f8'
                       }}>
                    <div style={{width: '100%', padding: '10pt 20pt 0pt 10pt'}}>
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={this.state.ageChartOptions}
                        />
                    </div>
                </Paper>

                <Paper elevation={3}
                       style={{
                           width: '95%',
                           minHeight: '10vh',
                           textAlign: 'center',
                           marginTop: '20pt',
                           backgroundColor: '#f8f8f8'
                       }}>
                    <div style={{width: '100%', padding: '10pt 20pt 0pt 10pt'}}>
                        <table style={{width: '100%'}}>
                            <tbody>
                            <tr>
                                <td style={{minWidth: '500px'}}>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        options={this.state.pieChartOptions}
                                    />
                                </td>
                                <td style={{width: '250px', padding: '20pt 0pt 10pt 0pt'}}>
                                    <HighchartsReact
                                        highcharts={Highcharts}
                                        options={this.state.stageChartOptions}
                                    />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </Paper>

                <div style={{height: 100}}></div>
            </div>
        )
    }

}

export default SelectedDataSummary;
