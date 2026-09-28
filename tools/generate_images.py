#!/usr/bin/env python3
"""Génère les illustrations SVG des produits de Bavaria Parts.

Usage : python3 tools/generate_images.py
Les fichiers sont écrits dans images/products/ et images/.
"""
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "products"

DEFS = """
<defs>
  <radialGradient id="bg" cx="50%" cy="38%" r="75%">
    <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eef2f7"/><stop offset="1" stop-color="#d7dfe9"/>
  </radialGradient>
  <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#0b1f3a" stop-opacity=".35"/><stop offset="1" stop-color="#0b1f3a" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f4f6f9"/><stop offset=".35" stop-color="#c3cad3"/><stop offset=".55" stop-color="#8a94a1"/><stop offset=".8" stop-color="#cfd5dd"/><stop offset="1" stop-color="#9aa3ae"/>
  </linearGradient>
  <linearGradient id="steelH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8a94a1"/><stop offset=".3" stop-color="#eef1f5"/><stop offset=".55" stop-color="#b7bfc9"/><stop offset="1" stop-color="#7d8794"/>
  </linearGradient>
  <radialGradient id="discFace" cx="42%" cy="38%" r="70%">
    <stop offset="0" stop-color="#f1f3f6"/><stop offset=".55" stop-color="#b9c1cb"/><stop offset="1" stop-color="#7f8996"/>
  </radialGradient>
  <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a525e"/><stop offset=".5" stop-color="#262b33"/><stop offset="1" stop-color="#14171c"/>
  </linearGradient>
  <linearGradient id="darkH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1a1e24"/><stop offset=".35" stop-color="#4b5460"/><stop offset=".6" stop-color="#2a3038"/><stop offset="1" stop-color="#15181d"/>
  </linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f0584e"/><stop offset=".5" stop-color="#c4261e"/><stop offset="1" stop-color="#861712"/>
  </linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#5aa0f0"/><stop offset=".5" stop-color="#1c69d4"/><stop offset="1" stop-color="#0f3f86"/>
  </linearGradient>
  <linearGradient id="blueH" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0f3f86"/><stop offset=".35" stop-color="#4a92ea"/><stop offset=".6" stop-color="#1c69d4"/><stop offset="1" stop-color="#0c3470"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8e6a22"/><stop offset=".4" stop-color="#f0d38a"/><stop offset=".7" stop-color="#c49a3c"/><stop offset="1" stop-color="#7c5c1c"/>
  </linearGradient>
  <linearGradient id="white" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#cfd6de"/><stop offset=".4" stop-color="#ffffff"/><stop offset="1" stop-color="#c3cbd5"/>
  </linearGradient>
  <linearGradient id="yellow" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffd84d"/><stop offset="1" stop-color="#e0a800"/>
  </linearGradient>
  <linearGradient id="green" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#0d6b3c"/><stop offset=".4" stop-color="#27b36a"/><stop offset="1" stop-color="#0b5a33"/>
  </linearGradient>
  <linearGradient id="pink" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#1b4f9a"/><stop offset=".4" stop-color="#63a6f2"/><stop offset="1" stop-color="#164283"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".5" stop-color="#cfe3f7" stop-opacity=".6"/><stop offset="1" stop-color="#8fb6de" stop-opacity=".8"/>
  </linearGradient>
  <linearGradient id="redGlass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ff7a70"/><stop offset=".5" stop-color="#d0241b"/><stop offset="1" stop-color="#7a100b"/>
  </linearGradient>
  <linearGradient id="amber" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#e07b00"/>
  </linearGradient>
  <pattern id="carbon" width="16" height="16" patternUnits="userSpaceOnUse">
    <rect width="16" height="16" fill="#1d2127"/>
    <rect width="8" height="8" fill="#353c46"/><rect x="8" y="8" width="8" height="8" fill="#353c46"/>
    <rect width="8" height="3" fill="#4a535f" opacity=".6"/><rect x="8" y="8" width="3" height="8" fill="#4a535f" opacity=".6"/>
  </pattern>
  <pattern id="pleats" width="14" height="10" patternUnits="userSpaceOnUse">
    <rect width="14" height="10" fill="#f6ecd2"/><path d="M0 0L7 10L14 0" fill="none" stroke="#d8c79b" stroke-width="2"/>
  </pattern>
  <pattern id="pleatsDark" width="14" height="10" patternUnits="userSpaceOnUse">
    <rect width="14" height="10" fill="#3b3f45"/><path d="M0 0L7 10L14 0" fill="none" stroke="#23262a" stroke-width="2"/>
  </pattern>
</defs>
"""


