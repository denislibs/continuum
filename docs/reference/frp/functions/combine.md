[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / combine

# Function: combine()

## Call Signature

> **combine**\<`A`, `B`, `R`\>(`a`, `b`, `f`): [`Wire`](../classes/Wire.md)\<`R`\>

Defined in: [index.ts:1207](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1207)

Combine wires pointwise — the join of the graph. Data first, the combiner
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

[`Wire`](../classes/Wire.md)\<`A`\>

#### b

[`Wire`](../classes/Wire.md)\<`B`\>

#### f

(`a`, `b`) => `R`

### Returns

[`Wire`](../classes/Wire.md)\<`R`\>

## Call Signature

> **combine**\<`A`, `B`, `C`, `R`\>(`a`, `b`, `c`, `f`): [`Wire`](../classes/Wire.md)\<`R`\>

Defined in: [index.ts:1212](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1212)

Combine wires pointwise — the join of the graph. Data first, the combiner
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

[`Wire`](../classes/Wire.md)\<`A`\>

#### b

[`Wire`](../classes/Wire.md)\<`B`\>

#### c

[`Wire`](../classes/Wire.md)\<`C`\>

#### f

(`a`, `b`, `c`) => `R`

### Returns

[`Wire`](../classes/Wire.md)\<`R`\>

## Call Signature

> **combine**\<`A`, `B`, `C`, `D`, `R`\>(`a`, `b`, `c`, `d`, `f`): [`Wire`](../classes/Wire.md)\<`R`\>

Defined in: [index.ts:1218](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1218)

Combine wires pointwise — the join of the graph. Data first, the combiner
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

[`Wire`](../classes/Wire.md)\<`A`\>

#### b

[`Wire`](../classes/Wire.md)\<`B`\>

#### c

[`Wire`](../classes/Wire.md)\<`C`\>

#### d

[`Wire`](../classes/Wire.md)\<`D`\>

#### f

(`a`, `b`, `c`, `d`) => `R`

### Returns

[`Wire`](../classes/Wire.md)\<`R`\>

## Call Signature

> **combine**\<`A`, `B`, `C`, `D`, `E`, `R`\>(`a`, `b`, `c`, `d`, `e`, `f`): [`Wire`](../classes/Wire.md)\<`R`\>

Defined in: [index.ts:1225](https://github.com/denislibs/continuum/blob/cd06cfd704b2e2e6c2e5200a78b1a8b9bff05997/packages/frp/src/index.ts#L1225)

Combine wires pointwise — the join of the graph. Data first, the combiner
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

[`Wire`](../classes/Wire.md)\<`A`\>

#### b

[`Wire`](../classes/Wire.md)\<`B`\>

#### c

[`Wire`](../classes/Wire.md)\<`C`\>

#### d

[`Wire`](../classes/Wire.md)\<`D`\>

#### e

[`Wire`](../classes/Wire.md)\<`E`\>

#### f

(`a`, `b`, `c`, `d`, `e`) => `R`

### Returns

[`Wire`](../classes/Wire.md)\<`R`\>
