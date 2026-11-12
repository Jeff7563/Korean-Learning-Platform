# Vocabulary review scheduling (V0.6)

Vocabulary rows keep their existing integer IDs. SRS state is created only after the learner rates a revealed card; simply opening or revealing a card creates no review history.

## Schedule rules

All dates are calendar dates in `Asia/Bangkok`. The scheduler takes the prior interval, a rating, and the review date as inputs, so the result is deterministic:

| Rating | Next interval | Effect |
| --- | --- | --- |
| Again (`จำไม่ได้`) | 1 day | Adds one lapse and resets a longer interval to one day |
| Hard (`ยังไม่แม่น`) | At least 1 day; otherwise rounds the prior interval × 1.5 up | Keeps progress slower |
| Good (`จำได้`) | First review: 1 day; later: at least 3 days or twice the prior interval | Gradually lengthens the interval |

The queue puts due cards first, then cards with more lapses, then the oldest due dates. This is a simple, transparent study rule, not a scientifically optimal memory prediction.

## Access and persistence

Only vocabulary from lessons that are currently unlocked or have existing learner activity, progress, or checkpoint history is returned. New cards have no persisted review row until their first rating. Every rating is stored as an append-only history event and updates one state row per vocabulary ID. Client-generated idempotency keys prevent a repeated submission from scheduling the same action twice.

Daily plans include a `/review` task only when the plan is first created and due vocabulary exists. The existing task duration is reused, and existing plans are not rewritten to reflect later SRS changes.
