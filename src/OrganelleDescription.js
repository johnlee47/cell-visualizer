import React from "react";
import { Button, Card, Typography} from "antd";

export default class OrganelleDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { selectedNode, onNodeSelected } = this.props;

    return (
        selectedNode && (
                  <Card
                  bordered={false}
        style={{
          position: "absolute",
          width: 300,
          right: 15,
          top: 15,
          backgroundColor: "#042044",
          color: "white",
          boxShadow: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)"
        }}
      >
      
            <Typography.Title style={{color:"white"}} level={4}>{selectedNode.id}</Typography.Title>
            <Typography.Paragraph style={{color:"white"}}>{selectedNode.description}</Typography.Paragraph>
            <div style={{ textAlign: "right" }}>
              <Button.Group>
                <Button ghost
                  type="default"
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
