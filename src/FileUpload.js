import React from "react";
import { Upload, Button, Icon, Typography } from "antd";

const dummyRequest = ({ file, onSuccess }) => {
  setTimeout(() => {
    onSuccess("ok");
  }, 0);
};

export default class FileUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      validFileType: true
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(info) {
    const nextState = {};
    switch (info.file.status) {
      case "uploading":
        nextState.selectedFile = info.file;
        nextState.selectedFileList = [info.file];
        break;

      case "done":
        nextState.selectedFile = info.file;
        nextState.selectedFileList = [info.file];
        break;

      default:
        //error or removed
        nextState.selectedFile = null;
        nextState.selectedFileList = [];
    }

    this.props.handleFileList(nextState.selectedFile);

    // Check for valid file type
    if (this.props.fileList[0].name.endsWith(".json")) {
      this.setState({
        validFileType: true
      });
    } else {
      this.setState({
        validFileType: false
      });
      return;
    }

    // Filereader which will read file contents
    let reader = new FileReader();

    // Waits for the file to finish loading and sets the data for the App
    reader.addEventListener(
      "loadend",
      function() {
        this.props.onFileUploaded(JSON.parse(reader.result));
      }.bind(this)
    );

    // Passing the name of the file to the reader
    reader.readAsText(this.props.fileList[0].originFileObj);
  }

  render() {
    return (
      <div
        style={{
          fontSize: 14,
          zIndex: 1000
        }}
      >
        <Upload.Dragger
          style={{
            padding: 5,
            textAlign: "center"
          }}
          accept=".json"
          customRequest={dummyRequest}
          onChange={this.handleChange}
          fileList={this.state.fileList}
        >
          <Icon
            type="cloud-upload"
            style={{ marginRight: 15, fontSize: "1.5rem" }}
          />

          {this.props.fileList[0] != undefined ? (
            <Typography.Text strong>
              {this.props.fileList[0].name}
            </Typography.Text>
          ) : (
            this.props.title && (
              <Typography.Text strong>{this.props.title}</Typography.Text>
            )
          )}
          {}
        </Upload.Dragger>
        <p
          style={{
            paddingTop: 8,
            marginBottom: 0,
            textAlign: "center"
          }}
        />
        {!this.state.validFileType && (
          <p
            style={{
              color: "red",
              paddingTop: 8,
              marginBottom: 0
            }}
          >
            "The file format must be .json"
          </p>
        )}
      </div>
    );
  }
}
