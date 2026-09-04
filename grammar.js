/**
 * @file NuSMV / nuXmv grammar for tree-sitter
 * @license MIT
 *
 * Follows the NuSMV 2.6 user manual grammar. One deliberate departure: the
 * manual defines separate simple_expr / next_expr / ctl_expr / ltl_expr
 * hierarchies that differ only in which operators they admit. We use a single
 * `_expr` rule covering all of them, so the parser accepts e.g. an LTL operator
 * inside a SPEC. That is a semantic error NuSMV itself will reject; keeping one
 * hierarchy avoids quadrupling the rule set for no highlighting benefit.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  imply: 1, // ->   (right associative)
  iff: 2, // <->
  ternary: 3, // ? :
  temporal: 4, // X G F AG EF ... and U V S T
  or: 5, // | xor xnor
  and: 6, // &
  compare: 7, // = != < > <= >=
  in: 8, // in
  union: 9, // union
  shift: 10, // << >>
  add: 11, // + -
  mul: 12, // * / mod
  concat: 13, // ::
  unary: 14, // ! and unary -
  postfix: 15, // [] [:] .
};

const commaSep1 = (rule) => seq(rule, repeat(seq(',', rule)));
const commaSep = (rule) => optional(commaSep1(rule));

module.exports = grammar({
  name: 'smv',

  word: ($) => $.identifier,

  extras: ($) => [/\s/, $.comment],

  conflicts: ($) => [
    // `A[` / `E[` begin a bracketed CTL operator, but A and E are also legal
    // variable names, so `A[i]` could equally be an array index.
    [$._expr, $.ctl_bracket_expression],
  ],

  rules: {
    source_file: ($) => repeat($.module),

    // ---------------------------------------------------------------- module

    module: ($) =>
      seq(
        'MODULE',
        field('name', $.identifier),
        optional(field('parameters', $.parameter_list)),
        repeat($._module_element),
      ),

    parameter_list: ($) => seq('(', commaSep($.identifier), ')'),

    _module_element: ($) =>
      choice(
        $.var_declaration,
        $.ivar_declaration,
        $.frozenvar_declaration,
        $.define_declaration,
        $.constants_declaration,
        $.assign_declaration,
        $.trans_constraint,
        $.init_constraint,
        $.invar_constraint,
        $.fairness_constraint,
        $.ctl_specification,
        $.ltl_specification,
        $.invar_specification,
        $.compute_specification,
        $.pslspec_specification,
        $.isa_declaration,
      ),

    // ----------------------------------------------------- variable sections

    var_declaration: ($) => seq('VAR', repeat($.variable_definition)),
    ivar_declaration: ($) => seq('IVAR', repeat($.variable_definition)),
    frozenvar_declaration: ($) => seq('FROZENVAR', repeat($.variable_definition)),

    variable_definition: ($) =>
      seq(field('name', $._dotted_identifier), ':', field('type', $._type), ';'),

    define_declaration: ($) => seq('DEFINE', repeat($.define_body)),

    define_body: ($) =>
      seq(field('name', $._dotted_identifier), ':=', field('value', $._expr), ';'),

    constants_declaration: ($) => seq('CONSTANTS', commaSep1($._dotted_identifier), ';'),

    // ------------------------------------------------------------------ types

    _type: ($) =>
      choice(
        $.boolean_type,
        $.word_type,
        $.integer_type,
        $.real_type,
        $.enum_type,
        $.range_type,
        $.array_type,
        $.module_instantiation,
      ),

    boolean_type: (_) => 'boolean',
    integer_type: (_) => 'integer',
    real_type: (_) => 'real',

    word_type: ($) =>
      seq(
        optional(choice('unsigned', 'signed')),
        'word',
        '[',
        field('width', $._constant_bound),
        ']',
      ),

    enum_type: ($) => seq('{', commaSep1($._enum_value), '}'),

    _enum_value: ($) => choice($.identifier, $.integer_literal, $.boolean_literal),

    // In type position the manual allows only constant bounds, not arbitrary
    // expressions. Restricting this keeps `{a,b}` unambiguously an enum_type
    // rather than a set_expression.
    range_type: ($) =>
      seq(field('low', $._constant_bound), '..', field('high', $._constant_bound)),

    _constant_bound: ($) => choice($.integer_literal, $.negative_integer, $.identifier),

    negative_integer: ($) => seq('-', $.integer_literal),

    array_type: ($) =>
      seq(
        optional('array'),
        field('index', choice($.range_type, seq(optional('word'), '[', $._constant_bound, ']'))),
        'of',
        field('element', $._type),
      ),

    module_instantiation: ($) =>
      seq(
        optional('process'),
        field('module', $.identifier),
        optional(seq('(', commaSep($._expr), ')')),
      ),

    // ----------------------------------------------------------------- assign

    assign_declaration: ($) => seq('ASSIGN', repeat($.assignment)),

    assignment: ($) =>
      seq(field('target', $._assign_target), ':=', field('value', $._expr), ';'),

    _assign_target: ($) => choice($._dotted_identifier, $.init_target, $.next_target),

    init_target: ($) => seq('init', '(', $._dotted_identifier, ')'),
    next_target: ($) => seq('next', '(', $._dotted_identifier, ')'),

    // ------------------------------------------------------------ constraints

    trans_constraint: ($) => seq('TRANS', $._expr, optional(';')),
    init_constraint: ($) => seq('INIT', $._expr, optional(';')),
    invar_constraint: ($) => seq('INVAR', $._expr, optional(';')),

    fairness_constraint: ($) =>
      choice(
        seq(choice('FAIRNESS', 'JUSTICE'), $._expr, optional(';')),
        seq('COMPASSION', '(', $._expr, ',', $._expr, ')', optional(';')),
      ),

    // --------------------------------------------------------- specifications

    // NuSMV 2.5+ allows an optional `NAME ident :=` prefix on every spec.
    spec_name: ($) => seq('NAME', field('name', $._dotted_identifier), ':='),

    ctl_specification: ($) =>
      seq(choice('SPEC', 'CTLSPEC'), optional($.spec_name), $._expr, optional(';')),

    ltl_specification: ($) => seq('LTLSPEC', optional($.spec_name), $._expr, optional(';')),

    invar_specification: ($) =>
      seq('INVARSPEC', optional($.spec_name), $._expr, optional(';')),

    pslspec_specification: ($) => seq('PSLSPEC', optional($.spec_name), $._expr, optional(';')),

    compute_specification: ($) =>
      seq('COMPUTE', optional($.spec_name), $._expr, optional(';')),

    isa_declaration: ($) => seq('ISA', $.identifier),

    // ------------------------------------------------------------ expressions

    _expr: ($) =>
      choice(
        $.identifier,
        $.complex_identifier,
        $.integer_literal,
        $.real_literal,
        $.word_literal,
        $.boolean_literal,
        $.self_expression,
        $.range_expression,
        $.parenthesized_expression,
        $.set_expression,
        $.case_expression,
        $.unary_expression,
        $.binary_expression,
        $.ternary_expression,
        $.index_expression,
        $.bit_selection_expression,
        $.temporal_unary_expression,
        $.temporal_binary_expression,
        $.ctl_bracket_expression,
        $.bounded_temporal_expression,
        $.compute_expression,
        $.call_expression,
      ),

    // COMPUTE MIN [ start, end ] — distance operators, bracketed not called.
    compute_expression: ($) =>
      seq(
        field('operator', choice('MIN', 'MAX')),
        '[',
        field('left', $._expr),
        ',',
        field('right', $._expr),
        ']',
      ),

    parenthesized_expression: ($) => seq('(', $._expr, ')'),

    set_expression: ($) => seq('{', commaSep($._expr), '}'),

    range_expression: ($) =>
      prec.left(PREC.union, seq($._expr, '..', $._expr)),

    unary_expression: ($) =>
      prec.right(PREC.unary, seq(field('operator', choice('!', '-')), field('operand', $._expr))),

    binary_expression: ($) => {
      const table = [
        [PREC.concat, '::', 'left'],
        [PREC.mul, choice('*', '/', 'mod'), 'left'],
        [PREC.add, choice('+', '-'), 'left'],
        [PREC.shift, choice('<<', '>>'), 'left'],
        [PREC.union, 'union', 'left'],
        [PREC.in, 'in', 'left'],
        [PREC.compare, choice('=', '!=', '<', '>', '<=', '>='), 'left'],
        [PREC.and, '&', 'left'],
        [PREC.or, choice('|', 'xor', 'xnor'), 'left'],
        [PREC.iff, '<->', 'left'],
        [PREC.imply, '->', 'right'],
      ];

      return choice(
        ...table.map(([precedence, operator, associativity]) => {
          const fn = associativity === 'right' ? prec.right : prec.left;
          return fn(
            precedence,
            seq(
              field('left', $._expr),
              field('operator', operator),
              field('right', $._expr),
            ),
          );
        }),
      );
    },

    ternary_expression: ($) =>
      prec.right(
        PREC.ternary,
        seq(
          field('condition', $._expr),
          '?',
          field('consequence', $._expr),
          ':',
          field('alternative', $._expr),
        ),
      ),

    index_expression: ($) =>
      prec.left(PREC.postfix, seq($._expr, '[', field('index', $._expr), ']')),

    bit_selection_expression: ($) =>
      prec.left(
        PREC.postfix,
        seq($._expr, '[', field('high', $._expr), ':', field('low', $._expr), ']'),
      ),

    case_expression: ($) => seq('case', repeat($.case_branch), 'esac'),

    case_branch: ($) =>
      seq(field('condition', $._expr), ':', field('value', $._expr), ';'),

    // ------------------------------------------------- temporal (CTL and LTL)

    temporal_unary_expression: ($) =>
      prec.right(
        PREC.temporal,
        seq(
          field('operator', choice(
            // CTL
            'EG', 'EX', 'EF', 'AG', 'AX', 'AF',
            // LTL future
            'X', 'G', 'F',
            // LTL past
            'Y', 'Z', 'H', 'O',
          )),
          field('operand', $._expr),
        ),
      ),

    temporal_binary_expression: ($) =>
      prec.left(
        PREC.temporal,
        seq(
          field('left', $._expr),
          field('operator', choice('U', 'V', 'S', 'T')),
          field('right', $._expr),
        ),
      ),

    // E[ p U q ] / A[ p U q ] and the bounded variants E[ p BU 1..3 q ]
    ctl_bracket_expression: ($) =>
      prec.dynamic(
        1,
        seq(
          field('quantifier', choice('A', 'E')),
          '[',
          field('left', $._expr),
          choice(
            field('operator', 'U'),
            seq(field('operator', 'BU'), field('bound', $.range_expression)),
          ),
          field('right', $._expr),
          ']',
        ),
      ),

    // EBF 1..3 p — real-time CTL
    bounded_temporal_expression: ($) =>
      prec.right(
        PREC.temporal,
        seq(
          field('operator', choice('EBF', 'ABF', 'EBG', 'ABG')),
          field('bound', $.range_expression),
          field('operand', $._expr),
        ),
      ),

    // -------------------------------------------------------------- functions

    call_expression: ($) =>
      prec(
        PREC.postfix,
        seq(
          field('function', choice($.builtin_function, $.identifier)),
          '(',
          commaSep($._expr),
          ')',
        ),
      ),

    builtin_function: (_) =>
      choice(
        'next', 'init',
        'abs', 'max', 'min', 'count',
        'bool', 'toint', 'word1', 'floor',
        'signed', 'unsigned', 'extend', 'resize', 'sizeof',
        'swconst', 'uwconst',
        'READ', 'WRITE', 'CONSTARRAY', 'WRESIZE', 'typeof',
      ),

    // ------------------------------------------------------------- identifier

    self_expression: (_) => 'self',

    // Declaration positions accept either a bare name or a dotted path.
    _dotted_identifier: ($) => choice($.identifier, $.complex_identifier),

    // `a.b.c` — module member access. Distinct from index_expression so that
    // highlight queries can treat the trailing atom as a field.
    complex_identifier: ($) =>
      prec.left(
        PREC.postfix,
        seq(
          choice($.identifier, $.self_expression),
          repeat1(seq('.', field('field', choice($.identifier, $.integer_literal)))),
        ),
      ),

    // Manual: first char [A-Za-z_], then [A-Za-z0-9_$#-]. We forbid a trailing
    // or doubled `-` so that `--` always lexes as a comment.
    identifier: (_) => /[A-Za-z_][A-Za-z0-9_$#]*(-[A-Za-z0-9_$#]+)*/,

    // ---------------------------------------------------------------- literals

    boolean_literal: (_) => choice('TRUE', 'FALSE'),

    integer_literal: (_) => /\d+/,

    real_literal: (_) => /\d+\.\d+([eE][+-]?\d+)?|\d+[eE][+-]?\d+/,

    // 0ud3_5, 0sb5_11111, 0h_FF, 0b1010 ...
    word_literal: (_) => /0[usUS]?[bBoOdDhH]\d*_[0-9a-fA-F]+/,

    // ---------------------------------------------------------------- comments

    comment: (_) =>
      token(
        choice(
          seq('--', /[^\n]*/),
          // block comments are /-- ... --/
          seq('/--', /([^-]|-[^-]|--+[^-\/])*-*/, '--/'),
        ),
      ),
  },
});
