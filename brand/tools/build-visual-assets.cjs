"use strict";

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const brandRoot = path.resolve(__dirname, "..");
const fontRoot = path.join(brandRoot, "typography", "fonts");

const colors = {
  black: "#090909",
  blackSoft: "#0f0f0f",
  surface: "#141311",
  line: "#2d2922",
  gold: "#c9a54b",
  goldLight: "#ead07f",
  goldDark: "#9b792d",
  ivory: "#f4f0e8",
  muted: "#b4aea4",
  mutedBrand: "#918a7f",
  mutedLabel: "#8e877b",
  mutedFooter: "#817a70",
  onGold: "#151109"
};

function b64(file) {
  return fs.readFileSync(file).toString("base64");
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fontCss() {
  const display = b64(path.join(fontRoot, "cormorant-garamond-latin.woff2"));
  const body = b64(path.join(fontRoot, "jost-latin.woff2"));
  return [
    "@font-face{font-family:'Cormorant Garamond';src:url(data:font/woff2;base64," + display + ") format('woff2');font-style:normal;font-weight:400 700;}",
    "@font-face{font-family:'Jost';src:url(data:font/woff2;base64," + body + ") format('woff2');font-style:normal;font-weight:400 700;}",
    ".display{font-family:'Cormorant Garamond',Georgia,serif;}",
    ".body{font-family:'Jost',Arial,sans-serif;}",
    ".caps{letter-spacing:0.22em;text-transform:uppercase;}",
    ".muted{fill:" + colors.muted + ";}",
    ".gold{fill:" + colors.gold + ";}",
    ".ivory{fill:" + colors.ivory + ";}"
  ].join("");
}

function wrap(width, height, body) {
  return [
    "<svg xmlns='http://www.w3.org/2000/svg' width='" + width + "' height='" + height + "' viewBox='0 0 " + width + " " + height + "'>",
    "<defs>",
    "<style>" + fontCss() + "</style>",
    "<linearGradient id='goldGradient' x1='0' y1='0' x2='1' y2='1'>",
    "<stop offset='0%' stop-color='" + colors.goldLight + "'/>",
    "<stop offset='58%' stop-color='" + colors.gold + "'/>",
    "<stop offset='100%' stop-color='" + colors.goldDark + "'/>",
    "</linearGradient>",
    "<radialGradient id='glow' cx='78%' cy='18%' r='62%'>",
    "<stop offset='0%' stop-color='" + colors.gold + "' stop-opacity='0.16'/>",
    "<stop offset='100%' stop-color='" + colors.black + "' stop-opacity='0'/>",
    "</radialGradient>",
    "</defs>",
    body,
    "</svg>"
  ].join("");
}

function text(x, y, content, attrs) {
  return "<text x='" + x + "' y='" + y + "' " + (attrs || "") + ">" + esc(content) + "</text>";
}

function paletteSvg() {
  const main = [
    ["Negro principal", "#090909", "Fondo general"],
    ["Negro secundario", "#0F0F0F", "Secciones"],
    ["Superficie", "#141311", "Capas oscuras"],
    ["Linea", "#2D2922", "Bordes"],
    ["Dorado principal", "#C9A54B", "Acentos"],
    ["Dorado claro", "#EAD07F", "Destacados"],
    ["Marfil", "#F4F0E8", "Texto principal"],
    ["Gris calido", "#B4AEA4", "Texto secundario"]
  ];
  const aux = [
    ["Dorado oscuro", "#9B792D"],
    ["Texto sobre dorado", "#151109"],
    ["Gris de marca", "#918A7F"],
    ["Gris de etiqueta", "#8E877B"],
    ["Gris de pie", "#817A70"]
  ];
  let body = "<rect width='1600' height='1000' fill='" + colors.black + "'/>";
  body += "<rect width='1600' height='1000' fill='url(#glow)'/>";
  body += text(96, 92, "EVOLUTION STUDIO", "class='body caps gold' font-size='18' font-weight='600'");
  body += text(96, 164, "Paleta digital", "class='display ivory' font-size='70' font-weight='500'");
  body += text(96, 207, "Valores exactos extraidos de la landing publicada", "class='body muted' font-size='22'");
  body += "<line x1='96' y1='250' x2='1504' y2='250' stroke='" + colors.line + "'/>";
  main.forEach(function(item, i) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 96 + col * 352;
    const y = 300 + row * 245;
    body += "<rect x='" + x + "' y='" + y + "' width='320' height='142' rx='2' fill='" + item[1] + "' stroke='" + (item[1].toLowerCase() === colors.black ? colors.line : item[1]) + "'/>";
    body += text(x, y + 178, item[0], "class='body ivory' font-size='19' font-weight='600'");
    body += text(x, y + 207, item[1], "class='body gold' font-size='17' font-weight='500'");
    body += text(x + 112, y + 207, item[2], "class='body muted' font-size='17'");
  });
  body += text(96, 792, "COLORES AUXILIARES", "class='body caps gold' font-size='15' font-weight='600'");
  aux.forEach(function(item, i) {
    const x = 96 + i * 282;
    body += "<circle cx='" + (x + 25) + "' cy='852' r='25' fill='" + item[1] + "' stroke='" + colors.line + "'/>";
    body += text(x + 62, 845, item[0], "class='body ivory' font-size='15' font-weight='500'");
    body += text(x + 62, 869, item[1], "class='body muted' font-size='14'");
  });
  body += "<rect x='96' y='924' width='1408' height='8' fill='url(#goldGradient)'/>";
  body += text(96, 968, "Gradiente de accion: #EAD07F 0%  ·  #C9A54B 58%  ·  #9B792D 100%", "class='body muted' font-size='15'");
  return wrap(1600, 1000, body);
}

