import React, { Component } from "react";
import saveSvgAsPng from "./Download";
import { Spin } from "antd";
const d3 = require("d3");
import * as bg from "./cell_bg.svg";

const width = window.innerWidth - 200;
const height = window.innerHeight - 200;
const plasmaMembraneWidth = 40;
const cellWallWidth = 40;
var gnodes = undefined;
const defaultGroupNoSet = [0, 1, 6, 9];
const organellRadius = 60;
// Radius of nodes
const radius = 5;
// Padding between nodes and cellular components that should not crossover
const padding = 5;
// Calculate and return the distance between two points
const calculateDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

// Constraint the cell inside a cell component, optionally constrained not to enter some components
const constraintInsideCell = (
  x,
  y,
  component,
  components = [],
  nodeRadius = 0
) => {
  const nodePadding = nodeRadius ? nodeRadius + 10 : padding;
  const { cx, cy, rmax, rmin } = component;
  let R = calculateDistance(x, y, cx, cy);
  if (R > rmax - nodePadding) {
    return {
      x: ((rmax - nodePadding) / R) * (x - cx) + cx,
      y: ((rmax - nodePadding) / R) * (y - cy) + cy
    };
  } else if (R < rmin + nodePadding) {
    return {
      x: ((rmin + nodePadding) / R) * (x - cx) + cx,
      y: ((rmin + nodePadding) / R) * (y - cy) + cy
    };
  } else {
    for (let i = 0; i < components.length; i++) {
      const { cx, cy, rmax } = components[i];
      R = calculateDistance(x, y, cx, cy);
      if (R < rmax + nodePadding) {
        const position = {
          x: ((rmax + nodePadding) / R) * (x - cx) + cx,
          y: ((rmax + nodePadding) / R) * (y - cy) + cy
        };
        return position;
      }
    }
  }
  return { x: x, y: y };
};

// Constraint the cell outside the cell and not let it enter the cell
const constraintOutsideCell = (x, y, cell) => {
  // If the cell has a cellwall, consider that its outter border. If not consider the plasma membrane its outer border
  var border = cell["cell_wall"] ? cell["cell_wall"] : cell["plasma_membrane"];
  let R = calculateDistance(x, y, border.cx, border.cy);
  if (R < border.rmax + padding) {
    return {
      x: ((border.rmax + padding) / R) * (x - border.cx) + border.cx,
      y: ((border.rmax + padding) / R) * (y - border.cy) + border.cy
    };
  }
  // Do not let the node out of the viewport
  return {
    x: x < padding ? padding : x > width - padding ? width - padding : x,
    y: y < padding ? padding : y > height - padding ? height - padding : y
  };
};

export default class CellVisualizer extends Component {
  constructor(props) {
    super(props);
    this.simulation = undefined;
    this.organnelSimulation = undefined;
    this.svg = undefined;
    this.node = undefined;
    this.link = undefined;
    this.cell = {};
    this.state = {
      busy: false
    };
  }

  componentDidUpdate(prevProp) {
    if (prevProp.data == this.props.data) {
    } else if (this.props.data) {
      this.initCellStructure();
    }

    if (
      this.props.selectedNode &&
      prevProp.selectedNode !== this.props.selectedNode
    ) {
      this.node.attr("r", radius - 0.75);
      d3.select(`circle#${this.props.selectedNode.id}`)
        .transition()
        .duration(200)
        .attr("r", 15);
    }
    if (!this.props.selectedNode && this.node) {
      this.node.attr("r", radius - 0.75);
    }
  }

  componentDidMount() {
    this.initCellStructure();
  }

  parseTranslateValues(translate) {
    return translate
      .replace("translate(", "")
      .replace(")", "")
      .split(",")
      .map(v => +v);
  }

  identifyComponent(groupNo) {
    return this.props.groupMapping[groupNo].component;
  }

