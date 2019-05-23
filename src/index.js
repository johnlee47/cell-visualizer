import React, { Component, Fragment } from "react";
import ReactDOM from "react-dom";
import CellVisualizer from "./CellVisualizer";
import { PercentageChart } from "./PercentageChart";
import FileUpload from "./FileUpload";
import OrganelleDescription from "./OrganelleDescription";
import {
  Button,
  Input,
  Icon,
  Typography,
  Upload,
  AutoComplete,
  Statistic,
  Card,
  Spin,
  Popover
} from "antd";
import saveSvgAsPng from "save-svg-as-png";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { ColorPalletes } from "./utils";
import "antd/dist/antd.css";
import "./style.css";

pdfMake.vfs = pdfFonts.pdfMake.vfs;
// Map a group of nodes to the cellular component (organnel) they belong to and their fill color
const GroupMapping = [
  { component: "glyoxysome", membrane: "glyoxysome_membrane" },
  { component: "centrosome", membrane: "centrosome_membrane" }
];

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: undefined,
      selectedNode: undefined,
      selectedFile: null,
      selectedFileList: [],
      loading: false
    };

    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleFileUploaded = this.handleFileUploaded.bind(this);
    this.handleUploadedFileList = this.handleUploadedFileList.bind(this);
    this.handleDownloadPdf = this.handleDownloadPdf.bind(this);
  }

  handleUploadedFileList(file) {
    this.setState({
      selectedFile: file,
      selectedFileList: [file]
    });
  }
  handleFileUploaded(data) {
    this.setState({ data });
  }

  handleNodeSelected(node) {
    this.setState({ selectedNode: node });
  }

  handleDownloadPdf() {
    // Sets fonts. Not working yet?
    var fonts = {
      Roboto: {
        normal: "fonts/Roboto-Regular.ttf",
        bold: "fonts/Roboto-Medium.ttf",
        italics: "fonts/Roboto-Italic.ttf",
        bolditalics: "fonts/Roboto-MediumItalic.ttf"
      }
    };
    let prevNodeLocation = "";
    // Copy the node's data and add it's connections
    let sortedData = [...this.state.data.nodes];
    sortedData.map(node => {
      let connectedTo = [];
      this.state.data.links.map(link => {
        if (link.source.id == node.id) {
          if (!connectedTo.includes(link.target.id)) {
            connectedTo.push(link.target.id);
          }
        }
        if (link.target.id == node.id) {
          if (!connectedTo.includes(link.source.id)) {
            connectedTo.push(link.source.id);
          }
        }
      });
      node.connectedTo = connectedTo;
    });
    // Sort the node's data first by Group and then by connected nodes
    sortedData.sort((a, b) => {
      return (
        a.location.localeCompare(b.location) ||
        b.connectedTo.length - a.connectedTo.length
      );
    });
    // Get the svg and return it's URI
    saveSvgAsPng
      .svgAsPngUri(document.getElementById("svg"), { scale: 0.55 })
      .then(uri => {
        // Used to set the PDF's content
        var docDefinition = {
          content: [
            {
              image: uri
            },
            // Create content for each node
            sortedData.map(node => {
              let nodeInfo = [
                {
                  // Show title for a new organelle
                  text:
                    prevNodeLocation != node.location
                      ? node.location
                      : undefined,
                  bold: true,
                  margin:
                    prevNodeLocation != node.location
                      ? [5, 12, 10, 20]
                      : [0, 0, 0, 0],
                  pageBreak:
                    prevNodeLocation != node.location ? "before" : undefined
                },
                {
                  style: "tableExample",
                  table: {
                    body: [
                      ["Name", node.id],
                      ["Description", "" + node.description],
                      [
                        `Connected to (${node.connectedTo.length})`,
                        node.connectedTo.join(", ")
                      ]
                    ]
                  },
                  margin: [5, 2, 10, 20]
                }
              ];
              if (prevNodeLocation != node.location) {
                prevNodeLocation = node.location;
              }
              return nodeInfo;
            })
          ]
        };
        // Download the PDF file
        pdfMake.createPdf(docDefinition).download();
      });
  }

  renderVisualization() {
    const { nodes } = this.state.data;
    // Extract unique locations from graph data
    const uniqueLocations = new Set(nodes.map(n => n.location));
    // Calculate the relative percentages of nodes found in each location. This is passed to chart component.
    const chartData = Array.from(uniqueLocations).map(l => {
      return {
        value: nodes.filter(n => n.location === l).length / nodes.length,
        label: l
      };
    });
    return (
      <div className="visualization-wrapper">
        <CellVisualizer
          selectedNode={this.state.selectedNode}
          groupMapping={GroupMapping}
          data={this.state.data}
          onNodeSelected={this.handleNodeSelected}
          colorPalletes={ColorPalletes}
          updateLoadingStatus={loading => this.setState({ loading })}
        />
        {this.state.selectedNode && (
          <OrganelleDescription
            selectedNode={this.state.selectedNode}
            onNodeSelected={this.handleNodeSelected}
          />
        )}
        <div className="percentage-chart-wrapper">
          <PercentageChart
            width={600}
            height={30}
            data={chartData}
            colorPalletes={ColorPalletes}
          />
        </div>
      </div>
    );
  }

  renderLandingPage() {
    return (
      <div className="landing-page-wrapper">
        <Typography.Title level={1}>Cell Visualizer</Typography.Title>
        <FileUpload
          title="Click or drag graph file to this area"
          hint="Upload a graph JSON file to view it in the cell visualizer."
          fileList={this.state.selectedFileList}
          onFileUploaded={this.handleFileUploaded}
          handleFileList={this.handleUploadedFileList}
        />
      </div>
    );
  }

  renderFloatingActionButtons() {
    return (
      <div className="floating-action-buttons-wrapper">
        <Button
          id="download_pdf"
          icon="file-pdf"
          size={"large"}
          type="primary"
          shape="round"
          className="floating-action-button"
          onClick={this.handleDownloadPdf}
        />

        <Button
          id="download"
          icon="camera"
          size={"large"}
          shape="round"
          type="primary"
          className="floating-action-button"
        />
      </div>
    );
  }

  renderTopBar() {
    return (
      <Fragment>
        <div className="top-bar-wrapper">
          <div className="menu">
            <FileUpload
              title={this.state.selectedFile.name}
              fileList={this.state.selectedFileList}
              onFileUploaded={this.handleFileUploaded}
              handleFileList={this.handleUploadedFileList}
            />
            <Button.Group size="large">
              <Button type="primary" icon="filter" />
              <Popover content={<p>Controls</p>} title="Title" trigger="click">
                <Button type="primary" icon="control" />
              </Popover>
            </Button.Group>
            <AutoComplete
              dataSource={this.state.data.nodes.map(d => d.id)}
              placeholder="Search ..."
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
            >
              <Input suffix={<Icon type="search" className="search-icon" />} />
            </AutoComplete>
            <Button type="primary" icon="left" className="fold-toggle" />
          </div>
        </div>
      </Fragment>
    );
  }

  renderLoader() {
    return (
      <div className="loader-wrapper">
        <div className="content">
          <Spin
            size="large"
            indicator={
              <Icon
                type="loading"
                style={{ fontSize: 24, marginRight: 15 }}
                spin
              />
            }
          />
          <Typography.Text strong>Running visualization ...</Typography.Text>
        </div>
      </div>
    );
  }

  render() {
    return (
      <Fragment>
        {this.state.data ? (
          <Fragment>
            {this.renderFloatingActionButtons()}
            {this.renderTopBar()}
            {this.renderVisualization()}
          </Fragment>
        ) : (
          this.renderLandingPage()
        )}
        {this.state.loading && this.renderLoader()}
      </Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
