/**
 * React SSR component for the standalone configuration-builder page.
 *
 * Renders the static shell that the `config-builder.ts` client bundle
 * animates and populates. The component is embedded inside the same top
 * navigation as the docs page so both routes share the same chrome,
 * theme, and typography — the visual difference is only the body.
 *
 * Steps 2-5 flesh out the shell (sections, field grids, preview panel);
 * step 1 keeps it minimal so the two-page build pipeline can be verified
 * end-to-end first.
 */

import type { ResolvedConfig } from "../config/config.js";
import { TopNav } from "./TopNav.jsx";

/**
 * Wraps the builder body in the shared page shell (same top bar as the
 * docs page). The root element carries `data-pw-cb-root` so the client
 * bundle can find its scope.
 *
 * @param props.navigation The resolved navigation config used to render
 *   the top bar consistently with the docs page.
 */
export function ConfigBuilder({ navigation }: { navigation: ResolvedConfig["navigation"] }) {
  return (
    <div className="pw-app pw-cb-app">
      <TopNav navigation={navigation} />
      <main className="pw-cb" data-pw-cb-root>
        <div className="pw-cb__intro">
          <h1 className="pw-cb__title">Configuration Builder</h1>
          <p className="pw-cb__lead">
            The full builder UI arrives in the next commits — this shell only proves the two-page
            build pipeline works end to end.
          </p>
        </div>
      </main>
    </div>
  );
}