  initCellStructure() {
    this.setState({ busy: true });
    this.simulation && this.simulation.stop();
    this.organnelSimulation && this.organnelSimulation.stop();
    this.cell = {};
    d3.selectAll("#svg").remove();
    this.svg = d3
      .select("#svg_wrapper")
      .append("svg")
      .attr("id", "svg")
      .attr("width", width)
      .attr("height", height);

    this.cell["cell_wall"] = {
      cx: width / 2,
      cy: height / 2,
      rmax: height / 2 - 10,
      rmin: height / 2 - 10 - cellWallWidth
    };

    this.cell["plasma_membrane"] = {
      cx: width / 2,
      cy: height / 2,
      rmax: this.cell["cell_wall"].rmin,
      rmin: this.cell["cell_wall"].rmin - plasmaMembraneWidth
    };

    this.cell["cytoplasm"] = {
      cx: width / 2,
      cy: height / 2,
      rmax: this.cell["plasma_membrane"].rmin,
      rmin: 0
    };

    const groupNoSet = new Set(defaultGroupNoSet);
    const uniqueNodes = this.props.data.nodes.filter(
      function(obj) {
        if (!groupNoSet.has(obj.group)) {
          groupNoSet.add(obj.group);
          this.cell[this.identifyComponent(obj.group)] = {
            cx: width / 2,
            cy: height / 2,
            rmax: organellRadius,
            rmin: 0
          };
          return obj;
        }
      }.bind(this)
    );

    var cellWall = this.svg
      .append("g")
      .attr("class", "group_component")
      .attr("id", "cell_wall_group")
      .append("circle")
      .attr("stroke", "#888DDB")
      .attr("fill", "#EDECFC")
      .attr("stroke-width", 1)
      .attr("id", "cell_wall")
      .attr("r", this.cell["cell_wall"].rmax)
      .attr("cx", this.cell["cell_wall"].cx)
      .attr("cy", this.cell["cell_wall"].cy);

    var plasmaMembrane = this.svg
      .append("g")
      .attr("class", "group_component")
      .attr("id", "plasma_membrane_group")
      .append("circle")
      .attr("stroke", "#888DDB")
      .attr("fill", "#f1f4f1")
      .attr("stroke-width", 1)
      .attr("id", "plasma_membrane")
      .attr("r", this.cell["plasma_membrane"].rmax)
      .attr("cx", this.cell["plasma_membrane"].cx)
      .attr("cy", this.cell["plasma_membrane"].cy);

    var cytoplasm = this.svg
      .append("g")
      .attr("class", "group_component")
      .attr("id", "cytoplasm_group")
      .append("circle")
      .attr("stroke", "#7e9a82")
      .attr("fill", "#FFF")
      .attr("stroke-width", 1)
      .attr("id", "cytoplasm")
      .attr("r", this.cell["cytoplasm"].rmax)
      .attr("cx", this.cell["cytoplasm"].cx)
      .attr("cy", this.cell["cytoplasm"].cy);

    gnodes = this.svg
      .selectAll("g.gnode")
      .data(uniqueNodes)
      .enter()
      .append("g")
      .attr("class", "group_component")
      .attr(
        "id",
        function(d) {
          return this.identifyComponent(d.group) + "_group";
        }.bind(this)
      );

    gnodes
      .append("svg:title")
      .text(
        d => this.props.groupMapping.find(m => m.group === d.group).component
      );

    const node = gnodes
      .append("circle")
      .attr("stroke", "#d29be3")
      .attr("fill", "#f6ebf9")
      .attr("stroke-width", 1)
      .attr(
        "id",
        function(d) {
          return this.identifyComponent(d.group);
        }.bind(this)
      )
      .attr("r", organellRadius)
      .attr("class", "node");

    gnodes
      .append("text")
      .style("fill", "#74278c")
      .style("font-size", "0.7rem")
      .attr("text-anchor", "middle")
      .attr("y", 30)
      .text(
        d => this.props.groupMapping.find(m => m.group === d.group).component
      );

    this.organnelSimulation = d3
      .forceSimulation(uniqueNodes)
      .force("repel", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius(function(d) {
          return organellRadius + 30;
        })
      );
    this.organnelSimulation
      .on(
        "tick",
        function() {
          const cell = this.cell;
          const cytoplasm = cell["cytoplasm"];
          const groupMapping = this.props.groupMapping;
          gnodes.each(function(d) {
            const result = constraintInsideCell(
              d.x,
              d.y,
              cytoplasm,
              [],
              organellRadius
            );

            d3.select(this).attr("transform", function(d, i) {
              return "translate(" + result.x + "," + result.y + ")";
            });
            // d3.select(this)
            //   .attr()
            //   .attr("cx", result.x)
            //   .attr("fixed", false)
            //   .attr("cy", result.y);
            cell[groupMapping.find(m => m.group === d.group).component].cx =
              result.x;
            cell[groupMapping.find(m => m.group === d.group).component].cy =
              result.y;
          });
        }.bind(this)
      )
      .on(
        "end",
        function() {
          console.log("End");
          this.setState({ busy: false });
          this.props.data && this.initGraph();
        }.bind(this)
      );
  }

