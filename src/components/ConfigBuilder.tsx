/**
 * React SSR component for the standalone configuration-builder page.
 *
 * The component renders the static shell that the `config-builder.ts`
 * client bundle animates and populates. The shell owns:
 *
 * - the shared top navigation (same `TopNav` as the docs page, so both
 *   routes carry identical chrome)
 * - the top-bar action buttons (Reset defaults, Copy, Save file, theme
 *   toggle) — plain `<button>`s tagged with `data-pw-cb-action`
 * - the intro block (title, lead, doc pointer)
 * - the two-column layout (form on the left, sticky preview on the
 *   right) with all 11 section headers pre-rendered and their bodies
 *   set up as empty grid-collapsible wrappers
 * - the preview panel with an empty `<pre>` the client fills line by
 *   line at boot
 * - the Reset confirmation `<dialog>`
 *
 * The section bodies stay empty in SSR — the client renders the actual
 * field widgets on boot. That keeps SSR deterministic (no server-side
 * state), lets the client be the single source of truth for values,
 * and keeps the initial HTML tiny.
 */

import type { ResolvedConfig } from "../config/config.js";
import { TopNav } from "./TopNav.jsx";

/**
 * Iconsax Bulk-variant paths keyed by section key. Rendered inline via
 * SSR so section icons paint on first frame; the same icon set is
 * reused by the client for consistency, but the JS never has to inject
 * SVG for the section headers.
 */
