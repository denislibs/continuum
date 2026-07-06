import { mount } from "@continuum-js/dom";
import { Counter } from "./counter";

mount(document.getElementById("app")!, () => <Counter />);
