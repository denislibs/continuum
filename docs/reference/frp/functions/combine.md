[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / combine

# Function: combine()

## Call Signature

> **combine**\<`A`, `B`, `R`\>(`a`, `b`, `f`): [`State`](../classes/State.md)\<`R`\>

Defined in: [index.ts:1535](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1535)

Combine states pointwise — the join of the graph. Data first, the combiner
last; simultaneous updates coalesce into ONE recompute per moment
(glitch-free, see FRP-MODEL §3).

### Type Parameters

#### A

`A`

#### B

`B`

#### R

`R`

### Parameters

#### a

[`State`](../classes/State.md)\<`A`\>

#### b

[`State`](../classes/State.md)\<`B`\>

#### f

(`a`, `b`) => `R`

### Returns

[`State`](../classes/State.md)\<`R`\>

## Call Signature

> **combine**\<`A`, `B`, `C`, `R`\>(`a`, `b`, `c`, `f`): [`State`](../classes/State.md)\<`R`\>

Defined in: [index.ts:1540](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1540)

Combine states pointwise — the join of the graph. Data first, the combiner
last; simultaneous updates coalesce into ONE recompute per moment
(glitch-free, see FRP-MODEL §3).

### Type Parameters

#### A

`A`

#### B

`B`

#### C

`C`

#### R

`R`

### Parameters

#### a

[`State`](../classes/State.md)\<`A`\>

#### b

[`State`](../classes/State.md)\<`B`\>

#### c

[`State`](../classes/State.md)\<`C`\>

#### f

(`a`, `b`, `c`) => `R`

### Returns

[`State`](../classes/State.md)\<`R`\>

## Call Signature

> **combine**\<`A`, `B`, `C`, `D`, `R`\>(`a`, `b`, `c`, `d`, `f`): [`State`](../classes/State.md)\<`R`\>

Defined in: [index.ts:1546](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1546)

Combine states pointwise — the join of the graph. Data first, the combiner
last; simultaneous updates coalesce into ONE recompute per moment
(glitch-free, see FRP-MODEL §3).

### Type Parameters

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

#### R

`R`

### Parameters

#### a

[`State`](../classes/State.md)\<`A`\>

#### b

[`State`](../classes/State.md)\<`B`\>

#### c

[`State`](../classes/State.md)\<`C`\>

#### d

[`State`](../classes/State.md)\<`D`\>

#### f

(`a`, `b`, `c`, `d`) => `R`

### Returns

[`State`](../classes/State.md)\<`R`\>

## Call Signature

> **combine**\<`A`, `B`, `C`, `D`, `E`, `R`\>(`a`, `b`, `c`, `d`, `e`, `f`): [`State`](../classes/State.md)\<`R`\>

Defined in: [index.ts:1553](https://github.com/denislibs/continuum/blob/a6efe14ab8b1da85f964b151c4700e6197236815/packages/frp/src/index.ts#L1553)

Combine states pointwise — the join of the graph. Data first, the combiner
last; simultaneous updates coalesce into ONE recompute per moment
(glitch-free, see FRP-MODEL §3).

### Type Parameters

#### A

`A`

#### B

`B`

#### C

`C`

#### D

`D`

#### E

`E`

#### R

`R`

### Parameters

#### a

[`State`](../classes/State.md)\<`A`\>

#### b

[`State`](../classes/State.md)\<`B`\>

#### c

[`State`](../classes/State.md)\<`C`\>

#### d

[`State`](../classes/State.md)\<`D`\>

#### e

[`State`](../classes/State.md)\<`E`\>

#### f

(`a`, `b`, `c`, `d`, `e`) => `R`

### Returns

[`State`](../classes/State.md)\<`R`\>
