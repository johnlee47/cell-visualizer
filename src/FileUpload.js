import React from "react";

export default class FileUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      validFileType: true
    };
    this.handleUpload = this.handleUpload.bind(this);
  }

  handleUpload(e) {
    let files = e.target.files;
    if (files[0].name.endsWith(".json")) {
      this.setState({
        validFileType: true
      });
    } else {
      this.setState({
        validFileType: false
      });
    }
    let reader = new FileReader();

    reader.onload = function(e) {
      var text = reader.result;
      // console.log(text);

      this.props.onFileUploaded(JSON.parse(text));
    }.bind(this);

    reader.readAsText(files[0]);
  }

  render() {
    return (
      <div
        style={{
          fontSize: 14,
          padding: 20,
          marginLeft: 5,
          marginTop: 20,
          backgroundColor: "hsla(204, 30%, 93%, 1)",
          width: 260,
          height: 100,
          display: "inline-block",
          borderRadius: 3,
          boxShadow: "0 1px 3px hsla(0, 0%, 0%, 0.3)"
        }}
      >
        <input
          accept=".json"
          onChange={e => this.handleUpload(e)}
          type="file"
          id="files"
        />
        {!this.state.validFileType && (
          <span
            style={{
              color: "red",
              paddingTop: 12,
              display: "inline-block"
            }}
          >
            "The file format must be .json"
          </span>
        )}
      </div>
    );
  }
}
