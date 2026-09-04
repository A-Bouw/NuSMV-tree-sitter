; Indent the body of each module section, and the branches of a case.

(var_declaration) @indent
(ivar_declaration) @indent
(frozenvar_declaration) @indent
(define_declaration) @indent
(assign_declaration) @indent

(case_expression) @indent
("esac" @outdent)

(parenthesized_expression) @indent
(set_expression) @indent
(enum_type) @indent
