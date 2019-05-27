import * as Yup from "yup";
export const ColorPalletes = [
  "#e6194b",
  "#3cb44b",
  "#f58231",
  "#4363d8",
  "#911eb4",
  "#46f0f0",
  "#ffe119",
  "#f032e6",
  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#9a6324",
  "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000075",
  "#808080",
  "#ff4d4d",
  "#b3ffc9",
  "#80ffa5",
  "#4dff81",
  "#ffffb3",
  "#ffff80",
  "#ffff4d",
  "#ffd9b3",
  "#ffbf80",
  "#ffa64d",
  "#b3b3ff",
  "#8080ff",
  "#4d4dff",
  "#d9d9d9",
  "#bfbfbf",
  "#a6a6a6"
];

const NodeSchema = Yup.object().shape({
  id: Yup.string().required(),
  location: Yup.string()
});
const LinkSchema = Yup.object().shape({
  source: Yup.string().required(),
  target: Yup.string().required()
});

export const GraphSchema = Yup.object().shape({
  nodes: Yup.array()
    .of(NodeSchema)
    .required(),
  links: Yup.array()
    .of(LinkSchema)
    .required()
});
