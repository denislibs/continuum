import { mount } from "@continuum-js/dom";
import { TodoApp } from "./todo";

mount(document.getElementById("app")!, () => <TodoApp />);
