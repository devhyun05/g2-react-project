export function createListTree(itemCount, options = {}) {
  const {
    className = "load-list",
    prefix = "item",
    includeProps = true,
  } = options;

  return {
    type: "ul",
    props: includeProps ? { className, "data-size": String(itemCount) } : {},
    children: Array.from({ length: itemCount }, (_, index) => ({
      type: "li",
      props: includeProps ? { "data-index": String(index) } : {},
      children: [
        {
          type: "TEXT",
          props: { nodeValue: `${prefix}-${index}` },
          children: [],
        },
      ],
    })),
  };
}

export function createMutatedListTree(itemCount, options = {}) {
  const {
    className = "load-list hot",
    prefix = "item",
    changedEvery = 3,
    appendCount = 0,
  } = options;

  const total = itemCount + appendCount;

  return {
    type: "ul",
    props: { className, "data-size": String(total) },
    children: Array.from({ length: total }, (_, index) => ({
      type: "li",
      props: { "data-index": String(index) },
      children: [
        {
          type: "TEXT",
          props: {
            nodeValue:
              index < itemCount && index % changedEvery !== 0
                ? `${prefix}-${index}`
                : `${prefix}-${index}-changed`,
          },
          children: [],
        },
      ],
    })),
  };
}

export function createNestedTree(depth, breadth, label = "node") {
  function buildNode(level, indexPath) {
    if (level === depth) {
      return {
        type: "TEXT",
        props: { nodeValue: `${label}:${indexPath.join(".") || "root"}` },
        children: [],
      };
    }

    return {
      type: "div",
      props: {
        className: `depth-${level}`,
        "data-path": indexPath.join(".") || "root",
      },
      children: Array.from({ length: breadth }, (_, childIndex) =>
        buildNode(level + 1, [...indexPath, childIndex]),
      ),
    };
  }

  return buildNode(0, []);
}
