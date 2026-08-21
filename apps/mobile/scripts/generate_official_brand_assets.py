import os
from PIL import Image, ImageOps

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
WEB_PUBLIC_DIR = os.path.join(os.path.dirname(BASE_DIR), "web", "public")
os.makedirs(WEB_PUBLIC_DIR, exist_ok=True)

actual_logo_path = os.path.join(ASSETS_DIR, "logo_actual.png")
actual_1x1_path = os.path.join(ASSETS_DIR, "brand_1x1.webp")

# Load actual logo
logo_img = Image.open(actual_logo_path).convert("RGBA")
brand_1x1_img = Image.open(actual_1x1_path).convert("RGBA")

# 1. Save crisp Web & Mobile logo
# Resize logo keeping aspect ratio, e.g. width=800
w, h = logo_img.size
target_w = 800
target_h = int(h * (target_w / w))
logo_resized = logo_img.resize((target_w, target_h), Image.LANCZOS)
logo_resized.save(os.path.join(ASSETS_DIR, "logo.png"), "PNG")
logo_resized.save(os.path.join(WEB_PUBLIC_DIR, "logo.png"), "PNG")
print("Saved logo.png (mobile & web)")

# 2. Generate 1024x1024 App Icon (icon.png)
icon_size = (1024, 1024)
# Brand Navy / Charcoal background
bg_color = (21, 26, 44, 255) # #151A2C
icon = Image.new("RGBA", icon_size, bg_color)

# Use actual 1x1 brand or scaled logo centered
# Let's paste brand_1x1 centered with slight padding
b1_w, b1_h = brand_1x1_img.size
target_b_w = 820
target_b_h = int(b1_h * (target_b_w / b1_w))
brand_resized = brand_1x1_img.resize((target_b_w, target_b_h), Image.LANCZOS)

bx = (1024 - target_b_w) // 2
by = (1024 - target_b_h) // 2
icon.alpha_composite(brand_resized, (bx, by))
icon.save(os.path.join(ASSETS_DIR, "icon.png"), "PNG")
icon.save(os.path.join(WEB_PUBLIC_DIR, "icon.png"), "PNG")
print("Saved icon.png")

# 3. Generate Android Adaptive Icon (adaptive-icon.png)
# Center 1x1 brand in safe-zone (65% width)
adaptive = Image.new("RGBA", icon_size, bg_color)
target_ad_w = 640
target_ad_h = int(b1_h * (target_ad_w / b1_w))
brand_ad_resized = brand_1x1_img.resize((target_ad_w, target_ad_h), Image.LANCZOS)
ax = (1024 - target_ad_w) // 2
ay = (1024 - target_ad_h) // 2
adaptive.alpha_composite(brand_ad_resized, (ax, ay))
adaptive.save(os.path.join(ASSETS_DIR, "adaptive-icon.png"), "PNG")
print("Saved adaptive-icon.png")

# 4. Generate Splash Screen (splash.png - 1242x2436)
splash_size = (1242, 2436)
splash = Image.new("RGBA", splash_size, bg_color)
# Place brand logo in center
target_sp_w = 750
target_sp_h = int(b1_h * (target_sp_w / b1_w))
brand_sp_resized = brand_1x1_img.resize((target_sp_w, target_sp_h), Image.LANCZOS)
sx = (1242 - target_sp_w) // 2
sy = (2436 - target_sp_h) // 2
splash.alpha_composite(brand_sp_resized, (sx, sy))
splash.save(os.path.join(ASSETS_DIR, "splash.png"), "PNG")
print("Saved splash.png")

# 5. Favicon (48x48)
favicon = brand_1x1_img.resize((48, 48), Image.LANCZOS)
favicon.save(os.path.join(ASSETS_DIR, "favicon.png"), "PNG")
print("Saved favicon.png")
