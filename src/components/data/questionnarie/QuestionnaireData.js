import React from 'react';
import Typography from '@material-ui/core/Typography/index';
import {Button, Input, Tabs, Card, Divider} from 'antd';
import {Collapse} from 'antd';
import 'antd/dist/antd.css';
import '../index.css';
import './questionnarie.css';
import SectionTable from "./SectionTable";
import all_topic_to_variable from '../../../model/topic_variables';
import TopicVariableTable from "./topic/TopicVariableTable";
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
            searchTerm: null,
            selected_variables: this.props.project.questionnarie ?
                JSON.parse(this.props.project.questionnarie)
                :
                {
                    Q1: {},
                    Q2: {},
                    Q3: {},
                    Q4: {},
                    Q4mini: {},
                    Q5: {},
                    Q5mini: {},
                    Q6: {}
                }
        };

        this.sectionQ1Ref = React.createRef();
        this.sectionQ2Ref = React.createRef();
        this.sectionQ3Ref = React.createRef();
        this.sectionQ4Ref = React.createRef();
        this.sectionQ4miniRef = React.createRef();
        this.sectionQ5Ref = React.createRef();
        this.sectionQ5miniRef = React.createRef();
        this.sectionQ6Ref = React.createRef();

        this.topicRef = React.createRef();
        this.allTopicRef = React.createRef();
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
        this.state.selected_variables[questionnarie] = values;
        //console.log("setSelectedVariables = " + JSON.stringify(this.state.selected_variables));
        this.props.save_questionnarie(this.state.selected_variables);
    }

    setSelectedVariablesWithQuestionnarie = (map) => {

        //console.log("before ==== " + JSON.stringify(this.state.selected_variables));
        //console.log("after ==== " + JSON.stringify(map));

        for (let [questionnarie, selected] of Object.entries(map)) {
            this.state.selected_variables[questionnarie] = selected;
        }
        this.props.save_questionnarie(this.state.selected_variables);
        //console.log("final ==== " + JSON.stringify(this.state.selected_variables));
    }

    onSearchTermChange = (evt) => {
        this.setState({
            searchTerm: evt.target.value
        });
    }

    setSearchTerm = (searchTerm) => {
        this.setState({
            searchTerm
        });
    }

    getSelectedVariables = () => {
        return this.state.selected_variables;
    }

    reset = () => {
        if (this.topicRef.current) {
            this.topicRef.current.reset();
        }
        if (this.allTopicRef.current) {
            this.allTopicRef.current.reset();
        }
        if (this.sectionQ1Ref.current) {
            this.sectionQ1Ref.current.reset();
        }
        if (this.sectionQ2Ref.current) {
            this.sectionQ2Ref.current.reset();
        }
        if (this.sectionQ3Ref.current) {
            this.sectionQ3Ref.current.reset();
        }
        if (this.sectionQ4Ref.current) {
            this.sectionQ4Ref.current.reset();
        }
        if (this.sectionQ4miniRef.current) {
            this.sectionQ4miniRef.current.reset();
        }
        if (this.sectionQ5Ref.current) {
            this.sectionQ5Ref.current.reset();
        }
        if (this.sectionQ5miniRef.current) {
            this.sectionQ5miniRef.current.reset();
        }
        if (this.sectionQ6Ref.current) {
            this.sectionQ6Ref.current.reset();
        }
    }

    onSearch = (searchTerm) => {
        console.log("search term = " + searchTerm);
        if (this.topicRef.current) {
            this.topicRef.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ1Ref.current) {
            this.sectionQ1Ref.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ2Ref.current) {
            this.sectionQ2Ref.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ3Ref.current) {
            this.sectionQ3Ref.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ4Ref.current) {
            this.sectionQ4Ref.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ4miniRef.current) {
            this.sectionQ4miniRef.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ5Ref.current) {
            this.sectionQ5Ref.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ5miniRef.current) {
            this.sectionQ5miniRef.current.onSearchTermChanged(searchTerm);
        }
        if (this.sectionQ6Ref.current) {
            this.sectionQ6Ref.current.onSearchTermChanged(searchTerm);
        }
    }

    countSelectedVariables = () => {
        let result = 0;
        if (this.state.selected_variables) {
            Object.keys(this.state.selected_variables).forEach(questionnarie => {
                if (this.state.selected_variables[questionnarie]) {
                    result += Object.keys(this.state.selected_variables[questionnarie]).length;
                }
            });

        }
        return result;
    }

    getSelectedTopicVariables = (topic) => {
        let result = [];
        let all_variables = all_topic_to_variable[topic];
        for (var i = 0; i < all_variables.length; i++) {
            let variable = all_variables[i].variable;
            let questionnarie = all_variables[i].questionnarie;
            if (this.state.selected_variables[questionnarie][variable]) {
                result.push(variable);
            }
        }

        return result;
    }

    setSelectedTopicsAndQuestionnarie = (questionnarie, topics) => {
        this.questionnarie = questionnarie;
        this.topics = topics;
    }

    render() {
        let thisState = this.state;
        return (
            <div style={root_style}>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    Over 1200 variables are available for your analysis.
                    To make your selections, check the boxes and
                    review them in the window on the right.
                </Typography>
                <Typography style={{padding: '10pt 10pt 0pt 10pt', width: '100%'}}>
                    The <b>Sections</b> view below is organized by the section titles on the
                    physical questionnaires (1-6).
                    If you prefer to review across all questionnaires by topic area, click <b>View By Topics</b>.
                    You can also use the search bar to search by key terms.
                </Typography>
                <Typography style={{padding: '10pt 10pt 10pt 10pt', width: '100%'}}>
                    Every analysis automatically includes the most commonly used CTS variables,
                    which are marked in green in the table below and are already
                    included in your dataset.
                </Typography>

                <table border={0} style={{width: '100%'}}>
                    <tbody>
                    <tr style={{verticalAlign: 'top'}}>
                        <td>
                            {
                                this.state.mode === 'section' ?
                                    <Tabs defaultActiveKey="1"
                                          type={"card"}
                                          style={{padding: '10pt 3pt 10pt 10pt'}}
                                          tabBarExtraContent={
                                              <table border={0}>
                                                  <tbody>
                                                  <tr>
                                                      <td>
                                                          <Button style={{marginRight: '2pt'}}
                                                                  onClick={this.viewByTopics}>
                                                              View by Topics
                                                          </Button>
                                                      </td>
                                                      <td>
                                                          <Search placeholder="input search text"
                                                                  allowClear
                                                                  onSearch={this.onSearch}
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
                                                          selectedVariables={this.state.selected_variables['Q1']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ1Ref}
                                            />
                                        </TabPane>
                                        <TabPane tab="Q2" key="2" forceRender={true}>
                                            <SectionTable type={'Q2'}
                                                          selectedVariables={this.state.selected_variables['Q2']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ2Ref}
                                            />
                                        </TabPane>
                                        <TabPane tab="Q3" key="3" forceRender={true}>
                                            <SectionTable type={'Q3'}
                                                          selectedVariables={this.state.selected_variables['Q3']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ3Ref}
                                            />
                                        </TabPane>
                                        <TabPane tab="Q4" key="4" forceRender={true}>
                                            <SectionTable type={'Q4'}
                                                          selectedVariables={this.state.selected_variables['Q4']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ4Ref}
                                            />
                                        </TabPane>
                                        <TabPane tab="Q4mini" key="41" forceRender={true}>
                                            <SectionTable type={'Q4mini'}
                                                          selectedVariables={this.state.selected_variables['Q4mini']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ4miniRef}
                                            />
                                        </TabPane>
                                        <TabPane tab="Q5" key="5" forceRender={true}>
                                            <SectionTable type={'Q5'}
                                                          selectedVariables={this.state.selected_variables['Q5']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ5Ref}
                                            />
                                        </TabPane>
                                        <TabPane tab="Q5mini" key="51" forceRender={true}>
                                            <SectionTable type={'Q5mini'}
                                                          selectedVariables={this.state.selected_variables['Q5mini']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ5miniRef}
                                            />
                                        </TabPane>
                                        <TabPane tab="Q6" key="6" forceRender={true}>
                                            <SectionTable type={'Q6'}
                                                          selectedVariables={this.state.selected_variables['Q6']}
                                                          setSelectedVariables={this.setSelectedVariables}
                                                          searchTerm={this.state.searchTerm}
                                                          ref={this.sectionQ6Ref}
                                            />
                                        </TabPane>
                                    </Tabs>
                                    :
                                    <div>
                                        {/*
                                        <Tabs defaultActiveKey="Q1"
                                              activeKey={this.state.topicActiveTabKey}
                                              onChange={this.onTopicActiveTabChange}
                                              type={"card"}
                                              style={{padding: '10pt 3pt 10pt 10pt', display: 'none'}}
                                              tabBarExtraContent={
                                                  <table border={0}>
                                                      <tbody>
                                                      <tr>
                                                          <td>
                                                              <Button style={{marginRight: '2pt'}}
                                                                      onClick={this.viewBySections}>
                                                                  View by Sections
                                                              </Button>
                                                          </td>
                                                          <td>
                                                              <Search placeholder="input search text"
                                                                      allowClear
                                                                      onSearch={this.onSearch}
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
                                            <TabPane tab="Topics" key="Q1" forceRender={true}>
                                                <AllTopicTable type={'Q1'}
                                                               getSelectedVariables={this.getSelectedVariables}
                                                               setSelectedVariablesWithQuestionnarie={this.setSelectedVariablesWithQuestionnarie}
                                                               searchTerm={this.state.searchTerm}
                                                               ref={this.topicRef}
                                                />
                                            </TabPane>
                                        </Tabs>
                                        */}

                                        <TopicVariableTable questionnarie={this.questionnarie}
                                                            topics={this.topics}
                                                            viewBySections={this.viewBySections}
                                                            getSelectedVariables={this.getSelectedVariables}
                                                            setSelectedVariablesWithQuestionnarie={this.setSelectedVariablesWithQuestionnarie}
                                                            searchTerm={this.state.searchTerm}
                                                            setSearchTerm={this.setSearchTerm}
                                                            setSelectedTopicsAndQuestionnarie={this.setSelectedTopicsAndQuestionnarie}
                                                            ref={this.allTopicRef}
                                        />

                                    </div>


                            }

                        </td>
                        <td style={{width: '150px', height: 'max(200px, 100%)', position: 'relative'}}>

                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 12,
                                width: '100%',
                                borderColor: '#e1e1e1',
                                backgroundColor: '#dadada',
                                padding: '8pt 0pt 10pt 10pt',
                                fontWeight: 'normal'
                            }}>
                                My Selections
                            </div>
                            <Card size="small"
                                  title=""
                                  headStyle={{backgroundColor: '#e1e1e1'}}
                                  style={{
                                      width: '150px',
                                      overflow: 'scroll',
                                      margin: '10pt 0pt 10pt 0pt',
                                      height: '90%',
                                      position: 'absolute',
                                      left: 0,
                                      top: 40,
                                      borderColor: '#e1e1e1',
                                      backgroundColor: '#fafafa'
                                  }}>

                                {
                                    this.state.mode === 'section' ?
                                        Object.keys(this.state.selected_variables).map((questionnarie, i) => (
                                            Object.keys(this.state.selected_variables[questionnarie]).length > 0 ?
                                                <div key={'my-selections-' + i}>
                                                    <span style={{
                                                        fontWeight: 'bold',
                                                        fontSize: 12
                                                    }}>{questionnarie}</span>
                                                    {
                                                        Object.keys(this.state.selected_variables[questionnarie]).sort().map((variable, j) => (
                                                            <div key={'variable-' + i + '-' + j}
                                                                 style={{paddingLeft: '8pt', fontSize: 12}}>
                                                                {variable}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                                :
                                                null
                                        ))
                                        :
                                        Object.keys(all_topic_to_variable).map((topic, i) => (
                                            this.getSelectedTopicVariables(topic).length > 0 ?
                                                <div key={'my-selections-' + i}>
                                                    <div style={{
                                                        fontWeight: 'bold',
                                                        fontSize: 12,
                                                        //whiteSpace: 'nowrap',
                                                        paddingTop: (i>0? '3pt': '0pt'),
                                                        paddingBottom: '5pt',
                                                        lineHeight: 'normal'
                                                    }}>
                                                        {topic}
                                                    </div>
                                                    {
                                                        this.getSelectedTopicVariables(topic).map((variable, j) => (
                                                            <div key={'variable-' + i + '-' + j}
                                                                 style={{paddingLeft: '8pt', fontSize: 12}}>
                                                                {variable}
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                                : null
                                        ))
                                }

                                {
                                    this.countSelectedVariables() === 0 ?
                                        <div>
                                            No selected variables.
                                        </div>
                                        :
                                        null
                                }

                            </Card>
                        </td>
                    </tr>
                    </tbody>
                </table>


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
