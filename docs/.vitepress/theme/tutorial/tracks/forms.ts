import type { Track } from "../types";

// The Forms track: inputs without the boilerplate. `bindInput` is a two-way
// binding; validation and "can I submit?" are just derived state (a formula),
// never a flag you keep in sync by hand. Every solution is verified by its
// check in the e2e run.

export const forms: Track = {
  id: "forms",
  title: "Forms",
  blurb: "Inputs without boilerplate: bind, validate, derive, gate submit.",
  steps: [
    {
      id: "bind",
      title: "Two-way input",
      task: `\`bindInput(state)\` wires an \`<input>\` both ways: it shows the state's value
and writes back on every keystroke. Spread it onto the input — one call, no
\`onChange\` boilerplate.

**Goal:** greet the name as it's typed.`,
      starter: `import { state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const name = state('');
  return (
    <div>
      <input placeholder="your name" />
      <p>hello, {name}</p>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const name = state('');
  return (
    <div>
      <input {...bindInput(name)} placeholder="your name" />
      <p>hello, {name}</p>
    </div>
  );
}`,
      hint: "Spread the binding onto the input: <input {...bindInput(name)} />",
      check: ({ render, type, App }) => {
        const { container } = render(App);
        type(container.querySelector("input")!, "Sam");
        return /hello,\s*Sam/.test(container.textContent!);
      },
    },
    {
      id: "validate",
      title: "Validation is a formula",
      task: `"Is this form valid?" isn't a flag you flip — it's a value **computed** from
the fields. Derive it with \`.map\`, and bind it straight to the button's
\`disabled\`. It can never drift out of sync with the input.

**Goal:** disable **sign up** until the email contains \`@\`.`,
      starter: `import { state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const email = state('');
  const invalid = email.map((e) => !e.includes('@'));
  return (
    <div>
      <input {...bindInput(email)} placeholder="email" />
      <button>sign up</button>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const email = state('');
  const invalid = email.map((e) => !e.includes('@'));
  return (
    <div>
      <input {...bindInput(email)} placeholder="email" />
      <button disabled={invalid}>sign up</button>
    </div>
  );
}`,
      hint: "Bind the derived state to the attribute: <button disabled={invalid}>",
      check: ({ render, type, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        if (!btn.disabled) return false; // empty email → disabled
        type(container.querySelector("input")!, "me@site.com");
        return btn.disabled === false; // now valid → enabled
      },
    },
    {
      id: "checkbox",
      title: "A checkbox is a boolean",
      task: `A checkbox binds to a \`state(false)\`: read it through \`checked\`, write it
back on \`change\`. Then gate the button on that same state — one source of
truth for "did they agree?".

**Goal:** enable **continue** only once the box is checked.`,
      starter: `import { state } from '@continuum-js/frp';

export default function App() {
  const agree = state(false);
  return (
    <div>
      <label>
        <input type="checkbox" />
        I agree
      </label>
      <button disabled={agree.map((a) => !a)}>continue</button>
    </div>
  );
}`,
      solution: `import { state } from '@continuum-js/frp';

export default function App() {
  const agree = state(false);
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => agree.set(e.target.checked)}
        />
        I agree
      </label>
      <button disabled={agree.map((a) => !a)}>continue</button>
    </div>
  );
}`,
      hint: "checked={agree} reads it; onChange={(e) => agree.set(e.target.checked)} writes it back.",
      check: ({ render, click, App }) => {
        const { container } = render(App);
        const btn = container.querySelector("button")!;
        if (!btn.disabled) return false; // unchecked → disabled
        click(container.querySelector("input")!); // toggle the checkbox
        return btn.disabled === false; // checked → enabled
      },
    },
    {
      id: "combine",
      title: "Many fields, one value",
      task: `\`combine(a, b, fn)\` joins several states into one derived value that
recomputes when **either** changes — glitch-free, once per moment. Perfect for
a preview, a full name, or a submit payload built from the whole form.

**Goal:** show the full name from the two fields.`,
      starter: `import { state, combine } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const first = state('');
  const last = state('');
  // combine both fields into one:
  const full = first;
  return (
    <div>
      <input {...bindInput(first)} placeholder="first" />
      <input {...bindInput(last)} placeholder="last" />
      <p>full: {full}</p>
    </div>
  );
}`,
      solution: `import { state, combine } from '@continuum-js/frp';
import { bindInput } from '@continuum-js/dom';

export default function App() {
  const first = state('');
  const last = state('');
  const full = combine(first, last, (f, l) => (f + ' ' + l).trim());
  return (
    <div>
      <input {...bindInput(first)} placeholder="first" />
      <input {...bindInput(last)} placeholder="last" />
      <p>full: {full}</p>
    </div>
  );
}`,
      hint: "const full = combine(first, last, (f, l) => (f + ' ' + l).trim());",
      check: ({ render, type, App }) => {
        const { container } = render(App);
        const [first, last] = container.querySelectorAll("input");
        type(first, "Ada");
        type(last, "Lovelace");
        return /full:\s*Ada Lovelace/.test(container.textContent!);
      },
    },
  ],
};
