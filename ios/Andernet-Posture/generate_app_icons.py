#!/usr/bin/env python3
"""
generate_app_icons.py — Generates Andernet Posture app icons.

Produces a 1024×1024 icon in light, dark, and tinted variants, then copies
them into the Xcode asset catalog and updates Contents.json.

Brand palette:
  Teal: (20, 184, 166) — rgb(0.08, 0.72, 0.65)
  Indigo: (99, 102, 241)
  Dark BG: (8, 20, 30)
"""

import math
import os
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSET_DIR = os.path.join(
    SCRIPT_DIR,
    "Andernet Posture",
    "Assets.xcassets",
    "AppIcon.appiconset",
)

SIZE = 1024
TEAL = (20, 184, 166)
INDIGO = (99, 102, 241)
DARK_BG = (8, 20, 30)
DARK_BG2 = (10, 30, 42)
WHITE = (255, 255, 255)


def lerp_color(c1, c2, t):
    """Linearly interpolate between two RGB colors."""
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def draw_radial_gradient(img, center, radius, color_center, color_edge, alpha=255):
    """Draw a radial gradient on an RGBA image."""
    px = img.load()
    cx, cy = center
    for y in range(img.height):
        for x in range(img.width):
            dx, dy = x - cx, y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            t = min(dist / radius, 1.0)
            # Ease out
            t = t * t
            r, g, b = lerp_color(color_center, color_edge, t)
            # Composite over existing pixel
            er, eg, eb, ea = px[x, y]
            a = int(alpha * (1 - t))
            # Alpha blend
            out_a = a + ea * (255 - a) // 255
            if out_a > 0:
                out_r = (r * a + er * ea * (255 - a) // 255) // out_a
                out_g = (g * a + eg * ea * (255 - a) // 255) // out_a
                out_b = (b * a + eb * ea * (255 - a) // 255) // out_a
            else:
                out_r, out_g, out_b = 0, 0, 0
            px[x, y] = (out_r, out_g, out_b, out_a)


def create_base_background(size):
    """Create the dark gradient background."""
    img = Image.new("RGBA", (size, size), DARK_BG + (255,))
    draw = ImageDraw.Draw(img)

    # Diagonal gradient from dark to slightly lighter
    for y in range(size):
        t = y / size
        c = lerp_color(DARK_BG, DARK_BG2, t)
        draw.line([(0, y), (size, y)], fill=c + (255,))

    return img


def draw_spine_icon(draw, cx, cy, scale=1.0, color_top=TEAL, color_bottom=INDIGO):
    """Draw a stylized spine / vertebrae column."""
    num_vertebrae = 7
    total_height = 280 * scale
    spacing = total_height / (num_vertebrae - 1)
    start_y = cy - total_height / 2

    widths = [42, 46, 50, 50, 46, 42, 34]

    for i in range(num_vertebrae):
        t = i / (num_vertebrae - 1)
        y = start_y + i * spacing
        w = widths[i] * scale
        h = 14 * scale
        color = lerp_color(color_top, color_bottom, t)

        # Main vertebra capsule
        bbox = [cx - w / 2, y - h / 2, cx + w / 2, y + h / 2]
        draw.rounded_rectangle(bbox, radius=h / 2, fill=color + (200,))

        # Small bright center dot
        dot_r = 3 * scale
        draw.ellipse(
            [cx - dot_r, y - dot_r, cx + dot_r, y + dot_r],
            fill=WHITE + (120,),
        )


def draw_figure(draw, cx, cy, scale=1.0, color=TEAL):
    """Draw a minimalist standing figure silhouette."""
    # Head
    head_r = 28 * scale
    head_cy = cy - 160 * scale
    draw.ellipse(
        [cx - head_r, head_cy - head_r, cx + head_r, head_cy + head_r],
        fill=color + (220,),
    )

    # Neck
    neck_w = 8 * scale
    draw.rounded_rectangle(
        [cx - neck_w, head_cy + head_r - 4 * scale,
         cx + neck_w, head_cy + head_r + 20 * scale],
        radius=neck_w,
        fill=color + (200,),
    )

    # Torso
    torso_top = head_cy + head_r + 16 * scale
    torso_bottom = cy + 40 * scale
    torso_w_top = 36 * scale
    torso_w_bot = 28 * scale

    # Draw torso as polygon
    draw.polygon(
        [
            (cx - torso_w_top, torso_top),
            (cx + torso_w_top, torso_top),
            (cx + torso_w_bot, torso_bottom),
            (cx - torso_w_bot, torso_bottom),
        ],
        fill=color + (180,),
    )

    # Arms
    arm_w = 8 * scale
    arm_len = 100 * scale
    arm_y = torso_top + 10 * scale
    for side in [-1, 1]:
        arm_x = cx + side * torso_w_top
        draw.rounded_rectangle(
            [arm_x - arm_w, arm_y,
             arm_x + arm_w + side * 12 * scale, arm_y + arm_len],
            radius=arm_w,
            fill=color + (160,),
        )

    # Legs
    leg_w = 10 * scale
    leg_len = 120 * scale
    leg_gap = 14 * scale
    for side in [-1, 1]:
        leg_x = cx + side * leg_gap
        draw.rounded_rectangle(
            [leg_x - leg_w, torso_bottom - 4 * scale,
             leg_x + leg_w, torso_bottom + leg_len],
            radius=leg_w,
            fill=color + (170,),
        )


def draw_arc_ring(draw, cx, cy, radius, width, color, start_deg=0, end_deg=270):
    """Draw a partial arc ring."""
    bbox = [cx - radius, cy - radius, cx + radius, cy + radius]
    draw.arc(bbox, start=start_deg, end=end_deg, fill=color + (180,), width=int(width))


def draw_posture_lines(draw, cx, cy, scale=1.0):
    """Draw alignment guide lines showing good posture."""
    line_color = TEAL + (60,)
    line_w = 2

    # Vertical alignment line
    draw.line(
        [(cx, cy - 200 * scale), (cx, cy + 200 * scale)],
        fill=line_color,
        width=line_w,
    )

    # Horizontal reference lines
    for offset in [-120, -40, 40, 120]:
        y = cy + offset * scale
        half_w = 30 * scale
        draw.line(
            [(cx - half_w, y), (cx + half_w, y)],
            fill=TEAL + (40,),
            width=1,
        )


def generate_light_icon(size=SIZE):
    """Generate the main (light appearance) app icon."""
    img = create_base_background(size)
    draw = ImageDraw.Draw(img, "RGBA")
    cx, cy = size // 2, size // 2

    # Subtle radial glow behind the figure
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_radial_gradient(glow, (cx, cy), size // 3, TEAL, DARK_BG, alpha=80)
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img, "RGBA")

    # Posture alignment lines (behind figure)
    draw_posture_lines(draw, cx, cy, scale=1.4)

    # Outer decorative ring
    ring_r = 380
    ring_w = 4
    draw_arc_ring(draw, cx, cy, ring_r, ring_w, TEAL, start_deg=-30, end_deg=210)
    draw_arc_ring(draw, cx, cy, ring_r - 2, ring_w - 1, INDIGO, start_deg=180, end_deg=330)

    # Inner ring
    inner_r = 340
    draw_arc_ring(draw, cx, cy, inner_r, 2, TEAL, start_deg=45, end_deg=315)

    # Standing figure
    draw_figure(draw, cx, cy + 10, scale=1.5, color=TEAL)

    # Spine overlay on the figure's torso
    draw_spine_icon(draw, cx, cy + 10, scale=1.2)

    # Small accent dots at cardinal points of the ring
    dot_r = 6
    for angle_deg in [0, 90, 180, 270]:
        angle = math.radians(angle_deg)
        dx = cx + int(ring_r * math.cos(angle))
        dy = cy + int(ring_r * math.sin(angle))
        dot_color = lerp_color(TEAL, INDIGO, angle_deg / 360)
        draw.ellipse(
            [dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r],
            fill=dot_color + (200,),
        )

    return img


def generate_dark_icon(size=SIZE):
    """Generate the dark appearance icon — deeper background, brighter elements."""
    img = Image.new("RGBA", (size, size), (4, 10, 16, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    # Even darker gradient
    for y in range(size):
        t = y / size
        c = lerp_color((4, 10, 16), (6, 16, 24), t)
        draw.line([(0, y), (size, y)], fill=c + (255,))

    cx, cy = size // 2, size // 2

    # Brighter glow
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_radial_gradient(glow, (cx, cy), size // 3, TEAL, (4, 10, 16), alpha=100)
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img, "RGBA")

    # Posture lines
    draw_posture_lines(draw, cx, cy, scale=1.4)

    # Rings — brighter
    bright_teal = (40, 220, 200)
    bright_indigo = (130, 130, 255)
    ring_r = 380
    draw_arc_ring(draw, cx, cy, ring_r, 5, bright_teal, start_deg=-30, end_deg=210)
    draw_arc_ring(draw, cx, cy, ring_r - 2, 3, bright_indigo, start_deg=180, end_deg=330)
    draw_arc_ring(draw, cx, cy, 340, 2, bright_teal, start_deg=45, end_deg=315)

    # Figure — brighter
    draw_figure(draw, cx, cy + 10, scale=1.5, color=bright_teal)
    draw_spine_icon(draw, cx, cy + 10, scale=1.2, color_top=bright_teal, color_bottom=bright_indigo)

    # Cardinal dots
    dot_r = 6
    for angle_deg in [0, 90, 180, 270]:
        angle = math.radians(angle_deg)
        dx = cx + int(ring_r * math.cos(angle))
        dy = cy + int(ring_r * math.sin(angle))
        dot_color = lerp_color(bright_teal, bright_indigo, angle_deg / 360)
        draw.ellipse(
            [dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r],
            fill=dot_color + (220,),
        )

    return img


def generate_tinted_icon(size=SIZE):
    """Generate a monochrome tinted icon (used for iOS tinted icon style)."""
    # Start with white figure on transparent — iOS will apply the tint
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    cx, cy = size // 2, size // 2
    mono = (255, 255, 255)

    # Filled background circle
    bg_r = 460
    draw.ellipse(
        [cx - bg_r, cy - bg_r, cx + bg_r, cy + bg_r],
        fill=(0, 0, 0, 255),
    )

    # Posture lines
    for offset in [-120, -40, 40, 120]:
        y = cy + int(offset * 1.4)
        half_w = int(30 * 1.4)
        draw.line([(cx - half_w, y), (cx + half_w, y)], fill=mono + (30,), width=1)
    draw.line([(cx, cy - 280), (cx, cy + 280)], fill=mono + (40,), width=2)

    # Rings
    ring_r = 380
    draw_arc_ring(draw, cx, cy, ring_r, 4, mono, start_deg=-30, end_deg=210)
    draw_arc_ring(draw, cx, cy, 340, 2, mono, start_deg=45, end_deg=315)

    # Figure
    draw_figure(draw, cx, cy + 10, scale=1.5, color=mono)
    draw_spine_icon(draw, cx, cy + 10, scale=1.2, color_top=mono, color_bottom=mono)

    # Cardinal dots
    dot_r = 6
    for angle_deg in [0, 90, 180, 270]:
        angle = math.radians(angle_deg)
        dx = cx + int(ring_r * math.cos(angle))
        dy = cy + int(ring_r * math.sin(angle))
        draw.ellipse(
            [dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r],
            fill=mono + (200,),
        )

    return img


def update_contents_json():
    """Update the asset catalog Contents.json with the generated file names."""
    contents = {
        "images": [
            {
                "filename": "AppIcon-Light.png",
                "idiom": "universal",
                "platform": "ios",
                "size": "1024x1024"
            },
            {
                "appearances": [
                    {"appearance": "luminosity", "value": "dark"}
                ],
                "filename": "AppIcon-Dark.png",
                "idiom": "universal",
                "platform": "ios",
                "size": "1024x1024"
            },
            {
                "appearances": [
                    {"appearance": "luminosity", "value": "tinted"}
                ],
                "filename": "AppIcon-Tinted.png",
                "idiom": "universal",
                "platform": "ios",
                "size": "1024x1024"
            }
        ],
        "info": {
            "author": "xcode",
            "version": 1
        }
    }

    path = os.path.join(ASSET_DIR, "Contents.json")
    with open(path, "w") as f:
        json.dump(contents, f, indent=2)
    print(f"  ✓ Updated {path}")


def main():
    os.makedirs(ASSET_DIR, exist_ok=True)

    print("Generating Andernet Posture app icons…")

    # Light
    print("  → Light icon…")
    light = generate_light_icon()
    light_path = os.path.join(ASSET_DIR, "AppIcon-Light.png")
    light.save(light_path, "PNG")
    print(f"  ✓ Saved {light_path}")

    # Dark
    print("  → Dark icon…")
    dark = generate_dark_icon()
    dark_path = os.path.join(ASSET_DIR, "AppIcon-Dark.png")
    dark.save(dark_path, "PNG")
    print(f"  ✓ Saved {dark_path}")

    # Tinted
    print("  → Tinted icon…")
    tinted = generate_tinted_icon()
    tinted_path = os.path.join(ASSET_DIR, "AppIcon-Tinted.png")
    tinted.save(tinted_path, "PNG")
    print(f"  ✓ Saved {tinted_path}")

    # Update Contents.json
    print("  → Updating Contents.json…")
    update_contents_json()

    print("\n✅ All icons generated successfully!")
    print(f"   Output: {ASSET_DIR}")


if __name__ == "__main__":
    main()
