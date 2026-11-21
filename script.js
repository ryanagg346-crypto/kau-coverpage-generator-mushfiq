(function () {
  "use strict";

  var FACULTIES = window.KAU_FACULTIES;
  var INFO = window.KAU_INFO;
  var STORE_KEY = "kau-cover-v2";
  var OLD_STORE_KEY = "kau-cover-v1";
  var PAGE_W = 794;
  var PAGE_H = 1122;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    form: $("form"),
    faculty: $("faculty"),
    department: $("department"),
    docType: $("docType"),
    topic: $("topic"),
    courseCode: $("courseCode"),
    courseTitle: $("courseTitle"),
    performDate: $("performDate"),
    submitDate: $("submitDate"),
    teacherName: $("teacherName"),
    designation: $("designation"),
    teacherFaculty: $("teacherFaculty"),
    teacherDept: $("teacherDept"),
    studentName: $("studentName"),
    program: $("program"),
    programOther: $("programOther"),
    programOtherWrap: $("programOtherWrap"),
    level: $("level"),
    semester: $("semester"),
    studentId: $("studentId"),
    regNo: $("regNo"),
    session: $("session"),
    downloadBtn: $("downloadBtn"),
    resetBtn: $("resetBtn"),
    status: $("status"),
    sheet: $("sheet"),
    scaler: $("sheetScaler"),
    scroll: $("previewScroll"),
    designationList: $("designationList"),
    _unused: null
  };

  var teacherFacultyTouched = false;
  var lastAutoProgram = "";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function clean(s) { return String(s || "").trim(); }

  /* dates are typed as dd/mm/yyyy */
  function fmtDate(v) { return clean(v); }

  // Accept old saved values (yyyy-mm-dd) and convert them.
  function normDate(v) {
    v = clean(v);
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? m[3] + "/" + m[2] + "/" + m[1] : v;
  }

  function maskDate(e) {
    var input = e.target;
    var digits = input.value.replace(/\D/g, "").slice(0, 8);
    var out = digits;
    if (digits.length > 4) out = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    else if (digits.length > 2) out = digits.slice(0, 2) + "/" + digits.slice(2);
    if (input.value !== out) input.value = out;
  }

  function facultyById(id) {
    for (var i = 0; i < FACULTIES.length; i++) if (FACULTIES[i].id === id) return FACULTIES[i];
    return FACULTIES[0];
  }

  function fillSelect(select, items, getValue, getLabel, selected) {
    select.innerHTML = "";
    items.forEach(function (item) {
      var o = document.createElement("option");
      o.value = getValue(item);
      o.textContent = getLabel(item);
      select.appendChild(o);
    });
    if (selected != null) select.value = selected;
  }

  function fillDepartments(select, faculty, withNone) {
    var items = faculty.departments.slice();
    var opts = withNone ? [""].concat(items) : items;
    fillSelect(
      select,
      opts,
      function (d) { return d; },
      function (d) { return d === "" ? "None" : d; },
      opts[0]
    );
  }

  function setStatus(msg) { el.status.textContent = msg || ""; }

  /* ---------- storage ---------- */
  function readForm() {
    return {
      faculty: el.faculty.value,
      department: el.department.value,
      docType: el.docType.value,
      topic: el.topic.value,
      courseCode: el.courseCode.value,
      courseTitle: el.courseTitle.value,
      performDate: el.performDate.value,
      submitDate: el.submitDate.value,
      teacherName: el.teacherName.value,
      designation: el.designation.value,
      teacherFaculty: el.teacherFaculty.value,
      teacherDept: el.teacherDept.value,
      studentName: el.studentName.value,
      program: getProgram(),
      level: el.level.value,
      semester: el.semester.value,
      studentId: el.studentId.value,
      regNo: el.regNo.value,
      session: el.session.value,
      _tft: teacherFacultyTouched
    };
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(readForm())); } catch (e) { /* storage may be blocked */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
      // Older version auto-filled today's date; keep the other saved fields but clear the date.
      var old = localStorage.getItem(OLD_STORE_KEY);
      if (old) {
        var o = JSON.parse(old);
        o.submitDate = "";
        return o;
      }
      return null;
    } catch (e) { return null; }
  }

  /* ---------- setup ---------- */
  function init() {
    // Logo is embedded in data.js, so no separate image file is needed.
    var topLogo = document.querySelector(".topbar-logo");
    if (topLogo) topLogo.src = window.KAU_LOGO;
    var fav = document.querySelector('link[rel="icon"]');
    if (fav) fav.href = window.KAU_LOGO;

    buildProgramSelect();
    fillSelect(el.faculty, FACULTIES, function (f) { return f.id; }, function (f) { return f.name; });
    fillSelect(el.teacherFaculty, FACULTIES, function (f) { return f.id; }, function (f) { return f.name; });
    fillSelect(el.docType, window.DOC_TYPES, function (t) { return t; }, function (t) { return t; });

    window.DESIGNATIONS.forEach(function (d) {
      var o = document.createElement("option");
      o.value = d;
      el.designationList.appendChild(o);
    });

    var saved = load();
    if (saved) {
      applyValues(saved);
    } else {
      applyDefaults();
    }

    bind();
    render();
    fitPreview();
  }

  function applyDefaults() {
    el.faculty.value = "aeas";
    onFacultyChange(true);
    el.teacherFaculty.value = el.faculty.value;
    fillDepartments(el.teacherDept, facultyById(el.teacherFaculty.value), false);
    el.docType.value = "Assignment";
    el.submitDate.value = "";
    el.level.value = "1";
    el.semester.value = "I";
  }

  function applyValues(v) {
    el.faculty.value = v.faculty || "aeas";
    fillDepartments(el.department, facultyById(el.faculty.value), true);
    updateProgramList();
    if (v.department != null) el.department.value = v.department;

    el.teacherFaculty.value = v.teacherFaculty || el.faculty.value;
    fillDepartments(el.teacherDept, facultyById(el.teacherFaculty.value), false);
    if (v.teacherDept) el.teacherDept.value = v.teacherDept;
    teacherFacultyTouched = !!v._tft;

    el.docType.value = v.docType || "Assignment";
    el.topic.value = v.topic || "";
    el.courseCode.value = v.courseCode || "";
    el.courseTitle.value = v.courseTitle || "";
    el.performDate.value = normDate(v.performDate);
    el.submitDate.value = normDate(v.submitDate);
    el.teacherName.value = v.teacherName || "";
    el.designation.value = v.designation || "";
    el.studentName.value = v.studentName || "";
    setProgram(v.program || "");
    el.level.value = v.level || "1";
    el.semester.value = v.semester || "I";
    el.studentId.value = v.studentId || "";
    el.regNo.value = v.regNo || "";
    el.session.value = v.session || "";
  }

  var OTHER = "__other__";

  function buildProgramSelect() {
    var sel = el.program;
    sel.innerHTML = "";
    var first = document.createElement("option");
    first.value = "";
    first.textContent = "Select program";
    sel.appendChild(first);
    var seen = {};
    FACULTIES.forEach(function (f) {
      var g = document.createElement("optgroup");
      g.label = f.name;
      f.programs.forEach(function (p) {
        if (seen[p]) return;
        seen[p] = true;
        var o = document.createElement("option");
        o.value = p;
        o.textContent = p;
        g.appendChild(o);
      });
      if (g.children.length) sel.appendChild(g);
    });
    var other = document.createElement("option");
    other.value = OTHER;
    other.textContent = "Other (type your own)";
    sel.appendChild(other);
  }

  function toggleOther() {
    var on = el.program.value === OTHER;
    el.programOtherWrap.hidden = !on;
  }

  function getProgram() {
    return el.program.value === OTHER ? el.programOther.value : el.program.value;
  }

  function setProgram(val) {
    val = clean(val);
    var found = false;
    for (var i = 0; i < el.program.options.length; i++) {
      if (el.program.options[i].value === val && val !== OTHER) { found = true; break; }
    }
    if (found || val === "") {
      el.program.value = val;
      el.programOther.value = "";
    } else {
      el.program.value = OTHER;
      el.programOther.value = val;
    }
    toggleOther();
  }

  function updateProgramList() { /* programs are listed once, see buildProgramSelect */ }

  function allPrograms() {
    var out = [];
    FACULTIES.forEach(function (f) { out = out.concat(f.programs); });
    return out;
  }

  function onFacultyChange(isInit) {
    var f = facultyById(el.faculty.value);
    fillDepartments(el.department, f, true);
    updateProgramList();

    // Suggest the program for this faculty unless the user typed something custom.
    var cur = clean(getProgram());
    var isAuto = cur === "" || cur === lastAutoProgram;
    if (isAuto && f.programs.length) {
      setProgram(f.programs[0]);
      lastAutoProgram = f.programs[0];
    }

    if (!teacherFacultyTouched) {
      el.teacherFaculty.value = f.id;
      fillDepartments(el.teacherDept, facultyById(f.id), false);
    }
    if (isInit) return;
  }

  function bind() {
    el.faculty.addEventListener("change", function () { onFacultyChange(false); render(); save(); });

    el.teacherFaculty.addEventListener("change", function () {
      teacherFacultyTouched = true;
      fillDepartments(el.teacherDept, facultyById(el.teacherFaculty.value), false);
      render(); save();
    });

    el.performDate.addEventListener("input", maskDate);
    el.submitDate.addEventListener("input", maskDate);
    el.program.addEventListener("change", toggleOther);
    el.form.addEventListener("input", function () { render(); save(); });
    el.form.addEventListener("change", function () { render(); save(); });
    el.form.addEventListener("submit", function (e) { e.preventDefault(); });

    el.downloadBtn.addEventListener("click", downloadPdf);
    el.resetBtn.addEventListener("click", resetAll);

    window.addEventListener("resize", fitPreview);
    if (window.ResizeObserver) new ResizeObserver(fitPreview).observe(el.scroll);
  }

  function resetAll() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    el.form.reset();
    teacherFacultyTouched = false;
    lastAutoProgram = "";
    setProgram("");
    applyDefaults();
    el.topic.value = "";
    el.courseCode.value = "";
    el.courseTitle.value = "";
    el.performDate.value = "";
    el.teacherName.value = "";
    el.designation.value = "";
    el.studentName.value = "";
    el.studentId.value = "";
    el.regNo.value = "";
    el.session.value = "";
    render();
    setStatus("Form reset.");
  }

  /* ---------- preview ---------- */
  function fitPreview() {
    var w = el.scroll.clientWidth;
    if (!w) return;
    var scale = Math.min(1, w / PAGE_W);
    el.scaler.style.transform = "scale(" + scale + ")";
    el.scroll.style.height = Math.round(PAGE_H * scale) + "px";
  }

  function line(text, cls) {
    return text ? '<div' + (cls ? ' class="' + cls + '"' : "") + ">" + esc(text) + "</div>" : "";
  }

  function uniLines() {
    return "<div>" + esc(INFO.name) + ",<br />" + esc(INFO.address.split(",")[0]) + "</div>";
  }

  function sheetHTML(v) {
    var fac = facultyById(v.faculty);
    var tFac = facultyById(v.teacherFaculty);
    var docType = clean(v.docType) || "Assignment";
    var topic = clean(v.topic);
    var code = clean(v.courseCode);
    var title = clean(v.courseTitle);
    var perform = fmtDate(v.performDate) || "dd/mm/yyyy";
    var submit = fmtDate(v.submitDate) || "dd/mm/yyyy";
    var dept = clean(v.department);
    var footer = [code, title].filter(Boolean).join("  \u2022  ");

    var h = "";
    // header
    h += '<div class="hdr' + (dept ? " has-dept" : "") + '">';
    h += '<img class="hdr-bg" src="' + window.KAU_COVER_BG + '" alt="" />';
    h += '<svg class="hdr-lines" width="794" height="452" viewBox="0 0 794 452" xmlns="http://www.w3.org/2000/svg">';
    h += '<line x1="0" y1="443" x2="794" y2="398.5" stroke="#bf993f" stroke-width="3.5" />';
    h += '<line x1="0" y1="448.5" x2="794" y2="404" stroke="#1d7434" stroke-width="2.2" />';
    h += "</svg>";
    h += '<div class="ring"></div><div class="disc"></div>';
    h += '<img class="logo" src="' + window.KAU_COVER_LOGO + '" alt="" />';
    h += '<div class="hline uni">' + esc(INFO.name.toUpperCase()) + "</div>";
    h += '<div class="hline faculty-line">' + esc(fac.name) + "</div>";
    if (dept) h += '<div class="hline dept-line">' + esc(dept) + "</div>";
    h += '<div class="hline addr-line">' + esc(INFO.address) + "</div>";
    h += '<div class="orn"><i></i><b></b><i></i></div>';
    h += "</div>";

    // title + card
    h += '<div class="body">';
    h += '<h2 class="doc-type">' + esc(docType) + "</h2>";
    h += '<div class="orn sm"><i></i><b></b><i></i></div>';
    h += '<p class="topic' + (topic ? "" : " empty") + '">' + esc(topic) + "</p>";
    h += '<div class="card"><div class="gbar"></div><div class="vline"></div><div class="hline2"></div>';
    h += '<div class="cell c1"><span class="lbl">Course Title</span><span class="val">' + esc(title) + "</span></div>";
    h += '<div class="cell c2"><span class="lbl">Course Code</span><span class="val">' + esc(code) + "</span></div>";
    h += '<div class="cell c1 r2"><span class="lbl">Date of Performance</span><span class="val">' + esc(perform) + "</span></div>";
    h += '<div class="cell c2 r2"><span class="lbl">Date of Submission</span><span class="val">' + esc(submit) + "</span></div>";
    h += "</div>";

    // people
    var to = "";
    to += line(clean(v.designation));
    to += line(v.teacherDept);
    to += line(tFac.name);
    to += uniLines();

    var by = "";
    by += line(clean(v.program));
    by += line("Level - " + v.level + ", Semester - " + v.semester);
    if (clean(v.studentId)) by += line("ID: " + clean(v.studentId));
    if (clean(v.regNo)) by += line("Reg. No: " + clean(v.regNo));
    if (clean(v.session)) by += line("Session: " + clean(v.session));
    by += line(fac.name);
    by += uniLines();

    h += '<div class="people">';
    h += '<div class="person to"><div class="role">Assigned By</div><div class="rule"></div><div class="pname">' +
      esc(clean(v.teacherName) || "Teacher Name") + '</div><div class="pbar"></div><div class="plines">' + to + "</div></div>";
    h += '<div class="person by"><div class="role">Submitted By</div><div class="rule"></div><div class="pname">' +
      esc(clean(v.studentName) || "Student Name") + '</div><div class="pbar"></div><div class="plines">' + by + "</div></div>";
    h += "</div></div>";

    // footer
    h += '<div class="foot-gold"></div><div class="foot-green"></div>';
    h += '<div class="foot"><span>' + esc(footer || "Course Code  \u2022  Course Title") + "</span></div>";
    return h;
  }

  function render() {
    el.sheet.innerHTML = sheetHTML(readForm());
  }

  /* ---------- PDF ---------- */
  function safeName(s) {
    return clean(s).replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function downloadPdf() {
    if (typeof window.html2pdf !== "function") {
      setStatus("The PDF library did not load. Check your internet connection and reload the page.");
      return;
    }
    var v = readForm();
    var parts = [safeName(v.docType), safeName(v.courseCode), safeName(v.studentName)].filter(Boolean);
    var filename = (parts.join("_") || "KAU_Cover_Page") + ".pdf";

    el.downloadBtn.disabled = true;
    setStatus("Creating PDF...");

    // Render an unscaled copy off-screen so the PDF is always full A4 size.
    var holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-10000px;top:0;width:" + PAGE_W + "px;height:" + PAGE_H + "px;";
    var copy = document.createElement("div");
    copy.className = "sheet";
    copy.innerHTML = sheetHTML(v);
    holder.appendChild(copy);
    document.body.appendChild(holder);

    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready
      .then(function () {
        return window.html2pdf()
          .set({
            margin: 0,
            filename: filename,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 3,
              useCORS: true,
              backgroundColor: "#ffffff",
              scrollX: 0,
              scrollY: 0,
              windowWidth: PAGE_W
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
          })
          .from(copy)
          .save();
      })
      .then(function () { setStatus("Downloaded " + filename); })
      .catch(function (err) {
        console.error(err);
        setStatus("Could not create the PDF. Please try again.");
      })
      .then(function () {
        document.body.removeChild(holder);
        el.downloadBtn.disabled = false;
      });
  }

  init();
})();
