const $ = id => document.getElementById(id);
let data = [];
const fmt = n => Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const has = id => cols.some(c => c.id === id);
const yr = r => has("d") ? (r.d || "").slice(0, 4) : "";
const amt = r => has("a") ? (+r.a || 0) : 0;
const isIn = r => has("k") && r.k === "in";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const toTh = iso => { const p = (iso || "").split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${+p[0] + 543}` : "" };
const parseTh = s => { const m = (s || "").trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/); if (!m) return null; let y = +m[3]; if (y > 2400) y -= 543; const mo = +m[2], d = +m[1], dt = new Date(y, mo - 1, d); if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null; return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
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
    { id: "d", n: "วันที่", t: "date" }, { id: "t", n: "รายการ", t: "text" }, { id: "n", n: "ชื่อ", t: "text" },
    { id: "ln", n: "นามสกุล", t: "text" }, { id: "c", n: "จำนวนคน", t: "num" }, { id: "a", n: "จำนวนเงิน", t: "money" }
];
const TL = { date: "วันที่", text: "ข้อความ", num: "ตัวเลข", money: "จำนวนเงิน", kind: "รายรับ/รายจ่าย" };
const re = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isoToday = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}` };
function renderHead() {
    $("hl").innerHTML = cols.map(c => `<span class="hd" data-cid="${c.id}" title="${TL[c.t]}"><button class="x" data-del="${c.id}" title="ลบหัวข้อ">✕</button><span class="gr" title="ลากเพื่อจัดลำดับ">⋮⋮</span><input data-id="${c.id}" value="${esc(c.n)}" style="width:${Math.max(80, c.n.length * 11 + 30)}px"></span>`).join("");
}
// ลากวางด้วย Pointer Events (ใช้ได้ทั้งเมาส์และจอสัมผัส) ลากจากที่จับ ⋮⋮
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
$("add").onclick = () => {
    const n = $("hn").value.trim();
    if (!n) { popup("กรุณาตั้งชื่อหัวข้อ"); return }
    if (cols.some(c => c.n === n)) { popup(`มีหัวข้อ "${n}" อยู่แล้ว`); return }
    const t = $("ht").value;
    if (["date", "kind", "money"].includes(t) && cols.some(c => c.t === t)) { popup(`มีหัวข้อประเภท "${TL[t]}" อยู่แล้ว`); return }
    const pref = { date: ["d"], kind: ["k"], money: ["a"], num: ["c"], text: ["t", "n"] }[t] || [];
    cols.push({ id: pref.find(x => !has(x)) || "c" + uid(), n, t }); $("hn").value = ""; renderHead(); render();
};
$("hn").addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) $("add").click() });
$("hl").addEventListener("change", e => {
    const c = cols.find(x => x.id === e.target.dataset.id); if (!c) return;
    const n = e.target.value.trim();
    if (!n || cols.some(x => x !== c && x.n === n)) { popup(n ? `มีหัวข้อ "${n}" อยู่แล้ว` : "ชื่อหัวข้อต้องไม่ว่าง"); e.target.value = c.n; return }
    c.n = n; renderHead(); render();
});
$("hl").addEventListener("click", async e => {
    const c = cols.find(x => x.id === e.target.dataset.del); if (!c) return;
    if (!await popup(`ลบหัวข้อ "${c.n}"?`, { cancel: true, ok: "ลบ" })) return;
    cols = cols.filter(x => x !== c); renderHead(); render();
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
    $("th").innerHTML = cols.map(c => `<th>${esc(c.n)}</th>`).join("") + "<th></th>";
    $("tb").innerHTML = rows.map(r => `<tr data-id="${r.id}">` + cols.map(c => `<td>${cell(c, r)}</td>`).join("") + '<td><button class="x" data-del="1">✕</button></td></tr>').join("") || empty(cols.length + 1);
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
    if (!e.target.dataset.del) return;
    const id = e.target.closest("tr").dataset.id;
    if (!await popup("ลบรายการนี้?", { cancel: true, ok: "ลบ" })) return;
    data = data.filter(x => x.id !== id); render();
});
$("cl").onclick = async () => { if (data.length && await popup("ล้างข้อมูลทั้งหมด?", { cancel: true, ok: "ล้าง" })) { data = []; render() } };

