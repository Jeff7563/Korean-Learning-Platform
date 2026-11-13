# EPS-TOPIK V0.7.1 Exam Quality and Versioning

## Published forms

V0.7 published two original mock forms (`legacy-style` and `current-style`). Their question rows remain in SQLite as immutable records. The additive `0007_eps_immutable_exam_versions.sql` migration retires them from the full-exam catalog while retaining them for historical results and Thai-supported guided practice.

V0.7.1 adds two final original mock forms: `eps-topik-v071-a2` and `eps-topik-v071-b2`. Each contains 20 Reading and 20 Listening questions, with four distinct choices per question, a Korean listening script, and a Thai explanation for review. New exam attempts can use only active forms. An attempt stores its original question IDs; scoring and result review read those immutable rows even after later forms are published. Earlier V0.7.1 draft forms (`eps-topik-v071-a` and `eps-topik-v071-b`) were retained as immutable retired rows when a distinct answer-position sequence was added per final section.

The database prevents updates or deletions of published question rows and prevents changes to a form's published content fields. Seeding uses `ON CONFLICT DO NOTHING`; later content changes require a new form ID. `is_active` is the only mutable form field and controls availability for new full exams.

## Answer-position checks

| Form | Section | A | B | C | D |
| --- | --- | ---: | ---: | ---: | ---: |
| V0.7.1 A | Reading | 5 | 5 | 5 | 5 |
| V0.7.1 A | Listening | 5 | 5 | 5 | 5 |
| V0.7.1 B | Reading | 5 | 5 | 5 | 5 |
| V0.7.1 B | Listening | 5 | 5 | 5 | 5 |

Positions follow a mixed sequence rather than a repeating A/B/C/D pattern; each final section uses its own sequence. Automated validation checks section counts, position balance, distinct sequences, distinct options, valid answer indices, Thai explanations, Korean Reading stems/choices, and Listening scripts.

## Exam-style and guided practice

V0.7.1 Reading stems and choices are in Korean and use original practical notices, forms, schedules, work instructions, and short situations. Listening questions have original Korean dialogue scripts. These items imitate the published four-choice shape for practice; they are not genuine HRD Korea questions and do not establish equivalence to the official exam's difficulty or blueprint. HRD Korea's [EPS-TOPIK standard textbook catalog](https://epstopik.hrdkorea.or.kr/epstopik/book/std/standardBookList.do?lang=ko) lists daily-life Korean and workplace Korean materials; the new items are original practice content and do not reproduce those books.

The guided Practice Mode continues to use the retired V0.7 Thai-supported question set. This keeps beginner help separate from the Korean-only full-exam forms. The “incorrect questions” practice mode can still include prior submitted questions from either version.

## Human review still required

Automated checks cannot determine whether a distractor is linguistically natural, uniquely wrong in every context, or appropriately calibrated to EPS-TOPIK difficulty. A Korean-language teacher familiar with EPS-TOPIK should review all 80 V0.7.1 items, particularly polite workplace instructions, safety wording, vocabulary level, and distractor ambiguity, before these materials are described as expert-reviewed or exam-equivalent. No official HRD Korea questions, answer keys, audio, or textbook passages are reproduced.

## Database safety and verification

Before applying the migration to the learner database, a SQLite online backup was created and verified with `PRAGMA integrity_check` and `PRAGMA foreign_key_check`. The pre-change learner database contained one lesson-progress row, two checkpoint attempts, one daily plan with six tasks, and zero EPS attempts/answers. Migration and seeding add form rows and mark the two V0.7 forms inactive; they do not reset learner progress or delete attempts.

Automated regression coverage checks the old-form retirement, immutable question behavior, unchanged historical scoring after adding new versions, seed idempotency, private answer keys, resume, duplicate finalization, section limits/transitions, and the new bank's balance and structural integrity.
