import React, { Component } from "react";
import { func } from "prop-types";

const d3 = require("d3");

// Radius of nodes
const radius = 5;
// Padding between nodes and cellular components that should not crossover
const padding = 2 * radius;

// Calculate and return the distance between two points
const calculateDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

// Constraint the cell inside a cell component, optionally constrained not to enter some components
const constraintInsideCell = (x, y, component, components = []) => {
  const { cx, cy, rmax, rmin } = component;
  let R = calculateDistance(x, y, cx, cy);
  if (R > rmax - padding) {
    return {
      x: ((rmax - padding) / R) * (x - cx) + cx,
      y: ((rmax - padding) / R) * (y - cy) + cy
    };
  } else if (R < rmin + padding) {
    return {
      x: ((rmin + padding) / R) * (x - cx) + cx,
      y: ((rmin + padding) / R) * (y - cy) + cy
    };
  } else {
    for (let i = 0; i < components.length; i++) {
      const { cx, cy, rmax } = components[i];
      R = calculateDistance(x, y, cx, cy);
      if (R < rmax + padding) {
        const position = {
          x: ((rmax + padding) / R) * (x - cx) + cx,
          y: ((rmax + padding) / R) * (y - cy) + cy
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
  let w = 1000, h = 900;
  return {
    x: x < padding ? padding : x > w - padding ? w - padding : x,
    y: y < padding ? padding : y > h - padding ? h - padding : y
  };
};



export default class CellVisualizer extends Component {
  constructor(props) {
    super(props);
    this.simulation = undefined;
    this.svg = undefined;
    this.node = undefined;
    this.link = undefined;
    this.cell = {};
  }

  componentDidUpdate(prevProp) {
    if (prevProp.data == this.props.data) {
    } else if (this.props.data) {
      this.resetGraph();
      this.initGraph();
    }

    if (this.props.selectedNode && prevProp.selectedNode !== this.props.selectedNode) {
      this.node.attr('r', radius - 0.75);
      d3.select(`circle#${this.props.selectedNode.id}`)
        .transition()
        .duration(200)
        .attr('r', 15)
    }
    if (!this.props.selectedNode) {
      this.node.attr('r', radius - 0.75);
    }
  }

  componentDidMount() {
    this.initCellStructure().then(() => this.props.data && this.initGraph());

  }

  parseTranslateValues(translate) {
    return translate
      .replace("translate(", "")
      .replace(")", "")
      .split(",")
      .map(v => +v);
  }

  initCellStructure() {
    return d3.xml("./cell.svg").then(data => {
      d3.select("#svg_wrapper")
        .node()
        .appendChild(data.documentElement);
      this.svg = d3.select("#svg_wrapper").select("svg");
      this.svg.attr("width", 1000);
      // Get the offset value of the whole diagram
      let cellTranslate = this.parseTranslateValues(
        d3
          .select("#cell_group")
          .node()
          .getAttribute("transform")
      );

      d3.selectAll(".group_component")
        .nodes()
        .map(groupComponent => {
          // Get the offset value of each cellular component
          var groupTranslate = groupComponent.getAttribute("transform");
          groupTranslate = groupTranslate
            ? this.parseTranslateValues(groupTranslate)
            : [0, 0];

          const componentName = groupComponent.id.replace("_group", "");
          const component = d3.select("#" + componentName).node();
          // Calculate the center of cellular components
          var cx =
            +component.getAttribute("cx") +
            groupTranslate[0] +
            cellTranslate[0];
          var cy =
            +component.getAttribute("cy") +
            groupTranslate[1] +
            cellTranslate[1];
          // Save cellular components
          this.cell[componentName] = {
            cx: cx,
            cy: cy,
            rmax: +component.getAttribute("r"),
            rmin: 0
          };
        });
      // Save minimum radius for memebrane like cellular components
      this.cell["plasma_membrane"].rmin =
        this.cell["cytoplasm"].rmax + 0.6 * padding;
      if (this.cell["cell_wall"]) {
        this.cell['cell_wall'].rmin =
          this.cell["plasma_membrane"].rmax + 0.6 * padding;
      }
    });
  }

  resetGraph() {
    d3.selectAll(".node").each(function () {
      this.parentNode.remove();
    });
    d3.selectAll(".edge").each(function () {
      this.parentNode.remove();
    });
  }



  initGraph() {
    this.simulation = d3
      .forceSimulation(this.props.data.nodes)
      .force(
        "link",
        d3
          .forceLink(this.props.data.links)
          .id(d => d.id)
          .distance(70)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(400, 450))
      .force(
        "collision",
        d3.forceCollide().radius(function (d) {
          return 10;
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
      .attr("id", function (d) {
        return d.id;
      });

    var gnodes = this.svg
      .selectAll("g.gnode")
      .data(this.props.data.nodes)
      .enter()
      .append("g")
      .attr("id", function (d) {
        return d.id + "_g";
      });

    this.node = gnodes
      .append("circle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr('id', d => d.id)
      .attr("r", radius - 0.75)
      .attr("class", "node")
      .attr("fill", d => {
        const mapping = this.props.groupMapping.find(m => m.group === d.group);
        return mapping ? mapping.color : "#333";
      })

      .on("click", function (d, i) {
        this.props.onNodeSelected(d);
      }.bind(this))
      .call(this.drag(this.simulation));


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
    let node = this.node

    let link = this.link
    let props = this.props
    this.node.each(function (d) {
      const result = calculateNewPosition(d);
      let characterLength =
        result.x.toFixed(2).length * 12 + result.y.toFixed(2).length * 12;
      d3.select(this)
        .attr("cx", result.x)
        .attr("fixed", false)
        .attr("cy", result.y)

        .on("mouseover", function (d, i) {
          // Add the text background



          const linkedByIndex = {};
          props.data.links.forEach(d => {
            linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
          });

          //Checks if they are connected 
          function isConnected(a, b) {
            return linkedByIndex[`${a.index},${b.index}`] || linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
          }
          node.style('stroke-opacity', function (o) {
            const thisOpacity = isConnected(d, o) ? 1 : .1;
            this.setAttribute('fill-opacity', thisOpacity);
            return thisOpacity;
          });
          link.style('stroke-opacity', o => (o.source === d || o.target === d ? 1 : .1));
          d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
            .append("rect")
            .style("fill", "hsla(204, 80%, 80%, 1)")
            .attr("x", function () {
              // Adjust the center of the rectangle
              return result.x - characterLength / 2;
            }) // set x position of left side of rectangle
            .attr("rx", 5)
            .attr("y", result.y - 40) // set y position of top of rectangle
            .attr("ry", 5)
            .attr("width", function () {
              // The function returns width of the background based on the length of characters
              return characterLength;
            })
            .attr("height", 30)
            .attr("id", "node" + i);

          //Add the text description
          d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
            .append("text")
            .style("fill", "hsla(204, 94%, 9%, 1)") // fill the text with the colour black
            .style("font-size", "16px")
            .style("font-weight", "600")
            .attr("x", result.x) // set x position of left side of text
            .attr("y", result.y) // set y position of bottom of text
            .attr("dy", "-20") // set offset y position
            .attr("text-anchor", "middle") // set anchor y justification
            .attr("id", "node" + i)
            .text(function (d) {
              return [result.x.toFixed(2), result.y.toFixed(2)];
            });
        })
        .on("mouseout", function (d, i) {
          d3.selectAll("#node" + i).remove(); // Removes the on-hover information
          node.style('stroke-opacity', function (o) {
            this.setAttribute('fill-opacity', 1);
            return 1;
          });
          link.style('stroke-opacity', 1);
        });
    });
    // Update link
    this.link.each(function (d) {
      const sourcePosition = calculateNewPosition(d.source);
      const targetPosition = calculateNewPosition(d.target);
      d3.select(this)
        .attr("x1", sourcePosition.x)
        .attr("y1", sourcePosition.y)
        .attr("x2", targetPosition.x)
        .attr("y2", targetPosition.y);
    });

    let alwaysVisibleOrganelles = new Set(["extracellular", "cell_wall", "cytoplasm", "plasma_membrane"]);
    let presentOrganelles = new Set();
    this.node.each(function (d) {
      presentOrganelles.add(d.group);
    })

    this.props.groupMapping.forEach(organelle => {
      if (!presentOrganelles.has(organelle.group) && !alwaysVisibleOrganelles.has(organelle.component)) {
        d3.selectAll("#" + organelle.component + "_group")
          .remove();
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
    return <div id="svg_wrapper" />;
  }
}
