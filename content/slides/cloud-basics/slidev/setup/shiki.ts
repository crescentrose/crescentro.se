import { defineShikiSetup } from '@slidev/types'

export default defineShikiSetup(() => {
  return {
    themes: {
      dark: 'catppuccin-mocha',
      light: 'catppuccin-latte',
    },
    langs: [
      'terraform',
      'diff',
      'json5',
    ],
  }
})
