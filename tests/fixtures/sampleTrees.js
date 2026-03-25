export const basicTree = {
  type: "section",
  props: { className: "card", "data-kind": "article" },
  children: [
    {
      type: "h2",
      props: {},
      children: [{ type: "TEXT", props: { nodeValue: "Weekly menu" }, children: [] }],
    },
    {
      type: "p",
      props: { className: "lead" },
      children: [{ type: "TEXT", props: { nodeValue: "Kimchi stew" }, children: [] }],
    },
    {
      type: "ul",
      props: {},
      children: [
        { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "Egg roll" }, children: [] }] },
        { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "Seaweed soup" }, children: [] }] }
      ],
    },
  ],
};

export const updatedTree = {
  type: "section",
  props: { className: "card featured", "data-kind": "article" },
  children: [
    {
      type: "h2",
      props: {},
      children: [{ type: "TEXT", props: { nodeValue: "Weekly menu" }, children: [] }],
    },
    {
      type: "p",
      props: { className: "lead" },
      children: [{ type: "TEXT", props: { nodeValue: "Soybean paste stew" }, children: [] }],
    },
    {
      type: "ul",
      props: {},
      children: [
        { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "Egg roll" }, children: [] }] },
        { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "Seaweed soup" }, children: [] }] },
        { type: "li", props: {}, children: [{ type: "TEXT", props: { nodeValue: "Seasonal fruit" }, children: [] }] }
      ],
    },
  ],
};

export const replacedRootTree = {
  type: "article",
  props: { className: "notice" },
  children: [
    {
      type: "TEXT",
      props: { nodeValue: "" },
      children: [],
    },
    {
      type: "strong",
      props: {},
      children: [{ type: "TEXT", props: { nodeValue: "Emergency notice" }, children: [] }],
    },
  ],
};

export const deepTree = {
  type: "div",
  props: { id: "root" },
  children: [
    {
      type: "section",
      props: { className: "outer" },
      children: [
        {
          type: "article",
          props: { "data-depth": "2" },
          children: [
            {
              type: "p",
              props: {},
              children: [{ type: "TEXT", props: { nodeValue: "deep value" }, children: [] }],
            },
          ],
        },
      ],
    },
  ],
};
