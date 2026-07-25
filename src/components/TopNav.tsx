/**
 * Sticky top navigation bar rendered above the reference shell.
 *
 * Structure adopted verbatim from `apps/developer/src/components/PublicHeader.astro`
 * and `apps/developer/src/components/PublicNavigationItems.astro`:
 *
 * ```
 * div.public-header
 *   header.public-header__inner.developer-shell
 *     a.public-header__brand (optional logo, links to homeHref)
 *       <img class=public-header__brand-logo />
 *     div.public-header__actions
 *       nav.public-header__desktop
 *         a.public-navigation__link (home)
 *           <Icon class=public-navigation__item-icon />
 *           <span class=public-navigation__label>API reference</span>
 *         a.public-navigation__link (custom nav links, if any)
 *           <span>Label</span>
 *         a.public-navigation__link (github)
 *           <GithubMark /> <span>GitHub</span>
 *         a.public-navigation__link data-public-search-command (search)
 *           <Icon /> <span>Search</span> <KeyCap shortcut="⌘K" />
 *         button.public-navigation__link (theme toggle, periwinkle addition)
 *           <Sun /><Moon />
 * ```
 *
 * Search and the theme toggle are the fixed trailing pair, in that order:
 * search always sits directly left of the toggle, with every other item to
 * their left. Disabling either just moves the remaining items right.
 *
 * Every entry uses the reference `.public-navigation__link` surface: an
 * icon left of a text label, with a pill backdrop on hover. Search is a
 * `<button>` (musiccloud renders an `<a href="/docs/api?search=1">` that
 * routes to the search page; periwinkle opens the same document dialog
 * inline, so a real anchor href would be misleading). Theme toggle is a
 * periwinkle addition and follows the same visual recipe.
 *
 * Sticky at `top: 0`. `bindTopNavScrollState` toggles
 * `data-pw-top-nav-scrolled="true"` once the page scrolls behind the bar
 * so the stylesheet lifts the frosted-glass backdrop and separator.
 */

import type { CSSProperties } from "react";

import type { ResolvedConfig } from "../config/config.js";
import { DataIcon, MoonIcon, SearchStatusIcon, Sun1Icon } from "./icons.jsx";
import { KeyCap } from "./primitives.jsx";

/** GitHub mark rendered inline; iconsax ships no GitHub logo. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.724-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.236 1.839 1.236 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.605-2.665-.303-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.235-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23A11.507 11.507 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.371.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12Z"
      />
    </svg>
  );
}

/**
 * Iconsax Bulk-variant "code slash" mark used for the auto-generated
 * "Config builder" nav link, matching the docs' Bulk icon style.
 */
function ConfigBuilderMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        opacity="0.4"
        d="M16.74 4.63003V8.84003C16.74 10 15.79 10.95 14.63 10.95H6.21C6.03 10.95 5.86 10.94 5.69 10.92C3.61 10.66 2 8.88003 2 6.74003C2 5.58003 2.47 4.52003 3.24 3.76003C4 3.00003 5.05 2.53003 6.21 2.53003H14.63C15.79 2.53003 16.74 3.47003 16.74 4.63003Z"
      />
      <path d="M16.6699 4.11011H18.8399C19.4199 4.11011 19.8899 4.58011 19.8899 5.16011V7.27011C19.8899 7.85011 19.4199 8.32011 18.8399 8.32011H16.7299" />
      <path d="M21.9996 6.95996H19.8896C19.4796 6.95996 19.1396 6.61996 19.1396 6.20996C19.1396 5.79996 19.4796 5.45996 19.8896 5.45996H21.9996C22.4096 5.45996 22.7496 5.79996 22.7496 6.20996C22.7496 6.61996 22.4096 6.95996 21.9996 6.95996Z" />
      <path d="M8.94973 7.48999H6.21973C5.80973 7.48999 5.46973 7.14999 5.46973 6.73999C5.46973 6.32999 5.80973 5.98999 6.21973 5.98999H8.94973C9.35973 5.98999 9.69973 6.32999 9.69973 6.73999C9.69973 7.14999 9.35973 7.48999 8.94973 7.48999Z" />
      <path d="M14.6296 10.95V12.45C14.6296 13.36 13.8896 14.11 12.9696 14.11H9.88965L10.9496 10.95H14.6296Z" />
      <path d="M10.9501 10.9499L9.89008 14.1099L8.84008 17.2599H3.58008L5.69008 10.9199C5.86008 10.9399 6.03008 10.9499 6.21008 10.9499H10.9501Z" />
      <path d="M10.42 18.32V20.42C10.42 21 9.95 21.47 9.37 21.47H3.05C2.47 21.47 2 21 2 20.42V18.32C2 17.73 2.47 17.26 3.05 17.26H9.37C9.95 17.26 10.42 17.73 10.42 18.32Z" />
    </svg>
  );
}

