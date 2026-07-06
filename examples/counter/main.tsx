import { h, mount } from "@continuum/dom";
import { Counter } from "./counter";

mount(document.getElementById("app")!, () => <Counter />);