const SECTION_ICONS: Record<string, Array<{ d: string; opacity?: number }>> = {
  spec: [
    {
      d: "M20.5 7v8H6.35c-1.57 0-2.85 1.28-2.85 2.85V7c0-4 1-5 5-5h7c4 0 5 1 5 5Z",
      opacity: 0.4,
    },
    {
      d: "M20.5 15v3.5c0 1.93-1.57 3.5-3.5 3.5H7c-1.93 0-3.5-1.57-3.5-3.5v-.65C3.5 16.28 4.78 15 6.35 15H20.5ZM16 7.75H8c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h8c.41 0 .75.34.75.75s-.34.75-.75.75ZM13 11.25H8c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h5c.41 0 .75.34.75.75s-.34.75-.75.75Z",
    },
  ],
  site: [
    {
      d: "M22.6799 8.99001H2.67993V15.14C3.20993 14.94 3.59993 14.52 3.74993 13.98L4.07993 12.76L4.14993 12.53C4.41993 11.84 5.05993 11.36 5.80993 11.36C6.57993 11.36 7.23993 11.8 7.49993 12.49L7.90993 13.95C8.07993 14.56 8.52993 15.01 9.12993 15.18L10.3799 15.51C11.1498 15.7666 11.7299 16.4604 11.7299 17.29C11.7299 18.065 11.2219 18.7634 10.4799 19L9.14993 19.37C8.67993 19.5 8.30993 19.8 8.07993 20.22H18.5799C20.8399 20.22 22.6699 18.39 22.6699 16.13V9.00001L22.6799 8.99001Z",
      opacity: 0.4,
    },
    {
      d: "M10.3299 17.31C10.3299 17.4 10.2799 17.6 10.0399 17.68L8.76995 18.03C7.67995 18.33 6.85995 19.15 6.55995 20.24L6.21995 21.48C6.13995 21.76 5.91995 21.79 5.81995 21.79C5.71995 21.79 5.49995 21.76 5.41995 21.48L5.07995 20.23C4.77995 19.15 3.94995 18.33 2.86995 18.03L1.61995 17.69C1.34995 17.61 1.31995 17.38 1.31995 17.29C1.31995 17.19 1.34995 16.96 1.61995 16.88L2.87995 16.55C3.95995 16.24 4.77995 15.42 5.07995 14.34L5.43995 13.03C5.52995 12.81 5.72995 12.78 5.81995 12.78C5.90995 12.78 6.11995 12.81 6.19995 13.01L6.55995 14.33C6.85995 15.41 7.68995 16.23 8.76995 16.54L10.0599 16.89C10.3199 16.99 10.3299 17.22 10.3299 17.3V17.31Z",
    },
    {
      d: "M22.6799 6.30001V7.49001H2.67993V6.30001C2.67993 4.04001 4.50993 2.21001 6.76993 2.21001H18.5899C20.8499 2.21001 22.6799 4.04001 22.6799 6.30001Z",
      opacity: 0.4,
    },
    {
      d: "M7.42992 5.21001C7.42992 5.62001 7.08992 5.96001 6.67992 5.96001C6.26992 5.96001 5.91992 5.62001 5.91992 5.21001C5.91992 4.80001 6.24992 4.46001 6.66992 4.46001H6.67992C7.08992 4.46001 7.42992 4.79001 7.42992 5.21001Z",
    },
    {
      d: "M9.92992 5.21001C9.92992 5.62001 9.58992 5.96001 9.17992 5.96001C8.76992 5.96001 8.41992 5.62001 8.41992 5.21001C8.41992 4.80001 8.74992 4.46001 9.16992 4.46001H9.17992C9.58992 4.46001 9.92992 4.79001 9.92992 5.21001Z",
    },
    {
      d: "M12.4299 5.21001C12.4299 5.62001 12.0899 5.96001 11.6799 5.96001C11.2699 5.96001 10.9199 5.62001 10.9199 5.21001C10.9199 4.80001 11.2499 4.46001 11.6699 4.46001H11.6799C12.0899 4.46001 12.4299 4.79001 12.4299 5.21001Z",
    },
  ],
  theme: [
    {
      d: "M16.2401 16.2398L14.2801 18.2098C13.8601 18.6198 13.2901 18.8598 12.7001 18.8598C12.1101 18.8598 11.5501 18.6198 11.1301 18.2098L10.2701 17.3498C10.1601 17.2398 10.0201 17.1798 9.86014 17.1798C9.71014 17.1898 9.56014 17.2598 9.46014 17.3698L6.08014 21.2098C5.66014 21.6898 5.05014 21.9798 4.41014 21.9998H4.34014C3.71014 21.9998 3.12014 21.7498 2.68014 21.3198C2.23014 20.8598 1.98014 20.2398 2.00014 19.5898C2.02014 18.9498 2.31014 18.3398 2.79014 17.9198L6.63014 14.5398C6.74014 14.4298 6.81014 14.2898 6.82014 14.1398C6.82014 13.9798 6.76014 13.8398 6.65014 13.7298L5.79014 12.8698C5.38014 12.4498 5.14014 11.8898 5.14014 11.2998C5.14014 10.7098 5.38014 10.1398 5.79014 9.71977L7.76014 7.75977L16.2401 16.2398Z",
    },
    {
      d: "M21.2898 11.19L16.2398 16.24L7.75977 7.76L12.8098 2.71C13.2598 2.26 13.8798 2 14.5198 2C15.1598 2 15.7798 2.26 16.2398 2.71L16.8298 3.31H16.8398L17.8898 4.36L19.6198 6.1H19.6298L20.6798 7.15L21.2898 7.76C22.2398 8.71 22.2398 10.25 21.2898 11.19Z",
      opacity: 0.4,
    },
    {
      d: "M20.6802 7.1501L18.3302 9.5201C18.1802 9.6701 17.9902 9.7401 17.8002 9.7401C17.6102 9.7401 17.4202 9.6701 17.2702 9.5201C16.9802 9.2301 16.9802 8.7501 17.2702 8.4601L19.6202 6.1001H19.6302L20.6802 7.1501Z",
    },
    {
      d: "M17.8899 4.36006L15.5399 6.72006C15.3899 6.87006 15.1999 6.94006 15.0099 6.94006C14.8199 6.94006 14.6199 6.87006 14.4799 6.72006C14.1799 6.43006 14.1799 5.96006 14.4799 5.66006L16.8299 3.31006H16.8399L17.8899 4.36006Z",
    },
  ],
  navigation: [
    {
      d: "M14.62 5.68008C14.62 6.46008 14.86 7.19008 15.28 7.78008H5.51C4.82 7.78008 4.16 7.56008 3.61 7.15008L2.21 6.10008C2.08 6.00008 2 5.85008 2 5.68008C2 5.52008 2.08 5.36008 2.21 5.26008L3.61 4.21008C4.16 3.80008 4.82 3.58008 5.51 3.58008H15.28C14.86 4.17008 14.62 4.90008 14.62 5.68008Z",
      opacity: 0.4,
    },
    {
      d: "M20.4102 8.69995V17.43C20.4102 18.11 20.1802 18.77 19.7702 19.32L18.7202 20.72C18.6202 20.85 18.4702 20.93 18.3002 20.93C18.1402 20.93 17.9802 20.85 17.8802 20.72L16.8302 19.32C16.4202 18.77 16.2002 18.11 16.2002 17.43V8.69995C16.7902 9.11995 17.5202 9.35995 18.3002 9.35995C19.0802 9.35995 19.8202 9.11995 20.4102 8.69995Z",
      opacity: 0.4,
    },
    {
      d: "M13.5698 21.6799C7.3598 21.6799 2.2998 16.6299 2.2998 10.4099C2.2998 9.99991 2.6398 9.65991 3.0498 9.65991C3.4598 9.65991 3.7998 9.99991 3.7998 10.4099C3.7998 15.7999 8.1798 20.1799 13.5698 20.1799C13.9798 20.1799 14.3198 20.5199 14.3198 20.9299C14.3198 21.3399 13.9798 21.6799 13.5698 21.6799Z",
    },
    {
      d: "M20.8998 3.82994C20.7098 3.82994 20.5198 3.75994 20.3698 3.60994C20.0798 3.31994 20.0798 2.83994 20.3698 2.54994L21.4498 1.46994C21.7398 1.17994 22.2198 1.17994 22.5098 1.46994C22.7998 1.75994 22.7998 2.23994 22.5098 2.52994L21.4298 3.60994C21.2798 3.75994 21.0898 3.82994 20.8998 3.82994Z",
    },
    {
      d: "M18.3001 2C17.0501 2 15.9401 2.63 15.2801 3.58C14.8601 4.17 14.6201 4.9 14.6201 5.68C14.6201 6.46 14.8601 7.19 15.2801 7.78C15.5301 8.14 15.8401 8.45 16.2001 8.7C16.7901 9.12 17.5201 9.36 18.3001 9.36C19.0801 9.36 19.8201 9.12 20.4101 8.7C21.3601 8.03 21.9801 6.93 21.9801 5.68C21.9801 3.65 20.3301 2 18.3001 2ZM18.8101 6.23C18.6701 6.36 18.4901 6.43 18.3101 6.43C18.1301 6.43 17.9501 6.36 17.8101 6.23C17.6501 6.09 17.5601 5.88 17.5601 5.67C17.5601 5.46 17.6501 5.25 17.8001 5.11C18.0901 4.85 18.5301 4.84 18.8101 5.11C18.9701 5.25 19.0601 5.46 19.0601 5.67C19.0601 5.88 18.9701 6.09 18.8201 6.23H18.8101Z",
    },
  ],
  sidebar: [
    {
      d: "M22 7.81v8.38c0 3.64-2.17 5.81-5.81 5.81H7.81c-.2 0-.4-.01-.59-.02-1.23-.08-2.27-.43-3.09-1.03-.42-.29-.79-.66-1.08-1.08C2.36 18.92 2 17.68 2 16.19V7.81c0-3.44 1.94-5.57 5.22-5.78.19-.02.39-.03.59-.03h8.38c1.49 0 2.73.36 3.68 1.05.42.29.79.66 1.08 1.08.69.95 1.05 2.19 1.05 3.68Z",
      opacity: 0.4,
    },
    {
      d: "M8.72 2v20h-.91c-.2 0-.4-.01-.59-.02V2.03c.19-.02.39-.03.59-.03h.91ZM14.97 15.309c-.19 0-.38-.07-.53-.22l-2.56-2.56a.754.754 0 0 1 0-1.06l2.56-2.56c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06l-2.02 2.03 2.03 2.03c.29.29.29.77 0 1.06-.15.15-.34.22-.54.22Z",
    },
  ],
  features: [
    {
      d: "M2 12.881v-1.76c0-1.04.85-1.9 1.9-1.9 1.81 0 2.55-1.28 1.64-2.85-.52-.9-.21-2.07.7-2.59l1.73-.99c.79-.47 1.81-.19 2.28.6l.11.19c.9 1.57 2.38 1.57 3.29 0l.11-.19c.47-.79 1.49-1.07 2.28-.6l1.73.99c.91.52 1.22 1.69.7 2.59-.91 1.57-.17 2.85 1.64 2.85 1.04 0 1.9.85 1.9 1.9v1.76c0 1.04-.85 1.9-1.9 1.9-1.81 0-2.55 1.28-1.64 2.85.52.91.21 2.07-.7 2.59l-1.73.99c-.79.47-1.81.19-2.28-.6l-.11-.19c-.9-1.57-2.38-1.57-3.29 0l-.11.19c-.47.79-1.49 1.07-2.28.6l-1.73-.99a1.899 1.899 0 0 1-.7-2.59c.91-1.57.17-2.85-1.64-2.85-1.05 0-1.9-.86-1.9-1.9Z",
      opacity: 0.4,
    },
    { d: "M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" },
  ],
  sizing: [
    {
      d: "M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2Z",
      opacity: 0.4,
    },
    {
      d: "M18.6899 5.71C18.6099 5.53 18.4699 5.38 18.2799 5.3C18.1899 5.27 18.0999 5.25 17.9999 5.25H13.9999C13.5899 5.25 13.2499 5.59 13.2499 6C13.2499 6.41 13.5899 6.75 13.9999 6.75H16.1899L12.4699 10.47C12.1799 10.76 12.1799 11.24 12.4699 11.53C12.6199 11.68 12.8099 11.75 12.9999 11.75C13.1899 11.75 13.3799 11.68 13.5299 11.53L17.2499 7.81V10C17.2499 10.41 17.5899 10.75 17.9999 10.75C18.4099 10.75 18.7499 10.41 18.7499 10V6C18.7499 5.9 18.7299 5.81 18.6899 5.71Z",
    },
    {
      d: "M11.53 12.4695C11.24 12.1795 10.76 12.1795 10.47 12.4695L6.75 16.1895V13.9995C6.75 13.5895 6.41 13.2495 6 13.2495C5.59 13.2495 5.25 13.5895 5.25 13.9995V17.9995C5.25 18.0995 5.27 18.1895 5.31 18.2895C5.39 18.4695 5.53 18.6195 5.72 18.6995C5.8 18.7295 5.9 18.7495 6 18.7495H10C10.41 18.7495 10.75 18.4095 10.75 17.9995C10.75 17.5895 10.41 17.2495 10 17.2495H7.81L11.53 13.5295C11.82 13.2395 11.82 12.7595 11.53 12.4695Z",
    },
  ],
  motion: [
    {
      d: "M12 18.75c-.41 0-.75-.34-.75-.75v-1c0-.41.34-.75.75-.75s.75.34.75.75v1c0 .41-.34.75-.75.75ZM12 22.75c-.41 0-.75-.34-.75-.75v-1c0-.41.34-.75.75-.75s.75.34.75.75v1c0 .41-.34.75-.75.75ZM1.998 22.748c-.06 0-.12-.01-.18-.02-.4-.1-.65-.51-.55-.91l1-4a.75.75 0 1 1 1.46.36l-1 4c-.09.34-.39.57-.73.57ZM21.999 22.749c-.34 0-.64-.23-.73-.57l-1-4c-.1-.4.14-.81.55-.91.4-.1.81.14.91.55l1 4a.748.748 0 0 1-.73.93Z",
    },
    {
      d: "M19.26 9.52c-.11-1.18-.42-2.43-2.71-2.43h-9.1c-2.29 0-2.6 1.26-2.71 2.43l-.4 4.34c-.05.54.13 1.08.5 1.49.38.41.92.65 1.48.65h1.34c1.15 0 1.37-.66 1.52-1.1l.14-.43c.16-.49.2-.61.85-.61h3.65c.64 0 .66.07.85.61l.14.43c.15.44.37 1.1 1.52 1.1h1.34c.56 0 1.1-.24 1.48-.65.37-.4.55-.95.5-1.49l-.39-4.34Z",
      opacity: 0.4,
    },
    {
      d: "M18.42 4.94h-.72l-.27-1.29c-.26-1.25-.79-2.4-2.92-2.4H9.5c-2.13 0-2.66 1.15-2.92 2.4l-.27 1.29h-.72c-.3 0-.54.24-.54.54 0 .3.24.54.54.54h.51l-.3 1.43c.39-.22.92-.36 1.66-.36h9.1c.74 0 1.28.14 1.66.36l-.3-1.43h.51c.3 0 .54-.24.54-.54a.553.553 0 0 0-.55-.54ZM9.86 11.01H7.72c-.3 0-.54-.24-.54-.54 0-.3.24-.54.54-.54h2.14c.3 0 .54.24.54.54a.55.55 0 0 1-.54.54ZM16.282 11.01h-2.14c-.3 0-.54-.24-.54-.54 0-.3.24-.54.54-.54h2.14c.3 0 .54.24.54.54 0 .3-.24.54-.54.54Z",
    },
  ],
  guide: [
    {
      d: "M7.37 22h9.25a4.87 4.87 0 0 0 4.87-4.87V8.37a4.87 4.87 0 0 0-4.87-4.87H7.37A4.87 4.87 0 0 0 2.5 8.37v8.75c0 2.7 2.18 4.88 4.87 4.88Z",
      opacity: 0.4,
    },
    {
      d: "M8.29 6.29c-.42 0-.75-.34-.75-.75V2.75a.749.749 0 1 1 1.5 0v2.78c0 .42-.33.76-.75.76ZM15.71 6.29c-.42 0-.75-.34-.75-.75V2.75a.749.749 0 1 1 1.5 0v2.78c0 .42-.33.76-.75.76ZM14.78 13.71H7.36a.749.749 0 1 1 0-1.5h7.42a.749.749 0 1 1 0 1.5ZM12 17.422H7.36a.749.749 0 1 1 0-1.5H12a.749.749 0 1 1 0 1.5Z",
    },
  ],
  customSections: [
    {
      d: "M20 3.5H5.5c-.31 0-.61.15-.8.4l-1.5 2c-.49.66-.02 1.6.8 1.6h14.5c.31 0 .61-.15.8-.4l1.5-2c.49-.66.02-1.6-.8-1.6Z",
    },
    {
      d: "M4 10h14.5c.31 0 .61.15.8.4l1.5 2c.49.66.02 1.6-.8 1.6H5.5c-.31 0-.61-.15-.8-.4l-1.5-2c-.49-.66-.02-1.6.8-1.6Z",
      opacity: 0.4,
    },
    {
      d: "M20 16.5H5.5c-.31 0-.61.15-.8.4l-1.5 2c-.49.66-.02 1.6.8 1.6h14.5c.31 0 .61-.15.8-.4l1.5-2c.49-.66.02-1.6-.8-1.6Z",
    },
  ],
  footer: [
    {
      d: "M16.19 2H7.81C4.17 2 2 4.17 2 7.81v8.38c0 .2.01.4.02.59.08 1.23.43 2.27 1.03 3.09.29.42.66.79 1.08 1.08.95.69 2.19 1.05 3.68 1.05h8.38c3.44 0 5.57-1.94 5.78-5.22.02-.19.03-.39.03-.59V7.81c0-1.49-.36-2.73-1.05-3.68-.29-.42-.66-.79-1.08-1.08C18.92 2.36 17.68 2 16.19 2Z",
      opacity: 0.4,
    },
    {
      d: "M22 15.281H2v.91c0 .2.01.4.02.59h19.95c.02-.19.03-.39.03-.59v-.91ZM8.69 9.028c0 .19.07.38.22.53l2.56 2.56c.29.29.77.29 1.06 0l2.56-2.56c.29-.29.29-.77 0-1.06a.754.754 0 0 0-1.06 0L12 10.518l-2.03-2.02c-.29-.3-.77-.3-1.06 0a.71.71 0 0 0-.22.53Z",
    },
  ],
};

