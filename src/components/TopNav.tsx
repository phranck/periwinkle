/**
 * Sticky top navigation bar rendered above the reference shell.
 *
 * Structure adopted verbatim from `apps/developer/src/components/PublicHeader.astro`
 * and `apps/developer/src/components/PublicNavigationItems.astro`:
 *
 * ```
 * div.public-header
 *   header.public-header__inner.developer-shell
 *     div.public-header__actions
 *       nav.public-header__desktop
 *         a.public-navigation__link (home)
 *           <Icon class=public-navigation__item-icon />
 *           <span class=public-navigation__label>API reference</span>
 *         a.public-navigation__link data-public-search-command (search)
 *           <Icon /> <span>Search</span> <KeyCap shortcut="⌘K" />
 *         a.public-navigation__link (github)
 *           <GithubMark /> <span>GitHub</span>
 *         button.public-navigation__link (theme toggle, periwinkle addition)
 *           <Sun /><Moon />
 * ```
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
 * Renders the top navigation bar, or `null` when every affordance is off.
 *
 * @param props.navigation The resolved navigation config.
 */
export function TopNav({ navigation }: { navigation: ResolvedConfig["navigation"] }) {
  const hasHome = navigation.showHome;
  const hasSearch = navigation.showSearch;
  const hasGithub = Boolean(navigation.github);
  const hasThemeToggle = navigation.showThemeToggle;
  if (!hasHome && !hasSearch && !hasGithub && !hasThemeToggle) return null;

  return (
    <div className="public-header" data-pw-top-nav>
      <header className="public-header__inner developer-shell">
        <div className="public-header__actions">
          <nav
            className="public-header__desktop"
            aria-label="Primary"
            data-public-navigation="desktop"
          >
            {hasHome ? (
              <a
                className="public-navigation__link public-navigation__link--active"
                href={navigation.homeHref}
                aria-current="page"
              >
                <DataIcon className="public-navigation__item-icon" aria-hidden="true" />
                <span className="public-navigation__label">{navigation.homeLabel}</span>
              </a>
            ) : null}
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
            {hasThemeToggle ? (
              <button
                type="button"
                className="public-navigation__link public-header__theme-toggle"
                aria-label="Toggle color scheme"
                title="Toggle color scheme"
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
