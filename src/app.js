const $ = id => document.getElementById(id);
        let data = [];
        const fmt = n => Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const yr = r => (r.d || "").slice(0, 4);
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
            { id: "c", n: "จำนวนคน", t: "num" }, { id: "k", n: "ประเภท", t: "kind" }, { id: "a", n: "จำนวนเงิน", t: "money" }
        ];
        const LOCK = ["d", "k", "a"], TL = { date: "วันที่", text: "ข้อความ", num: "ตัวเลข", money: "จำนวนเงิน", kind: "รายรับ/รายจ่าย" };
        const re = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const isoToday = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}` };
        function renderHead() {
            $("hl").innerHTML = cols.map(c => `<span class="hd" title="${TL[c.t]}"><input data-id="${c.id}" value="${esc(c.n)}" style="width:${Math.max(80, c.n.length * 11 + 30)}px">${LOCK.includes(c.id) ? "" : `<button class="x" data-del="${c.id}">✕</button>`}</span>`).join("");
        }
        $("add").onclick = () => {
            const n = $("hn").value.trim();
            if (!n) { popup("กรุณาตั้งชื่อหัวข้อ"); return }
            if (cols.some(c => c.n === n)) { popup(`มีหัวข้อ "${n}" อยู่แล้ว`); return }
            cols.push({ id: "c" + uid(), n, t: $("ht").value }); $("hn").value = ""; renderHead(); render();
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
            if (c.t === "num" || c.t === "money") return `<input type="number" ${f} value="${v ?? ""}" placeholder="*" step="any" class="${c.t === "money" ? r.k : ""}">`;
            return `<input ${f} placeholder="*" value="${esc(v)}">`;
        };
        const empty = n => `<tr><td colspan="${n}" style="color:var(--mut);text-align:center;padding:16px">ยังไม่มีข้อมูล</td></tr>`;
        function render() {
            const years = [...new Set(data.map(yr).filter(Boolean))].sort().reverse();
            if (curY !== "all" && !years.includes(curY)) curY = "all";
            $("y").innerHTML = '<option value="all">ทุกปี</option>' + years.map(y => `<option value="${y}">${+y + 543}</option>`).join(""); $("y").value = curY;
            const rows = data.filter(r => curY === "all" || yr(r) === curY), dir = $("s").value === "asc" ? 1 : -1;
            rows.sort((a, b) => a.d === b.d ? 0 : (a.d > b.d ? dir : -dir));
            let i = 0, o = 0; rows.forEach(r => r.k === "in" ? i += +r.a || 0 : o += +r.a || 0);
            $("si").textContent = fmt(i); $("so").textContent = fmt(o);
            $("sn").textContent = fmt(i - o); $("sn").className = i >= o ? "in" : "out";
            $("cnt").textContent = rows.length + " รายการ" + (cols.some(c => c.id === "c") ? " · " + rows.reduce((s, r) => s + (+r.c || 0), 0) + " คน" : "");
            $("tbl").style.minWidth = cols.length * 120 + 50 + "px";
            $("th").innerHTML = cols.map(c => `<th>${esc(c.n)}</th>`).join("") + "<th></th>";
            $("tb").innerHTML = rows.map(r => `<tr data-id="${r.id}">` + cols.map(c => `<td>${cell(c, r)}</td>`).join("") + '<td><button class="x" data-del="1">✕</button></td></tr>').join("") || empty(cols.length + 1);
            const pn = {}; rows.forEach(r => { const k = r.n || "(ไม่ระบุชื่อ)", p = pn[k] = pn[k] || { c: 0, i: 0, o: 0 }; p.c += +r.c || 0; r.k === "in" ? p.i += +r.a || 0 : p.o += +r.a || 0 });
            $("nt").innerHTML = Object.keys(pn).sort().map(k => { const p = pn[k], d = p.i - p.o; return `<tr><td>${esc(k)}</td><td class="r">${p.c}</td><td class="r in">${fmt(p.i)}</td><td class="r out">${fmt(p.o)}</td><td class="r ${d >= 0 ? "in" : "out"}">${fmt(d)}</td></tr>` }).join("") || empty(5);
            $("nl").innerHTML = [...new Set(data.map(r => r.n).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join("");
            const by = {}; data.forEach(r => { const y = yr(r); if (!y) return; by[y] = by[y] || { i: 0, o: 0 }; r.k === "in" ? by[y].i += +r.a || 0 : by[y].o += +r.a || 0 });
            let html = "", ti = 0, to = 0;
            Object.keys(by).sort().reverse().forEach(y => { const v = by[y]; ti += v.i; to += v.o; const d = v.i - v.o; html += `<tr><td>${+y + 543}</td><td class="r in">${fmt(v.i)}</td><td class="r out">${fmt(v.o)}</td><td class="r ${d >= 0 ? "in" : "out"}">${fmt(d)}</td></tr>` });
            if (html) html += `<tr><th>รวมทั้งหมด</th><th class="r in">${fmt(ti)}</th><th class="r out">${fmt(to)}</th><th class="r">${fmt(ti - to)}</th></tr>`;
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
            const by = {}; rows.forEach(r => { const y = yr(r); if (!y) return; by[y] = by[y] || { i: 0, o: 0 }; r.k === "in" ? by[y].i += +r.a || 0 : by[y].o += +r.a || 0 });
            const ys = Object.keys(by).sort(); let ti = 0, to = 0; ys.forEach(y => { ti += by[y].i; to += by[y].o });
            const sum = ys.length ? [[], ["สรุปยอดรายปี"], ["ปี (พ.ศ.)", "รายรับ", "รายจ่าย", "คงเหลือ"], ...ys.map(y => [+y + 543, by[y].i, by[y].o, by[y].i - by[y].o]), ["รวมทั้งหมด", ti, to, ti - to]] : [];
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
        function parseTable(ls) {
            const del = ls[0].includes("\t") ? "\t" : ",", map = ls[0].split(del).map(h => cols.find(c => c.n === h.trim()));
            if (map.filter(Boolean).length < 2) return null;
            return ls.slice(1).map(l => { const p = l.split(del), r = { id: uid() }; map.forEach((c, i) => { if (c && (p[i] || "").trim()) r[c.id] = conv(c, p[i].trim()) }); return fin(r) });
        }
        const bubble = (txt, who) => { const d = document.createElement("div"); d.className = "b " + who; d.innerHTML = esc(txt).replace(/\n/g, "<br>"); $("log").appendChild(d); $("log").scrollTop = $("log").scrollHeight };
        const show = (c, v) => c.t === "date" ? toTh(v) : c.t === "kind" ? (v === "in" ? "รับ" : "จ่าย") : c.t === "money" ? fmt(v) : v;
        function send() {
            const v = $("ci").value.trim(); if (!v) return;
            bubble(v, "u"); $("ci").value = "";
            const ls = v.split(/\n+/).map(x => x.trim()).filter(Boolean), bad = [];
            let ok = ls.length > 1 ? parseTable(ls) : null;
            if (!ok) { ok = []; ls.forEach(l => { const r = parseLine(l); r ? ok.push(r) : bad.push(l) }) }
            data.push(...ok);
            if (ok.length) {
                curY = "all"; render();
                bubble(`เพิ่ม ${ok.length} รายการ แยกตามหัวข้อ:\n` + ok.slice(0, 8).map(r => "• " + cols.filter(c => r[c.id] !== undefined && r[c.id] !== "").map(c => `${c.n}: ${show(c, r[c.id])}`).join(" · ")).join("\n") + (ok.length > 8 ? `\n…และอีก ${ok.length - 8} รายการ` : "") + "\nแก้ไขในตารางได้เลย", "s");
            }
            if (bad.length) { $("ci").value = bad.join("\n"); popup(`อ่านไม่ได้ ${bad.length} บรรทัด (ไม่พบจำนวนเงิน)\nใส่กลับในช่องให้แก้แล้ว`) }
        }
        $("cs").onclick = send;
        $("ci").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing && matchMedia("(pointer:fine)").matches) { e.preventDefault(); send() } });
        addEventListener("beforeunload", e => { if (data.length) { e.preventDefault(); e.returnValue = "" } });
        renderHead(); render();