  initGraph() {
    this.simulation = d3
      .forceSimulation(this.props.data.nodes)
      .force("repel", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(this.props.data.links).id(d => d.id))
      .force(
        "collision",
        d3.forceCollide().radius(function(d) {
          return radius;
        })
      );

    this.link = this.svg
      .append("g")
      .selectAll(".edge")
      .data(this.props.data.links)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("stroke", "#888")
      .attr("stroke-width", 0.7)
      .attr("id", function(d) {
        return d.id;
      });

    var gnodes = this.svg
      .selectAll("g.gnode")
      .data(this.props.data.nodes)
      .enter()
      .append("g")
      .attr("id", function(d) {
        return d.id + "_g";
      });

    this.node = gnodes
      .append("circle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("id", d => d.id)
      .attr("r", radius - 0.75)
      .attr("class", "node")
      .attr("fill", d => {
        const mapping = this.props.groupMapping.find(m => m.group === d.group);
        return mapping ? mapping.color : "#333";
      })
      .on(
        "click",
        function(d, i) {
          this.props.onNodeSelected(d);
        }.bind(this)
      )
      .call(this.drag(this.simulation));

    d3.select("#download").on("click", function() {
      // Get the d3js SVG element and save using saveSvgAsPng.js
      saveSvgAsPng.saveSvgAsPng(
        document.getElementById("svg"),
        "Cell View.png",
        {
          scale: 2,
          backgroundColor: "#FFFFFF"
        }
      );
    });

    this.simulation.on("tick", this.onTick.bind(this));
  }

  onTick() {
    // Calculate the node's new position after applying the constraints
    const calculateNewPosition = node => {
      const mapping = this.props.groupMapping.find(m => m.group === node.group);
      if (mapping) {
        const component = this.cell[mapping.component];
        switch (mapping.component) {
          case "cytoplasm":
            const components = Object.keys(this.cell)
              .filter(
                k => !["plasma_membrane", "cytoplasm", "cell_wall"].includes(k)
              )
              .map(k => this.cell[k]);
            return constraintInsideCell(node.x, node.y, component, components);
          case "extracellular":
            return constraintOutsideCell(node.x, node.y, this.cell);
          default:
            return constraintInsideCell(node.x, node.y, component);
        }
      }
      return { x: node.x, y: node.y };
    };
    // Update node positions
    let node = this.node;

    let link = this.link;
    let props = this.props;

    this.node.each(function(d) {
      const result = calculateNewPosition(d);

      // Use character length to determine hover information
      let characterLength =
        (d.id.length < 6
          ? d.id.length + 2
          : d.id.length > 12
          ? d.id.length - 2
          : d.id.length) * 12;

      d3.select(this)
        .attr("cx", result.x)
        .attr("fixed", false)
        .attr("cy", result.y)

        .on("mouseover", function(d, i) {
          // Add the text background
          const linkedByIndex = {};
          props.data.links.forEach(d => {
            linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
          });

          //Checks if the nodes are connected
          function isConnected(a, b) {
            return (
              linkedByIndex[`${a.index},${b.index}`] ||
              linkedByIndex[`${b.index},${a.index}`] ||
              a.index === b.index
            );
          }
          node.style("stroke-opacity", function(o) {
            const thisOpacity = isConnected(d, o) ? 1 : 0.1;
            this.setAttribute("fill-opacity", thisOpacity);
            return thisOpacity;
          });

          link.style("stroke-opacity", o =>
            o.source === d || o.target === d ? 1 : 0.1
          );

          d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
            .append("rect")
            .style("fill", "hsla(214, 89%, 14%, .7)")
            .attr("x", function() {
              // Adjust the center of the rectangle
              return result.x - characterLength / 2;
            }) // set x position of left side of rectangle
            .attr("rx", 5)
            .attr("y", result.y - 40) // set y position of top of rectangle
            .attr("ry", 5)
            .attr("width", function() {
              // The function returns width of the background based on the length of characters
              return characterLength;
            })
            .attr("height", 30)
            .attr("id", "node" + i);

          //Add the text description
          d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
            .append("text")
            //.style("fill", "hsla(204, 94%, 9%, 1)") // fill the text with the colour black
            .style("font-size", "16px")
            .style("font-weight", "600")
            .style("fill", "white")
            .attr("x", result.x) // set x position of left side of text
            .attr("y", result.y) // set y position of bottom of text
            .attr("dy", "-20") // set offset y position
            .attr("text-anchor", "middle") // set anchor y justification
            .attr("id", "node" + i)
            .text(d.id);
          //return [result.x.toFixed(2), result.y.toFixed(2)];
          // });
        })
        .on("mouseout", function(d, i) {
          d3.selectAll("#node" + i).remove(); // Removes the on-hover information
          node.style("stroke-opacity", function(o) {
            this.setAttribute("fill-opacity", 1);
            return 1;
          });
          link.style("stroke-opacity", 1);
        });
    });
    // Update link
    this.link.each(function(d) {
      const sourcePosition = calculateNewPosition(d.source);
      const targetPosition = calculateNewPosition(d.target);
      d3.select(this)
        .attr("x1", sourcePosition.x)
        .attr("y1", sourcePosition.y)
        .attr("x2", targetPosition.x)
        .attr("y2", targetPosition.y);
    });

    let alwaysVisibleOrganelles = new Set([
      "extracellular",
      "cell_wall",
      "cytoplasm",
      "plasma_membrane"
    ]);
    let presentOrganelles = new Set();
    this.node.each(function(d) {
      presentOrganelles.add(d.group);
    });

    this.props.groupMapping.forEach(organelle => {
      if (
        !presentOrganelles.has(organelle.group) &&
        !alwaysVisibleOrganelles.has(organelle.component)
      ) {
        d3.selectAll("#" + organelle.component + "_group").remove();
      }
    });
  }

  drag(simulation) {
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  render() {
    return (
      <React.Fragment>
        {this.state.busy && (
          <div
            style={{
              position: "absolute",
              width: "100vw",
              height: "100vh",
              background: "rgba(255,255,255,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Spin size="large" tip="Preparing visualization ..." />
          </div>
        )}
        <div
          id="svg_wrapper"
          style={{
            display: "grid",
            justifyContent: "center",
            alignContent: "center",
            height: "100vh",
            background: `url(${bg})`
          }}
        />
      </React.Fragment>
    );
  }
}
