from PIL import Image, ImageDraw

ORANGE = (224, 96, 32)
ORANGE_D = (180, 70, 18)

def rounded_rect(draw, box, r, fill):
    draw.rounded_rectangle(box, radius=r, fill=fill)

def make_icon(size=1024):
    # orange rounded plate
    img = Image.new("RGBA", (size, size), (0,0,0,0))
    d = ImageDraw.Draw(img)
    rounded_rect(d, [0,0,size,size], int(size*0.22), ORANGE)
    # vertical gradient overlay
    grad = Image.new("RGBA", (size,size), (0,0,0,0))
    gd = ImageDraw.Draw(grad)
    for y in range(size):
        t = y/size
        c = tuple(int(ORANGE_D[i] + (ORANGE[i]-ORANGE_D[i])*t) for i in range(3))
        gd.line([(0,y),(size,y)], fill=c+(255,))
    img = Image.alpha_composite(grad, img) if False else img
    # place real logo centered, scaled to ~55% width
    logo = Image.open("logo.png").convert("RGBA")
    lw = int(size*0.62)
    lh = int(lw * logo.height/logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    x = (size-lw)//2
    y = int(size*0.30)
    img.alpha_composite(logo, (x, y))
    img.convert("RGB").save("icon.png")
    print("icon.png", img.size)

def make_splash(w=1242, h=2436):
    img = Image.new("RGBA", (w, h), ORANGE)
    # gradient
    for y in range(h):
        t = y/h
        c = tuple(int(ORANGE_D[i] + (ORANGE[i]-ORANGE_D[i])*t) for i in range(3))
        ImageDraw.Draw(img).line([(0,y),(w,y)], fill=c+(255,))
    logo = Image.open("logo.png").convert("RGBA")
    lw = int(w*0.5)
    lh = int(lw*logo.height/logo.width)
    logo = logo.resize((lw, lh), Image.LANCZOS)
    x = (w-lw)//2
    y = int(h*0.40)
    img.alpha_composite(logo, (x, y))
    img.convert("RGB").save("splash.png")
    print("splash.png", img.size)

if __name__ == "__main__":
    make_icon(1024)
    make_splash()
