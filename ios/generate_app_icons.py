#!/usr/bin/env python3
"""
Generate app icons for HealthKit Bridge app
Creates a simple heart icon with medical cross theme
"""

from PIL import Image, ImageDraw
import os

def create_heart_icon(size, bg_color="#FF3B30", heart_color="#FFFFFF"):
    """Create a heart icon with medical theme"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Add rounded rectangle background
    margin = size // 8
    bg_rect = [margin, margin, size - margin, size - margin]
    
    # Draw background with rounded corners
    corner_radius = size // 6
    draw.rounded_rectangle(bg_rect, radius=corner_radius, fill=bg_color)
    
    # Draw heart shape
    heart_size = size // 2
    heart_x = (size - heart_size) // 2
    heart_y = (size - heart_size) // 2 + size // 12
    
    # Heart top circles
    circle_radius = heart_size // 4
    left_circle_center = (heart_x + circle_radius, heart_y + circle_radius)
    right_circle_center = (heart_x + heart_size - circle_radius, heart_y + circle_radius)
    
    # Draw heart circles
    draw.ellipse([left_circle_center[0] - circle_radius, left_circle_center[1] - circle_radius,
                  left_circle_center[0] + circle_radius, left_circle_center[1] + circle_radius], 
                 fill=heart_color)
    draw.ellipse([right_circle_center[0] - circle_radius, right_circle_center[1] - circle_radius,
                  right_circle_center[0] + circle_radius, right_circle_center[1] + circle_radius], 
                 fill=heart_color)
    
    # Heart bottom triangle
    bottom_point = (heart_x + heart_size // 2, heart_y + heart_size - circle_radius // 2)
    triangle_points = [
        (heart_x + circle_radius // 2, heart_y + circle_radius + circle_radius // 2),
        (heart_x + heart_size - circle_radius // 2, heart_y + circle_radius + circle_radius // 2),
        bottom_point
    ]
    draw.polygon(triangle_points, fill=heart_color)
    
    # Add small medical cross
    cross_size = size // 8
    cross_x = heart_x + heart_size - cross_size
    cross_y = heart_y
    cross_thickness = cross_size // 4
    
    # Horizontal bar of cross
    draw.rectangle([cross_x, cross_y + cross_size//2 - cross_thickness//2,
                    cross_x + cross_size, cross_y + cross_size//2 + cross_thickness//2], 
                   fill=bg_color)
    # Vertical bar of cross
    draw.rectangle([cross_x + cross_size//2 - cross_thickness//2, cross_y,
                    cross_x + cross_size//2 + cross_thickness//2, cross_y + cross_size], 
                   fill=bg_color)
    
    return img

def main():
    """Generate all required app icon sizes"""
    icon_sizes = [
        (40, "AppIcon-20x20@2x.png"),
        (60, "AppIcon-20x20@3x.png"),
        (58, "AppIcon-29x29@2x.png"),
        (87, "AppIcon-29x29@3x.png"),
        (80, "AppIcon-40x40@2x.png"),
        (120, "AppIcon-40x40@3x.png"),
        (120, "AppIcon-60x60@2x.png"),
        (180, "AppIcon-60x60@3x.png"),
        (1024, "AppIcon-1024x1024.png")
    ]
    
    output_dir = "/Users/ma55700/Documents/GitHub/HealthKitBridge/HealthKitBridge/Assets.xcassets/AppIcon.appiconset"
    
    print("🎨 Generating HealthKit Bridge app icons...")
    
    for size, filename in icon_sizes:
        print(f"Creating {filename} ({size}x{size})")
        icon = create_heart_icon(size)
        
        # Convert to RGB for PNG (removes alpha channel for compatibility)
        if icon.mode == 'RGBA':
            # Create white background
            background = Image.new('RGB', icon.size, (255, 255, 255))
            background.paste(icon, mask=icon.split()[-1])  # Use alpha channel as mask
            icon = background
        
        icon.save(os.path.join(output_dir, filename), "PNG")
    
    print("✅ All app icons generated successfully!")

if __name__ == "__main__":
    main()