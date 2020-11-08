# CRDT WOOT

A collaborative text editor implemented using the CRDT algorithm WOOT.

TODO: Consider using CRDT Loogot instead, it seems more performant?

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
