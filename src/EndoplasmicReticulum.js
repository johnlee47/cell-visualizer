import React from "react";
const d3 = require("d3");

export default class EndoplasmicReticulum extends React.Component {
  constructor(props) {
    super(props);
    this.link = undefined;
    this.node = undefined;
    this.state = {};
  }

  componentDidMount() {
    this.initEndoplasmicReticulum();
  }

  componentDidUpdate() {
    if (this.node) this.node.attr("fill", d => this.props.colorSelector(d));
  }

  getPointsOnPath(path, components) {
    let pts = [];
    let numberOfNodes = components.length;
    let pathLength = path.getTotalLength();

    for (let i = 0; i < numberOfNodes; i++) {
      let { x, y } = path.getPointAtLength((pathLength * i) / numberOfNodes);
      let pos = {
        x,
        y,
        ...components[i]
      };
      pts.push(pos);
    }

    return pts;
  }

  placeNodes(svg, nodes) {
    this.node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 3)
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .on(
        "click",
        function(d, i) {
          this.props.onNodeSelected(d);
        }.bind(this)
      )
      .on("mouseover", function(d, i) {
        let mouse = d3.mouse(this);
        let characterLength =
          (d.name.length < 6
            ? d.name.length + 2
            : d.name.length > 12
            ? d.name.length - 2
            : d.name.length) * 12;
        svg
          .append("rect")
          .attr("x", mouse[0] - characterLength / 2)
          .attr("rx", 5)
          .attr("y", mouse[1] - 40)
          .attr("ry", 5)
          .attr("width", function() {
            // Width is based on the length of word
            return characterLength;
          })
          .attr("height", 30)
          .attr("id", "node" + i)
          .classed("tooltip-wrapper", true);

        // Text description
        d3.select("svg#er")
          .append("text")
          .attr("x", mouse[0])
          .attr("y", mouse[1])
          .attr("dy", "-20")
          .attr("id", "node" + i)
          .text(d.name)
          .classed("tooltip", true);
      })
      .on("mouseout", function(d, i) {
        d3.selectAll("#node" + i).remove(); // Removes the on-hover information
      });
  }

  initEndoplasmicReticulum() {
    let newPoints = []; // array of new locations within organelle
    let nodesInOrganelle = [];
    let linksInOrganelle = [];

    let svg = d3.select("svg#er");
    let parts = [
      "endoplasmic reticulum membrane",
      "endoplasmic reticulum lumen",
      "endoplasmic reticulum cisternal network",
      "endoplasmic reticulum quality control compartment",
      "cytoplasmic side of endoplasmic reticulum membrane",
      "extrinsic component of endoplasmic reticulum membrane",
      "integral component of cytoplasmic side of endoplasmic reticulum membrane",
      "integral component of endoplasmic reticulum membrane",
      "integral component of lumenal side of endoplasmic reticulum membrane",
      "intrinsic component of endoplasmic reticulum membrane",
      "lumenal side of endoplasmic reticulum membrane",
      "integral component of endoplasmic reticulum-Golgi intermediate compartment (ERGIC) membrane",
      "intrinsic component of endoplasmic reticulum-Golgi intermediate compartment (ERGIC) membrane",
      "host cell endoplasmic reticulum lumen",
      "rough endoplasmic reticulum lumen",
      "lumenal side of rough endoplasmic reticulum membrane",
      "cytoplasmic side of rough endoplasmic reticulum membrane",
      "smooth endoplasmic reticulum lumen",
      "cytoplasmic side of smooth endoplasmic reticulum membrane",
      "lumenal side of smooth endoplasmic reticulum membrane"
    ];

    // TODO: Change this with a function that replaces Spaces with Underscores
    let organelleMapping = {
      "endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "endoplasmic reticulum membrane": "Endoplasmic_inner_membrane",
      "endoplasmic reticulum lumen": "Endoplasmic_intermembrane_space",
      "endoplasmic reticulum cisternal network": "Endoplasmic_outer_membrane",
      "endoplasmic reticulum quality control compartment": "Endoplasmic_outer_membrane",
      "cytoplasmic side of endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "extrinsic component of endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "integral component of cytoplasmic side of endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "integral component of endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "integral component of lumenal side of endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "intrinsic component of endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "lumenal side of endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "integral component of endoplasmic reticulum-Golgi intermediate compartment (ERGIC) membrane": "Endoplasmic_outer_membrane",
      "intrinsic component of endoplasmic reticulum-Golgi intermediate compartment (ERGIC) membrane": "Endoplasmic_outer_membrane",
      "host cell endoplasmic reticulum lumen": "Endoplasmic_outer_membrane",
      "rough endoplasmic reticulum lumen": "Endoplasmic_outer_membrane",
      "lumenal side of rough endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "cytoplasmic side of rough endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "smooth endoplasmic reticulum lumen": "Endoplasmic_outer_membrane",
      "cytoplasmic side of smooth endoplasmic reticulum membrane": "Endoplasmic_outer_membrane",
      "lumenal side of smooth endoplasmic reticulum membrane": "Endoplasmic_outer_membrane"
    };
    let colors = ["#ACEDFF", "#615D6C", "#80CFA9", "#BE5A38"];

    // Add the nodes
    parts.map((part, i) => {
      let components = this.props.data.nodes.filter(
        node => node.originalLocation == part
      );
      

      let path = d3.select(`#${organelleMapping[part]}`).node();
      let points = this.getPointsOnPath(path, components);

      newPoints.push(...points);
      nodesInOrganelle.push(...components);
    });
    this.placeNodes(svg, newPoints);

    linksInOrganelle = this.props.data.links.filter(link => {
      let source = nodesInOrganelle.find(node => node.id == link.source.id);
      let target = nodesInOrganelle.find(node => node.id == link.target.id);

      if (source != undefined && target != undefined) {
        return source.originalLocation == target.originalLocation;
      }
    });

    // Add the edges
    svg
      .append("g")
      .selectAll(".edge")
      .data(linksInOrganelle)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("stroke", "#888")
      .attr("stroke-width", 0.7)
      .attr("id", function(d) {
        return d.id;
      })
      .each(function(d) {
        const sourcePosition = newPoints.find(node => node.id == d.source.id);
        const targetPosition = newPoints.find(node => node.id == d.target.id);

        d3.select(this)
          .attr("x1", sourcePosition.x)
          .attr("y1", sourcePosition.y)
          .attr("x2", targetPosition.x)
          .attr("y2", targetPosition.y);
      });
  }

  render() {
    const { onOrganelleSelected } = this.props;

    return (
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" width="400mm" height="200mm" viewBox="0 0 210 297"
id="er">
    
        <path d="m -120.89475,117.49709 c -6.69665,6.68965 -6.19181,27.23597 -2.16934,39.98253 6.21204,19.68504 21.85722,36.26034 38.307678,49.02827 27.946592,21.69059 60.006959,32.7476 97.49185,42.88705 37.484892,10.13944 77.389737,16.10015 124.646652,12.47594 47.25693,-3.62419 107.08052,-18.18606 154.138,-43.03257 16.44324,-8.6821 31.98668,-20.58417 42.50456,-35.84418 10.34501,-15.0092 19.11681,-33.41671 18.06913,-51.61555 -0.31099,-5.40217 -1.11917,-12.53235 -7.08648,-14.60489 -5.9673,-2.07253 -15.98212,6.29751 -20.96149,14.21385 -4.97938,7.91633 -5.57563,16.27152 -10.59146,23.14442 -8.57885,11.755 -19.60303,22.29596 -32.33558,29.54428 -30.18903,17.18587 -99.9448,30.49152 -99.9448,30.49152 l -1.1484,-19.16031 c 0,0 32.4331,-11.00598 48.0427,-17.94603 18.37409,-8.16914 38.85483,-14.14857 53.48444,-27.79765 12.4475,-11.61324 22.89042,-31.10583 26.41464,-43.44965 3.5242,-12.34382 1.59316,-22.354745 -2.88398,-28.151835 -4.47714,-5.797091 -12.62129,-9.054473 -17.89056,-6.141315 -5.26928,2.913161 -6.10203,12.946803 -9.41738,19.484062 -3.31535,6.537257 -2.22307,11.606338 -10.08091,18.202328 -7.85784,6.59595 -32.97377,18.50642 -32.97377,18.50642 l -9.28976,-22.72953 c 0,0 25.92881,-16.310288 33.45859,-26.870111 7.52979,-10.559821 11.73326,-23.90729 11.73988,-32.937543 0.006,-9.030251 -3.43297,-14.819663 -6.45689,-18.202297 -3.02395,-3.382635 -3.85102,-4.092523 -7.04395,-3.467108 -3.19293,0.625413 -9.25538,3.363764 -11.30605,7.312204 -2.05067,3.948438 -2.14373,11.57223 -2.14373,11.57223 -2.59882,4.974714 -2.99584,12.624173 -10.02991,18.386964 -7.03408,5.76279 -17.33156,12.574633 -31.11062,18.202329 -13.77907,5.627694 -31.75589,10.667879 -51.65539,13.001729 C 130.9834,94.316498 103.58547,93.080218 83.965744,91.115859 64.346018,89.151507 47.691148,86.051332 33.484356,81.581222 19.277563,77.11111 8.2957416,72.622191 -1.1482069,65.979252 -10.592155,59.336315 -16.682653,51.817818 -22.866939,43.443072 c -4.91147,-6.651101 -4.234088,-18.557622 -11.96959,-21.669437 -4.610867,-1.854848 -10.808698,0.794061 -14.292007,4.296953 -5.398279,5.428622 -7.015496,14.369032 -6.278296,21.92798 1.096095,11.238939 7.971018,21.711782 15.465993,30.263309 9.804158,11.186231 36.8274684,25.514553 36.8274684,25.514553 l -6.6355449,23.48548 c 0,0 -31.6556565,-19.85372 -42.3655415,-34.486392 -5.174693,-7.070062 -4.398939,-20.78956 -9.570572,-24.380605 -5.171631,-3.591044 -4.226401,-2.87535 -11.408119,-0.304118 -7.181715,2.571233 -11.240649,7.663774 -12.224783,21.328389 -0.984136,13.664626 21.082415,46.241326 22.509943,45.413456 l -17.788447,24.08508 c 0,0 -9.06865,-16.22134 -12.939318,-24.64775 -3.189128,-6.94269 -1.578196,-17.77199 -8.447637,-21.29143 -5.75341,-2.94767 -12.21473,-2.17108 -18.91136,4.51855 z"
        id="path3773" fill="#edecfc" stroke="#5f5fd3" />
        <path d="m -37.278438,32.206311 c 6.346924,1.127825 5.144681,13.447822 9.510886,20.218447 4.366205,6.770627 11.684229,12.948425 21.086191,20.453071 9.4019624,7.504646 23.801485,14.993951 38.950927,20.620394 15.149442,5.626447 31.407483,9.511097 51.55269,11.783057 20.145204,2.27195 48.742024,2.72201 68.736924,0 19.99488,-2.72201 35.68373,-4.85755 52.16108,-12.82308 16.47735,-7.965524 34.59443,-22.404479 42.72234,-33.424468 8.12791,-11.019987 0.0174,-23.940014 6.26536,-24.735401 6.24792,-0.795386 6.76953,3.96967 7.79245,9.858312 1.02291,5.888643 1.36462,11.536167 -5.72809,22.829691 -7.09271,11.293523 -40.66937,36.420156 -40.66937,36.420156 l 13.49774,35.93576 c 0,0 38.23588,-15.63498 51.67751,-30.2789 5.71316,-6.22418 3.87212,-24.161998 13.54346,-25.473427 3.15076,-0.427242 5.70335,3.823722 6.52766,6.845217 1.48234,5.433501 -1.60702,11.28085 -3.89621,16.43631 -4.80391,10.81877 -8.76351,18.42462 -20.16739,29.34036 -11.40392,10.91577 -34.88347,21.5553 -52.6983,31.43233 -17.81485,9.87705 -52.74964,18.32619 -52.74964,18.32619 l 1.1855,38.68179 c 0,0 79.43173,-10.92698 114.00015,-29.52501 13.03749,-7.01425 22.84571,-18.95432 32.98457,-29.74224 6.65336,-7.07929 10.68481,-15.47487 13.80195,-26.37906 1.35037,-4.72378 2.43721,-13.27602 7.32605,-12.78936 4.52469,0.45042 4.62615,8.4048 4.31382,12.94112 -0.93276,13.54741 -9.90406,26.8011 -18.103,36.48755 -12.37413,14.61914 -26.51548,28.70938 -43.52763,37.50854 -45.64476,23.60876 -104.16854,34.45213 -149.62202,37.1566 -45.453466,2.7045 -83.977151,-1.55395 -119.830265,-11.73307 -35.853112,-10.17913 -65.945799,-22.52194 -92.794887,-43.45008 -12.741971,-9.93202 -23.006348,-23.25308 -30.472228,-37.45856 -3.8154,-7.25962 -8.72199,-15.59863 -6.87371,-23.56614 1.08515,-4.67775 3.68958,-13.55464 9.73775,-10.74461 6.04816,2.81002 4.04107,18.07973 8.365273,26.17734 4.991998,9.34813 19.815727,24.97163 19.815727,24.97163 l 27.494809,-37.55851 -15.773594,-25.86011 c -6.066735,-9.94614 -13.366574,-29.239691 -3.958697,-32.998231 8.337818,-3.331041 5.40796,14.24133 9.724534,20.42375 4.925574,7.054661 11.406441,12.985381 18.054864,18.446881 12.051255,9.89978 39.1556839,25.61206 39.1556839,25.61206 L 8.4499091,100.41079 c 0,0 -29.8967101,-16.03201 -40.2328131,-28.788584 -7.269822,-8.972242 -16.092613,-20.409598 -13.753114,-31.649579 0.763832,-3.669775 1.910658,-8.89414 8.25758,-7.766316 z"
        id="path3777" fill="#f1f4f1" stroke="#8787de"  />
        <path d="M 18.405976,102.79145 6.8671022,143.86706 c 0,0 28.5434868,7.84877 41.0411828,11.67072 12.497696,3.82195 17.685498,6.71895 26.620845,9.77084 11.280005,3.85271 21.627664,10.39437 19.864733,19.50539 -1.558738,8.05573 -14.526713,9.24729 -22.729362,9.44964 -27.005978,0.66622 -61.612433,-21.60452 -76.2760088,-27.38377 -14.6635752,-5.77923 -39.4349402,-23.3852 -39.4349402,-23.3852 l -20.794765,39.72013 c 0,0 51.128562,26.93614 83.463779,35.68747 32.335216,8.75135 85.884594,14.38492 109.325784,13.72597 23.44118,-0.65898 29.97645,-5.49038 29.97645,-5.49038 l 0.97295,-37.86739 c 0,0 -13.17271,6.69705 -19.45069,4.50724 -5.00231,-1.74483 -9.53476,-7.17628 -9.73535,-12.39305 -0.23231,-6.04178 4.28082,-13.32334 10.1406,-15.14964 l 77.6402,-24.19803 -13.9441,-33.38279 c 0,0 -31.29629,8.9314 -47.38693,11.0375 -23.79099,3.11401 -48.16066,5.28352 -71.965102,2.27066 -22.685213,-2.8712 -65.790402,-19.17092 -65.790402,-19.17092 z"
        id="path3775" fill="#edecfc" stroke="#5f5fd3"  />
        <path d="m 26.110663,116.56254 -5.852924,20.67031 c 0,0 21.191204,7.27111 31.707898,11.12662 13.261448,4.86176 27.8511,7.26377 39.577642,15.13721 5.962772,4.00352 13.459631,8.64669 14.742341,15.71334 1.0156,5.5951 -2.49432,11.76924 -6.555287,15.74984 -4.543106,4.45319 -11.429923,6.25223 -17.762802,6.97994 -18.669684,2.14527 -37.759383,-2.88577 -55.777739,-8.15084 -14.215231,-4.15375 -27.2692489,-11.53487 -40.436784,-18.24377 -9.482724,-4.83147 -27.710196,-15.81721 -27.710196,-15.81721 L -53.1865,179.66186 c 0,0 43.7697265,21.14356 74.113319,28.6713 30.343594,7.52772 82.492331,12.15612 104.137621,13.30587 21.64533,1.14975 23.47942,-0.45185 23.47942,-0.45185 l 2.17775,-20.88753 c 0,0 -12.9299,3.78999 -18.32405,0.95363 -6.79593,-3.57345 -12.00443,-11.9721 -11.80788,-19.54936 0.23599,-9.0974 6.66268,-19.66755 15.37525,-22.72975 l 66.52486,-23.38148 -6.98714,-14.67887 c 0,0 -27.76839,8.74419 -42.14952,10.5448 -22.99163,2.87871 -46.54503,3.20773 -69.530874,0.28461 -19.748852,-2.51144 -57.711593,-15.18069 -57.711593,-15.18069 z"
        id="path3779" fill="white" stroke="#55f"  />
        <path d="m -46.791998,59.288404 9.508463,14.262695 c 0,0 9.71517,10.541993 10.541993,10.955404 0.826823,0.413412 16.536459,10.335287 16.536459,10.335287 l 13.2291665,7.85482 -10.128581,29.97233 -0.8268229,1.44694 -41.3411466,-28.9388 -10.748698,-17.983402 -4.754232,-15.916342 c 0,0 -10.128581,2.480469 -11.16211,3.307292 -1.033529,0.826823 -4.960938,14.262696 -4.960938,14.262696 0,0 7.441407,21.497396 7.854818,22.324216 0.413412,0.82683 15.916342,26.04493 15.916342,26.04493 l -22.324219,30.17903 -17.156576,-24.39127 -4.75423,-23.35775 -9.30176,-3.30729 -8.06152,6.20117 -2.68718,14.26269 2.68718,21.4974 24.184567,30.38574 30.385743,25.63151 60.56478,25.83822 67.592775,14.2627 71.520195,2.48047 23.15104,-2.68718 71.9336,-15.29622 53.74349,-21.08399 29.97232,-20.46387 23.15104,-28.73209 10.33529,-23.56446 -0.62011,-20.05045 -4.96093,-3.72071 -7.23472,2.27377 -13.64258,26.25163 -6.20117,11.57552 -27.07844,27.07845 -39.89422,15.29622 -61.5983,14.88281 -9.50847,0.82683 -2.06706,-28.7321 45.47527,-15.91634 48.78255,-24.59798 24.80469,-24.59799 12.40234,-30.592444 -7.4414,-17.156576 -8.68165,-1.240235 -5.58104,7.234701 -9.30177,25.011394 -18.60351,12.40234 -25.4248,13.02247 -11.78224,-29.76563 31.00586,-23.77116 13.64258,-21.497396 1.86037,-19.843751 -6.20118,-10.335287 -8.06153,0.413412 -4.13412,4.754232 -1.03351,12.195638 -6.61459,14.676107 -19.43033,16.123048 -44.85515,17.569987 -74.41408,5.58106 c 0,0 -65.525714,-11.36882 -66.765949,-11.36882 -1.240234,0 -29.5589201,-14.055991 -29.5589201,-14.055991 l -28.1119799,-21.910807 -8.474935,-21.083985 -4.960938,-6.821289 -6.201172,1.860351 -5.167643,4.340821 -3.307292,9.095052 z"
        id="Endoplasmic_outer_membrane" fill="none" stroke="#000" strokeWidth="0" />
        <path d="m 22.041011,110.55143 -7.854818,30.17903 43.201499,13.84929 29.352227,9.71517 14.676091,11.98893 c 2.97855,3.85851 -0.92475,7.71701 -1.860335,11.57552 l -7.234714,8.26823 -26.251628,2.89388 c 0,0 -30.799155,-6.61458 -33.899741,-7.2347 -3.100586,-0.62012 -75.654299,-40.30762 -75.654299,-40.30762 l -15.50293,29.35222 68.8330098,31.21256 69.6598322,11.98893 44.855155,2.68718 28.73209,-1.44694 1.86036,-29.76563 -16.94987,3.10059 -11.16211,-10.12858 -1.44695,-11.98893 7.23471,-10.95541 27.07844,-11.16211 50.22951,-15.50293 -9.71519,-23.35775 c 0,0 -56.84406,12.19564 -60.77148,11.78223 -3.9274,-0.41341 -50.229482,0.62012 -50.229482,0.62012 l -42.7881,-10.33529 z"
        id="Endoplasmic_inner_membrane" fill="none" stroke="#000" strokeWidth="0" />
        <path d="m -39.247238,41.201651 8.474935,16.743164 21.9108081,22.427574 29.3522139,15.399578 28.732097,9.818523 c 0,0 41.134434,9.50846 43.924968,9.61182 2.790534,0.10335 39.997566,-1.13689 39.997566,-1.13689 l 57.46419,-8.68164 27.38851,-14.676105 -8.68164,14.882815 5.58106,13.22917 12.09228,27.59521 47.74901,-23.66781 1.75702,8.16488 -40.61769,23.66781 -74.62076,26.04492 4.85759,17.67334 -0.10337,29.66227 21.60077,1.34359 c 0,0 54.05353,-14.36605 54.777,-14.36605 0.72348,0 49.60938,-15.39957 49.60938,-15.39957 0,0 14.15934,-15.81299 14.57275,-15.81299 0.41341,0 -11.98893,19.53369 -11.98893,19.53369 l -54.05353,21.7041 -52.50326,12.29899 -42.58138,6.61458 -53.226735,0.20671 -73.27719,-11.47217 -63.1486,-23.25439 -32.452801,-22.73763 -24.701334,-23.04769 -7.44141,-17.05323 32.34945,34.10645 30.385743,-43.09814 -15.709636,-25.94158 24.494628,17.25993 28.2153344,20.87728 11.4721669,2.68718 -0.4134114,-14.57276 11.5755211,-35.13997 0.826823,-2.37712"
        id="Endoplasmic_intermembrane_space" fill="none" stroke="#000" strokeWidth="0" />
        <path d="m 31.962886,130.39518 78.961594,17.36328 76.48112,-15.29623 -72.76042,28.11198 -1.24023,41.34115 26.45833,7.028 -3.7207,8.26822 -85.989589,-7.4414 -89.296877,-35.9668"
        id="Endoplasmic_matrix" fill="none" stroke="#000" strokeWidth="0" />
    
</svg>
      </div>
    );
  }
}
