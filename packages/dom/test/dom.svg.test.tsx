import { describe, test, expect } from "vitest";
import { mount } from "@continuum-js/dom";
import { newBehavior } from "@continuum-js/frp";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("SVG namespace", () => {
  test("svg and its children are created in the SVG namespace", () => {
    const svg = (
      <svg viewBox="0 0 100 100" width="100">
        <rect x="10" y="10" width="80" height="80" />
        <circle cx="50" cy="50" r="20" />
      </svg>
    ) as SVGElement;
    expect(svg.namespaceURI).toBe(SVG_NS);
    const rect = svg.querySelector("rect")!;
    const circle = svg.querySelector("circle")!;
    expect(rect.namespaceURI).toBe(SVG_NS);
    expect(circle.namespaceURI).toBe(SVG_NS);
  });

  test("attributes are set with their case preserved", () => {
    const svg = (<svg viewBox="0 0 10 10" />) as SVGElement;
    expect(svg.getAttribute("viewBox")).toBe("0 0 10 10");
  });

  test("class on an SVG element uses setAttribute (no throw)", () => {
    const svg = (<svg class="chart" />) as SVGElement;
    expect(svg.getAttribute("class")).toBe("chart");
  });

  test("reactive attribute binding works on SVG", () => {
    const [fill, setFill] = newBehavior("red");
    const container = document.createElement("div");
    mount(container, () => (
      <svg>
        <rect fill={fill} />
      </svg>
    ));
    const rect = container.querySelector("rect")!;
    expect(rect.getAttribute("fill")).toBe("red");
    setFill("blue");
    expect(rect.getAttribute("fill")).toBe("blue");
  });

  test("HTML inside foreignObject stays HTML", () => {
    const svg = (
      <svg>
        <foreignObject>
          <div id="html">hi</div>
        </foreignObject>
      </svg>
    ) as SVGElement;
    const div = svg.querySelector("#html")!;
    expect(div.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
  });
});
