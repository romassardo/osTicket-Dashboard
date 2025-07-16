module.exports = {
  overrides: [
    {
      files: ['src/components/charts/TicketStatusChart.tsx'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}; 