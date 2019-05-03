import React from "react";
import { Button, Input } from "antd";

export default class OrganelleDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { selectedNode, onNodeSelected } = this.props;

    return (
      <div
        style={{
          position: "absolute",
          display: "flex",
          height: "100vh",
          right: 0,
          top: 0,
          paddingBottom: 15,
          paddingTop: 15,
          paddingRight: 15,
          paddingLeft: 25,
          marginTop: 20,
          marginLeft: 5,
          flexDirection: "column",
          width: 350,
          backgroundColor: "hsla(204, 3%, 98%, 1)",
          borderRadius: 3,
          boxShadow: "0 1px 2px hsla(0, 0%, 0%, 0.3)"
        }}
      >
        {selectedNode && (
          <div>
            <h3>{selectedNode.id}</h3>
            <p>{selectedNode.description}</p>
            <p>{selectedNode.description}</p>
            <div style={{ textAlign: "right" }}>
              <Button.Group>
                <Button
                  type="default"
                  onClick={() => onNodeSelected(undefined)}
                >
                  Close
                </Button>
                <Button type="primary">Learn more</Button>
              </Button.Group>
            </div>
          </div>
        )}
      </div>
    );
  }
}
