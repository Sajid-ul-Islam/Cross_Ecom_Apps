import struct, zlib, math

def write_png(path, w, h, pixels):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        raw.extend(pixels[y*w: y*w + w])
    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        c += struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff)
        return c
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i]-a[i])*t)) for i in range(3))

ORANGE = (224, 96, 32)
ORANGE_D = (180, 70, 18)
WHITE = (255, 255, 255)

FONT = {
    'D': ["111","101","101","101","111"],
    'E': ["111","100","110","100","111"],
    'N': ["101","111","111","111","101"],
}

def point_in_tri(p, tri):
    def sign(a, b, c):
        return (a[0]-c[0])*(b[1]-c[1])-(b[0]-c[0])*(a[1]-c[1])
    d1 = sign(p, tri[0], tri[1]); d2 = sign(p, tri[1], tri[2]); d3 = sign(p, tri[2], tri[0])
    has_neg = (d1<0) or (d2<0) or (d3<0)
    has_pos = (d1>0) or (d2>0) or (d3>0)
    return not (has_neg and has_pos)

def rounded_triangle(cx, cy, r):
    pts = []
    for ang in (-90, 30, 150):
        a = math.radians(ang)
        pts.append((cx + r*math.cos(a), cy + r*math.sin(a)))
    minx = min(p[0] for p in pts); maxx = max(p[0] for p in pts)
    miny = min(p[1] for p in pts); maxy = max(p[1] for p in pts)
    out = []
    for y in range(int(miny)-2, int(maxy)+3):
        for x in range(int(minx)-2, int(maxx)+3):
            if point_in_tri((x+0.5, y+0.5), pts):
                out.append((x, y))
    return out

def draw_text(px, w, h, text, color, size=40, y_off=0):
    glyph_w = 5; gap = 2
    total = len(text)*(glyph_w+gap)-gap
    x0 = (w-total)//2
    y0 = (h - size*7)//2 + y_off
    for ci, ch in enumerate(text):
        g = FONT.get(ch)
        if not g: continue
        gx = x0 + ci*(glyph_w+gap)
        for row, line in enumerate(g):
            for col, bit in enumerate(line):
                if bit == '1':
                    for dy in range(size):
                        for dx in range(size):
                            x = gx + col*size + dx
                            y = y0 + row*size + dy
                            if 0 <= x < w and 0 <= y < h:
                                px[y*w + x] = color

def make_icon(size=1024):
    px = [ORANGE]*(size*size)
    for y in range(size):
        c = lerp(ORANGE, ORANGE_D, y/size)
        px[y*size: y*size+size] = [c]*size
    for (x,y) in rounded_triangle(size*0.40, size*0.42, size*0.15):
        px[y*size+x] = WHITE
    draw_text(px, size, size, "DEEN", WHITE, size=max(16, size//26), y_off=size//8)
    write_png("icon.png", size, size, px)
    print("icon.png", size)

def make_splash(w=1242, h=2436):
    px = [ORANGE]*(w*h)
    for y in range(h):
        c = lerp(ORANGE, ORANGE_D, y/h)
        px[y*w: y*w+w] = [c]*w
    for (x,y) in rounded_triangle(w//2 - 130, h//2 - 220, 150):
        px[y*w+x] = WHITE
    draw_text(px, w, h, "DEEN", WHITE, size=70, y_off=140)
    write_png("splash.png", w, h, px)
    print("splash.png", w, h)

if __name__ == "__main__":
    make_icon(1024)
    make_splash()