// ---------- ส่งออก Excel ----------
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
    const show = (c, v) => c.t === "date" ? toTh(v) : c.t === "kind" ? (v === "in" ? "รายรับ" : "รายจ่าย") : (v ?? "");
    const by = {}; rows.forEach(r => { const y = yr(r); if (!y) return; by[y] = by[y] || { i: 0, o: 0 }; isIn(r) ? by[y].i += amt(r) : by[y].o += amt(r) });
    const ys = Object.keys(by).sort(); let ti = 0, to = 0; ys.forEach(y => { ti += by[y].i; to += by[y].o });
    const sum = ys.length ? [[], ["สรุปยอดรายปี"], [((cols.find(c => c.t === "date") || {}).n || "ปี") + " (พ.ศ.)", "รายรับ", "รายจ่าย", "คงเหลือ"], ...ys.map(y => [+y + 543, by[y].i, by[y].o, by[y].i - by[y].o]), ["รวมทั้งหมด", ti, to, ti - to]] : [];
    const s1 = XLSX.utils.aoa_to_sheet([cols.map(c => c.n), ...rows.map(r => cols.map(c => show(c, r[c.id]))), ...sum]);
    s1["!cols"] = cols.map(() => ({ wch: 16 }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, s1, "รายการ");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    try { await saveFile("รายรับ-รายจ่าย.xlsx", buf) } catch (e) { if (e && e.code !== "declined") popup("บันทึกไฟล์ไม่สำเร็จ (" + (e.code || "error") + ")") }
};

