const $ = id => document.getElementById(id);
let data = [];
const fmt = n => Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = n => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 4 });
const has = id => cols.some(c => c.id === id);
const yr = r => has("d") ? (r.d || "").slice(0, 4) : "";
const amt = r => has("a") ? (+r.a || 0) : 0;
const isIn = r => has("k") && r.k === "in";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const IC = {
    "x": "<path d=\"M18 6 6 18M6 6l12 12\"/>",
    "grip": "<g fill=\"currentColor\" stroke=\"none\"><circle cx=\"9\" cy=\"6\" r=\"1.4\"/><circle cx=\"15\" cy=\"6\" r=\"1.4\"/><circle cx=\"9\" cy=\"12\" r=\"1.4\"/><circle cx=\"15\" cy=\"12\" r=\"1.4\"/><circle cx=\"9\" cy=\"18\" r=\"1.4\"/><circle cx=\"15\" cy=\"18\" r=\"1.4\"/></g>",
    "check": "<path d=\"M20 6 9 17l-5-5\"/>",
    "edit": "<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z\"/>",
    "warn": "<path d=\"m10.3 3.9-8.5 14.7A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.4L13.7 3.9a2 2 0 0 0-3.4 0Z\"/><path d=\"M12 9v4M12 17h.01\"/>",
    "search": "<circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m21 21-4.3-4.3\"/>",
    "ok": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8.5 12.5 2.5 2.5 4.5-5\"/>",
    "arrow": "<path d=\"M5 12h14m-6-6 6 6-6 6\"/>"
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
const hl = (t, k = "") => `<mark class="hl ${k}">${t}</mark>`;
const toTh = iso => { const p = (iso || "").split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${+p[0] + 543}` : "" };
const TH_MONTHS = {
    "ม.ค.": 1, "มกราคม": 1, "ก.พ.": 2, "กุมภาพันธ์": 2, "มี.ค.": 3, "มีนาคม": 3,
    "เม.ย.": 4, "เมษายน": 4, "พ.ค.": 5, "พฤษภาคม": 5, "มิ.ย.": 6, "มิถุนายน": 6,
    "ก.ค.": 7, "กรกฎาคม": 7, "ส.ค.": 8, "สิงหาคม": 8, "ก.ย.": 9, "กันยายน": 9,
    "ต.ค.": 10, "ตุลาคม": 10, "พ.ย.": 11, "พฤศจิกายน": 11, "ธ.ค.": 12, "ธันวาคม": 12
};

const parseTh = s => {
    if (!s) return null;
    const str = String(s).trim();
    const today = new Date();

    if (str === "วันนี้" || str === "today") {
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    }
    if (str === "เมื่อวาน" || str === "เมื่อวานนี้" || str === "yesterday") {
        const yest = new Date(today.getTime() - 86400000);
        return `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, "0")}-${String(yest.getDate()).padStart(2, "0")}`;
    }
    if (str === "พรุ่งนี้" || str === "tomorrow") {
        const tomo = new Date(today.getTime() + 86400000);
        return `${tomo.getFullYear()}-${String(tomo.getMonth() + 1).padStart(2, "0")}-${String(tomo.getDate()).padStart(2, "0")}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    const mThai = str.match(/^(\d{1,2})\s+([^\s\d]+)(?:\s+(\d{2,4}))?$/);
    if (mThai) {
        const d = +mThai[1];
        const mo = TH_MONTHS[mThai[2]];
        if (mo) {
            let y = mThai[3] ? +mThai[3] : today.getFullYear() + 543;
            if (y < 100) y += 2500;
            if (y > 2400) y -= 543;
            return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        }
    }

    const m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (!m) return null;
    let y = +m[3];
    if (y < 100) y += 2500;
    if (y > 2400) y -= 543;
    const mo = +m[2], d = +m[1];
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};
let curY = "all";
const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
let pq = Promise.resolve();
function popup(msg, o = {}) { const p = pq.then(() => popupNow(msg, o)); pq = p.catch(() => { }); return p }
function popupNow(msg, o) {
    return new Promise(res => {
        const m = $("pm");
        $("pt").innerHTML = esc(msg).replace(/\n/g, "<br>"); $("pf").innerHTML = o.html || "";
        $("pc").style.display = o.cancel ? "" : "none"; $("po").textContent = o.ok || "ตกลง";
        m.hidden = false;
        const done = ok => { m.hidden = true; $("po").onclick = $("pc").onclick = m.onkeydown = null; res(ok ? (o.get ? o.get() : true) : false) };
        const first = () => $("pf").querySelector("input,select");
        $("po").onclick = () => { if (o.valid && !o.valid()) { const f = first(); if (f) f.focus(); return } done(true) };
        $("pc").onclick = () => done(false);
        m.onkeydown = e => { if (e.key === "Escape") done(false); else if (e.key === "Enter" && ["INPUT", "SELECT"].includes(e.target.tagName)) { e.preventDefault(); $("po").click() } };
        (first() || $("po")).focus();
    });
}
document.addEventListener("click", e => { const c = e.target.closest && e.target.closest(".cal"); if (c) { const i = c.querySelector("input"); try { i.showPicker() } catch (_) { } } });

// ---------- หัวข้อ (คอลัมน์) ----------
let cols = [
    { id: "d", n: "วันที่", t: "date", c: "none" },
    { id: "t", n: "รายการ", t: "text", c: "count" },
    { id: "n", n: "ชื่อ", t: "text", c: "none" },
    { id: "ln", n: "นามสกุล", t: "text", c: "none" },
    { id: "c", n: "จำนวนคน", t: "num", c: "sum" },
    { id: "k", n: "ประเภท", t: "kind", c: "none" },
    { id: "a", n: "จำนวนเงิน", t: "money", c: "sum" }
];
const TL = { date: "วันที่", text: "ข้อความ", num: "ตัวเลข", money: "จำนวนเงิน", kind: "รายรับ/รายจ่าย" };
const CALC_NAMES = { none: "ข้อความ", sum: "รวม", avg: "เฉลี่ย", count: "นับ", min: "ต่ำสุด", max: "สูงสุด" };

