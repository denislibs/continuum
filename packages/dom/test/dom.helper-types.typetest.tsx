// Compile-time contract of the public helper types (checked by `tsc -b`).
// The React-parity story: ComponentProps<"button">, a typed currentTarget on
// event handlers (our answer to React.MouseEvent<HTMLButtonElement>), and
// Reactive<T> for component props that accept behaviors.
import { state } from "@continuum-js/frp";
import type { ComponentProps, Reactive, Ref } from "@continuum-js/dom";

// ── ComponentProps ─────────────────────────────────────────────────────────

export function TagProps() {
  // of an intrinsic tag — typed attributes and events
  const props: ComponentProps<"button"> = {
    type: "submit",
    onClick: (e) => e.clientX,
  };
  // @ts-expect-error href is an <a> attribute, not a <button> one
  const bad: ComponentProps<"button"> = { href: "/x" };
  void props;
  void bad;
}

export function Card(props: { title: string; wide?: boolean }) {
  return <div>{props.title}</div>;
}

export function FnComponentProps() {
  // of a component function — its props type, extracted
  const props: ComponentProps<typeof Card> = { title: "hello", wide: true };
  // @ts-expect-error no such prop on Card
  const bad: ComponentProps<typeof Card> = { title: "x", tall: true };
  void props;
  void bad;
}

// ── typed currentTarget on handlers ────────────────────────────────────────

export function TypedCurrentTarget() {
  return (
    <div>
      <form
        onSubmit={(e) => {
          // no cast needed — the tag types its own currentTarget
          const form: HTMLFormElement = e.currentTarget;
          void form;
        }}
      />
      <button
        onClick={(e) => {
          const btn: HTMLButtonElement = e.currentTarget;
          void btn;
        }}
      />
      <input
        onKeyDown={(e) => {
          const value: string = e.currentTarget.value;
          void value;
        }}
      />
    </div>
  );
}

// ── Reactive / Ref ─────────────────────────────────────────────────────────

export function ReactiveProp() {
  const loading = state(false);
  const staticOk: Reactive<boolean> = true;
  const liveOk: Reactive<boolean> = loading;
  void staticOk;
  void liveOk;
}

export function RefHelper() {
  const setRef: Ref<HTMLInputElement> = (el) => {
    const input: HTMLInputElement = el;
    void input;
  };
  return <input ref={setRef} />;
}

// ── the polymorphic button (the docs recipe, pinned here) ──────────────────

type ButtonOwnProps = {
  variant?: "primary" | "secondary";
  loading?: Reactive<boolean>;
};
type ButtonProps =
  // `href?: never` closes the union excess-property hole: with an optional
  // discriminant, TS would otherwise accept link props on the button branch.
  | (ComponentProps<"button"> &
      ButtonOwnProps & { as?: "button"; href?: never })
  | (ComponentProps<"a"> & ButtonOwnProps & { as: "a" });

export function Button(props: ButtonProps) {
  const { as, variant = "primary", loading, ...rest } = props;
  const cls = `btn btn-${variant}`;
  return as === "a" ? (
    <a class={cls} {...(rest as ComponentProps<"a">)} />
  ) : (
    <button
      class={cls}
      disabled={loading}
      {...(rest as ComponentProps<"button">)}
    />
  );
}

export function PolymorphicUsage() {
  const saving = state(false);
  return (
    <div>
      {/* as a button: button props are accepted */}
      <Button type="submit" loading={saving} onClick={(e) => e.clientX}>
        Save
      </Button>
      {/* as a link: anchor props are accepted */}
      <Button as="a" href="/docs" target="_blank">
        Docs
      </Button>
      {/* @ts-expect-error href requires as="a" */}
      <Button href="/docs">nope</Button>
    </div>
  );
}
