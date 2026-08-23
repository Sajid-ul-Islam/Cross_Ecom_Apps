import struct, zlib, math

# Minimal PNG writer (RGBA) — no PIL dependency.
def write_png(path, w, h, pixels):
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter type 0
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes((r, g, b, a))
    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))

# Palette
INK = (26, 35, 80)        # #1A2350 brand navy
DENIM = (37, 56, 131)     # #253883
STITCH = (200, 170, 110, 255)  # gold stitch
WHITE = (255, 255, 255, 255)
TRANS = (0, 0, 0, 0)

W, H = 480, 160
px = [TRANS] * (W * H)

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[y * W + x] = c

# Soft rounded navy plate behind the wordmark (logo chip)
pad = 14
for y in range(pad, H - pad):
    for x in range(pad, W - pad):
        # rounded corners radius
        r = 22
        cx = min(x - pad, pad + (W - 2 * pad) - 1 - x)
        cy = min(y - pad, pad + (H - 2 * pad) - 1 - y)
        if cx >= r or cy >= r or (cx - r) ** 2 + (cy - r) ** 2 <= r * r:
            # subtle vertical gradient navy->denim
            t = y / H
            put(x, y, lerp(INK + (255,), DENIM + (255,), t))

# Draw "DEEN" wordmark as block letters (gold stitch) + a small tagline.
# Letter grid: 5x7 pixel font for D,E,E,N (scaled).
def rect(x0, y0, w, h, c):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            put(x, y, c)

def letter_D(x, y, s, c):
    rect(x, y, s, 7 * s, c); rect(x, y, 3 * s, s, c)
    rect(x, y + 3 * s, 2 * s, s, c); rect(x, y + 6 * s, 3 * s, s, c)
    rect(x + 2 * s, y + s, s, 5 * s, c)

def letter_E(x, y, s, c):
    rect(x, y, 3 * s, s, c); rect(x, y, s, 7 * s, c)
    rect(x, y + 3 * s, 2 * s, s, c); rect(x, y + 6 * s, 3 * s, s, c)

def letter_N(x, y, s, c):
    rect(x, y, s, 7 * s, c); rect(x + 2 * s, y, s, 7 * s, c)
    for i in range(7 * s):
        put(x + s + i // 7, y + i, c)

s = 12
y0 = 52
xs = [70, 70 + 5 * s, 70 + 10 * s, 70 + 15 * s]
for i, (lx, ch) in enumerate(zip(xs, [letter_D, letter_E, letter_E, letter_N])):
    ch(lx, y0, s, STITCH)

# "COMMERCE" small underline text approximation (drawn as thin bar + dots) - skip literal font; add tagline line
for x in range(70, 70 + 19 * s, 1):
    put(x, y0 + 7 * s + 8, STITCH)

write_png("assets/logo.png", W, H, px)
print("wrote assets/logo.png")
