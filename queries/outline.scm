(module
  "MODULE" @context
  name: (identifier) @name) @item

(variable_definition
  name: (identifier) @name) @item

(define_body
  name: (identifier) @name) @item

(ctl_specification
  (spec_name name: (identifier) @name)) @item

(ltl_specification
  (spec_name name: (identifier) @name)) @item

(invar_specification
  (spec_name name: (identifier) @name)) @item
