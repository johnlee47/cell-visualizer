import React, { Component, Fragment } from "react";
import { fetchGraphData } from "./utils";
import ReactDOM from "react-dom";
import CellVisualizer from "./CellVisualizer";
import { PercentageChart } from "./PercentageChart";
import FileUpload from "./FileUpload";
import OrganelleDescription from "./OrganelleDescription";
import { Button, Input, Icon, Typography, Upload } from "antd";
import "antd/dist/antd.css";
import "./style.css";
import { AutoComplete } from "antd";
import * as bg from "./home.svg";
import saveSvgAsPng from "save-svg-as-png";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Map a group of nodes to the cellular component (organnel) they belong to and their fill color
const GroupMapping = [
  { component: "glyoxysome", membrane: "glyoxysome_membrane" },
  { component: "centrosome", membrane: "centrosome_membrane" },
];

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: undefined,
      selectedNode: undefined,
      selectedFile: null,
      selectedFileList: [],
      size: "large"
    };

    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleFileUploaded = this.handleFileUploaded.bind(this);
    this.handleUploadedFileList = this.handleUploadedFileList.bind(this);
    this.handleDownloadPdf = this.handleDownloadPdf.bind(this);
  }

  componentDidMount() { }

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
      return a.location.localeCompare(b.location) || b.connectedTo.length - a.connectedTo.length;

    });

    console.log(sortedData)
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
                    prevNodeLocation != node.location ? [5, 12, 10, 20] : [0, 0, 0, 0],
                  pageBreak: prevNodeLocation != node.location
                  ? 'before'
                  : undefined
                },
                {
                  style: "tableExample",
                  table: {
                    body: [
                      ["Name", node.id],
                      ["Description", "" + node.description],
                      [`Connected to (${node.connectedTo.length})`, node.connectedTo.join(", ")]
                    ]
                  },
                  margin: [5, 2, 10, 20]
                },
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
          selectedNode={this.state.selectedNode}
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
        <div style={{ right: 15, bottom: 70, position: "absolute" }}>
          <Button
            id="download_pdf"
            icon="download"
            size={"large"}
            type="primary"
            shape="round"
            onClick={this.handleDownloadPdf}
            style={{
              boxShadow:
                "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)"
            }}
          >
            Download Pdf
          </Button>
        </div>
        <div style={{ right: 15, bottom: 15, position: "absolute" }}>
          <Button
            id="download"
            icon="download"
            size={"large"}
            shape="circle"
            type="primary"
            style={{
              boxShadow:
                "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)"
            }}
          />
        </div>

        <div
          style={{
            width: "100vw",
            textAlign: "center",
            position: "absolute",
            top: 15
          }}
        >
          <AutoComplete
            dataSource={this.state.data.nodes.map(d => d.id)}
            placeholder="Search ..."
            style={{
              width: 600
            }}
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
            <Input
              suffix={<Icon type="search" className="certain-category-icon" />}
            />
          </AutoComplete>
        </div>

        <div
          style={{
            left: 15,
            position: "absolute",
            top: 15
          }}
        >
          <FileUpload
            title="Change graph"
            hint="Select another graph file"
            fileList={this.state.selectedFileList}
            onFileUploaded={this.handleFileUploaded}
            handleFileList={this.handleUploadedFileList}
          />
        </div>
        {this.renderVisualization()}
      </Fragment>
    ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            height: "100vh",
            background: `url(${bg})`,
            paddingBottom: 90
          }}
        >
          <Typography.Title
            level={1}
            style={{ textAlign: "center", fontSize: "2.8rem" }}
          >
            Cell Visualizer
        </Typography.Title>

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
}

ReactDOM.render(<App />, document.getElementById("app"));
