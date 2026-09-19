#!/bin/sh
set -eu

if ! command -v cargo >/dev/null 2>&1; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "cargo is not installed and curl is unavailable for Rust bootstrap" >&2
    exit 127
  fi
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
fi

export PATH="${HOME}/.cargo/bin:${PATH}"

if ! command -v cargo >/dev/null 2>&1; then
  echo "Rust bootstrap completed but cargo is still unavailable" >&2
  exit 127
fi

rustup target add wasm32-unknown-unknown

worker_build_version="0.8.4"
worker_build_bin="${HOME}/.cargo/bin/worker-build"
worker_build_marker="${HOME}/.cache/randseed-worker-build-${worker_build_version}-rustls-platform-verifier"
if [ ! -x "$worker_build_bin" ] || [ ! -f "$worker_build_marker" ]; then
  worker_build_tmp="$(mktemp -d)"
  cleanup_worker_build() {
    rm -rf "$worker_build_tmp"
  }
  trap cleanup_worker_build EXIT HUP INT TERM

  mkdir -p "$(dirname "$worker_build_marker")"
  curl --proto '=https' --tlsv1.2 -sSfL "https://crates.io/api/v1/crates/worker-build/${worker_build_version}/download" -o "$worker_build_tmp/worker-build.tgz"
  tar -xzf "$worker_build_tmp/worker-build.tgz" -C "$worker_build_tmp"
  worker_build_source="$worker_build_tmp/worker-build-${worker_build_version}"
  sed -i '/^\[dependencies\.ureq\]$/a default-features = false' "$worker_build_source/Cargo.toml"
  sed -i 's/"native-tls"/"rustls", "platform-verifier"/g' "$worker_build_source/Cargo.toml"
  find "$worker_build_source/src" -type f -name '*.rs' -exec sed -i 's/TlsProvider::NativeTls/TlsProvider::Rustls/g' {} +
  rm -f "$worker_build_source/Cargo.lock"
  cargo install --path "$worker_build_source" --force --quiet
  : > "$worker_build_marker"
fi
cd rust-worker
worker-build --release --no-opt