function typeSvg() {
  let body = "<rect width='1600' height='1100' fill='" + colors.black + "'/>";
  body += "<rect width='1600' height='1100' fill='url(#glow)'/>";
  body += text(96, 92, "EVOLUTION STUDIO", "class='body caps gold' font-size='18' font-weight='600'");
  body += text(96, 164, "Sistema tipografico", "class='display ivory' font-size='70' font-weight='500'");
  body += text(96, 207, "Cormorant Garamond para expresion · Jost para funcion", "class='body muted' font-size='22'");
  body += "<line x1='96' y1='250' x2='1504' y2='250' stroke='" + colors.line + "'/>";
  body += text(96, 310, "DISPLAY  ·  CORMORANT GARAMOND", "class='body caps gold' font-size='15' font-weight='600'");
  body += text(96, 430, "Evolution", "class='display ivory' font-size='132' font-weight='500' letter-spacing='-2'");
  body += text(640, 430, "Studio", "class='display gold' font-size='132' font-weight='400' font-style='italic'");
  body += text(102, 486, "Titulares 400 / 500 / 600  ·  contraste editorial  ·  italica para enfasis", "class='body muted' font-size='18'");
  body += "<line x1='96' y1='540' x2='1504' y2='540' stroke='" + colors.line + "'/>";
  body += text(96, 600, "BODY  ·  JOST", "class='body caps gold' font-size='15' font-weight='600'");
  body += text(96, 682, "Claridad para cada paso de la experiencia.", "class='body ivory' font-size='43' font-weight='400'");
  body += text(96, 737, "Parrafos, navegacion, datos y acciones utilizan una sans serif geometrica,", "class='body muted' font-size='22'");
  body += text(96, 772, "con ritmo amplio, lectura directa y jerarquias contenidas.", "class='body muted' font-size='22'");
  body += "<rect x='96' y='836' width='338' height='76' rx='2' fill='url(#goldGradient)'/>";
  body += text(265, 883, "RESERVAR HORA", "class='body' fill='" + colors.onGold + "' text-anchor='middle' font-size='16' font-weight='600' letter-spacing='2'");
  body += text(510, 870, "QUINTA DE TILCOCO", "class='body caps gold' font-size='16' font-weight='500'");
  body += text(510, 910, "@evolution_barbercut", "class='body' fill='" + colors.goldLight + "' font-size='20' font-weight='500'");
  body += "<line x1='96' y1='970' x2='1504' y2='970' stroke='" + colors.line + "'/>";
  body += text(96, 1025, "Jerarquia verificada en la landing publicada · pesos 400, 500 y 600", "class='body muted' font-size='17'");
  return wrap(1600, 1100, body);
}