def svg(body, shadow=(300, 500, 200, 26), title=""):
    sx, sy, rx, ry = shadow
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="{title}">
<title>{title}</title>{DEFS}
<rect width="600" height="600" fill="url(#bg)"/>
<ellipse cx="{sx}" cy="{sy}" rx="{rx}" ry="{ry}" fill="url(#shadow)"/>
{body}
</svg>
"""


# ---------- Pièces ----------

def disc(cx, cy, r, drilled=True, hat="#8a94a1"):
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#discFace)" stroke="#6b7582" stroke-width="3"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r*0.93}" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="2"/>'
    # rayures d'usinage
    for k in range(6):
        s += f'<circle cx="{cx}" cy="{cy}" r="{r*(0.6+k*0.06)}" fill="none" stroke="#6f7985" stroke-opacity=".18" stroke-width="1.5"/>'
    if drilled:
        for ring, n in ((0.72, 12), (0.84, 12)):
            for i in range(n):
                a = 2 * math.pi * i / n + (0.26 if ring > 0.8 else 0)
                x, y = cx + r * ring * math.cos(a), cy + r * ring * math.sin(a)
                s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*0.035:.1f}" fill="#3d4550"/>'
    # bol central
    s += f'<circle cx="{cx}" cy="{cy}" r="{r*0.45}" fill="{hat}" stroke="#5d6672" stroke-width="3"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r*0.42}" fill="url(#steel)" opacity=".85"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r*0.17}" fill="#e9edf2" stroke="#5d6672" stroke-width="3"/>'
    for i in range(5):
        a = 2 * math.pi * i / 5 - math.pi / 2
        x, y = cx + r * 0.3 * math.cos(a), cy + r * 0.3 * math.sin(a)
        s += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*0.045:.1f}" fill="#2f363f"/>'
    return s


def pad(x, y, w=170, h=80, rot=0):
    return f'''<g transform="translate({x} {y}) rotate({rot})">
<path d="M0 {h*0.35} Q{w/2} {-h*0.25} {w} {h*0.35} L{w} {h} Q{w/2} {h*0.55} 0 {h} Z" fill="url(#steel)" stroke="#5d6672" stroke-width="2"/>
<path d="M8 {h*0.45} Q{w/2} {h*0.02} {w-8} {h*0.45} L{w-8} {h*0.92} Q{w/2} {h*0.55} 8 {h*0.92} Z" fill="url(#dark)"/>
<line x1="{w/2}" y1="{h*0.2}" x2="{w/2}" y2="{h*0.75}" stroke="#0e1013" stroke-width="3"/>
</g>'''


def cylinder(cx, top, w, h, body, cap="url(#dark)", label=None, ribs=0, label_color="#ffffff"):
    x = cx - w / 2
    s = f'<rect x="{x}" y="{top}" width="{w}" height="{h}" rx="18" fill="{body}" stroke="#0b1f3a" stroke-opacity=".25" stroke-width="2"/>'
    for i in range(ribs):
        yy = top + 16 + i * 9
        s += f'<rect x="{x}" y="{yy}" width="{w}" height="4" fill="#000" opacity=".18"/>'
    s += f'<rect x="{x-6}" y="{top+h-26}" width="{w+12}" height="30" rx="6" fill="{cap}"/>'
    if label:
        s += f'<rect x="{x+22}" y="{top+h*0.34}" width="{w-44}" height="{h*0.3}" rx="8" fill="#fff" opacity=".9"/>'
        s += f'<text x="{cx}" y="{top+h*0.34+h*0.3/2+9}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="26" fill="#0b1f3a" text-anchor="middle">{label}</text>'
    s += f'<rect x="{x+12}" y="{top+8}" width="16" height="{h-40}" rx="8" fill="#fff" opacity=".35"/>'
    return s


def bottle(cx, base, w, h, body, cap, label, sub, label_bg="#ffffff", txt="#0b1f3a"):
    x = cx - w / 2
    top = base - h
    s = f'<path d="M{x} {base-16} Q{x} {base} {x+16} {base} L{x+w-16} {base} Q{x+w} {base} {x+w} {base-16} L{x+w} {top+70} Q{x+w} {top+40} {x+w-40} {top+30} L{cx+32} {top+22} L{cx-32} {top+22} L{x+40} {top+30} Q{x} {top+40} {x} {top+70} Z" fill="{body}" stroke="#0b1f3a" stroke-opacity=".25" stroke-width="2"/>'
    s += f'<rect x="{cx-30}" y="{top-18}" width="60" height="44" rx="6" fill="{cap}"/>'
    for i in range(5):
        s += f'<rect x="{cx-30}" y="{top-12+i*8}" width="60" height="3" fill="#000" opacity=".2"/>'
    s += f'<rect x="{x+20}" y="{top+h*0.36}" width="{w-40}" height="{h*0.42}" rx="10" fill="{label_bg}"/>'
    s += f'<text x="{cx}" y="{top+h*0.36+58}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="40" fill="{txt}" text-anchor="middle">{label}</text>'
    s += f'<text x="{cx}" y="{top+h*0.36+96}" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="20" fill="{txt}" opacity=".75" text-anchor="middle">{sub}</text>'
    s += f'<rect x="{x+12}" y="{top+60}" width="16" height="{h-100}" rx="8" fill="#fff" opacity=".35"/>'
    return s


def spark_plug(x, y, s=1.0):
    return f'''<g transform="translate({x} {y}) scale({s})">
<rect x="-14" y="0" width="28" height="40" rx="5" fill="url(#steelH)"/>
<rect x="-26" y="36" width="52" height="118" rx="20" fill="url(#white)" stroke="#aab3bf" stroke-width="2"/>
<rect x="-26" y="70" width="52" height="8" fill="#b9c1cb"/><rect x="-26" y="86" width="52" height="8" fill="#b9c1cb"/><rect x="-26" y="102" width="52" height="8" fill="#b9c1cb"/>
<path d="M-34 150 h68 l-6 42 h-56 z" fill="url(#steelH)" stroke="#5d6672" stroke-width="2"/>
<rect x="-24" y="190" width="48" height="60" fill="url(#gold)"/>
{''.join(f'<rect x="-24" y="{194+i*9}" width="48" height="3" fill="#6d5217" opacity=".6"/>' for i in range(6))}
<rect x="-4" y="250" width="8" height="18" fill="#9aa3ae"/>
<path d="M-4 266 h22 v8 h-22z" fill="#6c7683"/>
</g>'''


def spring(cx, top, bottom, w, coils=7, color="url(#blueH)"):
    s = ""
    step = (bottom - top) / coils
    # arrière
    for i in range(coils):
        y = top + i * step
        s += f'<path d="M{cx+w/2} {y+step*0.1} Q{cx} {y+step*0.55} {cx-w/2} {y+step*0.6}" fill="none" stroke="#0c3470" stroke-width="22" stroke-linecap="round"/>'
    # avant
    for i in range(coils):
        y = top + i * step
        s += f'<path d="M{cx-w/2} {y+step*0.6} Q{cx} {y+step*1.2} {cx+w/2} {y+step*1.1}" fill="none" stroke="{color}" stroke-width="24" stroke-linecap="round"/>'
        s += f'<path d="M{cx-w/2+14} {y+step*0.72} Q{cx} {y+step*1.18} {cx+w/2-18} {y+step*1.04}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>'
    return s


def ribbed_box(x, y, w, h, fill, ribs=8):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}"/>'
    for i in range(ribs):
        s += f'<rect x="{x+10+i*(w-20)/ribs}" y="{y+8}" width="{(w-20)/ribs*0.45:.1f}" height="{h-16}" rx="3" fill="#fff" opacity=".12"/>'
    return s


def bolt(x, y, r=10):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#steel)" stroke="#4b5460" stroke-width="2"/><circle cx="{x}" cy="{y}" r="{r*0.4}" fill="#4b5460"/>'


def bushing(x, y, r=26):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#steel)" stroke="#4b5460" stroke-width="3"/><circle cx="{x}" cy="{y}" r="{r*0.72}" fill="#1b1e23"/><circle cx="{x}" cy="{y}" r="{r*0.3}" fill="url(#steel)"/>'


# ---------- Catalogue d'images ----------

IMAGES = {}


def image(name, title, shadow=(300, 500, 200, 26)):
    def deco(fn):
        IMAGES[name] = (title, fn, shadow)
        return fn
    return deco


@image("kit-disques-plaquettes", "Kit disques et plaquettes")
def _():
    return disc(250, 280, 190) + pad(360, 360, 190, 90, -12) + pad(380, 420, 190, 90, -8)


@image("disques-arriere", "Paire de disques arrière")
def _():
    return disc(360, 260, 170, drilled=False) + disc(230, 320, 170, drilled=False)


@image("plaquettes-arriere", "Plaquettes de frein arrière", (300, 470, 210, 24))
def _():
    return pad(90, 210, 200, 95, -6) + pad(310, 190, 200, 95, 4) + pad(110, 330, 200, 95, 3) + pad(320, 320, 200, 95, -4)


@image("capteur-usure", "Capteur d'usure de plaquettes")
def _():
    s = '<path d="M150 420 C 60 340, 140 230, 260 260 S 470 330, 420 200 S 250 120, 320 90" fill="none" stroke="#1b1e23" stroke-width="16" stroke-linecap="round"/>'
    s += '<path d="M150 420 C 60 340, 140 230, 260 260 S 470 330, 420 200 S 250 120, 320 90" fill="none" stroke="#4b5460" stroke-width="4" stroke-linecap="round" opacity=".6"/>'
    s += '<rect x="110" y="400" width="80" height="60" rx="10" fill="url(#dark)"/><rect x="126" y="416" width="48" height="10" rx="3" fill="#6c7683"/>'
    s += '<rect x="290" y="50" width="80" height="60" rx="12" fill="url(#dark)"/><rect x="304" y="66" width="52" height="28" rx="4" fill="#111"/>'
    s += '<circle cx="415" cy="200" r="0" />'
    return s


@image("etrier-frein", "Étrier de frein avant")
def _():
    s = '<path d="M130 200 Q300 60 470 200 L450 400 Q300 330 150 400 Z" fill="url(#red)" stroke="#6d120e" stroke-width="3"/>'
    s += '<path d="M170 230 Q300 130 430 230 L415 360 Q300 300 185 360 Z" fill="#000" opacity=".18"/>'
    s += '<rect x="250" y="190" width="100" height="40" rx="8" fill="#ffffff" opacity=".92"/>'
    s += '<text x="300" y="218" font-family="Arial" font-weight="800" font-size="22" fill="#c4261e" text-anchor="middle">BP</text>'
    s += bolt(165, 380, 16) + bolt(435, 380, 16) + bolt(200, 250, 12) + bolt(400, 250, 12)
    s += '<path d="M180 175 Q300 85 420 175" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="8" stroke-linecap="round"/>'
    return s


@image("liquide-frein", "Liquide de frein DOT 4")
def _():
    return bottle(300, 480, 210, 330, "url(#white)", "#1b1e23", "DOT 4", "Frein · 1 L", "#1c69d4", "#ffffff")


@image("filtre-huile", "Filtre à huile", (300, 490, 150, 22))
def _():
    s = '<rect x="196" y="120" width="208" height="360" rx="14" fill="url(#pleats)"/>'
    for i in range(0, 208, 12):
        s += f'<rect x="{196+i}" y="120" width="6" height="360" fill="#d8c79b"/>'
    s += '<ellipse cx="300" cy="120" rx="104" ry="26" fill="url(#dark)"/><ellipse cx="300" cy="120" rx="44" ry="12" fill="#0e1013"/>'
    s += '<ellipse cx="300" cy="480" rx="104" ry="26" fill="url(#dark)"/>'
    s += '<rect x="196" y="112" width="208" height="12" fill="#262b33"/>'
    return s


@image("filtre-air", "Filtre à air moteur", (300, 470, 230, 24))
def _():
    s = '<path d="M90 230 L470 190 L520 330 L140 380 Z" fill="#1b1e23"/>'
    s += '<path d="M110 235 L465 198 L505 322 L150 362 Z" fill="url(#pleats)"/>'
    for i in range(24):
        t = i / 24
        x1, y1 = 110 + t * 355, 235 - t * 37
        x2, y2 = 150 + t * 355, 362 - t * 40
        s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#c9b886" stroke-width="3"/>'
    s += '<path d="M140 380 L520 330 L522 352 L142 404 Z" fill="#0e1013"/>'
    return s


@image("bougies", "Jeu de 4 bougies d'allumage", (300, 500, 220, 22))
def _():
    return spark_plug(150, 180, 0.95) + spark_plug(250, 160, 0.95) + spark_plug(350, 180, 0.95) + spark_plug(450, 160, 0.95)


@image("pompe-eau", "Pompe à eau électrique")
def _():
    s = '<ellipse cx="300" cy="300" rx="170" ry="150" fill="url(#dark)"/>'
    s += '<ellipse cx="300" cy="300" rx="120" ry="104" fill="url(#steel)"/>'
    s += '<circle cx="300" cy="300" r="70" fill="#262b33"/>'
    for i in range(8):
        a = i * 45
        s += f'<path d="M300 300 L300 238 Q330 250 322 290 Z" fill="url(#steelH)" transform="rotate({a} 300 300)"/>'
    s += '<circle cx="300" cy="300" r="16" fill="url(#steel)" stroke="#262b33" stroke-width="3"/>'
    s += '<rect x="420" y="160" width="110" height="60" rx="10" fill="url(#dark)"/><rect x="440" y="176" width="70" height="28" rx="4" fill="#0e1013"/>'
    s += '<path d="M110 350 h-40 a20 20 0 0 1 0-40 h40" fill="url(#dark)"/><path d="M300 450 v50" stroke="#262b33" stroke-width="40"/>'
    for a in (30, 150, 270):
        x, y = 300 + 140 * math.cos(math.radians(a)), 300 + 125 * math.sin(math.radians(a))
        s += bolt(x, y, 12)
    return s


@image("courroie", "Courroie d'accessoires", (300, 490, 230, 22))
def _():
    s = '<ellipse cx="300" cy="300" rx="230" ry="150" fill="none" stroke="#0e1013" stroke-width="44"/>'
    s += '<ellipse cx="300" cy="300" rx="230" ry="150" fill="none" stroke="#2b3038" stroke-width="30"/>'
    for i in range(6):
        s += f'<ellipse cx="300" cy="300" rx="{216+i*5.6}" ry="{136+i*5.6}" fill="none" stroke="#4b5460" stroke-width="1.5"/>'
    s += '<text x="300" y="306" font-family="Arial" font-weight="700" font-size="30" fill="#5d6672" text-anchor="middle">6PK 1538</text>'
    return s


@image("bobine-allumage", "Bobine d'allumage", (300, 500, 160, 22))
def _():
    s = '<rect x="200" y="100" width="200" height="110" rx="16" fill="url(#dark)"/>'
    s += '<rect x="370" y="130" width="80" height="50" rx="8" fill="#1b1e23"/><rect x="388" y="142" width="48" height="26" rx="4" fill="#3b4250"/>'
    s += bolt(230, 130, 12)
    s += '<rect x="260" y="200" width="80" height="210" rx="10" fill="url(#darkH)"/>'
    s += '<rect x="270" y="405" width="60" height="80" rx="12" fill="#c23a2f"/>'
    s += '<rect x="240" y="120" width="120" height="40" rx="6" fill="#fff" opacity=".12"/>'
    return s


@image("thermostat", "Thermostat avec boîtier")
def _():
    s = '<path d="M180 180 h240 l40 80 v120 l-40 60 h-240 l-40 -60 v-120 z" fill="url(#dark)"/>'
    s += '<circle cx="300" cy="320" r="92" fill="url(#steel)" stroke="#262b33" stroke-width="6"/>'
    s += '<circle cx="300" cy="320" r="54" fill="#b2892e"/><circle cx="300" cy="320" r="30" fill="url(#gold)"/>'
    s += '<path d="M430 300 h90 a24 24 0 0 1 0 48 h-90z" fill="url(#darkH)"/><path d="M170 300 h-90 a24 24 0 0 0 0 48 h90z" fill="url(#darkH)"/>'
    s += '<rect x="270" y="120" width="60" height="70" rx="8" fill="#1b1e23"/>'
    s += bolt(190, 220, 12) + bolt(410, 220, 12) + bolt(190, 420, 12) + bolt(410, 420, 12)
    return s


@image("amortisseur", "Amortisseur avant", (300, 530, 120, 18))
def _():
    s = '<rect x="286" y="60" width="28" height="180" fill="url(#steelH)"/>'
    s += '<rect x="262" y="40" width="76" height="30" rx="8" fill="url(#dark)"/>'
    s += '<rect x="246" y="230" width="108" height="250" rx="18" fill="url(#yellow)"/>'
    s += '<rect x="262" y="250" width="16" height="210" rx="8" fill="#fff" opacity=".35"/>'
    s += '<rect x="246" y="300" width="108" height="46" fill="#1b1e23"/>'
    s += '<text x="300" y="332" font-family="Arial" font-weight="800" font-size="22" fill="#ffd84d" text-anchor="middle">B4</text>'
    s += '<rect x="230" y="470" width="140" height="22" rx="4" fill="url(#steel)"/>'
    s += bushing(300, 510, 26)
    return s


@image("bras-suspension", "Bras de suspension avant")
def _():
    s = '<path d="M110 380 L300 170 L500 390 L420 400 L300 270 L190 395 Z" fill="url(#dark)" stroke="#0e1013" stroke-width="3"/>'
    s += '<path d="M130 372 L300 190 L480 382" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="6"/>'
    s += bushing(120, 385, 38) + bushing(490, 395, 38)
    s += '<circle cx="300" cy="170" r="40" fill="url(#steel)" stroke="#4b5460" stroke-width="3"/>'
    s += '<path d="M280 120 h40 v40 h-40z" fill="url(#steelH)"/><rect x="270" y="80" width="60" height="44" rx="10" fill="#1b1e23"/>'
    return s


@image("rotule-direction", "Rotule de direction")
def _():
    s = '<rect x="80" y="284" width="260" height="32" rx="6" fill="url(#steel)"/>'
    for i in range(18):
        s += f'<rect x="{90+i*9}" y="284" width="3" height="32" fill="#6c7683" opacity=".6"/>'
    s += '<path d="M330 260 h110 q40 0 50 40 q-10 40 -50 40 h-110z" fill="url(#dark)"/>'
    s += '<rect x="420" y="190" width="40" height="80" rx="6" fill="url(#steelH)"/>'
    s += '<path d="M410 200 q30 -40 60 0 z" fill="#1b1e23"/><rect x="428" y="140" width="24" height="60" fill="url(#steelH)"/>'
    s += '<rect x="420" y="130" width="40" height="18" rx="3" fill="#4b5460"/>'
    return s


@image("ressorts", "Ressorts de suspension")
def _():
    return spring(210, 110, 450, 150, 6) + spring(400, 130, 470, 150, 6)


@image("biellette-stabilisatrice", "Biellette de barre stabilisatrice")
def _():
    s = '<rect x="140" y="286" width="320" height="28" rx="14" fill="url(#dark)" transform="rotate(-18 300 300)"/>'
    s += '<g transform="rotate(-18 300 300)">'
    s += '<circle cx="140" cy="300" r="42" fill="url(#steel)" stroke="#4b5460" stroke-width="3"/><path d="M110 300 h60" stroke="#1b1e23" stroke-width="30" stroke-linecap="round"/>'
    s += '<circle cx="460" cy="300" r="42" fill="url(#steel)" stroke="#4b5460" stroke-width="3"/><path d="M430 300 h60" stroke="#1b1e23" stroke-width="30" stroke-linecap="round"/>'
    s += '<rect x="126" y="220" width="28" height="46" fill="url(#steelH)"/><rect x="446" y="334" width="28" height="46" fill="url(#steelH)"/>'
    s += '</g>'
    return s


@image("phare-led", "Phare LED avant", (300, 470, 230, 22))
def _():
    s = '<path d="M60 230 Q120 150 300 150 L540 190 Q560 290 500 380 L180 410 Q70 380 60 230 Z" fill="url(#dark)"/>'
    s += '<path d="M85 238 Q135 175 300 172 L520 205 Q535 285 485 360 L185 388 Q95 360 85 238 Z" fill="url(#glass)" stroke="#9fb6cc" stroke-width="2"/>'
    s += '<circle cx="210" cy="280" r="62" fill="#1b1e23"/><circle cx="210" cy="280" r="48" fill="url(#steel)"/><circle cx="210" cy="280" r="22" fill="#dff0ff"/>'
    s += '<circle cx="380" cy="270" r="56" fill="#1b1e23"/><circle cx="380" cy="270" r="42" fill="url(#steel)"/><circle cx="380" cy="270" r="18" fill="#dff0ff"/>'
    s += '<path d="M130 350 Q300 330 470 318" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round"/>'
    s += '<path d="M130 350 Q300 330 470 318" fill="none" stroke="#9fd0ff" stroke-width="22" stroke-linecap="round" opacity=".35"/>'
    s += '<path d="M110 220 Q200 180 320 180" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="6" stroke-linecap="round"/>'
    return s


@image("feu-arriere", "Feu arrière LED", (300, 470, 220, 22))
def _():
    s = '<path d="M80 200 L520 180 L500 290 L300 300 L280 400 L90 400 Z" fill="#1b1e23"/>'
    s += '<path d="M98 214 L502 196 L486 276 L288 286 L268 386 L104 386 Z" fill="url(#redGlass)"/>'
    s += '<path d="M120 250 L470 234 M120 250 L118 360" fill="none" stroke="#ffd6d2" stroke-width="10" stroke-linecap="round"/>'
    s += '<path d="M120 250 L470 234 M120 250 L118 360" fill="none" stroke="#ff4d40" stroke-width="26" stroke-linecap="round" opacity=".35"/>'
    s += '<rect x="170" y="290" width="80" height="60" rx="6" fill="#f2f4f7" opacity=".85"/>'
    return s


@image("ampoule-xenon", "Ampoule xénon D1S", (300, 510, 160, 20))
def _():
    s = '<rect x="230" y="330" width="140" height="170" rx="14" fill="url(#dark)"/>'
    s += '<rect x="250" y="360" width="100" height="16" rx="3" fill="#4b5460"/><rect x="250" y="392" width="100" height="16" rx="3" fill="#4b5460"/>'
    s += '<rect x="210" y="310" width="180" height="30" rx="6" fill="url(#steel)"/>'
    s += '<rect x="282" y="120" width="36" height="200" rx="18" fill="url(#glass)" stroke="#9fb6cc" stroke-width="2"/>'
    s += '<ellipse cx="300" cy="200" rx="26" ry="40" fill="url(#glass)" stroke="#9fb6cc" stroke-width="2"/>'
    s += '<circle cx="300" cy="200" r="10" fill="#ffffff"/><circle cx="300" cy="200" r="30" fill="#bfe0ff" opacity=".45"/>'
    s += '<path d="M330 150 v170" stroke="#9aa3ae" stroke-width="4"/>'
    return s


@image("antibrouillard", "Projecteur antibrouillard", (300, 500, 170, 22))
def _():
    s = '<circle cx="300" cy="290" r="170" fill="url(#dark)"/>'
    s += '<circle cx="300" cy="290" r="140" fill="url(#steel)"/>'
    for r in (120, 96, 72):
        s += f'<circle cx="300" cy="290" r="{r}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>'
    s += '<circle cx="300" cy="290" r="140" fill="url(#glass)" opacity=".7"/>'
    s += '<circle cx="300" cy="290" r="32" fill="#fffbe0"/>'
    s += '<path d="M200 200 Q260 160 330 170" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8"/>'
    return s


@image("calandre", "Calandre double noir brillant", (300, 470, 240, 22))
def _():
    s = ""
    for x in (95, 315):
        s += f'<rect x="{x}" y="150" width="190" height="280" rx="70" fill="url(#steel)"/>'
        s += f'<rect x="{x+12}" y="162" width="166" height="256" rx="60" fill="#0e1013"/>'
        for i in range(8):
            s += f'<rect x="{x+26+i*19}" y="170" width="9" height="240" rx="4" fill="url(#darkH)"/>'
        s += f'<rect x="{x+26}" y="168" width="40" height="244" rx="20" fill="#fff" opacity=".06"/>'
    return s


@image("coques-retro", "Coques de rétroviseur carbone", (300, 480, 230, 22))
def _():
    s = ""
    for dx, flip in ((0, 1), (300, -1)):
        tr = f'translate({150+dx} 0) scale({flip} 1) translate({-150} 0)' if flip == -1 else f'translate({dx} 0)'
        s += f'<g transform="{tr}">'
        s += '<path d="M40 330 Q30 200 150 180 Q250 175 270 260 Q280 360 180 400 Q70 420 40 330 Z" fill="url(#carbon)" stroke="#0e1013" stroke-width="4"/>'
        s += '<path d="M60 300 Q60 210 150 200" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="10" stroke-linecap="round"/>'
        s += '</g>'
    return s


@image("bouclier-avant", "Bouclier avant à peindre", (300, 470, 250, 22))
def _():
    s = '<path d="M40 230 Q60 170 150 160 L450 160 Q540 170 560 230 L550 380 Q540 420 490 420 L110 420 Q60 420 50 380 Z" fill="#5f6873"/>'
    s += '<path d="M40 230 Q60 170 150 160 L450 160 Q540 170 560 230 L550 380 Q540 420 490 420 L110 420 Q60 420 50 380 Z" fill="url(#steel)" opacity=".55"/>'
    s += '<path d="M150 300 h300 v70 h-300 z" rx="20" fill="#1b1e23"/>'
    for i in range(10):
        s += f'<rect x="{160+i*29}" y="306" width="14" height="58" fill="#30353d"/>'
    s += '<path d="M70 280 h60 l10 60 h-60z" fill="#1b1e23"/><path d="M530 280 h-60 l-10 60 h60z" fill="#1b1e23"/>'
    for x in (200, 260, 340, 400):
        s += f'<circle cx="{x}" cy="395" r="8" fill="#30353d"/>'
    s += '<path d="M80 200 Q300 175 520 200" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="8" stroke-linecap="round"/>'
    return s


@image("huile-5w30", "Huile moteur 5W30 5 L")
def _():
    return bottle(300, 490, 260, 360, "url(#dark)", "#c4261e", "5W30", "Longlife · 5 L", "#1c69d4", "#ffffff")


@image("liquide-refroidissement", "Liquide de refroidissement")
def _():
    s = bottle(300, 490, 220, 330, "url(#pink)", "#1b1e23", "-37 °C", "Antigel · 1,5 L", "#ffffff", "#0b1f3a")
    return s


@image("filtre-habitacle", "Filtre d'habitacle à charbon", (300, 470, 220, 22))
def _():
    s = '<path d="M100 230 L460 200 L510 320 L150 360 Z" fill="#e8ebef"/>'
    s += '<path d="M116 236 L456 208 L494 312 L156 346 Z" fill="url(#pleatsDark)"/>'
    for i in range(22):
        t = i / 22
        x1, y1 = 116 + t * 340, 236 - t * 28
        x2, y2 = 156 + t * 338, 346 - t * 34
        s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#1a1c1f" stroke-width="3"/>'
    s += '<path d="M150 360 L510 320 L512 340 L152 382 Z" fill="#b9c1cb"/>'
    return s


@image("balais-essuie-glace", "Balais d'essuie-glace", (300, 480, 240, 20))
def _():
    s = ""
    for y, rot, l in ((250, -8, 460), (340, -8, 380)):
        s += f'<g transform="rotate({rot} 300 {y})">'
        s += f'<rect x="{300-l/2}" y="{y-14}" width="{l}" height="28" rx="14" fill="url(#dark)"/>'
        s += f'<rect x="{300-l/2+10}" y="{y+12}" width="{l-20}" height="8" rx="3" fill="#0e1013"/>'
        s += f'<rect x="276" y="{y-24}" width="48" height="20" rx="4" fill="#1b1e23"/>'
        s += f'<rect x="{300-l/2+20}" y="{y-10}" width="{l-40}" height="5" rx="2" fill="#fff" opacity=".15"/>'
        s += '</g>'
    return s


@image("batterie-agm", "Batterie AGM 90 Ah", (300, 500, 220, 22))
def _():
    s = '<rect x="110" y="200" width="380" height="280" rx="14" fill="url(#dark)"/>'
    s += '<rect x="100" y="180" width="400" height="44" rx="10" fill="#1b1e23"/>'
    s += '<rect x="140" y="146" width="44" height="40" rx="6" fill="url(#steel)"/><rect x="416" y="146" width="44" height="40" rx="6" fill="url(#steel)"/>'
    s += '<rect x="136" y="186" width="52" height="10" fill="#c4261e"/><rect x="412" y="186" width="52" height="10" fill="#1c69d4"/>'
    s += '<text x="162" y="140" font-family="Arial" font-weight="800" font-size="30" fill="#c4261e" text-anchor="middle">+</text>'
    s += '<text x="438" y="140" font-family="Arial" font-weight="800" font-size="30" fill="#1c69d4" text-anchor="middle">−</text>'
    s += '<rect x="150" y="260" width="300" height="160" rx="10" fill="url(#blue)"/>'
    s += '<text x="300" y="330" font-family="Arial" font-weight="800" font-size="44" fill="#fff" text-anchor="middle">AGM</text>'
    s += '<text x="300" y="380" font-family="Arial" font-weight="600" font-size="24" fill="#fff" text-anchor="middle">12V · 90Ah · 900A</text>'
    return s


def hero():
    """Illustration d'en-tête : pièces en vue éclatée sur fond sombre."""
    body = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 640" role="img" aria-label="Disque, étrier, ressort et filtre">
