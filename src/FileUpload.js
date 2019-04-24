import React from "react";

export default class FileUpload extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      textRead: false
    };
    this.handleUpload = this.handleUpload.bind(this);
  }

  handleUpload(e) {
    let files = e.target.files;
    let reader = new FileReader();

    reader.onload = function(e) {
      var text = reader.result;
      console.log(text);

      this.props.onFileUploaded(JSON.parse(text));
    }.bind(this);

    reader.readAsText(files[0]);
  }

  render() {
    return (
      <label>
        Data:
        <input
          accept=".json"
          onChange={e => this.handleUpload(e)}
          type="file"
          id="files"
        />
      </label>
    );
  }
}
