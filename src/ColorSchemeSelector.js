import * as React from "react";
import { Radio } from "antd";
import * as Color from "color";

const ColorSchemes = {
  LOCATION: 0,
  TYPE: 1,
  CONNECTIVITY: 2,
  PATHWAY: 3
};

export class ColorSchemeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultColorScheme: ColorSchemes.LOCATION
    };
  }

  componentDidMount() {
    this.handleColorSchemeChange(this.state.defaultColorScheme);
  }

  handleColorSchemeChange(colorScheme) {
    switch (colorScheme) {
      case ColorSchemes.LOCATION: {
        const result = this.colorSchemeByDiscereteAttribute("location");
        return this.props.onColorSchemeChange(
          result.colorScheme,
          result.colorSelector
        );
      }
      case ColorSchemes.TYPE: {
        const result = this.colorSchemeByDiscereteAttribute("type");
        return this.props.onColorSchemeChange(
          result.colorScheme,
          result.colorSelector
        );
      }
      case ColorSchemes.CONNECTIVITY: {
        const connectedNodes = this.props.data.links.reduce((acc, link) => {
          acc.push(link.source.id);
          acc.push(link.target.id);
          return acc;
        }, []);
        const connectionsByNode = connectedNodes.reduce((acc, node, i) => {
          if (connectedNodes.findIndex(n => n === node) === i)
            acc[node] = connectedNodes.filter(n => n === node).length;
          return acc;
        }, {});
        const relativePercentages = this.calculateRelativePercentagesForRange(
          Object.values(connectionsByNode),
          "connections"
        );
        const colorScheme = this.assignMonochromaticColors(relativePercentages);
        return this.props.onColorSchemeChange(colorScheme, n => {
          const c = connectionsByNode[n.id];
          return colorScheme.find(a => {
            return c >= a.min && c < a.max;
          }).color;
        });
      }
      case ColorSchemes.PATHWAY: {
        const pathways = this.props.data.nodes
          .filter(n => n.id.includes("Mme"))
          .map(n => n.id);
        const pathwayConnectedNodes = pathways.reduce((a, pathway) => {
          const nodes = this.props.data.links
            .map(l => {
              if (l.source.id === pathway) {
                return l.target.id;
              }
              if (l.target.id === pathway) {
                return l.source.id;
              }
            })
            .filter(n => n);
          return {
            ...a,
            [pathway]: nodes
          };
        }, {});
        const totalPathwayConnectedNodes = Object.values(
          pathwayConnectedNodes
        ).reduce((a, c) => a + c.length, 0);
        console.log("PATH-NODE", pathwayConnectedNodes);
        const relativePercentages = Object.keys(pathwayConnectedNodes).map(
          key => ({
            label: key,
            value:
              pathwayConnectedNodes[key].length / this.props.data.links.length
          })
        );
        relativePercentages.push({
          label: "No pathway",
          value:
            (this.props.data.links.length - totalPathwayConnectedNodes) /
            this.props.data.links.length
        });
        const colorScheme = this.assignColors(relativePercentages);
        console.log("RELATIVE-PERCENTAGES", relativePercentages);
        return this.props.onColorSchemeChange(colorScheme, n => {
          let color;
          Object.keys(pathwayConnectedNodes).forEach((key, i) => {
            if (key === n.id) {
              color = colorScheme.find(s => s.label === key).color;
            } else if (pathwayConnectedNodes[key].includes(n.id))
              color = colorScheme.find(s => s.label === key).color;
          });
          if (!color)
            color = colorScheme.find(s => s.label === "No pathway").color;
          return color;
        });
      }
    }
  }

  colorSchemeByDiscereteAttribute(attribute) {
    const relativePercentages = this.calculateRelativePercentages(
      attribute
    ).map(rp => {
      if (rp.label === "") {
        rp.label = "Unlocalized";
      }
      return rp;
    });
    console.log("RELATIVE", relativePercentages);
    const colorScheme = this.assignColors(relativePercentages);
    const colorSelector = n => {
      const cs =
        colorScheme.find(s => s.label === n[attribute]) ||
        colorScheme.find(s => s.label === "Unlocalized");
      return cs.color;
    };

    return { colorScheme, colorSelector };
  }

  assignColors(data) {
    const { colorPalletes } = this.props;
    return data.map(d => ({
      ...d,
      color: colorPalletes[data.findIndex(l => l.label === d.label)]
    }));
  }

  assignMonochromaticColors(data) {
    const sortedData = [...data].sort((a, b) => b.min - a.min);
    let red = Color("#180205");
    return sortedData.map(d => {
      red = red.lighten(0.75);
      return {
        ...d,
        color: red.rgb()
      };
    });
  }

  calculateRelativePercentages(key) {
    const counts = this.props.data.nodes.reduce((rps, node) => {
      if (!rps.find(rp => rp.label === node[key])) {
        rps.push({ label: node[key], value: 0 });
      }
      return rps.map(rp => {
        if (rp.label === node[key]) {
          rp.value = rp.value + 1;
        }
        return rp;
      });
    }, []);
    return counts.map(c => ({
      ...c,
      value: c.value / this.props.data.nodes.length
    }));
  }

  calculateRelativePercentagesForRange(values, caption) {
    const totalConnections = values.reduce((a, c) => a + c, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    let step = 1;
    if (range < 3) {
      step = range;
    } else if (range < 10) {
      step = Math.ceil(range / 2);
    } else {
      step = Math.ceil(range / 5);
    }
    let relativePercentages = [];
    for (let i = min; i + step <= max; i = i + step) {
      relativePercentages.push({
        min: i,
        max: i + step,
        label: `${i}-${i + step + 1} ${caption}`
      });
    }
    return relativePercentages.map((rp, i) => {
      if (i === relativePercentages.length - 1) rp.max = rp.max + 1;
      rp.value =
        values
          .filter(v => v >= rp.min && v < rp.max)
          .reduce((a, c) => a + c, 0) / totalConnections;
      return rp;
    });
  }

  render() {
    return (
      <React.Fragment>
        <Radio.Group
          onChange={e => this.handleColorSchemeChange(e.target.value)}
          defaultValue={this.state.defaultColorScheme}
        >
          <Radio value={ColorSchemes.LOCATION}>Location</Radio>
          <Radio value={ColorSchemes.TYPE}>Type</Radio>
          <Radio value={ColorSchemes.CONNECTIVITY}>Connectivity</Radio>
          <Radio value={ColorSchemes.PATHWAY}>Pathway</Radio>
        </Radio.Group>
      </React.Fragment>
    );
  }
}
