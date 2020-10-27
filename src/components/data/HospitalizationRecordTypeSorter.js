import React, {Component} from 'react';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import Paper from "@material-ui/core/Paper/Paper";
import 'antd/dist/antd.css';
import './index.css';
import './hospitalization_record_type_sorter.css'

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    //padding: grid * 2,
    padding: 10,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'Cornsilk' : 'white',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: 250,
    height: 160
});

class HospitalizationRecordTypeSorter extends Component {

    constructor(props) {
        super(props);
        this.state = {
            items:
                [{
                    id: "item-0",
                    content: "Patient Discharge"
                }, {
                    id: "item-1",
                    content: "Ambulatory Surgery"
                }, {
                    id: "item-2",
                    content: "Emergency Department"
                }],
            selected: []
        };
    }

    removeItem(index) {
        let items = [...this.state.items];
        for (var i=0; i<items.length; i++) {
            if (items[i].id === index) {
                items.splice(i, 1);
                this.setState({items}, this.setOrder);
                break;
            }
        }

        let selected = [...this.state.selected];
        for (i=0; i<selected.length; i++) {
            if (selected[i].id === index) {
                selected.splice(i, 1);
                this.setState({selected}, this.setOrder);
                break;
            }
        }

    }

    addItem(index) {
        let items = [...this.state.items];
        let found = false;
        for (var i=0; i<items.length; i++) {
            if (items[i].id === index) {
                found = true;
                break;
            }
        }

        if (!found) {
            let item;
            if (index === 'item-0') {
                item = {
                    id: "item-0",
                    content: "Patient Discharge"
                }
            } else if (index === 'item-1') {
                item = {
                    id: "item-1",
                    content: "Ambulatory Surgery"
                }
            } else if (index === 'item-2') {
                item = {
                    id: "item-2",
                    content: "Emergency Department"
                }
            }

            let inserted = false;
            for (i=0; i<items.length; i++) {
                if (items[i].id > index) {
                    items.splice(i, 0, item);
                    this.setState({items}, this.setOrder);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                items.push(item);
                this.setState({items}, this.setOrder);
            }

        }

    }

    componentDidMount() {
        //console.log(`hospitalization_record_order: ${JSON.stringify(this.props.hospitalization_record_order)}`);

        let items = [];
        let selected = [];

        if (this.props.hospitalization_record_order &&
            this.props.hospitalization_record_order.includes('patient_discharge')) {
            selected.push({
                id: "item-0",
                content: "Patient Discharge"
            });
        } else if (this.props.hospitalization_record_list[0]) {
            items.push({
                id: "item-0",
                content: "Patient Discharge"
            });
        }

        if (this.props.hospitalization_record_order &&
            this.props.hospitalization_record_order.includes('ambulatory_surgery')) {
            selected.push({
                id: "item-1",
                content: "Ambulatory Surgery"
            });
        } else if (this.props.hospitalization_record_list[1]) {
            items.push({
                id: "item-1",
                content: "Ambulatory Surgery"
            });
        }

        if (this.props.hospitalization_record_order &&
            this.props.hospitalization_record_order.includes('emergency_department')) {
            selected.push({
                id: "item-2",
                content: "Emergency Department"
            });
        } else if (this.props.hospitalization_record_list[2]){
            items.push({
                id: "item-2",
                content: "Emergency Department"
            });
        }

        this.setState({
           items, selected
        });

    }

    /**
     * A semi-generic way to handle multiple lists. Matches
     * the IDs of the droppable container to the names of the
     * source arrays stored in the state.
     */
    id2List = {
        droppable: 'items',
        droppable2: 'selected'
    };

    getList = id => this.state[this.id2List[id]];

    setOrder = () => {
        //console.log(`items: ${JSON.stringify(this.state.items, null, 2)}`);
        //console.log(`selected: ${JSON.stringify(this.state.selected, null, 2)}`);
        this.props.set_hospitalization_record_order(this.state.selected);
    }

    onDragEnd = result => {
        const {source, destination} = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const items = reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index
            );

            let state = {items};

            if (source.droppableId === 'droppable2') {
                state = {selected: items};
            }

            this.setState(state, this.setOrder);
        } else {
            const result = move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );

            this.setState({
                items: result.droppable,
                selected: result.droppable2
            }, this.setOrder);
        }
    };

    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    render() {

        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <table>
                    <tbody>
                    <tr>
                        <td style={{paddingRight: '18pt'}}>
                            <Paper elevation={8}
                                   style={{
                                       padding: '3pt',
                                       backgroundColor: 'lightgray'
                                   }}>
                                <Droppable droppableId="droppable">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            style={getListStyle(snapshot.isDraggingOver)}>
                                            {this.state.items.map((item, index) => (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={getItemStyle(
                                                                snapshot.isDragging,
                                                                provided.draggableProps.style
                                                            )}>
                                                            {item.content}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </Paper>
                        </td>
                        <td>
                            <Paper elevation={8}
                                   style={{
                                       padding: '3pt',
                                       backgroundColor: 'lightgray'
                                   }}>
                                <Droppable droppableId="droppable2">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            style={getListStyle(snapshot.isDraggingOver)}>
                                            {this.state.selected.map((item, index) => (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={getItemStyle(
                                                                snapshot.isDragging,
                                                                provided.draggableProps.style
                                                            )}>
                                                            {item.content}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </Paper>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </DragDropContext>
        );
    }
}

export default HospitalizationRecordTypeSorter;
