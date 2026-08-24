const base = require('rhtmlBuildUtils/eslint.config.base')

module.exports = [
  ...base,
  {
    // Carried across from the .eslintrc that eslint 10 dropped support for. The shared base config
    // reproduces eslint-config-standard's defaults and nothing else, so anything this repo set has
    // to be restated here or it is silently lost. The formatting rules moved into @stylistic in
    // eslint 10, and @stylistic split the continuation indent of a wrapped binary expression out of
    // `indent` into `indent-binary-ops`, so turning `indent` off means turning both off.
    rules: {
      '@stylistic/indent': 0,
      '@stylistic/indent-binary-ops': 0,
      'prefer-promise-reject-errors': 0,

      // Not in js.configs.recommended, and the base config restored only no-extend-native and
      // no-new-func from eslint-config-standard. Two deliberate `eslint-disable-line no-eval`
      // directives in this repo depend on it: with the rule off they are unused directives, and
      // `eslint --fix` deletes them, dropping the rule everywhere rather than just at those sites.
      'no-eval': 'error',

      // NB the object form, not the `'always-multiline'` string this repo's .eslintrc used. eslint's
      // core comma-dangle left `functions` at 'never' when given a string; @stylistic's applies the
      // string to function arguments too. The string form therefore demands a trailing comma after
      // the last argument of every wrapped call — four of them in code untouched by this upgrade.
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],

      // customize() sets avoidEscape: false, dropping standard's setting. Without avoidEscape the
      // double-quoted strings that exist precisely to hold an apostrophe -- `"Must specify 'x'"` --
      // become errors whose only fix is to escape the quotes they were written to avoid.
      // allowTemplateLiterals repeats customize()'s own 'always', because passing options at all
      // replaces the whole option object: omitting it would fall back to the rule's stricter default
      // and flag every substitution-free template literal in the widget source.
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
    },
  },
]
