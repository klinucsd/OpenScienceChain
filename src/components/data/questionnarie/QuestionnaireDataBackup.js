import React from 'react';
import Typography from '@material-ui/core/Typography/index';
import {Button, Input, Tabs} from 'antd';
import {Collapse} from 'antd';
import 'antd/dist/antd.css';
import '../index.css';
import './questionnarie.css';
import SectionTable from "./SectionTable";
import TopicTable from "./TopicTable";

const {Panel} = Collapse;
const {Search} = Input;
const {TabPane} = Tabs;

const root_style = {
    width: '100%',
}


class QuestionnaireData extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            mode: 'section',
            topicActiveTabKey: 'Q1',
            searchTerm: null
        };

        this.selected_variables = {
            Q1: {},
            Q2: {},
            Q3: {},
            Q4: {},
            Q4mini: {},
            Q5: {},
            Q5mini: {},
            Q6: {}
        };

        this.sectionQ1Ref = React.createRef();
        this.sectionQ2Ref = React.createRef();
        this.sectionQ3Ref = React.createRef();
        this.sectionQ4Ref = React.createRef();
        this.sectionQ4miniRef = React.createRef();
        this.sectionQ5Ref = React.createRef();
        this.sectionQ5miniRef = React.createRef();
        this.sectionQ6Ref = React.createRef();

        this.topicQ1Ref = React.createRef();
        this.topicQ2Ref = React.createRef();
        this.topicQ3Ref = React.createRef();
        this.topicQ4Ref = React.createRef();
        this.topicQ4miniRef = React.createRef();
        this.topicQ5Ref = React.createRef();
        this.topicQ5miniRef = React.createRef();
        this.topicQ6Ref = React.createRef();
    }

    viewByTopics = () => {
        this.setState({
            mode: 'topic'
        });
    }

    viewBySections = () => {
        this.setState({
            mode: 'section'
        });
    }

    onTopicActiveTabChange = (activeKey) => {
        this.setState({
            topicActiveTabKey: activeKey
        });
    }

    switchToTopic = (questionnarie, topic) => {
        this.setState({
            topicActiveTabKey: questionnarie
        });

        if (questionnarie === 'Q1') {
            this.topicQ1Ref.current.viewTopic(topic);
        } else if (questionnarie === 'Q2') {
            this.topicQ2Ref.current.viewTopic(topic);
        } else if (questionnarie === 'Q3') {
            this.topicQ3Ref.current.viewTopic(topic);
        } else if (questionnarie === 'Q4') {
            this.topicQ4Ref.current.viewTopic(topic);
        } else if (questionnarie === 'Q4mini') {
            this.topicQ4miniRef.current.viewTopic(topic);
        } else if (questionnarie === 'Q5') {
            this.topicQ5Ref.current.viewTopic(topic);
        } else if (questionnarie === 'Q5mini') {
            this.topicQ5miniRef.current.viewTopic(topic);
        } else if (questionnarie === 'Q6') {
            this.topicQ6Ref.current.viewTopic(topic);
        }
    }

    setSelectedVariables = (questionnarie, values) => {
        this.selected_variables[questionnarie] = values;
        //console.log("setSelectedVariables = " + JSON.stringify(this.selected_variables));
    }

    onSearchTermChange = (evt) => {
        this.setState({
            searchTerm: evt.target.value
        });
    }


    render() {
        let thisState = this.state;
        return (
            <div style={root_style}>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    Every dataset automatically includes the most commonly used variables, which are marked in green
                    in the table below and are already included in your selections.
                </Typography>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    Over 1200 variables are available for your analysis. Search, review, and make your selections
                    below. On the left, use the search bar or the menus to filter by Questionnaire (1-6), Section, or
                    Topic.
                </Typography>
                <Typography style={{padding: '10pt 10pt 10pt 10pt', width: '100%'}}>
                    Check the boxes and select “Add” to add variables to your selections. Review your selections in
                    the window on the right, and click Confirm Selections to finish.
                </Typography>

                {
                    this.state.mode === 'section' ?
                        <Tabs defaultActiveKey="1"
                              type={"card"}
                              style={{padding: '10pt 10pt 10pt 10pt'}}
                              tabBarExtraContent={
                                  <table border={0}>
                                      <tbody>
                                      <tr>
                                          <td>
                                              <Button style={{marginRight: '0pt'}}
                                                      onClick={this.viewByTopics}>
                                                  View by Topics
                                              </Button>
                                          </td>
                                          <td>
                                              <Search placeholder="input search text"
                                                      onSearch={value => console.log(value)}
                                                      value={this.state.searchTerm}
                                                      onChange={this.onSearchTermChange}
                                                      style={{width: '100'}}
                                              />
                                          </td>
                                          <td style={{width: '5pt'}}></td>
                                      </tr>
                                      </tbody>
                                  </table>
                              }
                        >
                            <TabPane tab="Q1" key="1" forceRender={true}>
                                <SectionTable type={'Q1'}
                                              selectedVariables={this.selected_variables['Q1']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ1Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q2" key="2" forceRender={true}>
                                <SectionTable type={'Q2'}
                                              selectedVariables={this.selected_variables['Q2']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ2Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q3" key="3" forceRender={true}>
                                <SectionTable type={'Q3'}
                                              selectedVariables={this.selected_variables['Q3']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ3Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q4" key="4" forceRender={true}>
                                <SectionTable type={'Q4'}
                                              selectedVariables={this.selected_variables['Q4']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ4Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q4mini" key="41" forceRender={true}>
                                <SectionTable type={'Q4mini'}
                                              selectedVariables={this.selected_variables['Q4mini']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ4miniRef}
                                />
                            </TabPane>
                            <TabPane tab="Q5" key="5" forceRender={true}>
                                <SectionTable type={'Q5'}
                                              selectedVariables={this.selected_variables['Q5']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ5Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q5mini" key="51" forceRender={true}>
                                <SectionTable type={'Q5mini'}
                                              selectedVariables={this.selected_variables['Q5mini']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ5miniRef}
                                />
                            </TabPane>
                            <TabPane tab="Q6" key="6" forceRender={true}>
                                <SectionTable type={'Q6'}
                                              selectedVariables={this.selected_variables['Q6']}
                                              setSelectedVariables={this.setSelectedVariables}
                                              ref={this.sectionQ6Ref}
                                />
                            </TabPane>
                        </Tabs>
                        :
                        <Tabs defaultActiveKey="Q1"
                              activeKey={this.state.topicActiveTabKey}
                              onChange={this.onTopicActiveTabChange}
                              type={"card"}
                              style={{padding: '10pt 10pt 10pt 10pt'}}
                              tabBarExtraContent={
                                  <table border={0}>
                                      <tbody>
                                      <tr>
                                          <td>
                                              <Button style={{marginRight: '0pt'}}
                                                      onClick={this.viewBySections}>
                                                  View by Sections
                                              </Button>
                                          </td>
                                          <td>
                                              <Search placeholder="input search text"
                                                      onSearch={value => console.log(value)}
                                                      style={{width: '100'}}
                                              />
                                          </td>
                                          <td style={{width: '5pt'}}></td>
                                      </tr>
                                      </tbody>
                                  </table>



                              }
                        >
                            <TabPane tab="Q1" key="Q1" forceRender={true}>
                                <TopicTable type={'Q1'}
                                            selectedVariables={this.selected_variables['Q1']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ1Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q2" key="Q2" forceRender={true}>
                                <TopicTable type={'Q2'}
                                            selectedVariables={this.selected_variables['Q2']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ2Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q3" key="Q3" forceRender={true}>
                                <TopicTable type={'Q3'}
                                            selectedVariables={this.selected_variables['Q3']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ3Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q4" key="Q4" forceRender={true}>
                                <TopicTable type={'Q4'}
                                            selectedVariables={this.selected_variables['Q4']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ4Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q4mini" key="Q4mini" forceRender={true}>
                                <TopicTable type={'Q4mini'}
                                            selectedVariables={this.selected_variables['Q4mini']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ4miniRef}
                                />
                            </TabPane>
                            <TabPane tab="Q5" key="Q5" forceRender={true}>
                                <TopicTable type={'Q5'}
                                            selectedVariables={this.selected_variables['Q5']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ5Ref}
                                />
                            </TabPane>
                            <TabPane tab="Q5mini" key="Q5mini" forceRender={true}>
                                <TopicTable type={'Q5mini'}
                                            selectedVariables={this.selected_variables['Q5mini']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ5miniRef}
                                />
                            </TabPane>
                            <TabPane tab="Q6" key="Q6" forceRender={true}>
                                <TopicTable type={'Q6'}
                                            selectedVariables={this.selected_variables['Q6']}
                                            setSelectedVariables={this.setSelectedVariables}
                                            switchTo={this.switchToTopic}
                                            ref={this.topicQ6Ref}
                                />
                            </TabPane>
                        </Tabs>
                }


                {/*
                <table border={0}
                       style={{backgroundColor: '#eee', width: '100%', margin: '10pt 0pt 10pt 0pt', height: '100vh'}}>
                    <tbody>
                    <tr>
                        <td style={{width: '150pt', verticalAlign: 'top', padding: '10pt 5pt 10pt 5pt'}}>

                            <Search placeholder="input search text"
                                    onSearch={value => console.log(value)}
                                    style={{width: '100', marginBottom: '10pt'}}
                            />

                            <Collapse defaultActiveKey={['1']}
                                      expandIconPosition={'right'}
                                      expandIcon={this.expandIcon}
                                      className="site-collapse-custom-collapse">
                                <Panel header="Questionnaire" key="1">
                                    <QuestionnariePane questionnarie_changed={this.onQuestionnarieChanged}
                                                       ref={this.questionnarieRef}
                                    />
                                </Panel>
                            </Collapse>

                            <div style={{height: '5pt'}}></div>
                            <Collapse defaultActiveKey={['2']}
                                      expandIconPosition={'right'}
                                      expandIcon={this.expandIcon}
                                      className="site-collapse-custom-collapse">
                                <Panel header="Section" key="2">
                                    <SectionPane sections_changed={this.onSectionsChanged}
                                                 ref={this.sectionRef}
                                    />
                                </Panel>
                            </Collapse>

                            <div style={{height: '5pt'}}></div>
                            <Collapse defaultActiveKey={['3']}
                                      expandIconPosition={'right'}
                                      expandIcon={this.expandIcon}
                                      className="site-collapse-custom-collapse">
                                <Panel header="#Topic" key="3">
                                    <TopicPane ref={this.topicRef}/>
                                </Panel>
                            </Collapse>

                        </td>
                        <td style={{
                            minWidth: '200pt',
                            verticalAlign: 'top',
                            padding: '10pt 5pt 10pt 0pt',
                            height: '100%',
                        }}>

                            <div style={{backgroundColor: 'white', height: '100%'}}>
                                <Table
                                    columns={this.state.columns}
                                    dataSource={this.state.data}
                                    size="small"
                                    bordered
                                    pagination={false}
                                    loading={this.state.loading}
                                    style={{fontSize: 12}}
                                    rowKey={() => 'key-' + new Date().getTime()}
                                />
                            </div>

                        </td>
                        <td style={{
                            width: '130pt',
                            height: '100%',
                            verticalAlign: 'top',
                            padding: '10pt 5pt 10pt 0pt'
                        }}>
                            <Collapse defaultActiveKey={['3']}
                                      expandIconPosition={'right'}
                                      expandIcon={({isActive}) => null}
                                      style={{height: '100%'}}
                                      className="site-collapse-custom-collapse">
                                <Panel header="Your selections"
                                       key="3"
                                       style={{height: '100%'}}>
                                    Test
                                </Panel>
                            </Collapse>
                        </td>
                    </tr>
                    </tbody>
                </table>
                */}

            </div>
        );
    }

}

export default QuestionnaireData;
