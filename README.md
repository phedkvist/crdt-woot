# CRDT WOOT

A collaborative text editor implemented using the CRDT algorithm WOOT.

WOOT (Without Operational Transformation) is an algorithm created by Gérald Oster, Pascal Urso, Pascal Molli, Abdessamad Imine, published on 6 Nov 2006, in a research paper named [Data Consistency for P2P Collaborative Editing](https://hal.inria.fr/inria-00108523/document).

As all CRDT (Conflict Free Replicated Data-types) based algorithms, the data type is constructed such that no conflict can occur. As long as all operations are sent to all replicas, all replicas converge to the same state. CRDTs allows all replicas to communicate in a peer-to-peer network, using for example a gossip protocol. The operations that are sent to each replica, can be received in any order, applied multiple times, and still converge to the same state. It is a useful algorithm for a privacy-centric data sharing application, which involves no central server, and each payload can be end-to-end encrypted.

## Data model

### Definition 1.

A W-character c is a five-tuple `< id, value, visible, idcp, idcn >` where

- `id` is the identifier of the character.
- `value` is the alphabetical value of the effect character,
- `visible` indicates if the character is visible,
- `idcp` is the identifier of the previous W-character of c.
- `idcn` is the identifier of the next W-character of c.

### Definition 2.

The previous W-character of c is denoted
`CP(c)`. The next W-character of c is denoted `CN(c)`.

### Definition 3.

A character identifier is a pair `(ns, ng)`
where `ns` is the identifier of a site and `ng` is a natural number.
When a W-character is generated at site s, its identifier
is set to `(numSites,Hs)`.

### Definition 4.

A W-string is an ordered sequence of W-characters
`cbc1c2... cnce` where `cb` and `ce` are special W-characters
that mark the beginning and the ending of the
sequence.

### Definition 5.

Let a and b be two W-characters. a < b if
and only if, there exists a set of characters {c0, c1, ...ci} such
that a = c0, b = ci and CN(cj) = cj+1 or cj = CP (cj+1) for
all 0 <= j < i.

### Definition 6.

Let a and b be two W-characters with their
respective identifiers (`nsa`, `nga`) and (`nsb`, `ngb`). a <<sub><sup>`id`</sub></sup> b if
and only if (1) nsa < nsb or (2) nsa = nsb and nga < ngb.

### Definition 7.

Let S be a sequence, the relation <= <sub><sup>S</sub></sup> is
defined as a <= <sub><sup>S</sub></sup> b if and only if `pos(S, a)` <= `pos(S, b)`. The
relation <= <sub><sup>S</sub></sup> is defined as a <= <sub><sup>S</sub></sup> b if and only if `pos(S, a)` <
`pos(S, b)`.

## Implementation

The implementation is divided into a model and controller. The model contains all the algorithms that works with the sequence of characters, functions such insert, delete, position, isExecutable etc. The controller interfaces with the client application, and creates payloads that can be sent to other replicas, and processes payloads from other replices.

### Controller

The main function updates operations that have been receieved and are executable. Some operations might no be executable, as operations can be recevied in any order. For instance a delete operation can't be received before the insert operation has been implemented. The main updates the sequence according to incoming operations, and uses the model to integrate insert or deletion of characters.

Generate delete creates a payload of a deletion of a character at the given position and other related metadata other replicas will use to successfully execute the operation.

Generate insert creates a payload of an insert operation between two characters.

### Model

### Tests

### Communication
