#!/usr/bin/env node
/**
 * build.js — สคริปต์ build โปรเจกต์ "บัญชีรายรับ-รายจ่าย"
 *
 * อ่านไฟล์ต้นฉบับจาก  src/index.html, src/style.css, src/app.js
 * แล้วสร้างไฟล์สำหรับใช้งานจริงลงที่ dist/index.html, dist/style.css, dist/app.js
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
 * ห้ามแก้ไฟล์ใน dist/ โดยตรง เพราะจะถูกเขียนทับเวลา build ใหม่ และโค้ดอ่านแทบไม่ได้แล้ว
 */

const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const CleanCSS = require("clean-css");
const { minify: minifyHtml } = require("html-minifier-terser");

const SRC = path.join(__dirname, "src");
const DIST = path.join(__dirname, "dist");

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

function readSrc(name) {
    const p = path.join(SRC, name);
    if (!fs.existsSync(p)) throw new Error(`ไม่พบไฟล์ต้นฉบับ: ${p}`);
    return fs.readFileSync(p, "utf8");
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
    const src = readSrc("index.html");
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

async function main() {
    log("เริ่ม build จาก src/ → dist/ ...");
    await buildJs();
    await buildCss();
    await buildHtml();
    log("เสร็จแล้ว เปิด dist/index.html เพื่อใช้งาน (ต้องมีไฟล์ dist/style.css และ dist/app.js อยู่โฟลเดอร์เดียวกัน)");
}

main().catch(err => {
    console.error("[build] ล้มเหลว:", err.message);
    process.exit(1);
});
