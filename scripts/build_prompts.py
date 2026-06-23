#!/usr/bin/env python3
"""Build prompts from the bridal batch job CSV."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JOBS = ROOT / "workflow" / "batch_jobs.csv"
DEFAULT_TEMPLATE = ROOT / "templates" / "commercial_style_transfer_prompt.md"
DEFAULT_OUT = ROOT / "work" / "prompts"
STYLE_DIR = ROOT / "templates" / "styles"


def load_style_preset(style_preset: str) -> dict[str, str]:
    if not style_preset:
        return {}

    path = STYLE_DIR / f"{style_preset}.md"
    if not path.exists():
        return {}

    sections: dict[str, list[str]] = {}
    current_key: str | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("## "):
            current_key = line[3:].strip()
            sections[current_key] = []
            continue
        if current_key:
            sections[current_key].append(line)

    return {key: "\n".join(value).strip() for key, value in sections.items()}


def render_template(template: str, row: dict[str, str], variant_index: int, variants: int) -> str:
    style_values = load_style_preset(row.get("style_preset", "").strip())
    rendered = template
    for key, value in style_values.items():
        rendered = rendered.replace("{{" + key + "}}", value)

    for key, value in row.items():
        rendered = rendered.replace("{{" + key + "}}", value.strip())

    stage = row.get("stage", "production").strip() or "production"
    if variants == 1:
        variant_note = (
            "\n\nProduction direction:\n"
            f"Stage: {stage}. Build one subject-locked production prompt for this job. "
            "Prioritize preserving the real client, replacing or generating only the scene/background, "
            "then matching light, shadow, color temperature, and commercial skin texture. "
            "Do not redraw the face or create extra alternate versions."
        )
    else:
        variant_note = (
            "\n\nVariant direction:\n"
            f"Stage: {stage}. This is candidate version {variant_index} of {variants}. "
            "Keep the same subject lock. Vary only the background depth, floral placement, "
            "light falloff, and limited fabric extension. Do not redraw the client's face, "
            "hairstyle, body pose, or identity."
        )
    source_note = (
        "\n\nBatch source files:\n"
        f"- Original image path: {row.get('original_image', '').strip()}\n"
        f"- Reference image path: {row.get('reference_image', '').strip()}\n"
        f"- Job ID: {row.get('job_id', '').strip()}\n"
        f"- Client ID: {row.get('client_id', '').strip()}\n"
    )
    return rendered.strip() + variant_note + source_note


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jobs", type=Path, default=DEFAULT_JOBS)
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    template = args.template.read_text(encoding="utf-8")
    args.out.mkdir(parents=True, exist_ok=True)

    written = 0
    with args.jobs.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            if row.get("status", "").strip().lower() not in {"pending", "ready", ""}:
                continue

            variants_raw = row.get("variants", "1").strip() or "1"
            try:
                variants = max(1, int(variants_raw))
            except ValueError:
                variants = 1

            job_id = row.get("job_id", "job").strip() or "job"
            client_id = row.get("client_id", "client").strip() or "client"

            for index in range(1, variants + 1):
                prompt = render_template(template, row, index, variants)
                filename = f"{job_id}_{client_id}_v{index:02d}.md"
                (args.out / filename).write_text(prompt + "\n", encoding="utf-8")
                written += 1

    print(f"Wrote {written} prompt file(s) to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
