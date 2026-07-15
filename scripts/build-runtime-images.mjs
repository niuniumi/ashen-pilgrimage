import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

import { PIXEL_TEXTURE_ASSETS } from '../src/art/PixelAssetCatalog.js';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(projectRoot, 'qa', 'source-art', 'runtime-masters');
const runtimeRoot = path.join(projectRoot, 'public');

const pythonProgram = String.raw`
import json
import os
import sys
import tempfile

try:
    from PIL import Image, features
except ImportError as error:
    raise SystemExit(
        "Pillow is required to build runtime images. Install it with "
        f"'{sys.executable} -m pip install Pillow'."
    ) from error

if not features.check("webp"):
    raise SystemExit(
        "The installed Pillow build does not include WebP support. "
        "Install a Pillow build with libwebp enabled."
    )

config = json.load(sys.stdin)
changed = 0
unchanged = 0
original_bytes = 0
runtime_bytes = 0

def has_alpha(image):
    return "A" in image.getbands() or "transparency" in image.info

def verify_pixels(source, runtime, relative_path):
    if source.size != runtime.size:
        raise ValueError(
            f"dimension mismatch for {relative_path}: {source.size} != {runtime.size}"
        )

    source_alpha = has_alpha(source)
    runtime_alpha = has_alpha(runtime)
    if source_alpha != runtime_alpha:
        raise ValueError(
            f"alpha presence mismatch for {relative_path}: "
            f"source={source_alpha}, runtime={runtime_alpha}"
        )

    source_rgba = source.convert("RGBA").tobytes()
    runtime_rgba = runtime.convert("RGBA").tobytes()
    for offset in range(0, len(source_rgba), 4):
        source_pixel = source_rgba[offset:offset + 4]
        runtime_pixel = runtime_rgba[offset:offset + 4]
        if source_pixel[3] != runtime_pixel[3]:
            raise ValueError(f"alpha mismatch for {relative_path} at pixel {offset // 4}")
        if source_pixel[3] != 0 and source_pixel != runtime_pixel:
            raise ValueError(
                f"visible pixel mismatch for {relative_path} at pixel {offset // 4}"
            )

for asset in config["assets"]:
    relative_webp = asset["url"]
    relative_png = relative_webp[:-5] + ".png"
    source_path = os.path.join(config["sourceRoot"], *relative_png.split("/"))
    runtime_path = os.path.join(config["runtimeRoot"], *relative_webp.split("/"))

    if not os.path.isfile(source_path):
        raise FileNotFoundError(f"missing PNG runtime master: {source_path}")

    os.makedirs(os.path.dirname(runtime_path), exist_ok=True)
    original_bytes += os.path.getsize(source_path)

    temporary_path = None
    try:
        with Image.open(source_path) as source:
            source.load()
            encoded = source.convert("RGBA" if has_alpha(source) else "RGB")
            with tempfile.NamedTemporaryFile(
                dir=os.path.dirname(runtime_path), suffix=".webp", delete=False
            ) as temporary:
                temporary_path = temporary.name
            encoded.save(
                temporary_path,
                format="WEBP",
                lossless=True,
                method=6,
                exact=True,
            )

            with Image.open(temporary_path) as runtime:
                runtime.load()
                verify_pixels(source, runtime, relative_webp)

        with open(temporary_path, "rb") as generated_file:
            generated_bytes = generated_file.read()
        existing_bytes = None
        if os.path.isfile(runtime_path):
            with open(runtime_path, "rb") as runtime_file:
                existing_bytes = runtime_file.read()

        if generated_bytes == existing_bytes:
            unchanged += 1
            os.unlink(temporary_path)
            temporary_path = None
        else:
            os.replace(temporary_path, runtime_path)
            temporary_path = None
            changed += 1

        runtime_bytes += len(generated_bytes)
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.unlink(temporary_path)

print(json.dumps({
    "count": len(config["assets"]),
    "changed": changed,
    "unchanged": unchanged,
    "originalBytes": original_bytes,
    "runtimeBytes": runtime_bytes,
    "savedBytes": original_bytes - runtime_bytes,
}, separators=(",", ":")))
`;

function pythonCandidates() {
  const candidates = [];
  if (process.env.PYTHON) candidates.push({ command: process.env.PYTHON, args: [], label: 'PYTHON' });
  candidates.push({ command: 'python', args: [], label: 'python' });
  candidates.push({ command: 'py', args: ['-3'], label: 'py -3' });
  return candidates;
}

function runConverter(input) {
  const attempts = [];
  for (const candidate of pythonCandidates()) {
    const result = spawnSync(candidate.command, [...candidate.args, '-c', pythonProgram], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, PYTHONUTF8: '1' },
      input: JSON.stringify(input),
      windowsHide: true
    });

    if (!result.error && result.status === 0) return JSON.parse(result.stdout.trim());

    const detail = result.error?.message ?? (result.stderr.trim() || `exit code ${result.status}`);
    attempts.push(`${candidate.label}: ${detail}`);
  }

  throw new Error(
    `Unable to build lossless WebP assets. A Python 3 runtime with Pillow and WebP support is required.\n${attempts.join('\n')}`
  );
}

const assets = PIXEL_TEXTURE_ASSETS.map(({ key, url }) => ({ key, url }));
for (const asset of assets) {
  if (!asset.url.endsWith('.webp')) throw new Error(`Runtime asset must use WebP: ${asset.key} (${asset.url})`);
}

const summary = runConverter({ assets, runtimeRoot, sourceRoot });
console.log(JSON.stringify(summary, null, 2));