function brandBoardSvg() {
  let evidenceImage = "";
  const screenshot = path.join(brandRoot, "evidence", "current-landing-reference.png");
  if (fs.existsSync(screenshot)) {
    evidenceImage = "data:image/png;base64," + b64(screenshot);
  }
  let body = "<rect width='1800' height='1350' fill='" + colors.black + "'/>";
  body += "<rect width='1800' height='1350' fill='url(#glow)'/>";
  body += text(100, 100, "IDENTIDAD DIGITAL V1", "class='body caps gold' font-size='18' font-weight='600'");
  body += text(100, 208, "Evolution", "class='display ivory' font-size='120' font-weight='500' letter-spacing='-2'");
  body += text(100, 305, "Studio", "class='display' fill='" + colors.goldLight + "' font-size='112' font-weight='400' font-style='italic'");
  body += text(104, 353, "NEGRO · DORADO · MARFIL · EDITORIAL · FUNCIONAL", "class='body caps muted' font-size='15' font-weight='500'");
  body += "<line x1='100' y1='404' x2='1700' y2='404' stroke='" + colors.line + "'/>";

  body += text(100, 465, "PALETA CENTRAL", "class='body caps gold' font-size='15' font-weight='600'");
  const swatches = [
    ["#090909", colors.line],
    ["#141311", colors.surface],
    ["#C9A54B", colors.gold],
    ["#EAD07F", colors.goldLight],
    ["#F4F0E8", colors.ivory],
    ["#B4AEA4", colors.muted]
  ];
  swatches.forEach(function(item, i) {
    const x = 100 + i * 176;
    body += "<rect x='" + x + "' y='495' width='152' height='92' rx='2' fill='" + item[1] + "' stroke='" + colors.line + "'/>";
    body += text(x, 620, item[0], "class='body muted' font-size='15'");
  });

  body += text(100, 708, "TIPOGRAFIA", "class='body caps gold' font-size='15' font-weight='600'");
  body += text(100, 798, "Cormorant Garamond", "class='display ivory' font-size='70' font-weight='500'");
  body += text(104, 844, "Titulares y expresion editorial", "class='body muted' font-size='18'");
  body += text(100, 923, "Jost", "class='body ivory' font-size='47' font-weight='500'");
  body += text(104, 966, "Lectura, navegacion, etiquetas y acciones", "class='body muted' font-size='18'");
  body += "<rect x='100' y='1035' width='330' height='78' rx='2' fill='url(#goldGradient)'/>";
  body += text(265, 1083, "RESERVAR HORA", "class='body' fill='" + colors.onGold + "' text-anchor='middle' font-size='16' font-weight='600' letter-spacing='2'");
  body += text(100, 1190, "REGLA DE IDENTIDAD", "class='body caps gold' font-size='15' font-weight='600'");
  body += text(100, 1232, "Contenido breve, alto contraste y acentos dorados contenidos.", "class='body ivory' font-size='22'");
  body += text(100, 1268, "No inventar servicios, promociones, testimonios ni imagenes del negocio.", "class='body muted' font-size='18'");

  body += "<rect x='1210' y='82' width='490' height='1186' rx='4' fill='" + colors.blackSoft + "' stroke='" + colors.line + "'/>";
  body += text(1260, 140, "REFERENCIA PUBLICADA", "class='body caps gold' font-size='14' font-weight='600'");
  if (evidenceImage) {
    body += "<clipPath id='shotClip'><rect x='1260' y='180' width='390' height='730' rx='2'/></clipPath>";
    body += "<image href='" + evidenceImage + "' x='1260' y='180' width='390' height='730' preserveAspectRatio='none' clip-path='url(#shotClip)'/>";
  } else {
    body += "<rect x='1260' y='180' width='390' height='730' fill='" + colors.surface + "'/>";
    body += text(1455, 535, "Captura pendiente", "class='body muted' text-anchor='middle' font-size='20'");
  }
  body += "<line x1='1260' y1='954' x2='1650' y2='954' stroke='" + colors.line + "'/>";
  body += text(1260, 1005, "LOGO", "class='body caps gold' font-size='14' font-weight='600'");
  body += text(1260, 1048, "Archivo maestro pendiente", "class='display ivory' font-size='34' font-weight='500'");
  body += text(1260, 1086, "La captura de Instagram se conserva", "class='body muted' font-size='16'");
  body += text(1260, 1113, "como evidencia, no como arte final.", "class='body muted' font-size='16'");
  body += "<rect x='1260' y='1160' width='250' height='46' rx='2' fill='" + colors.surface + "' stroke='" + colors.gold + "'/>";
  body += text(1385, 1189, "PENDIENTE DE ORIGINAL", "class='body gold' text-anchor='middle' font-size='12' font-weight='600' letter-spacing='1.3'");
  body += text(1260, 1242, "Fuente: landing publicada · 04.09.2026", "class='body muted' font-size='14'");

  return wrap(1800, 1350, body);
}

async function writeAsset(relativePath, svg, width) {
  const svgPath = path.join(brandRoot, relativePath + ".svg");
  const pngPath = path.join(brandRoot, relativePath + ".png");
  fs.writeFileSync(svgPath, svg, "utf8");
  await sharp(Buffer.from(svg), { density: 180 }).resize({ width: width }).png().toFile(pngPath);
  return { svgPath: svgPath, pngPath: pngPath };
}

async function main() {
  const outputs = [];
  outputs.push(await writeAsset("palette/evolution-palette", paletteSvg(), 1600));
  outputs.push(await writeAsset("typography/evolution-type-specimen", typeSvg(), 1600));
  outputs.push(await writeAsset("boards/evolution-brand-board", brandBoardSvg(), 1800));
  outputs.forEach(function(item) {
    if (!fs.existsSync(item.svgPath) || !fs.existsSync(item.pngPath)) {
      throw new Error("Missing output: " + JSON.stringify(item));
    }
  });
  process.stdout.write(JSON.stringify(outputs, null, 2) + "\n");
}

main().catch(function(error) {
  console.error(error);
  process.exit(1);
});
