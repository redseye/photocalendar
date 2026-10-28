// Writes assets/fonts/NotoSerifTC-Regular.ttf: Noto Serif TC Regular cut down to
// the characters the app can show in serif text, i.e. printable ASCII plus every
// character in App.tsx and src/**/*.ts(x) (question bank, resource names, UI
// strings). The full font (about 10 MB) comes from the
// @expo-google-fonts/noto-serif-tc devDependency and is not bundled.
// Re-run after changing src/questions.ts, src/resources.ts or other UI text.
// Usage: npm run gen-font
//        npm run check-font  (exits 1 and lists the characters the subset lacks)
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const outDir = path.join(root, 'assets', 'fonts');
const outFile = path.join(outDir, 'NotoSerifTC-Regular.ttf');
const fullFont = require.resolve(
  '@expo-google-fonts/noto-serif-tc/400Regular/NotoSerifTC_400Regular.ttf'
);
const fontLicense = require.resolve('@expo-google-fonts/noto-serif-tc/LICENSE_FONT');
const subsetWasm = require.resolve('harfbuzzjs/dist/harfbuzz-subset.wasm');

// HarfBuzz enum values (hb-common.h, hb-subset.h).
const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SUBSET_SETS_NAME_ID = 4;
// The subset keeps name IDs 0-6 by default; also keep the OFL notice (13, 14).
const LICENSE_NAME_IDS = [13, 14];

function sourceFiles() {
  const files = fs
    .readdirSync(srcDir, { recursive: true })
    .filter((name) => /\.tsx?$/.test(name))
    .map((name) => path.join(srcDir, name));
  return [path.join(root, 'App.tsx'), ...files].sort();
}

// Printable ASCII plus every non-control character in the sources, ascending.
function wantedCodePoints(files) {
  const codePoints = new Set();
  for (let cp = 0x20; cp <= 0x7e; cp++) codePoints.add(cp);
  for (const file of files) {
    for (const ch of fs.readFileSync(file, 'utf8')) {
      if (!/\p{Cc}/u.test(ch)) codePoints.add(ch.codePointAt(0));
    }
  }
  return [...codePoints].sort((a, b) => a - b);
}

function describe(codePoints) {
  return codePoints
    .map((cp) => `${String.fromCodePoint(cp)} (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`)
    .join(', ');
}

async function subset(fontData, codePoints) {
  const { instance } = await WebAssembly.instantiate(fs.readFileSync(subsetWasm));
  const hb = instance.exports;
  hb._initialize();
  // Re-read the buffer each time: it is replaced whenever wasm memory grows.
  const heap = () => new Uint8Array(hb.memory.buffer);

  const fontPtr = hb.malloc(fontData.length);
  heap().set(fontData, fontPtr);
  const blob = hb.hb_blob_create(fontPtr, fontData.length, HB_MEMORY_MODE_WRITABLE, 0, 0);
  const face = hb.hb_face_create(blob, 0);
  const input = hb.hb_subset_input_create_or_fail();
  const unicodes = hb.hb_subset_input_unicode_set(input);
  for (const cp of codePoints) hb.hb_set_add(unicodes, cp);
  const nameIds = hb.hb_subset_input_set(input, HB_SUBSET_SETS_NAME_ID);
  for (const id of LICENSE_NAME_IDS) hb.hb_set_add(nameIds, id);
  const result = hb.hb_subset_or_fail(face, input);
  if (!result) throw new Error('HarfBuzz could not subset the font');

  const resultBlob = hb.hb_face_reference_blob(result);
  const dataPtr = hb.hb_blob_get_data(resultBlob, 0);
  const data = Buffer.from(heap().subarray(dataPtr, dataPtr + hb.hb_blob_get_length(resultBlob)));
  hb.hb_blob_destroy(resultBlob);
  hb.hb_face_destroy(result);
  hb.hb_subset_input_destroy(input);
  hb.hb_face_destroy(face);
  hb.hb_blob_destroy(blob);
  hb.free(fontPtr);
  return data;
}

async function main() {
  const hb = await import('harfbuzzjs');
  const cmap = (data) => new Set(new hb.Face(new hb.Blob(data)).collectUnicodes());
  const files = sourceFiles();
  const wanted = wantedCodePoints(files);
  const inFont = cmap(fs.readFileSync(fullFont));
  const coverable = wanted.filter((cp) => inFont.has(cp));
  const absent = wanted.filter((cp) => !inFont.has(cp));
  const relOut = path.relative(root, outFile);

  if (process.argv.includes('--check')) {
    const covered = fs.existsSync(outFile) ? cmap(fs.readFileSync(outFile)) : new Set();
    const missing = coverable.filter((cp) => !covered.has(cp));
    if (missing.length > 0) {
      console.error(`${relOut} lacks ${missing.length} characters used in the sources: ${describe(missing)}`);
      console.error('Run npm run gen-font to regenerate it.');
      process.exitCode = 1;
    } else {
      console.log(`${relOut} covers all ${coverable.length} characters from ${files.length} source files`);
    }
  } else {
    const data = await subset(fs.readFileSync(fullFont), coverable);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, data);
    fs.copyFileSync(fontLicense, path.join(outDir, 'OFL.txt'));
    console.log(
      `Wrote ${relOut}: ${coverable.length} characters from ${files.length} source files, ${data.length} bytes`
    );
  }
  if (absent.length > 0) {
    console.log(`Not in Noto Serif TC (shown in a fallback font): ${describe(absent)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
