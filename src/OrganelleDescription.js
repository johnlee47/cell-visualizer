import React from "react";
import { Button, Card, Typography } from "antd";

export default class OrganelleDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { selectedNode, onNodeSelected } = this.props;

    return (
      selectedNode && (
        <Card bordered={false} className="description-wrapper">
          <Typography.Title style={{ color: "white" }} level={4}>
            {selectedNode.id}
          </Typography.Title>
          <Typography.Paragraph style={{ color: "white" }}>
            {selectedNode.description}
          </Typography.Paragraph>
          <div style={{ textAlign: "right" }}>
            <Button.Group>
              <Button
                type="link"
                ghost
                onClick={() => onNodeSelected(undefined)}
              >
                Close
              </Button>
              <Button type="primary">Learn more</Button>
            </Button.Group>
          </div>
        </Card>
      )
    );
  }
}
