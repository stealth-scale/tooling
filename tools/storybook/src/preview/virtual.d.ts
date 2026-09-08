/**
 * @fileoverview Declares what the kit's own modules hold. The Vite plugin in `./config`
 * answers each of them from a reading of the workspace, so they exist only while Storybook is
 * running and the compiler would otherwise know nothing about them. Every type is written as
 * an inline import, which keeps this file ambient rather than a module of its own.
 */

declare module 'virtual:stealth/offered' {
  /**
   * Lists what a toolbar may offer: the densities, locales and themes registered.
   */
  export const offered: import('@stealthscale/core-appearance').Offered
}

declare module 'virtual:stealth/provider' {
  /**
   * Wraps every story in the design system, under every registered stylesheet.
   */
  const provider: import('./decorator.tsx').Provider

  export default provider
}

declare module 'virtual:stealth/themes' {
  /**
   * Holds every theme the workspace registered, solved, as each theme's own build solved it.
   */
  export const themes: import('./appearance.ts').Themes
}
