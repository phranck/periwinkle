/**
 * Sticky top navigation bar rendered above the reference shell.
 *
 * Structure (right-to-left): theme toggle, GitHub link (optional), search
 * trigger, home link. Every affordance is toggleable through
 * `navigation.*`; when the whole bar has no children the component returns
 * `null` and no markup is emitted.
 *
 * The bar sits above the document flow with `position: sticky; top: 0`.
 * `bindTopNavScrollState` in the client bundle observes scroll and sets
 * `data-pw-top-nav-scrolled="true"` once the page moves behind it so the
 * stylesheet raises the frosted-glass backdrop.
 *
 * The search trigger dispatches the `periwinkle:open-search-dialog` custom
 * event; the search dialog controller listens for it and opens the same
 * dialog the sidebar search field opens.
 */

import type { ResolvedConfig } from "../config/config.js";
import { MoonIcon, SearchNormal1Icon, Sun1Icon } from "./icons.jsx";
import { KeyCap } from "./primitives.jsx";

/** GitHub mark rendered inline; iconsax does not ship a GitHub logo. */
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
    <header className="pw-topnav" data-pw-top-nav>
      <div className="pw-topnav__inner">
        <div className="pw-topnav__leading">
          {hasHome ? (
            <a className="pw-topnav__home" href={navigation.homeHref}>
              {navigation.homeLabel}
            </a>
          ) : null}
        </div>
        <div className="pw-topnav__actions">
          {hasSearch ? (
            <button
              type="button"
              className="pw-topnav__search"
              aria-label="Search API reference"
              data-pw-search-trigger
            >
              <SearchNormal1Icon className="pw-topnav__search-icon" aria-hidden="true" />
              <span className="pw-topnav__search-label">Search</span>
              <KeyCap shortcut="⌘K" />
            </button>
          ) : null}
          {navigation.github ? (
            <a
              className="pw-topnav__github"
              href={navigation.github.url}
              aria-label={navigation.github.label ?? "GitHub"}
              title={navigation.github.label ?? "GitHub"}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GithubMark className="pw-topnav__github-icon" />
            </a>
          ) : null}
          {hasThemeToggle ? (
            <button
              type="button"
              className="pw-topnav__theme-toggle"
              aria-label="Toggle color scheme"
              title="Toggle color scheme"
              data-pw-theme-toggle
            >
              <Sun1Icon
                className="pw-nav__theme-icon pw-nav__theme-icon--light"
                aria-hidden="true"
              />
              <MoonIcon
                className="pw-nav__theme-icon pw-nav__theme-icon--dark"
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
