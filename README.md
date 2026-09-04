# tree-sitter-smv

A [tree-sitter](https://tree-sitter.github.io) grammar for the **NuSMV** /
**nuXmv** model checker input language (`.smv`).

Written against the [NuSMV 2.6 user manual](https://nusmv.fbk.eu/userman/v26/nusmv.pdf)
grammar, with the modern keyword set (word types, `INVARSPEC`, `FROZENVAR`,
named specifications, past-time LTL, real-time CTL).

## What it covers

| Area | Constructs |
| --- | --- |
| Modules | `MODULE` with parameters, instantiation, `process`, `ISA` |
| Declarations | `VAR`, `IVAR`, `FROZENVAR`, `DEFINE`, `CONSTANTS` |
| Types | `boolean`, `integer`, `real`, enums, ranges, `array`, `[un]signed word[N]` |
| Assignment | plain, `init(x) :=`, `next(x) :=` |
| Constraints | `TRANS`, `INIT`, `INVAR`, `FAIRNESS`, `JUSTICE`, `COMPASSION` |
| Specifications | `SPEC`, `CTLSPEC`, `LTLSPEC`, `INVARSPEC`, `PSLSPEC`, `COMPUTE`, `NAME` |
| CTL | `AG AF AX EG EF EX`, `A[p U q]`, `E[p BU 1..5 q]`, `EBF/ABF/EBG/ABG` |
| LTL | `X G F`, `U V`, past-time `Y Z H O S T` |
| Expressions | full precedence table, `case/esac`, ternary, sets, `union`, `in`, bit selection `w[7:0]`, word concat `::` |
| Comments | `--` line and `/-- ... --/` block |

## Known limitations

- **One expression hierarchy.** The manual defines separate `simple_expr`,
  `next_expr`, `ctl_expr` and `ltl_expr` hierarchies that differ only in which
  operators they admit. This grammar merges them, so it will happily parse an
  LTL operator inside a `SPEC`. NuSMV itself rejects that; the parser is for
  editing, not validation.
- **`A` and `E` are ambiguous.** They are CTL quantifiers *and* legal variable
  names, so `A[i]` could be an array index or a malformed `A[p U q]`. Resolved
  with a dynamic precedence favouring the CTL reading when a `U`/`BU` follows.
- **PSL** expressions are parsed as ordinary expressions, not the full PSL
  grammar.

## Development

```sh
npm install
npx tree-sitter generate     # regenerate src/parser.c after editing grammar.js
npx tree-sitter test         # run test/corpus
npx tree-sitter parse examples/kitchen-sink.smv
```

`src/parser.c` is generated but **committed on purpose** — Zed and other
consumers compile it directly rather than running the CLI.

## License

MIT