const re = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isoToday = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}` };

function guessType(name) {
    const l = name.toLowerCase();
    if (l.includes("วัน") || l.includes("date") || l.includes("เวลา")) return "date";
    if (l.includes("เงิน") || l.includes("ราคา") || l.includes("บาท") || l.includes("จ่าย") || l.includes("ยอด") || l.includes("price") || l.includes("cost")) return "money";
    if (l.includes("ประเภท") || l.includes("ชนิด") || l.includes("สถานะ") || l.includes("kind")) return "kind";
    if (l.includes("จำนวน") || l.includes("qty") || l.includes("คน") || l.includes("หน่วย") || l.includes("แต้ม") || l.includes("คะแนน")) return "num";
    return "text";
}

function guessCalc(type) {
    if (type === "money" || type === "num") return "sum";
    if (type === "text") return "count";
    return "none";
}

function renderHead() {
    $("hl").innerHTML = cols.map(c => {
        const isNone = !c.c || c.c === "none";
        const calcText = isNone ? "ข้อความ" : c.c.toUpperCase();
        const calcStyle = isNone ? "background:var(--mut);opacity:0.8" : "";
        const calcTag = `<span class="calc-tag" data-calc-toggle="${c.id}" style="${calcStyle}" title="คลิกเพื่อเปลี่ยนการคำนวณ">${calcText}</span>`;
        return `<span class="hd" data-cid="${c.id}" title="${TL[c.t]}">
            <button class="x" data-del="${c.id}" title="ลบหัวข้อ">${ic("x")}</button>
            <span class="gr" title="ลากเพื่อจัดลำดับ">${ic("grip")}</span>
            <input data-id="${c.id}" value="${esc(c.n)}" style="width:${Math.max(80, c.n.length * 11 + 30)}px">
            ${calcTag}
        </span>`;
    }).join("");
}

// คลิกเปลี่ยนการคำนวณจาก Badge หัวข้อ
$("hl").addEventListener("click", async e => {
    const tag = e.target.closest("[data-calc-toggle]");
    if (!tag) return;
    const cid = tag.dataset.calcToggle;
    const col = cols.find(x => x.id === cid);
    if (!col) return;
    const options = ["none", "sum", "avg", "count", "min", "max"];
    const curIdx = options.indexOf(col.c || "none");
    col.c = options[(curIdx + 1) % options.length];
    renderHead();
    render();
    popup(`หัวข้อ "${col.n}" เปลี่ยนเป็น: ${CALC_NAMES[col.c]}`);
});

// ลากวางด้วย Pointer Events
let dragId = null, overId = null;
const clearOver = () => $("hl").querySelectorAll(".over").forEach(x => x.classList.remove("over"));
$("hl").addEventListener("pointerdown", e => {
    const g = e.target.closest(".gr"); if (!g) return;
    const h = g.closest(".hd"); dragId = h.dataset.cid; overId = null;
    h.classList.add("drag"); g.setPointerCapture(e.pointerId); e.preventDefault();
});
$("hl").addEventListener("pointermove", e => {
    if (!dragId) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), h = el && el.closest && el.closest("#hl .hd");
    clearOver(); overId = null;
    if (h && h.dataset.cid !== dragId) { h.classList.add("over"); overId = h.dataset.cid }
});
const endDrag = (e, ok) => {
    if (!dragId) return;
    const from = cols.findIndex(c => c.id === dragId), to = cols.findIndex(c => c.id === overId);
    dragId = null; clearOver();
    $("hl").querySelectorAll(".drag").forEach(x => x.classList.remove("drag"));
    if (ok && from >= 0 && to >= 0 && from !== to) { const [m] = cols.splice(from, 1); cols.splice(to, 0, m); renderHead(); render() }
};
$("hl").addEventListener("pointerup", e => endDrag(e, true));
$("hl").addEventListener("pointercancel", e => endDrag(e, false));

function addColumnDirect(n, t, calc) {
    const clean = n.trim();
    if (!clean) return null;
    const existing = cols.find(c => c.n.toLowerCase() === clean.toLowerCase());
    if (existing) return existing.id;
    const type = t || guessType(clean);
    const cType = calc || ($("hc") ? $("hc").value : guessCalc(type));
    const pref = { date: ["d"], kind: ["k"], money: ["a"], num: ["c"], text: ["t", "n"] }[type] || [];
    const newId = pref.find(x => !has(x)) || "c" + uid();
    cols.push({ id: newId, n: clean, t: type, c: cType });
    data.forEach(r => { if (!(newId in r)) r[newId] = ""; });
    renderHead();
    render();
    return newId;
}

function removeColumnDirect(nameOrId) {
    const target = cols.find(c => c.id === nameOrId || c.n.toLowerCase() === nameOrId.toLowerCase());
    if (!target) return false;
    const remId = target.id;
    cols = cols.filter(c => c.id !== remId);
    data.forEach(r => { delete r[remId]; });
    renderHead();
    render();
    return target.n;
}

$("add").onclick = () => {
    const n = $("hn").value.trim();
    if (!n) { popup("กรุณาตั้งชื่อหัวข้อ"); return }
    if (cols.some(c => c.n === n)) { popup(`มีหัวข้อ "${n}" อยู่แล้ว`); return }
    const t = $("ht").value;
    const cType = $("hc") ? $("hc").value : guessCalc(t);
    addColumnDirect(n, t, cType);
    $("hn").value = "";
};
$("hn").addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) $("add").click() });

// เมื่อเปลี่ยนประเภทให้ auto ปรับ select การคำนวณ
if ($("ht") && $("hc")) {
    $("ht").onchange = () => {
        $("hc").value = guessCalc($("ht").value);
    };
}

$("hl").addEventListener("change", e => {
    const c = cols.find(x => x.id === e.target.dataset.id); if (!c) return;
    const n = e.target.value.trim();
    if (!n || cols.some(x => x !== c && x.n === n)) { popup(n ? `มีหัวข้อ "${n}" อยู่แล้ว` : "ชื่อหัวข้อต้องไม่ว่าง"); e.target.value = c.n; return }
    c.n = n; renderHead(); render();
});
$("hl").addEventListener("click", async e => {
    const db = e.target.closest("[data-del]"), c = db && cols.find(x => x.id === db.dataset.del); if (!c) return;
    if (!await popup(`ลบหัวข้อ "${c.n}"?`, { cancel: true, ok: "ลบ" })) return;
    removeColumnDirect(c.id);
});

// ---------- ตาราง ----------
const cell = (c, r) => {
    const v = r[c.id], f = `data-f="${c.id}"${v === undefined || v === null || v === "" ? ' title="ยังไม่ได้กรอก"' : ""}`;
    if (c.t === "date") return `<span class="dt"><input ${f} value="${toTh(v)}" inputmode="numeric" placeholder="*" style="width:100px"><span class="cal">${CAL}<input type="date" ${f} data-p="1" value="${v || ""}"></span></span>`;
    if (c.t === "kind") return `<select ${f}${v ? "" : ' class="empty"'}>${v ? "" : '<option value="" selected>*</option>'}<option value="in"${v === "in" ? " selected" : ""}>รายรับ</option><option value="out"${v === "out" ? " selected" : ""}>รายจ่าย</option></select>`;
    if (c.t === "num" || c.t === "money") return `<input type="number" ${f} value="${v ?? ""}" placeholder="*" step="any" class="${c.t === "money" && has("k") ? r.k : ""}">`;
    return `<input ${f} placeholder="*" value="${esc(v)}">`;
};
const empty = n => `<tr><td colspan="${n}" style="color:var(--mut);text-align:center;padding:16px">ยังไม่มีข้อมูล</td></tr>`;

function render() {
    const years = [...new Set(data.map(yr).filter(Boolean))].sort().reverse();
    if (curY !== "all" && !years.includes(curY)) curY = "all";
    $("y").innerHTML = '<option value="all">ทุกปี</option>' + years.map(y => `<option value="${y}">${+y + 543}</option>`).join(""); $("y").value = curY;
    const rows = data.filter(r => curY === "all" || yr(r) === curY), dir = $("s").value === "asc" ? 1 : -1;
    rows.sort((a, b) => a.d === b.d ? 0 : (a.d > b.d ? dir : -dir));
    let i = 0, o = 0; rows.forEach(r => isIn(r) ? i += amt(r) : o += amt(r));
    $("si").textContent = fmt(i); $("so").textContent = fmt(o);
    $("sn").textContent = fmt(i - o); $("sn").className = i >= o ? "in" : "out";

    const numCols = cols.filter(c => c.t === "num");
    $("cnt").textContent = rows.length + " รายการ" + numCols.map(c => " · " + Math.round(rows.reduce((s, r) => s + (+r[c.id] || 0), 0) * 100) / 100 + " " + c.n.replace(/^จำนวน/, "")).join("");
    $("tbl").style.minWidth = cols.length * 120 + 50 + "px";
    
    // Header ตารางพร้อมป้ายคำนวณ
    $("th").innerHTML = cols.map(c => `<th>
        <div style="display:flex;align-items:center;gap:4px">
            <span>${esc(c.n)}</span>
            ${c.c && c.c !== "none" ? `<span style="font-size:10px;padding:1px 4px;border-radius:4px;background:var(--ac);color:#fff">${c.c.toUpperCase()}</span>` : ""}
        </div>
    </th>`).join("") + "<th></th>";

    // แถวข้อมูล
    let tbodyHtml = rows.map(r => `<tr data-id="${r.id}">` + cols.map(c => `<td>${cell(c, r)}</td>`).join("") + '<td><button class="x" data-del="1" title="ลบรายการ">' + ic("x") + '</button></td></tr>').join("");

    // แถวคำนวณใต้ตาราง
    const hasCalc = cols.some(c => c.c && c.c !== "none");
    if (hasCalc && rows.length > 0) {
        tbodyHtml += `<tr id="calc-row" style="background:var(--bg);font-weight:bold;border-top:2px solid var(--bd)">` +
            cols.map(c => {
                if (!c.c || c.c === "none") return `<td></td>`;
                const vals = rows.map(r => +r[c.id] || 0);
                let res = 0;
                if (c.c === "sum") res = vals.reduce((a, b) => a + b, 0);
                else if (c.c === "avg") res = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                else if (c.c === "count") res = rows.filter(r => r[c.id] !== "" && r[c.id] !== undefined && r[c.id] !== null).length;
                else if (c.c === "min") res = vals.length ? Math.min(...vals) : 0;
                else if (c.c === "max") res = vals.length ? Math.max(...vals) : 0;
                const display = (c.t === "money") ? fmt(res) : (c.c === "count" ? res : fmtNum(res));
                return `<td><small style="color:var(--mut);display:block;font-size:11px">${CALC_NAMES[c.c] || c.c}</small><span style="color:var(--ac)">${display}</span></td>`;
            }).join("") + `<td></td></tr>`;
    }

    $("tb").innerHTML = tbodyHtml || empty(cols.length + 1);

    const G = cols.find(c => c.id === "n") || cols.find(c => c.t === "text" && c.id !== "t"), M = has("a"), r2 = v => Math.round(v * 100) / 100;
    const L = G && G.id === "n" ? cols.find(c => c.id === "ln") : null, gName = G ? G.n + (L ? " " + L.n : "") : "ชื่อ", gKey = r => G ? [r[G.id], L && r[L.id]].filter(Boolean).join(" ") : "";
    $("nh2").textContent = G ? "สรุปตาม" + gName : "สรุปตามชื่อ";
    const hdr = [gName, ...numCols.map(c => c.n), ...(M ? ["รายรับ", "รายจ่าย", "คงเหลือ"] : [])];
    $("nth").innerHTML = hdr.map((h, i) => `<th${i ? ' class="r"' : ""}>${esc(h)}</th>`).join("");
    const pn = {}; if (G) rows.forEach(r => { const k = gKey(r) || "(ไม่ระบุ)", p = pn[k] = pn[k] || { n: numCols.map(() => 0), i: 0, o: 0 }; numCols.forEach((c, j) => p.n[j] += +r[c.id] || 0); isIn(r) ? p.i += amt(r) : p.o += amt(r) });
    $("nt").innerHTML = Object.keys(pn).sort().map(k => { const p = pn[k], d = p.i - p.o; return `<tr><td>${esc(k)}</td>` + p.n.map(v => `<td class="r">${r2(v)}</td>`).join("") + (M ? `<td class="r in">${fmt(p.i)}</td><td class="r out">${fmt(p.o)}</td><td class="r ${d >= 0 ? "in" : "out"}">${fmt(d)}</td>` : "") + "</tr>" }).join("") || empty(hdr.length);
    $("nl").innerHTML = [...new Set(data.map(gKey).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join("");
    const by = {}; data.forEach(r => { const y = yr(r); if (!y) return; by[y] = by[y] || { i: 0, o: 0 }; isIn(r) ? by[y].i += amt(r) : by[y].o += amt(r) });
    let html = "", ti = 0, to = 0;
    Object.keys(by).sort().reverse().forEach(y => { const v = by[y]; ti += v.i; to += v.o; const d = v.i - v.o; html += `<tr><td>${+y + 543}</td><td class="r in">${fmt(v.i)}</td><td class="r out">${fmt(v.o)}</td><td class="r ${d >= 0 ? "in" : "out"}">${fmt(d)}</td></tr>` });
    if (html) html += `<tr><th>รวมทั้งหมด</th><th class="r in">${fmt(ti)}</th><th class="r out">${fmt(to)}</th><th class="r">${fmt(ti - to)}</th></tr>`;
    const D = cols.find(c => c.t === "date");
    $("yth").textContent = (D ? D.n : "ปี") + " (พ.ศ.)";
    $("yt").innerHTML = html || empty(4);
}
$("y").onchange = () => { curY = $("y").value; render() };
$("s").onchange = render;
$("tb").addEventListener("change", e => {
    const tr = e.target.closest("tr"), f = e.target.dataset.f; if (!tr || !f) return;
    const r = data.find(x => x.id === tr.dataset.id), c = cols.find(x => x.id === f); if (!r || !c) return;
    const v = e.target.value;
    if (c.t === "date") { const iso = e.target.dataset.p ? v : parseTh(v); if (iso) r[f] = iso; else popup("รูปแบบวันที่ไม่ถูกต้อง ใช้ วว/ดด/ปปปป") }
    else r[f] = c.t === "num" || c.t === "money" ? (v === "" ? "" : parseFloat(v) || 0) : v;
    render();
});
$("tb").addEventListener("click", async e => {
    if (!e.target.closest("[data-del]")) return;
    const id = e.target.closest("tr").dataset.id;
    if (!await popup("ลบรายการนี้?", { cancel: true, ok: "ลบ" })) return;
    data = data.filter(x => x.id !== id); render();
});
$("cl").onclick = async () => { if (data.length && await popup("ล้างข้อมูลทั้งหมด?", { cancel: true, ok: "ล้าง" })) { data = []; render() } };

// ---------- ส่งออก Excel พร้อมสูตรคำนวณจริง ----------
async function saveFile(name, buf) {
    let dl = null; try { dl = window.claude ? await claude.use("downloads") : null } catch (e) { }
    const type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (window.showSaveFilePicker) {
        try {
            const h = await showSaveFilePicker({ suggestedName: name, types: [{ description: "Excel (.xlsx)", accept: { [type]: [".xlsx"] } }] });
            const w = await h.createWritable(); await w.write(buf); await w.close(); return;
        } catch (e) { if (e && e.name === "AbortError") return; }
    }
    if (dl) { await dl.save({ filename: name, data: buf }); return }
    const blob = new Blob([buf], { type });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("ex").onclick = async () => {
    if (!data.length) { popup("ยังไม่มีข้อมูลให้ส่งออก"); return }
    if (typeof XLSX === "undefined") { popup("โหลดตัวสร้างไฟล์ Excel ไม่สำเร็จ"); return }
    const rows = [...data].sort((a, b) => a.d > b.d ? 1 : a.d < b.d ? -1 : 0);
    const showVal = (c, v) => c.t === "date" ? toTh(v) : c.t === "kind" ? (v === "in" ? "รายรับ" : "รายจ่าย") : (c.t === "money" || c.t === "num" ? (+v || 0) : (v ?? ""));

    // แถวคำนวณสรุป
    const sumRow = cols.map(c => {
        if (!c.c || c.c === "none") return "";
        const vals = rows.map(r => +r[c.id] || 0);
        if (c.c === "sum") return vals.reduce((a, b) => a + b, 0);
        if (c.c === "avg") return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
        if (c.c === "count") return rows.filter(r => r[c.id] !== "" && r[c.id] !== undefined).length;
        if (c.c === "min") return vals.length ? Math.min(...vals) : 0;
        if (c.c === "max") return vals.length ? Math.max(...vals) : 0;
        return "";
    });

    const s1 = XLSX.utils.aoa_to_sheet([
        cols.map(c => c.n),
        ...rows.map(r => cols.map(c => showVal(c, r[c.id]))),
        sumRow
    ]);

    // ฝังสูตร Excel จริง (Formula) ลงในแถวสรุป
    const sumRowIdx = rows.length + 1; // row index ใน sheet (0-indexed)
    const startRow = 2; // Excel row 2
    const endRow = rows.length + 1;

    cols.forEach((c, idx) => {
        if (!c.c || c.c === "none") return;
        const colLetter = XLSX.utils.encode_col(idx);
        const cellRef = `${colLetter}${sumRowIdx + 1}`;
        let formula = "";
        if (c.c === "sum") formula = `SUM(${colLetter}${startRow}:${colLetter}${endRow})`;
        else if (c.c === "avg") formula = `AVERAGE(${colLetter}${startRow}:${colLetter}${endRow})`;
        else if (c.c === "count") formula = `COUNTA(${colLetter}${startRow}:${colLetter}${endRow})`;
        else if (c.c === "min") formula = `MIN(${colLetter}${startRow}:${colLetter}${endRow})`;
        else if (c.c === "max") formula = `MAX(${colLetter}${startRow}:${colLetter}${endRow})`;
        if (formula && s1[cellRef]) {
            s1[cellRef].f = formula;
        }
    });

    s1["!cols"] = cols.map(c => ({ wch: Math.max(c.n.length * 2 + 4, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, s1, "รายการ");

    // Sheet สรุปการคำนวณ
    const calcReport = [["หัวข้อ", "ประเภท", "การคำนวณ", "ผลลัพธ์"]];
    cols.forEach(c => {
        if (c.c && c.c !== "none") {
            const vals = rows.map(r => +r[c.id] || 0);
            let res = 0;
            if (c.c === "sum") res = vals.reduce((a, b) => a + b, 0);
            else if (c.c === "avg") res = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            else if (c.c === "count") res = rows.filter(r => r[c.id] !== "" && r[c.id] !== undefined).length;
            else if (c.c === "min") res = vals.length ? Math.min(...vals) : 0;
            else if (c.c === "max") res = vals.length ? Math.max(...vals) : 0;
            calcReport.push([c.n, TL[c.t] || c.t, CALC_NAMES[c.c] || c.c, c.t === "money" ? fmt(res) : (c.c === "count" ? res : fmtNum(res))]);
        }
    });
    if (calcReport.length > 1) {
        const sCalc = XLSX.utils.aoa_to_sheet(calcReport);
        sCalc["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, sCalc, "รายงานการคำนวณ");
    }

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    try { await saveFile("รายรับ-รายจ่าย_คำนวณ.xlsx", buf) } catch (e) { if (e && e.code !== "declined") popup("บันทึกไฟล์ไม่สำเร็จ (" + (e.code || "error") + ")") }
};

// ---------- แชต: แยกข้อมูลลงตามหัวข้อและคำสั่งระบบ ----------
const conv = (c, v) => c.t === "date" ? parseTh(v) : c.t === "num" || c.t === "money" ? (parseFloat(String(v).replace(/[^\d.\-]/g, "")) || 0) : c.t === "kind" ? (/รับ|in/i.test(v) ? "in" : "out") : v;
const colOf = t => cols.find(c => c.t === t);
function fin(r) { const d = colOf("date"), k = colOf("kind"); if (d && !r[d.id]) r[d.id] = isoToday(); if (k && !r[k.id]) { const low = cols.filter(c => c.t === "text").map(c => r[c.id] || "").join(" ").toLowerCase(); r[k.id] = /รายรับ|ได้รับ|รับเงิน|รับ|เงินเข้า|โอนเข้า|ขายได้|เงินเดือน/.test(low) && !/รายจ่าย|จ่าย|ซื้อ/.test(low) ? "in" : "out" } return r }

function parseLine(line) {
    let s = line.trim(); const r = { id: uid() };
    cols.forEach(c => { const m = s.match(new RegExp(re(c.n) + "\\s*[:：=]\\s*([^,;|\\t]+)")); if (m) { r[c.id] = conv(c, m[1].trim()); s = s.replace(m[0], " ") } });
    cols.forEach(c => {
        if (r[c.id] !== undefined || !["text", "num", "money"].includes(c.t)) return;
        const m = s.match(new RegExp(re(c.n) + (c.t === "text" ? "\\s*([^\\s,;|\\t]+)" : "\\s*(-?\\d[\\d,]*(?:\\.\\d+)?)")));
        if (m) { r[c.id] = conv(c, m[1]); s = s.replace(m[0], " ") }
    });
    cols.forEach(c => {
        if (r[c.id] !== undefined) return;
        if (c.t === "date") { const m = s.match(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}/); if (m) { r[c.id] = parseTh(m[0]); s = s.replace(m[0], " ") } }
        else if (c.t === "num") { const u = c.n.replace(/^จำนวน/, "").trim(); const m = u && s.match(new RegExp("(\\d+)\\s*" + re(u))); if (m) { r[c.id] = +m[1]; s = s.replace(m[0], " ") } }
        else if (c.t === "text" && c.id !== "t") {
            const known = [...new Set(data.map(x => x[c.id]).filter(Boolean))].sort((a, b) => b.length - a.length).find(x => s.includes(x));
            if (known) { r[c.id] = known; s = s.replace(known, " ") }
            else if (c.id === "n") { const m = s.match(/(?:ชื่อ|โดย|คุณ)\s*([^\s\d]+)/); if (m) { r[c.id] = m[1]; s = s.replace(m[0], " ") } }
        }
    });
    const A = colOf("money"), K = colOf("kind"), low = line.toLowerCase();
    if (A && r[A.id] === undefined) {
        const nums = [...s.matchAll(/(?:฿\s*)?(\d[\d,]*(?:\.\d+)?)\s*(?:บาท|฿)?/g)];
        if (nums.length) {
            const p = nums.find(m => /บาท|฿/.test(m[0])) || nums[nums.length - 1];
            r[A.id] = parseFloat(p[1].replace(/,/g, ""));
            s = s.slice(0, p.index) + " " + s.slice(p.index + p[0].length);
        }
    }
    if (K && r[K.id] === undefined) {
        const ki = low.search(/รายรับ|ได้รับ|รับเงิน|รับ|เงินเข้า|โอนเข้า|ขายได้|เงินเดือน/), ko = low.search(/รายจ่าย|จ่าย|ชำระ|เงินออก|โอนออก|ซื้อ/);
        r[K.id] = ki >= 0 && (ko < 0 || ki < ko) ? "in" : "out";
    }
    const T = cols.find(c => c.id === "t");
    if (T && r.t === undefined) {
        const cleanT = s.replace(/(?<=^|\s)(?:รายรับ|รายจ่าย|ได้รับ|จ่าย|รับ|เป็นเงิน|บาท)(?=\s|$)/g, " ").replace(/\s+/g, " ").replace(/^[\s:\-–,]+|[\s:\-–,]+$/g, "");
        if (cleanT) r.t = cleanT;
    }
    const hasAny = cols.some(c => r[c.id] !== undefined && r[c.id] !== "");
    return hasAny ? fin(r) : null;
}

function parseCasual(line) {
    let s = line.trim();
    if (!s) return null;
    const r = { id: uid() };

    // 0. ทำความสะอาดตัวคั่นพิเศษ เช่น / - = @ | ให้เป็น space เพื่อตัดคำได้ง่าย
    let norm = s.replace(/\s*[\/=@|]\s*/g, " ");

    // 1. ตรวจจับเครื่องหมายนำหน้า + หรือ - เป็นประเภทรายรับ/รายจ่าย
    if (/^\+\s*\d/.test(norm)) {
        const kCol = colOf("kind");
        if (kCol) r[kCol.id] = "in";
        norm = norm.replace(/^\+\s*/, "");
    } else if (/^-\s*\d/.test(norm)) {
        const kCol = colOf("kind");
        if (kCol) r[kCol.id] = "out";
        norm = norm.replace(/^-\s*/, "");
    }

    // 2. ตรวจจับหัวข้อเดี่ยวแบบ Prefix เช่น "ชื่อ สมชาย", "นามสกุล มีดี", "รายการ กาแฟ", "จำนวนเงิน 500"
    for (const c of cols) {
        const m = norm.match(new RegExp(`^${re(c.n)}\\s*[:：=]?\\s*(.+)$`, "i"));
        if (m) {
            r[c.id] = conv(c, m[1].trim());
            return fin(r);
        }
    }

    // 3. ตรวจจับวันที่แบบคำสัมพัทธ์หรือรูปแบบวันที่ เช่น "วันนี้", "เมื่อวาน", "15/10/69", "15 ต.ค. 69"
    const dCol = colOf("date");
    if (dCol) {
        const dateWords = ["วันนี้", "เมื่อวานนี้", "เมื่อวาน", "พรุ่งนี้", "today", "yesterday"];
        for (const dw of dateWords) {
            const reg = new RegExp(`(?<=^|\\s)${dw}(?=\\s|$)`, "i");
            if (reg.test(norm)) {
                r[dCol.id] = parseTh(dw);
                norm = norm.replace(reg, " ").trim();
                break;
            }
        }
        if (!r[dCol.id]) {
            const mDate = norm.match(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/);
            if (mDate) {
                const parsed = parseTh(mDate[0]);
                if (parsed) {
                    r[dCol.id] = parsed;
                    norm = norm.replace(mDate[0], " ").trim();
                }
            }
        }
    }

    // 4. ตรวจจับจำนวนคน / ปริมาณพร้อมลักษณนาม (เช่น "3 คน", "2 แก้ว", "5 กล่อง")
    const cCol = cols.find(c => c.t === "num" || c.id === "c" || c.n.includes("คน") || c.n.includes("จำนวน"));
    if (cCol) {
        const mNumUnit = norm.match(/(\d+)\s*(คน|แก้ว|จาน|ชิ้น|กล่อง|ถุง|ขวด|อัน|หน่วย|แพ็ค|ชุด|รายการ)/);
        if (mNumUnit) {
            r[cCol.id] = parseFloat(mNumUnit[1]);
            norm = norm.replace(mNumUnit[0], " ").trim();
        }
    }

    // 5. ตรวจจับและดึงจำนวนเงิน (Money) หลากหลายรูปแบบ
    // เช่น "50 บาท", "50.-", "฿50", "ราคา 50", "ยอด 50", "50 บ.", หรือตัวเลขโดดๆ
    const aCol = colOf("money") || colOf("num");
    if (aCol && r[aCol.id] === undefined) {
        let mMoney = norm.match(/฿\s*(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s*(?:บาท|฿|\.-|บ\.)/);
        if (!mMoney) {
            mMoney = norm.match(/(?:ราคา|ยอด|เป็นเงิน|จ่าย|รับ|จำนวนเงิน)\s*[:=]?\s*(\d[\d,]*(?:\.\d+)?)/);
        }
        if (mMoney) {
            const valStr = mMoney[1] || mMoney[2];
            r[aCol.id] = parseFloat(valStr.replace(/,/g, "")) || 0;
            norm = norm.replace(mMoney[0], " ").trim();
        }
    }

    // 6. ตรวจจับประเภท รายรับ / รายจ่าย จากคำศัพท์
    const kCol = colOf("kind");
    if (kCol && r[kCol.id] === undefined) {
        const isIncome = /(?:รายรับ|ได้รับ|รับเงิน|รับ|เงินเข้า|โอนเข้า|ขายได้|เงินเดือน|โบนัส|กำไร|ถูกหวย)/.test(norm);
        const isExpense = /(?:รายจ่าย|จ่าย|ซื้อ|ค่า|กิน|เลี้ยง|โอนออก|เงินออก|ชำระ|เติมเงิน|ซ่อม|หมดไป)/.test(norm);
        if (isIncome && !isExpense) r[kCol.id] = "in";
        else if (isExpense) r[kCol.id] = "out";
    }

    // 7. ตรวจจับคำนำหน้าชื่อคน เช่น "โดย สมชาย", "จาก สมชาย", "คุณ สมชาย", "นาย สมชาย มีดี"
    const nameCol = cols.find(c => c.id === "n" || c.n.includes("ชื่อ"));
    const surCol = cols.find(c => c.id === "ln" || c.n.includes("สกุล"));
    if (nameCol) {
        const mPerson = norm.match(/(?:โดย|จาก|ให้|กับ|คุณ|นาย|นางสาว|นาง|พี่|น้อง)\s*([^\s\d]+)(?:\s+([^\s\d]+))?/);
        if (mPerson) {
            r[nameCol.id] = mPerson[1];
            if (mPerson[2] && surCol && !["บาท", "คน", "แก้ว", "จาน"].includes(mPerson[2])) {
                r[surCol.id] = mPerson[2];
            }
            norm = norm.replace(mPerson[0], " ").trim();
        }
    }

    // 8. จัดการ Token ที่เหลือ
    let tokens = norm.split(/[,，\t\s]+/).map(x => x.trim()).filter(Boolean);

    // ถ้ายังไม่ได้จำนวนเงิน และมี token ที่เป็นตัวเลขโดดๆ (เช่น "กาแฟ 50" หรือ "50 กาแฟ")
    if (aCol && r[aCol.id] === undefined) {
        const numIdx = tokens.findIndex(t => /^-?\d[\d,]*(?:\.\d+)?$/.test(t));
        if (numIdx >= 0) {
            r[aCol.id] = parseFloat(tokens[numIdx].replace(/,/g, "")) || 0;
            tokens.splice(numIdx, 1);
        }
    }

    const itemCol = cols.find(c => c.id === "t" || c.n.includes("รายการ") || c.n.includes("สินค้า"));
    const textCols = cols.filter(c => c.t === "text");

    // ทำความสะอาดคำเชื่อมใน token
    tokens = tokens.filter(t => !["ไป", "หมดไป", "รวมเป็นเงิน", "เป็นเงิน", "ทั้งสิ้น", "ยอดรวม", "ราคา", "จำนวนเงิน"].includes(t));

    if (tokens.length === 1) {
        if (r[aCol ? aCol.id : "a"] !== undefined && itemCol) {
            r[itemCol.id] = tokens[0];
        } else if (nameCol && !r[nameCol.id] && !itemCol) {
            r[nameCol.id] = tokens[0];
        } else if (itemCol && !r[itemCol.id]) {
            r[itemCol.id] = tokens[0];
        } else if (nameCol && !r[nameCol.id]) {
            r[nameCol.id] = tokens[0];
        } else {
            const emptyCol = textCols.find(c => r[c.id] === undefined);
            if (emptyCol) r[emptyCol.id] = tokens[0];
        }
    } else if (tokens.length === 2) {
        if (nameCol && surCol && !r[nameCol.id] && !r[surCol.id]) {
            r[nameCol.id] = tokens[0];
            r[surCol.id] = tokens[1];
        } else if (itemCol && nameCol && !r[itemCol.id] && !r[nameCol.id]) {
            r[itemCol.id] = tokens[0];
            r[nameCol.id] = tokens[1];
        } else {
            tokens.forEach((tok, i) => {
                const emptyCol = textCols.filter(c => r[c.id] === undefined)[i];
                if (emptyCol) r[emptyCol.id] = tok;
            });
        }
    } else if (tokens.length >= 3) {
        if (itemCol && nameCol && surCol && !r[itemCol.id] && !r[nameCol.id] && !r[surCol.id]) {
            r[itemCol.id] = tokens[0];
            r[nameCol.id] = tokens[1];
            r[surCol.id] = tokens[2];
        } else {
            tokens.forEach((tok, i) => {
                const emptyCol = textCols.filter(c => r[c.id] === undefined)[i];
                if (emptyCol) r[emptyCol.id] = tok;
            });
        }
    }

    const hasAny = cols.some(c => r[c.id] !== undefined && r[c.id] !== "");
    return hasAny ? fin(r) : null;
}

function parseTabs(ls) {
    if (!ls.every(l => l.includes("\t"))) return null;
    const rows = ls.map(l => l.split("\t")); if (!rows.every(p => p.length === cols.length)) return null;
    return rows.map(p => { const r = { id: uid() }; cols.forEach((c, i) => { if ((p[i] || "").trim()) r[c.id] = conv(c, p[i].trim()) }); return fin(r) });
}
function parseTable(ls) {
    const del = ls[0].includes("\t") ? "\t" : ",", map = ls[0].split(del).map(h => cols.find(c => c.n === h.trim()));
    if (map.filter(Boolean).length < 2) return null;
    return ls.slice(1).map(l => { const p = l.split(del), r = { id: uid() }; map.forEach((c, i) => { if (c && (p[i] || "").trim()) r[c.id] = conv(c, p[i].trim()) }); return fin(r) });
}

const NUM = /^฿?\s*-?\d[\d,]*(?:\.\d+)?\s*(?:บาท|฿|คน)?$/, KW = /^(รายรับ|รายจ่าย|รับ|จ่าย|in|out)$/i;
const accepts = (j, p) => { const c = cols[j]; return c.t === "date" ? !!parseTh(p) : c.t === "kind" ? KW.test(p) : c.t === "num" || c.t === "money" ? NUM.test(p) : !NUM.test(p) && !parseTh(p) && !(KW.test(p) && cols.slice(j + 1).some(k => k.t === "kind")) };
const splitCsv = line => { const o = []; line.split(/[,，]/).forEach(x => { if (o.length && /\d$/.test(o[o.length - 1]) && /^\d{3}(?!\d)/.test(x)) o[o.length - 1] += "," + x; else o.push(x) }); return o.map(x => x.trim()) };
function mapParts(parts) {
    const r = { id: uid() };
    if (parts.length === cols.length) parts.forEach((p, i) => { if (p) { const v = conv(cols[i], p); if (v !== null && v !== "") r[cols[i].id] = v } });
    else { let j = 0; for (const p of parts.filter(Boolean)) { while (j < cols.length && !accepts(j, p)) j++; if (j >= cols.length) return null; r[cols[j].id] = conv(cols[j], p); j++ } }
    const hasAny = cols.some(c => r[c.id] !== undefined && r[c.id] !== "");
    return hasAny ? fin(r) : null;
}
function parseSmart(line) {
    if (cols.some(c => new RegExp(re(c.n) + "\\s*[:：=]").test(line))) return null;
    let parts = null;
    if (/[,，]/.test(line)) { parts = splitCsv(line); if (parts.length < 2) parts = null }
    if (!parts && /\t/.test(line)) parts = line.split("\t").map(x => x.trim());
    if (!parts) { const t = line.split(" "); if (t.filter(Boolean).length > 1) parts = t }
    return parts ? mapParts(parts) : null;
}

const bulkCol = ls => ls.length > 1 ? cols.find(c => c.n === ls[0].replace(/[:：]\s*$/, "").trim()) : null;
function planCol(c, vals) {
    const dir = $("s").value === "asc" ? 1 : -1;
    const empties = data.filter(r => curY === "all" || yr(r) === curY).sort((a, b) => a.d === b.d ? 0 : (a.d > b.d ? dir : -dir)).filter(r => r[c.id] === undefined || r[c.id] === "");
    const fills = [], news = [], bad = [];
    vals.forEach(v => { const cv = conv(c, v); if (cv === null || cv === "") { bad.push(v); return } if (empties.length) fills.push([empties.shift(), cv]); else news.push(fin({ id: uid(), [c.id]: cv })) });
    return { fills, news, bad };
}

const bubbleH = (h, who) => { const d = document.createElement("div"); d.className = "b " + who; d.innerHTML = h; $("log").appendChild(d); $("log").scrollTop = $("log").scrollHeight };
const bubble = (txt, who) => bubbleH(esc(txt).replace(/\n/g, "<br>"), who);
const show = (c, v) => c.t === "date" ? toTh(v) : c.t === "kind" ? (v === "in" ? "รับ" : "จ่าย") : c.t === "money" ? fmt(v) : v;
const csvVal = (c, v) => isBlank(v) ? "" : c.t === "date" ? toTh(v) : c.t === "kind" ? (v === "in" ? "รายรับ" : "รายจ่าย") : String(v).replace(/[,，\t\n]+/g, " ").trim();
const toCsv = rows => [cols.map(c => c.n.replace(/[,，]/g, " ")).join(", "), ...rows.map(r => cols.map(c => csvVal(c, r[c.id])).join(", "))].join("\n");
const grow = () => { const t = $("ci"); t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight + 2, innerHeight * .4) + "px" };
$("ci").addEventListener("input", grow);
const isBlank = v => v === undefined || v === null || v === "";
const keyOf = r => cols.map(c => r[c.id] ?? "").join("\u0001");
const rowLine = (r, dup) => "• " + cols.map(c => isBlank(r[c.id]) ? hl(`${esc(c.n)}: ว่าง`, "err") : `${esc(c.n)}: ${esc(show(c, r[c.id]))}`).join(" · ") + (dup ? " " + hl(ic("warn") + " ซ้ำกับรายการเดิม", "err") : " " + hl("ใหม่", "ok"));

function askConfirm(o) {
    const d = document.createElement("div"); d.className = "b s";
    d.innerHTML = `<div>${o.head}</div><div class="pv">${o.lines.join("<br>")}</div>${o.csv ? `<div class="pv">ระบบใส่ , คั่นให้แล้ว (กด "แก้ไข" เพื่อนำกลับไปแก้ได้):</div><div class="csv">${esc(o.csv.split("\n").slice(0, 9).join("\n"))}${o.csv.split("\n").length > 9 ? "\n…" : ""}</div>` : ""}<div class="acts"></div>`;
    const acts = d.querySelector(".acts");
    const btn = (t, cls, fn) => { const b = document.createElement("button"); b.innerHTML = t; if (cls) b.className = cls; b.onclick = () => { if (d.dataset.done) return; d.dataset.done = 1; acts.remove(); fn() }; acts.appendChild(b) };
    btn(ic("check") + " ยืนยันเพิ่ม", "p", () => o.apply(false));
    if (o.dup) btn("เพิ่มเฉพาะที่ไม่ซ้ำ", "", () => o.apply(true));
    btn(ic("edit") + " แก้ไข", "", () => { $("ci").value = o.csv || o.orig; grow(); $("ci").focus(); bubbleH(ic("edit") + " ยกเลิกแล้ว ใส่ข้อความกลับในช่องให้แก้ไข" + (o.csv ? " (แบบคั่นด้วย , แล้ว)" : ""), "s") });
    $("log").appendChild(d); $("log").scrollTop = $("log").scrollHeight;
}
function checkRows(rows) {
    const miss = rows.map(r => cols.filter(c => isBlank(r[c.id])).map(c => c.n)), full = miss.filter(m => !m.length).length, names = [...new Set(miss.flat())];
    return ic("search") + " ตรวจสอบ: กรอกครบทุกหัวข้อ " + hl(full + " รายการ", "ok") + (rows.length > full ? " · ยังมีช่องว่าง " + hl(`${rows.length - full} รายการ (${esc(names.join(", "))})`, "warn") + " แก้ในตารางได้" : "") + `<br>ข้อมูลทั้งหมดตอนนี้ ${hl(data.length + " รายการ")}`;
}

function send() {
    const v = $("ci").value.trim(); if (!v) return;
    bubble(v, "u"); $("ci").value = ""; grow();
    const ls = v.split(/\n+/).map(x => x.trim()).filter(Boolean), bad = [];

    // --- ตรวจคำสั่งสร้าง/เพิ่มหัวข้อผ่านแชท ---
    const addColMatch = ls[0].match(/^(?:สร้างหัวข้อ|เพิ่มหัวข้อ|เพิ่มคอลัมน์|สร้างคอลัมน์)\s*[:]?\s*(.+)$/i);
    if (addColMatch) {
        const raw = addColMatch[1].trim();
        if (raw.includes(",")) {
            const names = raw.split(",").map(s => s.trim()).filter(Boolean);
            names.forEach(n => addColumnDirect(n));
            bubbleH(`${ic("ok")} เพิ่มหัวข้อใหม่ <b>${names.length} หัวข้อ</b> (${esc(names.join(", "))}) เรียบร้อยแล้ว`, "s");
            return;
        }
        const parts = raw.split(/\s+/);
        const name = parts[0];
        let t = guessType(name), calc = guessCalc(t);
        const typeMap = { "ข้อความ": "text", "text": "text", "ตัวเลข": "num", "num": "num", "วันที่": "date", "date": "date", "เงิน": "money", "จำนวนเงิน": "money", "money": "money", "ประเภท": "kind", "kind": "kind" };
        const calcMap = { "sum": "sum", "รวม": "sum", "avg": "avg", "เฉลี่ย": "avg", "count": "count", "นับ": "count", "min": "min", "ต่ำสุด": "min", "max": "max", "สูงสุด": "max", "none": "none", "ไม่คำนวณ": "none" };
        for (let i = 1; i < parts.length; i++) {
            const p = parts[i].toLowerCase();
            if (typeMap[p]) t = typeMap[p];
            if (calcMap[p]) calc = calcMap[p];
        }
        addColumnDirect(name, t, calc);
        bubbleH(`${ic("ok")} เพิ่มหัวข้อ <b>"${esc(name)}"</b> (${TL[t]}, การคำนวณ: <b>${CALC_NAMES[calc]}</b>) ลงในทุกจุดแล้ว`, "s");
        return;
    }

    // --- ตรวจคำสั่งลด/ลบหัวข้อผ่านแชท ---
    const remColMatch = ls[0].match(/^(?:ลบหัวข้อ|ลดหัวข้อ|ลบคอลัมน์|ลดคอลัมน์)\s*[:]?\s*(.+)$/i);
    if (remColMatch) {
        const raw = remColMatch[1].trim();
        const names = raw.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
        const rems = [];
        names.forEach(n => {
            const r = removeColumnDirect(n);
            if (r) rems.push(r);
        });
        if (rems.length) {
            bubbleH(`${ic("ok")} ปรับลดและลบหัวข้อ <b>"${esc(rems.join('", "'))}"</b> ออกจากทุกจุดแล้ว`, "s");
        } else {
            bubbleH(`${ic("warn")} ไม่พบหัวข้อ "${esc(raw)}"`, "s");
        }
        return;
    }

    // --- ตรวจคำสั่งตั้งค่าการคำนวณผ่านแชท ---
    const calcMatch = ls[0].match(/^(?:คำนวณ|ตั้งค่าคำนวณ|ให้หัวข้อ|ให้)\s+(.+?)\s+(?:เป็น|=|แบบ|หา|:)\s*(.+)$/i);
    if (calcMatch) {
        const colName = calcMatch[1].replace(/หัวข้อ/g, "").trim();
        const calcWord = calcMatch[2].trim().toLowerCase();
        const calcMap = { "sum": "sum", "รวม": "sum", "ผลรวม": "sum", "avg": "avg", "เฉลี่ย": "avg", "ค่าเฉลี่ย": "avg", "count": "count", "นับ": "count", "min": "min", "ต่ำสุด": "min", "max": "max", "สูงสุด": "max", "none": "none", "ไม่คำนวณ": "none" };
        const cType = calcMap[calcWord];
        const target = cols.find(c => c.n.toLowerCase() === colName.toLowerCase() || c.id === colName);
        if (target && cType) {
            target.c = cType;
            renderHead();
            render();
            bubbleH(`${ic("ok")} ตั้งค่าหัวข้อ <b>"${esc(target.n)}"</b> ให้คำนวณแบบ <b>${CALC_NAMES[cType]}</b> (จะใส่สูตรลงใน Excel ด้วย)`, "s");
            return;
        }
    }

    // --- ตรวจการวางข้อมูลชุดใหญ่พร้อมระบุหลายหัวข้อ (Multi-column Bulk) ---
    const bulkMatch = ls[0].match(/^(?:หัวข้อ|คอลัมน์)\s*[:=]\s*(.+)$/i);
    if (bulkMatch && ls.length > 1) {
        const headerNames = bulkMatch[1].split(/[,，\t]/).map(s => s.trim()).filter(Boolean);
        headerNames.forEach(n => addColumnDirect(n));
        const targetCols = headerNames.map(n => cols.find(c => c.n.toLowerCase() === n.toLowerCase())).filter(Boolean);
        const newRows = [];
        ls.slice(1).forEach(line => {
            const parts = line.split(/[,，\t]/).map(s => s.trim());
            const r = { id: uid() };
            targetCols.forEach((c, idx) => {
                if (parts[idx] !== undefined) r[c.id] = conv(c, parts[idx]);
            });
            newRows.push(fin(r));
        });
        if (newRows.length) {
            data.push(...newRows);
            render();
            bubbleH(`${ic("ok")} นำเข้าข้อมูลสำเร็จ! จัดลง <b>${targetCols.length} หัวข้อ</b> จำนวน <b>${newRows.length} แถว</b>`, "s");
            return;
        }
    }

    // --- การเติมหัวข้อเดียวทีละมากๆ (bulkCol) ---
    const bc = bulkCol(ls);
    if (bc) {
        const p = planCol(bc, ls.slice(1)), who = r => esc([toTh(r.d), r.t].filter(Boolean).join(" ") || "แถวเดิม");
        if (p.fills.length || p.news.length) askConfirm({
            head: `ตรวจแล้ว หัวข้อ "${esc(bc.n)}": ใส่ช่องว่างของแถวเดิม ${hl(p.fills.length + " ช่อง", "ok")} · เพิ่มแถวใหม่ ${hl(p.news.length + " แถว", "ok")}`, orig: v,
            lines: [...p.fills.slice(0, 8).map(([r, cv]) => `• เติม ${esc(show(bc, cv))} ${ic("arrow")} ${who(r)}`), ...p.news.slice(0, 4).map(r => `• แถวใหม่: ${esc(bc.n)}: ${esc(show(bc, r[bc.id]))}`), ...(p.fills.length + p.news.length > 12 ? [`…และอีกหลายรายการ`] : [])],
            apply: () => {
                p.fills.forEach(([r, cv]) => r[bc.id] = cv); data.push(...p.news); curY = "all"; render();
                const left = data.filter(r => isBlank(r[bc.id])).length;
                bubbleH(`${ic("ok")} เติมช่องว่าง ${hl(p.fills.length + " ช่อง", "ok")} · เพิ่มแถวใหม่ ${hl(p.news.length + " แถว", "ok")}<br>${ic("search")} ตรวจสอบ: หัวข้อ "${esc(bc.n)}" ` + (left ? hl(`ยังว่าง ${left} ช่อง`, "warn") : hl("กรอกครบทุกแถวแล้ว", "ok")) + `<br>ข้อมูลทั้งหมดตอนนี้ ${hl(data.length + " รายการ")}`, "s");
            }
        });
        if (p.bad.length) bubbleH(`${ic("warn")} ${hl(`อ่านไม่ได้ ${p.bad.length} ค่า`, "err")}: ${esc(p.bad.slice(0, 5).join(", "))}`, "s");
        return;
    }

    let ok = ls.length > 1 ? parseTable(ls) : null;
    if (!ok) ok = parseTabs(ls);
    if (!ok) {
        ok = [];
        ls.forEach(l => {
            const r = parseSmart(l) || parseLine(l) || parseCasual(l);
            r ? ok.push(r) : bad.push(l);
        });
    }
    if (ok.length) {
        const seen = new Set(data.map(keyOf)), dups = ok.map(r => seen.has(keyOf(r))), nd = dups.filter(Boolean).length;
        askConfirm({
            head: `ตรวจแล้ว แยกตามหัวข้อได้ ${hl(ok.length + " รายการ", "ok")}` + (nd ? ` (${hl("ซ้ำกับของเดิม " + nd, "err")})` : "") + " — ทวนก่อนเพิ่ม:", orig: v, csv: toCsv(ok), dup: nd > 0 && nd < ok.length,
            lines: [...ok.slice(0, 8).map((r, i) => rowLine(r, dups[i])), ...(ok.length > 8 ? [`…และอีก ${ok.length - 8} รายการ`] : [])],
            apply: only => {
                const add = only ? ok.filter((r, i) => !dups[i]) : ok; if (!add.length) return;
                data.push(...add); curY = "all"; render();
                bubbleH(`${ic("ok")} เพิ่มแล้ว ${hl(add.length + " รายการ", "ok")}` + (only && nd ? ` (ข้ามที่ซ้ำ ${hl(nd, "warn")})` : "") + "<br>" + checkRows(add), "s");
            }
        });
    }
    if (bad.length) { $("ci").value = bad.join("\n"); grow(); popup(`อ่านไม่ได้ ${bad.length} บรรทัด\nใส่กลับในช่องให้แก้แล้ว`) }
}
$("cs").onclick = send;
$("ci").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing && matchMedia("(pointer:fine)").matches) { e.preventDefault(); send() } });
addEventListener("beforeunload", e => { if (data.length) { e.preventDefault(); e.returnValue = "" } });

renderHead();
render();