<title>Pièces détachées en vue éclatée</title>{DEFS}
<radialGradient id="glow" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#1c69d4" stop-opacity=".45"/><stop offset="1" stop-color="#0a1628" stop-opacity="0"/></radialGradient>
<rect width="900" height="640" fill="url(#glow)"/>
<ellipse cx="450" cy="590" rx="360" ry="30" fill="#000" opacity=".35"/>
<g opacity=".9">{spring(700, 110, 470, 130, 6)}</g>
{disc(380, 330, 230)}
<g transform="translate(40 -20)">
<path d="M430 170 Q560 90 660 200 L640 360 Q560 300 470 330 Z" fill="url(#red)" stroke="#6d120e" stroke-width="3"/>
<path d="M450 175 Q560 110 640 200" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="8" stroke-linecap="round"/>
{bolt(480, 310, 14)}{bolt(630, 330, 14)}
</g>
<g transform="translate(-40 310) scale(.55)">{cylinder(300, 120, 200, 330, "url(#blueH)", ribs=0, label="BP")}</g>
</svg>
"""
    return body


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (title, fn, shadow) in IMAGES.items():
        (OUT / f"{name}.svg").write_text(svg(fn(), shadow, title), encoding="utf-8")
    (ROOT / "images" / "hero.svg").write_text(hero(), encoding="utf-8")
    print(f"{len(IMAGES)} images produits + hero générées")


if __name__ == "__main__":
    main()
