import React from "react";
import { Button, Card, Typography } from "antd";

export default class OrganelleDescription extends React.Component {
  render() {
    const { selectedNode, onNodeSelected } = this.props;

    return (
      selectedNode && (
        <Card bordered={false} className="description-wrapper">
          <Typography.Title level={4}>{selectedNode.id}</Typography.Title>
          <Typography.Paragraph>
            {selectedNode.description}
          </Typography.Paragraph>
          <Button.Group>
            <Button type="link" ghost onClick={() => onNodeSelected(undefined)}>
              Close
            </Button>
            <Button type="primary">Learn more</Button>
          </Button.Group>
        </Card>
      )
    );
  }
}