interface SectionMeta {
  key: string;
  title: string;
  hint: string;
}

const SECTIONS: readonly SectionMeta[] = [
  { key: "spec", title: "Spec", hint: "OpenAPI 3.x document (JSON or YAML)" },
  { key: "site", title: "Site", hint: "Page identity, base path, favicon" },
  { key: "theme", title: "Theme", hint: "Colors, fonts, corner radius" },
  { key: "navigation", title: "Navigation (top bar)", hint: "Sticky top bar affordances" },
  { key: "sidebar", title: "Sidebar", hint: "Left navigation rail" },
  { key: "features", title: "Features", hint: "Global on/off switches" },
  { key: "sizing", title: "Sizing", hint: "Typography scale and layout dimensions" },
  { key: "motion", title: "Motion", hint: "Animation timing and visual color-mix intensities" },
  {
    key: "guide",
    title: "Integration guide",
    hint: "Auto = derive from spec · Custom = your Markdown · Off = hide panel",
  },
  { key: "customSections", title: "Custom sections", hint: "Your own Markdown chapters" },
  { key: "footer", title: "Footer", hint: "Links and closing text" },
] as const;

/** Chevron toggle indicator on every section summary. */
function Chevron() {
  return (
    <svg
      className="section__chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

/** Bulk-variant Iconsax icon rendered inline from the SECTION_ICONS map. */
function SectionIcon({ sectionKey }: { sectionKey: string }) {
  const paths = SECTION_ICONS[sectionKey];
  if (!paths) return null;
  return (
    <svg className="section__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {paths.map((p, i) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: SECTION_ICONS entries are stable and never reordered.
          key={i}
          d={p.d}
          {...(p.opacity !== undefined && p.opacity !== 1 ? { opacity: String(p.opacity) } : {})}
        />
      ))}
    </svg>
  );
}

