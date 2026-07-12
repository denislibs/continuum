/* @jsxImportSource solid-js */
// The standard Solid keyed implementation (signals + <For>), compiled by
// vite-plugin-solid — the fair "compiled templates" baseline. Same DOM
// structure and selectors as the Continuum app.
import { createSignal, batch, type Accessor, type Setter } from "solid-js";
import { For } from "solid-js";
import { render } from "solid-js/web";

const ADJECTIVES =
  "pretty large big small tall short long handsome plain quaint clean elegant easy angry crazy helpful mushy odd unsightly adorable important inexpensive cheap expensive fancy".split(
    " ",
  );
const COLOURS =
  "red yellow blue green pink brown purple brown white black orange".split(" ");
const NOUNS =
  "table chair house bbq desk car pony cookie sandwich burger pizza mouse keyboard".split(
    " ",
  );

interface Row {
  id: number;
  label: Accessor<string>;
  setLabel: Setter<string>;
}

let idCounter = 1;
const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)];
const buildLabel = () => `${pick(ADJECTIVES)} ${pick(COLOURS)} ${pick(NOUNS)}`;

function buildRows(n: number): Row[] {
  const out = new Array<Row>(n);
  for (let i = 0; i < n; i++) {
    const [label, setLabel] = createSignal(buildLabel());
    out[i] = { id: idCounter++, label, setLabel };
  }
  return out;
}

function App() {
  const [rows, setRows] = createSignal<Row[]>([]);
  const [selected, setSelected] = createSignal<number | null>(null);

  const run = () => setRows(buildRows(1000));
  const runLots = () => setRows(buildRows(10000));
  const add = () => setRows((r) => r.concat(buildRows(1000)));
  const update = () =>
    batch(() => {
      const r = rows();
      for (let i = 0; i < r.length; i += 10) r[i].setLabel((l) => l + " !!!");
    });
  const clear = () =>
    batch(() => {
      setRows([]);
      setSelected(null);
    });
  const swapRows = () =>
    setRows((r) => {
      if (r.length <= 998) return r;
      const copy = r.slice();
      const t = copy[1];
      copy[1] = copy[998];
      copy[998] = t;
      return copy;
    });
  const remove = (id: number) => setRows((r) => r.filter((x) => x.id !== id));

  const Button = (p: { id: string; text: string; fn: () => void }) => (
    <div class="col-sm-6 smallpad">
      <button
        id={p.id}
        class="btn btn-primary btn-block"
        type="button"
        onClick={p.fn}
      >
        {p.text}
      </button>
    </div>
  );

  return (
    <div class="container">
      <div class="jumbotron">
        <div class="row">
          <div class="col-md-6">
            <h1>Solid</h1>
          </div>
          <div class="col-md-6">
            <div class="row">
              <Button id="run" text="Create 1,000 rows" fn={run} />
              <Button id="runlots" text="Create 10,000 rows" fn={runLots} />
              <Button id="add" text="Append 1,000 rows" fn={add} />
              <Button id="update" text="Update every 10th row" fn={update} />
              <Button id="clear" text="Clear" fn={clear} />
              <Button id="swaprows" text="Swap Rows" fn={swapRows} />
            </div>
          </div>
        </div>
      </div>
      <table class="table table-hover table-striped test-data">
        <tbody>
          <For each={rows()}>
            {(row) => (
              <tr class={selected() === row.id ? "danger" : ""}>
                <td class="col-md-1">{row.id}</td>
                <td class="col-md-4">
                  <a class="lbl" onClick={() => setSelected(row.id)}>
                    {row.label()}
                  </a>
                </td>
                <td class="col-md-1">
                  <a class="remove" onClick={() => remove(row.id)}>
                    <span
                      class="remove glyphicon glyphicon-remove"
                      aria-hidden="true"
                    />
                  </a>
                </td>
                <td class="col-md-6" />
              </tr>
            )}
          </For>
        </tbody>
      </table>
      <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
    </div>
  );
}

render(() => <App />, document.getElementById("main")!);
