import { h, mount } from "@continuum/dom";
import { TodoApp } from "./todo";

mount(document.getElementById("app")!, () => <TodoApp />);
