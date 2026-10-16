#!/usr/bin/env node
/**
 * build.js — สคริปต์ build โปรเจกต์ "บัญชีรายรับ-รายจ่าย"
 *
 * อ่านไฟล์ต้นฉบับจาก  src/index.html, src/style.css, src/app.js (หรือ index.html/index.css/index.js ในโฟลเดอร์หลัก)
 * แล้วสร้างไฟล์สำหรับใช้งานจริงลงที่ public/ (ลบของเก่าทิ้งแล้วสร้างใหม่ทุกครั้ง)
 *
 *  - app.js   → เข้ารหัส/obfuscate ด้วย javascript-obfuscator (อ่านไม่รู้เรื่อง, ปิด console.log)
 *  - style.css→ minify (ตัดช่องว่าง/คอมเมนต์ออก)
 *  - index.html → minify (ตัดช่องว่าง/คอมเมนต์ออก), อ้างอิงไฟล์ style.css และ app.js ที่ build แล้ว
 *
 * วิธีใช้:
 *   npm install javascript-obfuscator clean-css html-minifier-terser
 *   node build.js
 *
 * แก้ฟีเจอร์ใหม่ ๆ ที่โฟลเดอร์ src/ เท่านั้น แล้วรัน `node build.js` ใหม่ทุกครั้ง
 * ห้ามแก้ไฟล์ใน public/ โดยตรง เพราะจะถูกเขียนทับเวลา build ใหม่ และโค้ดอ่านแทบไม่ได้แล้ว
 */

const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const CleanCSS = require("clean-css");
const { minify: minifyHtml } = require("html-minifier-terser");

// โฟลเดอร์ผลลัพธ์ที่ใช้ deploy (Netlify จะเสิร์ฟโฟลเดอร์นี้) — ถูกลบแล้วสร้างใหม่ทุกครั้งที่ build
const OUT = path.join(__dirname, "public");
const DIST = OUT;

// ไฟล์ต้นฉบับ: หาใน src/ ก่อน ถ้าไม่มีให้ใช้ไฟล์ในโฟลเดอร์หลัก (index.js / index.css / index.html)
const SRC_DIRS = [path.join(__dirname, "src"), __dirname];
const SRC_NAMES = {
    "app.js": ["app.js", "index.js"],
    "style.css": ["style.css", "index.css"],
    "index.html": ["index.html"],
};

// ---------- ตั้งค่าการเข้ารหัส JS ----------
// ปิด debugProtection / selfDefending ไว้ก่อน เพราะทดสอบแล้วพบว่าทำให้หน้าเว็บค้าง
// ในบางสถานการณ์ใช้งานปกติ (เช่นมือถือบางรุ่นเปิด inspector เอง) ถ้าต้องการระดับป้องกัน
// สูงขึ้นและยอมรับความเสี่ยงนี้ ให้เปลี่ยนทั้งสองค่าเป็น true
const OBFUSCATOR_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.3,
    debugProtection: false,
    selfDefending: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: "hexadecimal",
    renameGlobals: false,
    stringArray: true,
    stringArrayEncoding: ["rc4"],
    stringArrayThreshold: 1,
    splitStrings: true,
    splitStringsChunkLength: 6,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
};

function log(msg) {
    console.log("[build] " + msg);
}

function findSrc(name) {
    for (const dir of SRC_DIRS) {
        for (const n of SRC_NAMES[name] || [name]) {
            const p = path.join(dir, n);
            if (fs.existsSync(p)) return p;
        }
    }
    return null;
}

function readSrc(name) {
    const p = findSrc(name);
    if (!p) throw new Error(`ไม่พบไฟล์ต้นฉบับ: ${name} (หาใน src/ และโฟลเดอร์หลักแล้ว)`);
    log(`อ่าน ${path.relative(__dirname, p)}`);
    return fs.readFileSync(p, "utf8");
}

function cleanOut() {
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
    log("ลบ public/ เก่าแล้วสร้างใหม่");
}

function writeDist(name, content) {
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
    const p = path.join(DIST, name);
    fs.writeFileSync(p, content, "utf8");
    log(`เขียน ${path.relative(__dirname, p)}  (${Buffer.byteLength(content, "utf8")} bytes)`);
}

async function buildJs() {
    const src = readSrc("app.js");
    // ตรวจไวยากรณ์ก่อน obfuscate กันพังเงียบ ๆ
    new Function(src);
    const result = JavaScriptObfuscator.obfuscate(src, OBFUSCATOR_OPTIONS);
    const out = result.getObfuscatedCode();
    new Function(out); // ตรวจไวยากรณ์หลัง obfuscate ด้วย
    writeDist("app.js", out);
}

async function buildCss() {
    const src = readSrc("style.css");
    const result = new CleanCSS({ level: 2 }).minify(src);
    if (result.errors.length) throw new Error("CSS error: " + result.errors.join(", "));
    writeDist("style.css", result.styles);
}

async function buildHtml() {
    const src = readSrc("index.html")
        .replace(/href=(["'])index\.css\1/g, 'href="style.css"')
        .replace(/src=(["'])index\.js\1/g, 'src="app.js"');
    const out = await minifyHtml(src, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: false, // style.css แยก build เองแล้ว
        minifyJS: false,  // app.js แยก build เองแล้ว (obfuscate ไปแล้ว)
        removeAttributeQuotes: false,
        keepClosingSlash: true,
    });
    writeDist("index.html", out);
}

// คัดลอกไฟล์ที่ไม่ต้องแปลง (ไอคอน, manifest) ไป public/ — หาใน src/ ก่อน แล้วค่อยโฟลเดอร์หลัก
function copyStatic() {
    let n = 0;
    for (const f of ["favicon.ico", "manifest.webmanifest"]) {
        for (const dir of SRC_DIRS) {
            const p = path.join(dir, f);
            if (fs.existsSync(p)) { fs.copyFileSync(p, path.join(OUT, f)); n++; break; }
        }
    }
    for (const dir of SRC_DIRS) {
        const iconSrc = path.join(dir, "icons");
        if (fs.existsSync(iconSrc)) {
            fs.cpSync(iconSrc, path.join(OUT, "icons"), { recursive: true });
            n++;
            break;
        }
    }
    log(`คัดลอกไฟล์ประกอบ (ไอคอน/manifest) ${n} รายการ`);
}

async function main() {
    log("เริ่ม build → public/ ...");
    cleanOut();
    await buildJs();
    await buildCss();
    await buildHtml();
    copyStatic();
    log("เสร็จแล้ว เปิด public/index.html เพื่อใช้งาน (ต้องมีไฟล์ public/style.css และ public/app.js อยู่โฟลเดอร์เดียวกัน)");
}

main().catch(err => {
    console.error("[build] ล้มเหลว:", err.message);
    process.exit(1);
});