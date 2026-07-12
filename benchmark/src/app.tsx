import { newBehavior, selector, type Behavior } from "@continuum-js/frp";
import { Each } from "@continuum-js/dom";
import { buildRows, swap, type Row } from "./data";

// The standard js-framework-benchmark "keyed" table. Operations mutate a plain
// array and publish a fresh reference; `<Each by={id}>` reconciles with minimal
// DOM moves, and each row's label is its own behavior so `update` patches a
// single text node without re-rendering the row.
export function App() {
  let data: Row[] = [];
  const [rows, setRows] = newBehavior<Row[]>(data);
  const [selected, setSelected] = newBehavior<number | null>(null);
  // keyed selection: one watcher + a tiny cell per row — O(2) per click
  const rowClass = selector(selected, "danger", "");

  const publish = () => setRows(data);
  const run = () => {
    data = buildRows(1000);
    publish();
  };
  const runLots = () => {
    data = buildRows(10000);
    publish();
  };
  const add = () => {
    data = data.concat(buildRows(1000));
    publish();
  };
  const update = () => {
    for (let i = 0; i < data.length; i += 10) {
      data[i].setLabel(data[i].label.sample() + " !!!");
    }
  };
  const clear = () => {
    data = [];
    setSelected(null);
    publish();
  };
  const swapRows = () => {
    data = swap(data, 1, 998);
    publish();
  };
  const remove = (id: number) => {
    data = data.filter((r) => r.id !== id);
    publish();
  };

  const button = (id: string, label: string, onClick: () => void) => (
    <div class="col-sm-6 smallpad">
      <button
        id={id}
        class="btn btn-primary btn-block"
        type="button"
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  );

  return (
    <div class="container">
      <div class="jumbotron">
        <div class="row">
          <div class="col-md-6">
            <h1>Continuum</h1>
          </div>
          <div class="col-md-6">
            <div class="row">
              {button("run", "Create 1,000 rows", run)}
              {button("runlots", "Create 10,000 rows", runLots)}
              {button("add", "Append 1,000 rows", add)}
              {button("update", "Update every 10th row", update)}
              {button("clear", "Clear", clear)}
              {button("swaprows", "Swap Rows", swapRows)}
            </div>
          </div>
        </div>
      </div>
      <table class="table table-hover table-striped test-data">
        <tbody>
          <Each each={rows} by={(r) => r.id}>
            {(r) => (
              <TableRow
                row={r}
                rowClass={rowClass}
                onSelect={setSelected}
                onRemove={remove}
              />
            )}
          </Each>
        </tbody>
      </table>
      <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
    </div>
  );
}

function TableRow(props: {
  row: Row;
  rowClass: (id: number) => Behavior<string>;
  onSelect: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const { row, rowClass: cls, onSelect, onRemove } = props;
  const rowClass = cls(row.id);
  const onClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("a.remove")) onRemove(row.id);
    else onSelect(row.id);
  };
  return (
    <tr class={rowClass} onClick={onClick}>
      <td class="col-md-1">{row.id}</td>
      <td class="col-md-4">
        <a class="lbl">{row.label}</a>
      </td>
      <td class="col-md-1">
        <a class="remove">
          <span class="remove glyphicon glyphicon-remove" aria-hidden="true" />
        </a>
      </td>
      <td class="col-md-6" />
    </tr>
  );
}
