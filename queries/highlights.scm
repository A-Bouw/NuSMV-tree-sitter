; Syntax highlighting for NuSMV / nuXmv.
; Ordered most-specific first, since Zed applies the first matching pattern.

; ---------------------------------------------------------------- comments

(comment) @comment

; ---------------------------------------------------------------- literals

(integer_literal) @number
(real_literal) @number
(word_literal) @number
(boolean_literal) @boolean
(self_expression) @variable.special

; ------------------------------------------------------------------- types

[
  (boolean_type)
  (integer_type)
  (real_type)
] @type

[
  "word"
  "signed"
  "unsigned"
  "array"
] @type

"of" @keyword

; A module used as a variable's type, e.g. `sub : worker(x)`
(module_instantiation module: (identifier) @type)

; ------------------------------------------------------------ declarations

(module name: (identifier) @type)
(parameter_list (identifier) @variable)
(isa_declaration (identifier) @type)

(variable_definition name: (identifier) @variable)
(define_body name: (identifier) @variable)
(spec_name name: (identifier) @property)

; Symbolic constants: the members of an enum type and CONSTANTS entries.
(enum_type (identifier) @constant)
(constants_declaration (identifier) @constant)

; Trailing atom of a dotted path `c.sub.ready`
(complex_identifier field: (identifier) @property)

; --------------------------------------------------------------- functions

(builtin_function) @function
(call_expression function: (identifier) @function)

; `init(x) := ...` and `next(x) := ...` on the left of an assignment
(init_target "init" @function)
(next_target "next" @function)

; ---------------------------------------------------------------- keywords

[
  "MODULE"
  "VAR"
  "IVAR"
  "FROZENVAR"
  "DEFINE"
  "CONSTANTS"
  "ASSIGN"
  "TRANS"
  "INIT"
  "INVAR"
  "FAIRNESS"
  "JUSTICE"
  "COMPASSION"
  "SPEC"
  "CTLSPEC"
  "LTLSPEC"
  "INVARSPEC"
  "PSLSPEC"
  "COMPUTE"
  "ISA"
  "NAME"
  "process"
] @keyword

[
  "case"
  "esac"
] @keyword

; ------------------------------------------------- temporal / modal operators

; CTL, LTL, past-time and real-time operators. Highlighted as keywords so the
; modal structure of a specification stands out from ordinary boolean algebra.
(temporal_unary_expression operator: _ @keyword)
(temporal_binary_expression operator: _ @keyword)
(bounded_temporal_expression operator: _ @keyword)
(ctl_bracket_expression quantifier: _ @keyword)
(ctl_bracket_expression operator: _ @keyword)
(compute_expression operator: _ @keyword)

; --------------------------------------------------------------- operators

[
  "!"
  "-"
  "+"
  "*"
  "/"
  "mod"
  "::"
  "<<"
  ">>"
  "union"
  "in"
  "="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&"
  "|"
  "xor"
  "xnor"
  "<->"
  "->"
  "?"
  ":="
] @operator

; ------------------------------------------------------------- punctuation

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ","
  ";"
  ":"
  "."
  ".."
] @punctuation.delimiter
