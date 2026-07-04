Take-Home — Level 1: Community Library Lending System (End-to-End)

Nature of the Game
The Product Engineer role at Schedit is end-to-end: you write the API, the persistence, andthe UI for the features you own. This is a small but real slice of that — build us a communitylibrary lending system, backend and frontend.

We deliberately describe the problem in plain English, the way our imaginary customer
described it. We want to see how you model it in code. There isn't a "right" schema here
— only trade-offs. Show us yours.

The Problem — In Plain English
Imagine a small community library that just asked us to build them a lending system. 

Here's how the head librarian described what they need:

"Members come in, browse our books, and take them out for a few weeks. If a
book they want isn't available — we've usually only got one to three physical
copies of each title — they can join a waiting list, and when someone returns
one they get first dibs on it, for a few days. Different members have different
privileges: our regular members can have three books out at a time, our
supporting members can have six, and they get longer before they need to bring
them back. If a book comes back late there's a small daily charge, though we
cap it so nobody ever owes more than the book cost us to replace. Our
librarians run the day-to-day: adding new books, marking damaged copies,
sorting out the waiting lists."

Some more scenarios the head librarian mentioned when we probed further:

- "If someone's got the book out and their loan is coming up, they can renew it —
unless someone else is waiting for that title, in which case we'd rather that person get
their turn."
- "You can only be on the waiting list once for the same book. And you can't be on the
waiting list for a book you already have out — you've got it, come on."
- "When we reserve a returned book for the next member on the waiting list, they've
got three days to come collect it. If they don't, it moves along to whoever's next."
- "If a member's got outstanding late fees, we don't want them taking out any more
books until they've squared up."
- "Sometimes copies get lost or damaged and we mark them so. If someone happens
to be reserved for that copy when it happens, figure out what makes sense there."
- "Every so often we downgrade someone's membership tier, and they might already
have more books out than the new tier allows. What we do about that is a judgement
call."

You also learn: the library has a few hundred titles with 1–3 copies each, members might
have several loans and waiting-list entries at once, two librarians often work at the same time (assume concurrent use), and all time-based rules use a single library clock (no timezones).

What to Build

A backend (any OO-capable language) that enforces every rule — hitting the API directly
should get the same "no, sorry" the frontend would give — plus a React + TypeScript
frontend with enough for a member to actually use the library (find books, borrow, return, renew, join and cancel waiting lists, see their dashboard) and for a librarian to run the day-to-day (add books and copies, mark copies as lost, see waiting lists, settle fees). Use a simple "acting as: [pick a member / pick librarian]" selector — real authentication, notifications, and payments are out of scope. Everything else — entities, state transitions, API shape, folder layout — is your call. Show us your judgement.

What We're NOT Looking For

- Pixel-perfect design (clean beats fancy).
- 100% test coverage (a handful of meaningful tests on the gnarly bits beats a wall of
trivial ones).
- Real auth, notifications, or payments.
- Over-engineering — patterns only where they earn their keep.
- Every edge case handled — pick a few, handle them well, and be honest in the
README about the rest.

Your submission must include:

Backend, frontend, and seed data, each with a single documented run command.
README.md with setup, key design and modelling decisions (concrete reasoning),
trade-offs, edge cases you skipped and why, and "what I'd do next".
A handful of tests around the tricky rules.
Git history: atomic, meaningfully-named commits from the start. A single "initial
commit" with the whole project is a red flag.