/**
 * Empty section shell: summary button (icon, title, hint, chevron) plus
 * the collapsible body wrapper. `data-pw-cb-section` on the container
 * lets the client bind toggle + persistence to it, and
 * `data-pw-cb-body` marks the slot the client fills with field widgets.
 */
function Section({ meta }: { meta: SectionMeta }) {
  return (
    <div className="section" data-pw-cb-section={meta.key} data-open="false">
      <button
        type="button"
        className="section__summary"
        aria-expanded="false"
        aria-controls={`pw-cb-body-${meta.key}`}
        data-pw-cb-toggle
      >
        <Chevron />
        <SectionIcon sectionKey={meta.key} />
        <span className="section__title">{meta.title}</span>
        <span className="section__hint">{meta.hint}</span>
      </button>
      <div className="section__body-outer" id={`pw-cb-body-${meta.key}`}>
        <div className="section__body">
          <div className="section__body-inner" data-pw-cb-body={meta.key} />
        </div>
      </div>
    </div>
  );
}

/** SVG icon helpers for the top-bar action buttons. */
function IconReset() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

/**
 * The full builder page. Wraps the shared TopNav, intro block, form
 * (11 empty section shells) and preview panel. The client bundle takes
 * over on boot: it binds section toggling, fills each body's fields,
 * hooks up the top-bar actions, and renders the live preview.
 */
