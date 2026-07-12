// The classic krausest-style vanilla baseline: template row cloneNode +
// event delegation on tbody + direct DOM surgery. Same DOM structure and
// selectors as the Continuum app, so bench.mjs drives it unchanged.
//
// innerHTML below is applied ONLY to static developer-authored template
// literals (that is the very technique this baseline measures); all dynamic
// data (ids, labels) flows through Text nodes — nothing untrusted ever
// reaches innerHTML.

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
  label: string;
  el: HTMLTableRowElement;
  labelNode: Text;
}

let idCounter = 1;
const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)];
const buildLabel = () => `${pick(ADJECTIVES)} ${pick(COLOURS)} ${pick(NOUNS)}`;

const app = document.createElement("div");
app.className = "container";
app.innerHTML = `
  <div class="jumbotron"><div class="row">
    <div class="col-md-6"><h1>Vanilla</h1></div>
    <div class="col-md-6"><div class="row">
      <div class="col-sm-6 smallpad"><button id="run" class="btn btn-primary btn-block" type="button">Create 1,000 rows</button></div>
      <div class="col-sm-6 smallpad"><button id="runlots" class="btn btn-primary btn-block" type="button">Create 10,000 rows</button></div>
      <div class="col-sm-6 smallpad"><button id="add" class="btn btn-primary btn-block" type="button">Append 1,000 rows</button></div>
      <div class="col-sm-6 smallpad"><button id="update" class="btn btn-primary btn-block" type="button">Update every 10th row</button></div>
      <div class="col-sm-6 smallpad"><button id="clear" class="btn btn-primary btn-block" type="button">Clear</button></div>
      <div class="col-sm-6 smallpad"><button id="swaprows" class="btn btn-primary btn-block" type="button">Swap Rows</button></div>
    </div></div>
  </div></div>
  <table class="table table-hover table-striped test-data"><tbody></tbody></table>
  <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
`;
document.getElementById("main")!.appendChild(app);
const tbody = app.querySelector("tbody")!;

const rowTmpl = document.createElement("template");
rowTmpl.innerHTML = `<tr><td class="col-md-1"></td><td class="col-md-4"><a class="lbl"></a></td><td class="col-md-1"><a class="remove"><span class="remove glyphicon glyphicon-remove" aria-hidden="true"></span></a></td><td class="col-md-6"></td></tr>`;

let rows: Row[] = [];
let selected: Row | null = null;

function makeRow(): Row {
  const el = rowTmpl.content.firstChild!.cloneNode(true) as HTMLTableRowElement;
  const id = idCounter++;
  const label = buildLabel();
  el.firstChild!.textContent = String(id);
  const a = (el.childNodes[1] as HTMLElement).firstChild as HTMLElement;
  const labelNode = document.createTextNode(label);
  a.appendChild(labelNode);
  const row: Row = { id, label, el, labelNode };
  (el as unknown as { $row: Row }).$row = row;
  return row;
}

function buildRows(n: number): Row[] {
  const out = new Array<Row>(n);
  for (let i = 0; i < n; i++) out[i] = makeRow();
  return out;
}

function appendAll(list: Row[]): void {
  const frag = document.createDocumentFragment();
  for (const r of list) frag.appendChild(r.el);
  tbody.appendChild(frag);
}

function clearAll(): void {
  rows = [];
  selected = null;
  tbody.textContent = "";
}

document.getElementById("run")!.onclick = () => {
  clearAll();
  rows = buildRows(1000);
  appendAll(rows);
};
document.getElementById("runlots")!.onclick = () => {
  clearAll();
  rows = buildRows(10000);
  appendAll(rows);
};
document.getElementById("add")!.onclick = () => {
  const more = buildRows(1000);
  rows = rows.concat(more);
  appendAll(more);
};
document.getElementById("update")!.onclick = () => {
  for (let i = 0; i < rows.length; i += 10) {
    rows[i].label += " !!!";
    rows[i].labelNode.data = rows[i].label;
  }
};
document.getElementById("clear")!.onclick = clearAll;
document.getElementById("swaprows")!.onclick = () => {
  if (rows.length > 998) {
    const a = rows[1];
    const b = rows[998];
    rows[1] = b;
    rows[998] = a;
    const afterB = b.el.nextSibling;
    tbody.insertBefore(b.el, a.el);
    tbody.insertBefore(a.el, afterB);
  }
};

tbody.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const tr = target.closest("tr") as
    (HTMLTableRowElement & { $row?: Row }) | null;
  if (!tr?.$row) return;
  const row = tr.$row;
  if (target.closest("a.remove")) {
    rows.splice(rows.indexOf(row), 1);
    tr.remove();
    if (selected === row) selected = null;
  } else {
    if (selected) selected.el.className = "";
    selected = row;
    tr.className = "danger";
  }
});
