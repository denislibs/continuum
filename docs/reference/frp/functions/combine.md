[**@continuum-js/frp**](../index.md)

***

[@continuum-js/frp](../index.md) / combine

# Function: combine()

## Call Signature

> **combine**\<`A`, `B`, `R`\>(`a`, `b`, `f`): [`Wire`](../classes/Wire.md)\<`R`\>

Defined in: [index.ts:1180](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L1180)

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

Defined in: [index.ts:1185](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L1185)

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

Defined in: [index.ts:1191](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L1191)

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

Defined in: [index.ts:1198](https://github.com/denislibs/continuum/blob/cc4617269797dda656aa4d28267b6b87666cd809/packages/frp/src/index.ts#L1198)

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
