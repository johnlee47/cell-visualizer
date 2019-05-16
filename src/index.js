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
import html2canvas from "html2canvas";
import saveSvgAsPng from "save-svg-as-png";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

// Map a group of nodes to the cellular component (organnel) they belong to and their fill color
const GroupMapping = [
  { group: 0, color: "#740b28", component: "extracellular" },
  { group: 1, color: "#978cbf", component: "cytoplasm" },
  { group: 2, color: "#da950c", component: "endosome" },
  { group: 3, color: "#367baf", component: "glyoxysome" },
  { group: 4, color: "#ed2cbb", component: "centrosome" },
  { group: 5, color: "#23903a", component: "peroxisome" },
  { group: 6, color: "#4ecbb1", component: "plasma_membrane" },
  { group: 7, color: "#aa873c", component: "glycosome" },
  { group: 8, color: "#605294", component: "mtoc" },
  { group: 9, color: "#c71f25", component: "cell_wall" },
  { group: 10, color: "#c8ee2a", component: "chloroplast" },
  { group: 11, color: "#740b28", component: "apicoplast" },
  { group: 13, color: "#978cbf", component: "amyloplast" },
  { group: 14, color: "#da950c", component: "golgi_apparatus" },
  { group: 15, color: "#367baf", component: "endoplasmic_reticulum" },
  { group: 16, color: "#ed2cbb", component: "plastid" },
  { group: 17, color: "#23903a", component: "mitochondrion" },
  { group: 18, color: "#4ecbb1", component: "lysosome" },
  { group: 19, color: "#aa873c", component: "vacuole" },
  { group: 19, color: "#aa873c", component: "nucleus" }
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

  componentDidMount() {}

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
    // let imgData;
    // const input = document.getElementById("svg_wrapper");
    // // const input = document.getElementById("svg");
    // // console.log(input);
    // // input.style.width = '500px';
    // // input.style.height = '430px';
    // // let wrapper = document.createElement("div")
    // // wrapper.appendChild(input);
    // // console.log(wrapper)
    // // document.body.appendChild(wrapper)

    // html2canvas(input, {
    //   scale: 0.5
    // }).then(canvas => {
    //   imgData = canvas.toDataURL("image/png");
    //   var docDefinition = {
    //     content: [
    //       {
    //         image: imgData
    //       },
    //       this.state.data.nodes.map(node => {
    //         return {
    //           style: "tableExample",
    //           table: {
    //             body: [
    //               ["Name", node.id],
    //               ["Description", node.description],
    //               ["Organelle", node.group]
    //             ]
    //           },
    //           margin: [5, 2, 10, 20]
    //         };
    //       })
    //     ]
    //   };

    //   pdfMake.createPdf(docDefinition).download();
    // });

    var fonts = {
      Roboto: {
        normal: "fonts/Roboto-Regular.ttf",
        bold: "fonts/Roboto-Medium.ttf",
        italics: "fonts/Roboto-Italic.ttf",
        bolditalics: "fonts/Roboto-MediumItalic.ttf"
      }
    };

    let organelles = [
      "Nucleus",
      "Mitochondria",
      "Golgi Apparatus",
      "Centrosome"
    ];
    let prevNodeGroup = 0;

    // Take the node's data add it's connections
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
      return a.group - b.group || b.connectedTo.length - a.connectedTo.length;

    });

    // Get the svg and return it's URI
    saveSvgAsPng
      .svgAsPngUri(document.getElementById("svg"), { scale: 0.55 })
      .then(uri => {

        // Used to set the PDF's content
        var docDefinition = {
          content: [
            {
              image: uri, pageBreak: 'after'
            },

            // Create content for each node
            sortedData.map(node => {
              
              let nodeInfo = [
                {
                  // Show title for a new organelle
                  text:
                    prevNodeGroup != node.group
                      ? organelles[node.group - 1]
                      : undefined,
                  bold: true,
                  margin:
                    prevNodeGroup != node.group ? [5, 12, 10, 20] : [0, 0, 0, 0]
                },
                {
                  style: "tableExample",
                  table: {
                    body: [
                      ["Name", node.id],
                      ["Description", node.description],
                      [`Connected to (${node.connectedTo.length})`, node.connectedTo.join(", ")]
                    ]
                  },
                  margin: [5, 2, 10, 20]
                }
              ];

              if (prevNodeGroup != node.group) {
                prevNodeGroup = node.group;
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