/** Matches the auto-generated config-builder link so it can carry an icon. */
const CONFIG_BUILDER_HREF_RE = /config-builder(?:\.html|\/)(?:$|[?#])/;

/**
 * Renders the top navigation bar, or `null` when every affordance is off.
 *
 * The docs home ("API reference") and the generated config builder are the two
 * built-in destinations, and they cross-link. `currentPage` tells the bar which
 * one is the page being rendered: that item renders as a non-interactive,
 * highlighted `<span>` (no href, not focusable), while the other renders as
 * a plain link that navigates in the same window. This makes the active
 * item unclickable and keeps the two pages navigable back and forth.
 *
 * @param props.navigation The resolved navigation config.
 * @param props.currentPage Which page this bar renders on. `"docs"` (default)
 *   marks the home link active; `"builder"` marks the config-builder link
 *   active and turns the home link into a same-window link back to the docs.
 */
export function TopNav({
  navigation,
  currentPage = "docs",
}: {
  navigation: ResolvedConfig["navigation"];
  currentPage?: "docs" | "builder";
}) {
  const hasLogo = Boolean(navigation.logo);
  const hasHome = navigation.showHome;
  const hasSearch = navigation.showSearch;
  const hasGithub = Boolean(navigation.github);
  const hasThemeToggle = navigation.showThemeToggle;
  const hasCustomLinks = navigation.links.length > 0;
  if (!hasLogo && !hasHome && !hasSearch && !hasGithub && !hasThemeToggle && !hasCustomLinks) {
    return null;
  }

  const homeActive = currentPage === "docs";

  return (
    <div className="public-header" data-pw-top-nav>
      <header className="public-header__inner developer-shell">
        {hasLogo ? (
          // Brand mark on the left, mirroring the reference `Wordmark` slot:
          // first child of the inner row, linking home.
          <a
            className="public-header__brand"
            href={navigation.homeHref}
            aria-label={navigation.homeLabel}
          >
            {navigation.logoTint ? (
              // Tinted marks are painted with the current text color through a
              // CSS mask, so one silhouette stays legible in both themes.
              <span
                className="public-header__brand-logo public-header__brand-logo--tinted"
                style={{ "--pw-brand-logo": `url("${navigation.logo}")` } as CSSProperties}
                aria-hidden="true"
              />
            ) : (
              <img className="public-header__brand-logo" src={navigation.logo} alt="" />
            )}
          </a>
        ) : null}
        <div className="public-header__actions">
          <nav
            className="public-header__desktop"
            aria-label="Primary"
            data-public-navigation="desktop"
          >
            {hasHome ? (
              homeActive ? (
                <span
                  className="public-navigation__link public-navigation__link--active"
                  aria-current="page"
                >
                  <DataIcon className="public-navigation__item-icon" aria-hidden="true" />
                  <span className="public-navigation__label">{navigation.homeLabel}</span>
                </span>
              ) : (
                <a className="public-navigation__link" href={navigation.homeHref}>
                  <DataIcon className="public-navigation__item-icon" aria-hidden="true" />
                  <span className="public-navigation__label">{navigation.homeLabel}</span>
                </a>
              )
            ) : null}
            {navigation.links.map((link) => {
              const isConfigBuilder = CONFIG_BUILDER_HREF_RE.test(link.href);
              const linkActive = isConfigBuilder && currentPage === "builder";
              if (linkActive) {
                return (
                  <span
                    key={`${link.label}-${link.href}`}
                    className="public-navigation__link public-navigation__link--active"
                    aria-current="page"
                  >
                    <ConfigBuilderMark className="public-navigation__item-icon" />
                    <span className="public-navigation__label">{link.label}</span>
                  </span>
                );
              }
              const opensInNewTab = link.target === "_blank";
              return (
                <a
                  key={`${link.label}-${link.href}`}
                  className="public-navigation__link"
                  href={link.href}
                  title={link.label}
                  {...(link.target ? { target: link.target } : {})}
                  {...(opensInNewTab ? { rel: "noopener noreferrer" } : {})}
                >
                  {isConfigBuilder ? (
                    <ConfigBuilderMark className="public-navigation__item-icon" />
                  ) : null}
                  <span className="public-navigation__label">{link.label}</span>
                </a>
              );
            })}
            {navigation.github ? (
              <a
                className="public-navigation__link"
                href={navigation.github.url}
                aria-label={navigation.github.label ?? "GitHub"}
                title={navigation.github.label ?? "GitHub"}
                rel="noopener noreferrer"
                target="_blank"
              >
                <GithubMark className="public-navigation__item-icon" />
                <span className="public-navigation__label">
                  {navigation.github.label ?? "GitHub"}
                </span>
              </a>
            ) : null}
            {/* Search and the theme toggle are the trailing pair: search sits
                directly left of the toggle, after every other item. If either
                is disabled, the rest simply moves right. */}
            {hasSearch ? (
              <button
                type="button"
                className="public-navigation__link"
                aria-label="Search API reference"
                data-pw-search-trigger
                data-public-search-command
              >
                <SearchStatusIcon className="public-navigation__item-icon" aria-hidden="true" />
                <span className="public-navigation__label">Search</span>
                <KeyCap shortcut="⌘K" />
              </button>
            ) : null}
            {hasThemeToggle ? (
              <button
                type="button"
                className="public-navigation__link public-header__theme-toggle"
                aria-label="Toggle colour scheme"
                title="Toggle colour scheme"
                data-pw-theme-toggle
              >
                <Sun1Icon
                  className="pw-nav__theme-icon pw-nav__theme-icon--light public-navigation__item-icon"
                  aria-hidden="true"
                />
                <MoonIcon
                  className="pw-nav__theme-icon pw-nav__theme-icon--dark public-navigation__item-icon"
                  aria-hidden="true"
                />
              </button>
            ) : null}
          </nav>
        </div>
      </header>
    </div>
  );
}
