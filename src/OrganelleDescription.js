import React from "react";
import { Button, Card, Typography } from "antd";

export default class OrganelleDescription extends React.Component {
  render() {
    const { selectedNode, onNodeSelected } = this.props;

    return (
      selectedNode && (
        <div className="description-wrapper">
          <Typography.Title level={4}>{selectedNode.name}</Typography.Title>

          <Typography.Paragraph>
            <span style={{ fontWeight: "bold" }}>Location: </span>
            {selectedNode.originalLocation || "Unlocalized"}
          </Typography.Paragraph>

          <Typography.Paragraph>{selectedNode.definition}</Typography.Paragraph>
          <div className="actions">
            <Button type="link" ghost onClick={() => onNodeSelected(undefined)}>
              Close
            </Button>
            {/* <Button type="primary">Learn more</Button> */}
          </div>
        </div>
      )
    );
  }
}
