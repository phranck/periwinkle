/**
 * Builds the social preview card from the project banner.
 *
 * Social platforms lay their cards out at roughly 1200 by 630 pixels and crop
 * anything wider, so the 1600 by 480 banner cannot be shared as it stands: its
 * flower and wordmark would lose their top and bottom, and the transparent
 * rounded corners would render as black. The card therefore centres the banner
 * on an opaque field in the periwinkle accent, which keeps the whole artwork
 * visible at every crop platforms apply.
 *
 *   node tools/build-social-card.mjs
 *
 * Requires ImageMagick and pngquant (`brew install imagemagick pngquant`).
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDir = fileURLToPath(new URL(".", import.meta.url));
const bannerPath = `${toolsDir}../assets/Logo_Banner/banner.png`;
const outPath = `${toolsDir}../assets/Logo_Banner/social-card.png`;

/** Card dimensions every platform crops towards. */
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

/** Banner width inside the card, leaving an even margin on both sides. */
const BANNER_WIDTH = 1080;

/** The periwinkle accent, matching `DEFAULT_LIGHT_COLORS.accent`. */
const BACKGROUND = "#6667ab";

/**
 * Palette size the card is quantized to. The artwork is flat colour with soft
 * gradients, so 256 entries reproduce it without a visible band whilst cutting
 * the file to a fraction of its truecolour size. A crawler fetches this image
 * before it can show the card, and a smaller file is a faster card.
 */
const PALETTE_SIZE = 256;

function run(command, args, hint) {
  try {
    execFileSync(command, args, { stdio: "inherit" });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Failed to build the social card: ${reason}\n`);
    process.stderr.write(`${hint}\n`);
    process.exit(1);
  }
}

run(
  "magick",
  [
    "-size",
    `${CARD_WIDTH}x${CARD_HEIGHT}`,
    `xc:${BACKGROUND}`,
    "(",
    bannerPath,
    "-resize",
    `${BANNER_WIDTH}x`,
    ")",
    "-gravity",
    "center",
    "-composite",
    outPath,
  ],
  "ImageMagick provides the `magick` command: brew install imagemagick",
);

run(
  "pngquant",
  ["--force", "--skip-if-larger", "--strip", "--output", outPath, String(PALETTE_SIZE), outPath],
  "pngquant compresses the card: brew install pngquant",
);

process.stdout.write(`Wrote ${outPath} (${CARD_WIDTH}x${CARD_HEIGHT})\n`);
