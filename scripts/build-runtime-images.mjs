import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { PIXEL_TEXTURE_ASSETS } from '../src/art/PixelAssetCatalog.js';
import { resolveCatalogAssetEntries } from './runtime-image-paths.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const defaultSourceRoot = path.join(projectRoot, 'qa', 'source-art', 'runtime-masters');
const defaultRuntimeRoot = path.join(projectRoot, 'public');

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
mode = config["mode"]
changed = 0
unchanged = 0
verified = 0
original_bytes = 0
runtime_bytes = 0

def assert_inside(root, candidate, label):
    root_real = os.path.realpath(root)
    candidate_absolute = os.path.abspath(candidate)
    try:
        if os.path.commonpath([root_real, candidate_absolute]) != root_real:
            raise ValueError(f"{label} escapes its intended root: {candidate}")
    except ValueError as error:
        raise ValueError(f"{label} escapes its intended root: {candidate}") from error

    probe = candidate_absolute
    suffix = []
    while not os.path.lexists(probe):
        parent = os.path.dirname(probe)
        if parent == probe:
            raise ValueError(f"unable to resolve {label}: {candidate}")
        suffix.insert(0, os.path.basename(probe))
        probe = parent
    resolved = os.path.join(os.path.realpath(probe), *suffix)
    try:
        if os.path.commonpath([root_real, resolved]) != root_real:
            raise ValueError(f"{label} escapes its intended root through a symlink: {candidate}")
    except ValueError as error:
        raise ValueError(f"{label} escapes its intended root through a symlink: {candidate}") from error
    return resolved

def has_alpha(image):
    return "A" in image.getbands() or "transparency" in image.info

def verify_lossless_webp(file_path, relative_path):
    with open(file_path, "rb") as file:
        data = file.read()
    if len(data) < 20 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        raise ValueError(f"invalid WebP container for {relative_path}")
    if int.from_bytes(data[4:8], "little") + 8 != len(data):
        raise ValueError(f"invalid WebP RIFF length for {relative_path}")
    chunks = []
    offset = 12
    while offset < len(data):
        if offset + 8 > len(data):
            raise ValueError(f"truncated WebP chunk header for {relative_path}")
        chunk_type = data[offset:offset + 4]
        chunk_size = int.from_bytes(data[offset + 4:offset + 8], "little")
        payload_end = offset + 8 + chunk_size
        if payload_end > len(data):
            raise ValueError(f"truncated WebP chunk for {relative_path}")
        chunks.append(chunk_type)
        offset = payload_end + (chunk_size % 2)
    if b"VP8L" not in chunks or b"VP8 " in chunks or b"ANIM" in chunks or b"ANMF" in chunks:
        names = ",".join(chunk.decode("ascii", "replace") for chunk in chunks)
        raise ValueError(f"runtime WebP must use a VP8L lossless image chunk: {relative_path} ({names})")

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

source_root = os.path.realpath(config["sourceRoot"])
runtime_root = os.path.realpath(config["runtimeRoot"])

for asset in config["entries"]:
    relative_webp = asset["webpUrl"]
    source_path = assert_inside(source_root, asset["sourcePath"], "source path")
    runtime_path = assert_inside(runtime_root, asset["runtimePath"], "runtime path")
    if not os.path.isfile(source_path):
        raise FileNotFoundError(f"missing PNG runtime master: {source_path}")
    original_bytes += os.path.getsize(source_path)

    if mode == "verify":
        runtime_path = assert_inside(runtime_root, runtime_path, "runtime path")
        if not os.path.isfile(runtime_path):
            raise FileNotFoundError(f"missing runtime WebP: {runtime_path}")
        verify_lossless_webp(runtime_path, relative_webp)
        with Image.open(source_path) as source, Image.open(runtime_path) as runtime:
            source.load()
            runtime.load()
            verify_pixels(source, runtime, relative_webp)
        runtime_bytes += os.path.getsize(runtime_path)
        verified += 1
        continue

    runtime_parent = os.path.dirname(runtime_path)
    assert_inside(runtime_root, runtime_parent, "runtime directory")
    os.makedirs(runtime_parent, exist_ok=True)
    runtime_path = assert_inside(runtime_root, runtime_path, "runtime path")

    temporary_path = None
    try:
        with Image.open(source_path) as source:
            source.load()
            encoded = source.convert("RGBA" if has_alpha(source) else "RGB")
            with tempfile.NamedTemporaryFile(
                dir=runtime_parent, suffix=".webp", delete=False
            ) as temporary:
                temporary_path = temporary.name
            temporary_path = assert_inside(runtime_root, temporary_path, "temporary runtime path")
            encoded.save(
                temporary_path,
                format="WEBP",
                lossless=True,
                method=6,
                exact=True,
            )
            temporary_path = assert_inside(runtime_root, temporary_path, "temporary runtime path")
            verify_lossless_webp(temporary_path, relative_webp)
            with Image.open(temporary_path) as runtime:
                runtime.load()
                verify_pixels(source, runtime, relative_webp)

        with open(temporary_path, "rb") as generated_file:
            generated_bytes = generated_file.read()
        existing_bytes = None
        if os.path.lexists(runtime_path):
            runtime_path = assert_inside(runtime_root, runtime_path, "runtime path")
            if not os.path.isfile(runtime_path):
                raise ValueError(f"runtime output is not a regular file: {runtime_path}")
            with open(runtime_path, "rb") as runtime_file:
                existing_bytes = runtime_file.read()

        if generated_bytes == existing_bytes:
            unchanged += 1
            os.unlink(assert_inside(runtime_root, temporary_path, "temporary runtime path"))
            temporary_path = None
        else:
            temporary_path = assert_inside(runtime_root, temporary_path, "temporary runtime path")
            runtime_path = assert_inside(runtime_root, runtime_path, "runtime path")
            os.replace(temporary_path, runtime_path)
            temporary_path = None
            changed += 1
        runtime_bytes += len(generated_bytes)
        verified += 1
    finally:
        if temporary_path and os.path.lexists(temporary_path):
            os.unlink(assert_inside(runtime_root, temporary_path, "temporary runtime path"))

print(json.dumps({
    "mode": mode,
    "count": len(config["entries"]),
    "changed": changed,
    "unchanged": unchanged,
    "verified": verified,
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

function runPython(input) {
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
    `Unable to ${input.mode === 'verify' ? 'verify' : 'build'} lossless WebP assets. A Python 3 runtime with Pillow and WebP support is required.\n${attempts.join('\n')}`
  );
}

export async function runRuntimeImages({
  assets,
  mode = 'build',
  runtimeRoot = defaultRuntimeRoot,
  sourceRoot = defaultSourceRoot
}) {
  if (mode !== 'build' && mode !== 'verify') throw new Error(`Unsupported runtime image mode: ${mode}`);
  const resolved = await resolveCatalogAssetEntries({ assets, runtimeRoot, sourceRoot });
  return runPython({ ...resolved, mode });
}

async function main() {
  const unknownArguments = process.argv.slice(2).filter((argument) => argument !== '--verify');
  if (unknownArguments.length) throw new Error(`Unknown arguments: ${unknownArguments.join(', ')}`);
  const mode = process.argv.includes('--verify') ? 'verify' : 'build';
  const assets = PIXEL_TEXTURE_ASSETS.map(({ key, url }) => ({ key, url }));
  const summary = await runRuntimeImages({ assets, mode });
  console.log(JSON.stringify(summary, null, 2));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
