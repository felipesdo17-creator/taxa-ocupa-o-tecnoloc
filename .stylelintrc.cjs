module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // allow @tailwind and other at-rules
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'layer', 'import'],
      },
    ],
  },
};
