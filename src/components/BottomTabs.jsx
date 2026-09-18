```jsx
import React from "react";

const modes = [
  {
    id: "BIG",
    description: "LARGE"
  },

  {
    id: "MEDIUM",
    description: "ANIMALS"
  },

  {
    id: "SMALL",
    description: "FAR PEOPLE"
  },

  {
    id: "FACE",
    description: "FACE"
  },

  {
    id: "LIP",
    description: "LIP READ"
  }
];

function BottomTabs({
  mode,
  setMode
}) {
  return (
    <nav className="bottom-tabs">
      {modes.map((item) => (
        <button
          key={item.id}
          className={`tab ${
            mode === item.id
              ? "active"
              : ""
          }`}
          onClick={() =>
            setMode(item.id)
          }
        >
          <span className="tab-name">
            {item.id}
          </span>

          <span className="tab-description">
            {item.description}
          </span>
        </button>
      ))}
    </nav>
  );
}

export default BottomTabs;
```