// ---------- แชต: แยกข้อมูลลงตามหัวข้อ ----------
const conv = (c, v) => c.t === "date" ? parseTh(v) : c.t === "num" || c.t === "money" ? (parseFloat(v.replace(/[^\d.\-]/g, "")) || 0) : c.t === "kind" ? (/รับ|in/i.test(v) ? "in" : "out") : v;
const colOf = t => cols.find(c => c.t === t);
function fin(r) { const d = colOf("date"), k = colOf("kind"); if (d && !r[d.id]) r[d.id] = isoToday(); if (k && !r[k.id]) { const low = cols.filter(c => c.t === "text").map(c => r[c.id] || "").join(" ").toLowerCase(); r[k.id] = /รายรับ|ได้รับ|รับเงิน|รับ|เงินเข้า|โอนเข้า|ขายได้|เงินเดือน/.test(low) && !/รายจ่าย|จ่าย|ซื้อ/.test(low) ? "in" : "out" } return r }
function parseLine(line) {
    let s = line.trim(); const r = { id: uid() };
    cols.forEach(c => { const m = s.match(new RegExp(re(c.n) + "\\s*[:：=]\\s*([^,;|\\t]+)")); if (m) { r[c.id] = conv(c, m[1].trim()); s = s.replace(m[0], " ") } });
    // หัวข้อที่เพิ่มเอง: รองรับ "ชื่อหัวข้อ ค่า" แม้ไม่มี : เช่น "หมายเหตุ ฝากซื้อ" "น้ำหนัก 5"
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
        const nums = [...s.matchAll(/(?:฿\s*)?(\d[\d,]*(?:\.\d+)?)\s*(?:บาท|฿)?/g)]; if (!nums.length) return null;
        const p = nums.find(m => /บาท|฿/.test(m[0])) || nums[nums.length - 1];
        r[A.id] = parseFloat(p[1].replace(/,/g, "")); s = s.slice(0, p.index) + " " + s.slice(p.index + p[0].length);
    }
    if (K && r[K.id] === undefined) {
        const ki = low.search(/รายรับ|ได้รับ|รับเงิน|รับ|เงินเข้า|โอนเข้า|ขายได้|เงินเดือน/), ko = low.search(/รายจ่าย|จ่าย|ชำระ|เงินออก|โอนออก|ซื้อ/);
        r[K.id] = ki >= 0 && (ko < 0 || ki < ko) ? "in" : "out";
    }
    const T = cols.find(c => c.id === "t");
    if (T && r.t === undefined) r.t = s.replace(/(?<=^|\s)(?:รายรับ|รายจ่าย|ได้รับ|จ่าย|รับ|เป็นเงิน|บาท)(?=\s|$)/g, " ").replace(/\s+/g, " ").replace(/^[\s:\-–,]+|[\s:\-–,]+$/g, "") || line.trim();
    return fin(r);
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
// ---------- แยกตามตำแหน่งคอลัมน์ (ลูกน้ำ / เว้นวรรคหลายตัว / แท็บ / เว้นวรรคเท่าจำนวนหัวข้อ) ----------
const NUM = /^฿?\s*-?\d[\d,]*(?:\.\d+)?\s*(?:บาท|฿|คน)?$/, KW = /^(รายรับ|รายจ่าย|รับ|จ่าย|in|out)$/i;
const accepts = (j, p) => { const c = cols[j]; return c.t === "date" ? !!parseTh(p) : c.t === "kind" ? KW.test(p) : c.t === "num" || c.t === "money" ? NUM.test(p) : !NUM.test(p) && !parseTh(p) && !(KW.test(p) && cols.slice(j + 1).some(k => k.t === "kind")) };
const splitCsv = line => { const o = []; line.split(/[,，]/).forEach(x => { if (o.length && /\d$/.test(o[o.length - 1]) && /^\d{3}(?!\d)/.test(x)) o[o.length - 1] += "," + x; else o.push(x) }); return o.map(x => x.trim()) };
function mapParts(parts) {
    const r = { id: uid() };
    if (parts.length === cols.length) parts.forEach((p, i) => { if (p) { const v = conv(cols[i], p); if (v !== null && v !== "") r[cols[i].id] = v } });
    else { let j = 0; for (const p of parts.filter(Boolean)) { while (j < cols.length && !accepts(j, p)) j++; if (j >= cols.length) return null; r[cols[j].id] = conv(cols[j], p); j++ } }
    const A = colOf("money"); if (A && r[A.id] === undefined) return null;
    return fin(r);
}
function parseSmart(line) {
    if (cols.some(c => new RegExp(re(c.n) + "\\s*[:：=]").test(line))) return null;
    let parts = null;
    if (/[,，]/.test(line)) { parts = splitCsv(line); if (parts.length < 2) parts = null }
    if (!parts && /\t/.test(line)) parts = line.split("\t").map(x => x.trim());
    if (!parts) { const t = line.split(" "); if (t.filter(Boolean).length > 1) parts = t } // เว้นวรรค 1 ครั้ง = ลูกน้ำ 1 ตัว
    return parts ? mapParts(parts) : null;
}
// เติมหัวข้อเดียวทีละมากๆ: บรรทัดแรกเป็นชื่อหัวข้อ (ใส่ : ท้ายได้) บรรทัดต่อไปเป็นค่า
const bulkCol = ls => ls.length > 1 ? cols.find(c => c.n === ls[0].replace(/[:：]\s*$/, "").trim()) : null;
function planCol(c, vals) {
    const dir = $("s").value === "asc" ? 1 : -1;
    const empties = data.filter(r => curY === "all" || yr(r) === curY).sort((a, b) => a.d === b.d ? 0 : (a.d > b.d ? dir : -dir)).filter(r => r[c.id] === undefined || r[c.id] === "");
    const fills = [], news = [], bad = [];
    vals.forEach(v => { const cv = conv(c, v); if (cv === null || cv === "") { bad.push(v); return } if (empties.length) fills.push([empties.shift(), cv]); else news.push(fin({ id: uid(), [c.id]: cv })) });
    return { fills, news, bad };
}
const bubble = (txt, who) => { const d = document.createElement("div"); d.className = "b " + who; d.innerHTML = esc(txt).replace(/\n/g, "<br>"); $("log").appendChild(d); $("log").scrollTop = $("log").scrollHeight };
const show = (c, v) => c.t === "date" ? toTh(v) : c.t === "kind" ? (v === "in" ? "รับ" : "จ่าย") : c.t === "money" ? fmt(v) : v;
const csvVal = (c, v) => isBlank(v) ? "" : c.t === "date" ? toTh(v) : c.t === "kind" ? (v === "in" ? "รายรับ" : "รายจ่าย") : String(v).replace(/[,，\t\n]+/g, " ").trim();
const toCsv = rows => [cols.map(c => c.n.replace(/[,，]/g, " ")).join(", "), ...rows.map(r => cols.map(c => csvVal(c, r[c.id])).join(", "))].join("\n");
const isBlank = v => v === undefined || v === null || v === "";
const keyOf = r => cols.map(c => r[c.id] ?? "").join("\u0001");
const rowLine = (r, dup) => "• " + cols.map(c => isBlank(r[c.id]) ? `<span class="out">${esc(c.n)}: ว่าง</span>` : `${esc(c.n)}: ${esc(show(c, r[c.id]))}`).join(" · ") + (dup ? ' <b class="out">⚠ ซ้ำกับรายการเดิม</b>' : " <small>ใหม่</small>");
function askConfirm(o) {
    const d = document.createElement("div"); d.className = "b s";
    d.innerHTML = `<div>${o.head}</div><div class="pv">${o.lines.join("<br>")}</div>${o.csv ? `<div class="pv">ระบบใส่ , คั่นให้แล้ว (กด "แก้ไข" เพื่อนำกลับไปแก้ได้):</div><div class="csv">${esc(o.csv.split("\n").slice(0, 9).join("\n"))}${o.csv.split("\n").length > 9 ? "\n…" : ""}</div>` : ""}<div class="acts"></div>`;
    const acts = d.querySelector(".acts");
    const btn = (t, cls, fn) => { const b = document.createElement("button"); b.textContent = t; if (cls) b.className = cls; b.onclick = () => { if (d.dataset.done) return; d.dataset.done = 1; acts.remove(); fn() }; acts.appendChild(b) };
    btn("✓ ยืนยันเพิ่ม", "p", () => o.apply(false));
    if (o.dup) btn("เพิ่มเฉพาะที่ไม่ซ้ำ", "", () => o.apply(true));
    btn("✎ แก้ไข", "", () => { $("ci").value = o.csv || o.orig; $("ci").focus(); bubble("ยกเลิกแล้ว ใส่ข้อความกลับในช่องให้แก้ไข" + (o.csv ? " (แบบคั่นด้วย , แล้ว)" : "") + "", "s") });
    $("log").appendChild(d); $("log").scrollTop = $("log").scrollHeight;
}
function checkRows(rows) {
    const miss = rows.map(r => cols.filter(c => isBlank(r[c.id])).map(c => c.n)), full = miss.filter(m => !m.length).length, names = [...new Set(miss.flat())];
    return "🔍 ตรวจสอบ: กรอกครบทุกหัวข้อ " + full + " รายการ" + (rows.length > full ? ` · ยังมีช่องว่าง ${rows.length - full} รายการ (${names.join(", ")}) แก้ในตารางได้` : "") + `\nข้อมูลทั้งหมดตอนนี้ ${data.length} รายการ`;
}
function send() {
    const v = $("ci").value.trim(); if (!v) return;
    bubble(v, "u"); $("ci").value = "";
    const ls = v.split(/\n+/).map(x => x.trim()).filter(Boolean), bad = [];
    const bc = bulkCol(ls);
    if (bc) {
        const p = planCol(bc, ls.slice(1)), who = r => esc([toTh(r.d), r.t].filter(Boolean).join(" ") || "แถวเดิม");
        if (p.fills.length || p.news.length) askConfirm({
            head: `ตรวจแล้ว หัวข้อ "${esc(bc.n)}": ใส่ช่องว่างของแถวเดิม ${p.fills.length} ช่อง · เพิ่มแถวใหม่ ${p.news.length} แถว`, orig: v,
            lines: [...p.fills.slice(0, 8).map(([r, cv]) => `• เติม ${esc(show(bc, cv))} → ${who(r)}`), ...p.news.slice(0, 4).map(r => `• แถวใหม่: ${esc(bc.n)}: ${esc(show(bc, r[bc.id]))}`), ...(p.fills.length + p.news.length > 12 ? [`…และอีกหลายรายการ`] : [])],
            apply: () => {
                p.fills.forEach(([r, cv]) => r[bc.id] = cv); data.push(...p.news); curY = "all"; render();
                const left = data.filter(r => isBlank(r[bc.id])).length;
                bubble(`✅ เติมช่องว่าง ${p.fills.length} ช่อง · เพิ่มแถวใหม่ ${p.news.length} แถว\n🔍 ตรวจสอบ: หัวข้อ "${bc.n}" ` + (left ? `ยังว่าง ${left} ช่อง` : "กรอกครบทุกแถวแล้ว") + `\nข้อมูลทั้งหมดตอนนี้ ${data.length} รายการ`, "s");
            }
        });
        if (p.bad.length) bubble(`อ่านไม่ได้ ${p.bad.length} ค่า: ${p.bad.slice(0, 5).join(", ")}`, "s");
        return;
    }
    let ok = ls.length > 1 ? parseTable(ls) : null;
    if (!ok) ok = parseTabs(ls);
    if (!ok) { ok = []; ls.forEach(l => { const r = parseSmart(l) || parseLine(l); r ? ok.push(r) : bad.push(l) }) }
    if (ok.length) {
        const seen = new Set(data.map(keyOf)), dups = ok.map(r => seen.has(keyOf(r))), nd = dups.filter(Boolean).length;
        askConfirm({
            head: `ตรวจแล้ว แยกตามหัวข้อได้ ${ok.length} รายการ` + (nd ? ` (ซ้ำกับของเดิม ${nd})` : "") + " — ทวนก่อนเพิ่ม:", orig: v, csv: toCsv(ok), dup: nd > 0 && nd < ok.length,
            lines: [...ok.slice(0, 8).map((r, i) => rowLine(r, dups[i])), ...(ok.length > 8 ? [`…และอีก ${ok.length - 8} รายการ`] : [])],
            apply: only => {
                const add = only ? ok.filter((r, i) => !dups[i]) : ok; if (!add.length) return;
                data.push(...add); curY = "all"; render();
                bubble(`✅ เพิ่มแล้ว ${add.length} รายการ` + (only && nd ? ` (ข้ามที่ซ้ำ ${nd})` : "") + "\n" + checkRows(add), "s");
            }
        });
    }
    if (bad.length) { $("ci").value = bad.join("\n"); popup(`อ่านไม่ได้ ${bad.length} บรรทัด (ไม่พบจำนวนเงิน)\nใส่กลับในช่องให้แก้แล้ว`) }
}
$("cs").onclick = send;
$("ci").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing && matchMedia("(pointer:fine)").matches) { e.preventDefault(); send() } });
addEventListener("beforeunload", e => { if (data.length) { e.preventDefault(); e.returnValue = "" } });
renderHead(); render();