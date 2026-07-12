[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / combine

# Function: combine()

## Call Signature

> **combine**\<`A`, `B`, `R`\>(`a`, `b`, `f`): [`Wire`](../classes/Wire.md)\<`R`\>

Defined in: [index.ts:1299](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1299)

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

Defined in: [index.ts:1304](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1304)

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

Defined in: [index.ts:1310](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1310)

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

Defined in: [index.ts:1317](https://github.com/denislibs/continuum/blob/06378b217e7ab47a03a557199f3b883e3c7e30c6/packages/frp/src/index.ts#L1317)

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
