# Layout

::: tip Простыми словами
Размеры, видимость и позиция скролла входят в сеть как состояния; редкое измерение, которое нужно снять руками, идёт через `measure`. Единственное, чего стоит избегать — читать layout внутри `listen`/`onMount`: это форсирует reflow между записями рендерера.
:::

Layout — внешний мир. Писать в него — работа рендерера; **читать** его —
эффект, а у эффектов есть своё место: кадровый проход. Этот гайд — третий
закон модели на практике — _layout есть эффект_ — и API, который делает
правильное простым.

## Почему проблема именно в чтениях

Браузер пересчитывает стили и layout лениво: запись лишь помечает дерево
грязным, а цена приходит, когда кто-то **читает** layout-значение при грязном
дереве — это форсирует синхронный reflow. Чередуй запись, чтение, запись,
чтение — и платишь по reflow за каждое чтение. Это «layout thrashing», и в
списке на пару сотен строк это разница между 60 fps и дёрганьем.

Рендерер пишет в кадровом проходе. Колбэк `listen`, `onMount` или `perform`
тоже выполняется в этом проходе — значит, чтение layout там попадает ровно
между записями. Strict-режим devtools это сообщает, lint-правило
`no-layout-reads-in-effects` ловит статически, а API ниже туда просто не
пускает.

## Размеры, видимость, скролл: layout как State

У браузера уже есть своя measure-фаза: `ResizeObserver` и
`IntersectionObserver` вызываются после layout, до paint, с уже посчитанными
значениями — чтение ничего не форсирует. `@continuum-js/dom/layout`
превращает их в состояния:

```tsx
import {
  createSize,
  createVisibility,
  createScroll,
} from "@continuum-js/dom/layout";

function Chart() {
  const el = (<div class="chart" />) as HTMLElement;
  const size = createSize(el); // State<{ width, height }>
  const visible = createVisibility(el); // State<boolean>
  const scroll = createScroll(window); // State<{ top, left }>
  const bars = combine(size, data, (s, d) => layoutBars(d, s.width));
  return (
    <div>
      {el}
      <Show when={visible}>{() => <Legend bars={bars} />}</Show>
    </div>
  );
}
```

`size`, `visible` и `scroll` — обычные состояния: их можно `map`-ить,
комбинировать, привязывать. Они регистрируются во владельце компонента
(`createX` по конвенции) и отключаются при размонтировании. В вашем коде нет
ни одного чтения layout.

## `measure`: чтение, которое нужно снять самому

У некоторых измерений нет observer'а — высота скролла после вставки, смещение
элемента внутри родителя, вычисленный стиль. `measure` — это чтение layout как
эффект:

```ts
measure<A, B>(trigger: Stream<A>, read: (a: A) => B): Stream<B>
```

На каждое происшествие `trigger` функция `read` выполняется в кадровом
проходе — **после записей этого момента, до paint**, вместе со всеми другими
измерениями кадра — и её результат входит в сеть происшествием возвращённого
потока. Чтения батчируются: все измерения кадра идут подряд, так что кадр
платит максимум один reflow. Их результаты входят **одним моментом**, так что
вызванные ими записи тоже схлопываются в один проход.

Из «одно происшествие на момент» следуют два правила: измерение читает не
чаще **раза на кадр**, с последним значением триггера (промежуточные
теряются), а `read`, бросивший исключение, не останавливает остальные —
ошибка всплывает из кадрового прохода.

### Скролл-якорь при подгрузке истории

Классика. Когда старые сообщения добавляются сверху, удержать viewport на
месте:

```tsx
import { measure } from "@continuum-js/dom/layout";

function MessageList(props: {
  messages: State<Message[]>;
  loadOlder: Stream<void>;
}) {
  const list = (<div class="messages" />) as HTMLElement;
  const inserted = props.messages.updates; // срабатывает при смене списка

  // читаем ДО того, как вставка попадёт в DOM (кадр запроса) …
  const before = measure(props.loadOlder, () => ({
    height: list.scrollHeight,
    top: list.scrollTop,
  })).hold(null);
  // … и ПОСЛЕ (кадр вставки, всё ещё до paint)
  const after = measure(inserted, () => list.scrollHeight);

  before
    .at(after, (b, height) => (b ? b.top + (height - b.height) : null))
    .listen((top) => {
      if (top != null) list.scrollTop = top; // запись — эффектам можно писать
    });

  return list;
}
```

Пользователь прыжка не видит: поправка записывается в том же кадре, где
появились новые строки, до того как браузер отрисует хоть что-то.

Из кадрового прохода следует одно правило: чтение, которое должно случиться
**до** записи, не может жить в эффекте, который эту запись выполняет —
эффекты бегут после записей раунда. Сделайте запись _следствием_
измерения: сначала measure, запись — в слушателе результата. Выше запрос
`loadOlder` уходит в сеть, поэтому «до»-чтение естественно оказывается на
кадр раньше вставки; когда prepend синхронный (окно растёт из уже
загруженного), форма такая:
`measure(reachedTop, snapshot).listen((a) => { anchor.set(a); limit.update(…) })`
— спайк `examples/tweb-a` делает ровно это.

## Явный выход: `forceMeasure`

Сторонний виджет меряет при инициализации, а инициализируется он в
`onMount`. Это чтение намеренное — так и скажите:

```tsx
import { forceMeasure } from "@continuum-js/dom/layout";

onMount(() => forceMeasure(() => new Chart(el)));
```

`forceMeasure` приостанавливает зону эффектов на время колбэка: и strict-режим,
и lint-правило видят намерение. То же касается `input.focus()` в `onMount` —
`focus()` форсирует layout — так что канонический «фокус при монтировании»
пишется как `onMount(() => forceMeasure(() => input.focus()))`.

## Замереть на время анимации

Переход между страницами и список, который в это же время reconcile-ится,
дерутся за кадр. Пометьте анимацию и придержите дорогой регион:

```tsx
import {
  beginHeavyAnimation,
  isHeavyAnimating,
} from "@continuum-js/dom/layout";
import { holdWhile } from "@continuum-js/std";

const end = beginHeavyAnimation(300); // или пусть закончит длительность
panel.addEventListener("transitionend", end, { once: true });

<Each each={holdWhile(messages, isHeavyAnimating)} by={(m) => m.id}>
  {(m) => <Row message={m} />}
</Each>;
```

`holdWhile` замораживает список, пока гейт включён, и догоняет одним шагом,
когда он выключается; текстовые и атрибутные привязки в других местах
продолжают обновляться.

## Увидеть это

Поставьте devtools в разработке — скаффолд уже делает это:

```ts
if (import.meta.env.DEV) {
  const { installDevtools } = await import("@continuum-js/devtools");
  installDevtools();
}
```

Strict-режим бросает ошибку на чтение layout внутри эффекта, называя
свойство и указывая на `measure`/`forceMeasure`; оверлей показывает живые
scope'ы, подписки, моменты в секунду и число нарушений.
