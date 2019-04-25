import React, { Component, Fragment } from "react";
import ReactDOM from "react-dom";
import CellVisualizer from "./CellVisualizer";
import { PercentageChart } from "./PercentageChart";

import OrganelleDescription from "./OrganelleDescription";
import FileUpload from "./FileUpload";
import { Button, Input } from "antd";
import "antd/dist/antd.css";
import "./style.css";
import { AutoComplete } from "antd";


// Map a group of nodes to the cellular component (organnel) they belong to and their fill color
const GroupMapping = [
  { group: 0, color: "#740b28", component: "extracellular" },
  { group: 1, color: "#978cbf", component: "nucleus" },
  { group: 2, color: "#da950c", component: "endosome" },
  { group: 3, color: "#367baf", component: "plasma_membrane" },
  { group: 4, color: "#ed2cbb", component: "cytoplasm" },
  { group: 5, color: "#23903a", component: "cytoplasm" },
  { group: 6, color: "#4ecbb1", component: "cytoplasm" },
  { group: 7, color: "#aa873c", component: "cytoplasm" },
  { group: 8, color: "#605294", component: "cytoplasm" },
  { group: 9, color: "#c71f25", component: "cytoplasm" },
  { group: 10, color: "#c8ee2a", component: "cytoplasm" }
];

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: undefined,
      selectedNode: undefined,
    };

    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleFileUploaded = this.handleFileUploaded.bind(this);
  }

  componentDidMount() {}

  handleFileUploaded(data) {
    this.setState({ data });
  }
  handleNodeSelected(node) {
    this.setState({ selectedNode: node });
  }

  renderVisualization() {
    const data = GroupMapping.map(m => {
      const d = Object.assign({}, m);
      d.value =
        this.state.data.nodes.filter(n => n.group === d.group).length /
        this.state.data.nodes.length;
      d.label = d.component;
      return d;
    });
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column"
        }}
      >

        <CellVisualizer
          groupMapping={GroupMapping}
          data={this.state.data}
          onNodeSelected={this.handleNodeSelected}
        />


        {this.state.selectedNode && (
          <OrganelleDescription
            selectedNode={this.state.selectedNode}
            onNodeSelected={this.handleNodeSelected}
          />
        )}
        <div style={{ position: "absolute", bottom: 0, width: 600 }}>
          <PercentageChart data={data} />
        </div>
      </div>
    );
  }

  render() {
    return this.state.data ? (
      <Fragment>
        <FileUpload onFileUploaded={this.handleFileUploaded} />

        <AutoComplete
          dataSource={this.state.data.nodes.map(d => d.id)}
          placeholder="input here"
          className="custom"
          style={{ top: 15, left: 600, width: 600, display: "inline-block" }}
          onSelect={selectedId => {
            this.handleNodeSelected(
              this.state.data.nodes.find(n => n.id === selectedId)
            );
          }}
          filterOption={(inputValue, option) =>
            option.props.children
              .toUpperCase()
              .indexOf(inputValue.toUpperCase()) !== -1
          }
        />
        {this.renderVisualization()}
      </Fragment>
    ) : (
      <div>
        <FileUpload onFileUploaded={this.handleFileUploaded} />

        <h1>No data to render</h1>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));