export function ConfigBuilder({ navigation }: { navigation: ResolvedConfig["navigation"] }) {
  return (
    <div className="pw-app pw-cb-app">
      <TopNav navigation={navigation} />
      <section className="pw-cb__intro">
        <h1 className="pw-cb__title">Configuration Builder</h1>
        <p className="pw-cb__lead">
          Click your <code>periwinkle.config.ts</code> together, see it update on the right, and
          copy or save the result. Only fields you change from their defaults land in the output —
          the file stays as small as possible.
        </p>
        <p className="pw-cb__meta">
          Every option is documented in{" "}
          <a
            href="https://github.com/phranck/periwinkle/blob/main/CONFIGURATION.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            CONFIGURATION.md
          </a>
          . This builder runs entirely in your browser; nothing is uploaded.
        </p>
      </section>

      <main className="pw-cb__layout" data-pw-cb-root>
        <form className="pw-cb__form" id="pw-cb-form" autoComplete="off">
          {SECTIONS.map((meta) => (
            <Section key={meta.key} meta={meta} />
          ))}
        </form>

        <aside className="pw-cb__preview" aria-label="Generated periwinkle.config.ts">
          <div className="pw-cb__preview-header">
            <div className="pw-cb__preview-actions">
              <button
                type="button"
                className="pw-cb__action pw-cb__action--danger"
                data-pw-cb-action="reset"
                title="Reset all fields to their defaults"
              >
                <IconReset /> Reset defaults
              </button>
              <button
                type="button"
                className="pw-cb__action"
                data-pw-cb-action="copy"
                title="Copy the generated periwinkle.config.ts to the clipboard"
              >
                <IconCopy /> Copy
              </button>
              <button
                type="button"
                className="pw-cb__action pw-cb__action--accent"
                data-pw-cb-action="save"
                title="Save periwinkle.config.ts (browser will prompt where to save)"
              >
                <IconSave /> Save file
              </button>
            </div>
            <span className="pw-cb__preview-filename">periwinkle.config.ts</span>
          </div>
          {/* biome-ignore lint/a11y/useSemanticElements: <pre> is intentional here — it hosts monospaced source; using a list would be misleading semantically. */}
          <pre
            className="pw-cb__preview-body"
            id="pw-cb-preview"
            role="region"
            aria-live="polite"
          />
        </aside>
      </main>

      <dialog className="pw-cb__dialog" id="pw-cb-reset-dialog">
        <div className="pw-cb__dialog-body">
          <h2 className="pw-cb__dialog-title">Reset all fields?</h2>
          <p className="pw-cb__dialog-text">
            This clears every value and restores the built-in periwinkle defaults. It cannot be
            undone.
          </p>
          <div className="pw-cb__dialog-actions">
            <button type="button" className="pw-cb__action" data-pw-cb-dialog-close>
              Cancel
            </button>
            <button
              type="button"
              className="pw-cb__action pw-cb__action--accent"
              data-pw-cb-dialog-confirm
            >
              Reset
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
