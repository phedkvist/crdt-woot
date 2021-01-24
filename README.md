# CRDT WOOT

A collaborative text editor implemented using the CRDT algorithm WOOT.

WOOT (Without Operational Transformation) is an algorithm created by Gérald Oster, Pascal Urso, Pascal Molli, Abdessamad Imine, published on 6 Nov 2006, in a research paper named Data Consistency for P2P Collaborative Editing.

As all CRDT (Conflict Free Replicated Data-types) based algorithms, the data type is constructed such that no conflict can occur. As long as all operations are sent to all replicas, all replicas converge to the same state. CRDTs allows all replicas to communicate in a peer-to-peer network, using for example a gossip protocol. The operations that are sent to each replica, can be received in any order, applied multiple times, and still converge to the same state. It is a useful algorithm for a privacy-centric data sharing application, which involves no central server, and each payload can be end-to-end encrypted.

### Data model

Definition 1. A W-character c is a five-tuple
< id, ®, v, idcp, idcn > where
• id is the identifier of the character.
• ® is the alphabetical value of the effect character,
• v ∈ {True, False} indicates if the character is visible,
• idcp is the identifier of the previous W-character of c.
• idcn is the identifier of the next W-character of c.

Definition 2. The previous W-character of c is denoted
CP (c). The next W-character of c is denoted CN(c).

Definition 3. A character identifier is a pair (ns, ng)
where ns is the identifier of a site and ng is a natural number.
When a W-character is generated at site s, its identifier
is set to (numSites,Hs).

Definition 4. A W-string is an ordered sequence of Wcharacters
cbc1c2 . . . cnce where cb and ce are special Wcharacters
that mark the beginning and the ending of the
sequence.
