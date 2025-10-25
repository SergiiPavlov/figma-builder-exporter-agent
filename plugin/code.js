figma.showUI(__html__, { width: 520, height: 640 });

function checkTaskSpec(spec) {
  var need = ["target", "grid", "sections"];
  for (var i=0;i<need.length;i++){ var k=need[i]; if(!(k in spec)) return "Нет обязательного поля: "+k; }
  if (!spec.target || !spec.target.fileId) return "target.fileId пустой";
  if (!spec.target.pageName) return "target.pageName пустой";
  if (!spec.sections || !spec.sections.length) return "sections пустой";
  if (!spec.grid || spec.grid.container == null || spec.grid.columns == null || spec.grid.gap == null)
    return "grid должен содержать container/columns/gap";
  return null;
}

function findOrCreatePage(name) {
  var pages = figma.root.children;
  for (var i=0;i<pages.length;i++){ var n=pages[i]; if(n.type==="PAGE" && n.name===name) return n; }
  var p = figma.createPage(); p.name = name; return p;
}

function parsePadding(pad) {
  if (!pad || !pad.length) return { t:0,r:0,b:0,l:0 };
  if (pad.length===2){ var v=pad[0], h=pad[1]; return { t:v,r:h,b:v,l:h }; }
  if (pad.length===3){ return { t:pad[0], r:pad[1], b:pad[2], l:pad[1] }; }
  return { t:pad[0], r:pad[1], b:pad[2], l:pad[3] };
}
function val(x, d){ return (x===undefined || x===null) ? d : x; }

function createRootFrame(spec, page) {
  var name = spec.target.frameName || "Root";
  var root = page.findOne(function(n){ return n.type==="FRAME" && n.name===name; });
  if (!root) { root = figma.createFrame(); root.name = name; page.appendChild(root); }

  var container = spec.grid && spec.grid.container != null ? spec.grid.container : 1200;
  var margins   = spec.grid && spec.grid.margins   != null ? spec.grid.margins   : 24;
  var width  = (spec.target && spec.target.frameSize && spec.target.frameSize.w) ? spec.target.frameSize.w : (container + margins*2);
  var height = (spec.target && spec.target.frameSize && spec.target.frameSize.h) ? spec.target.frameSize.h : 10;

  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "FIXED";
  root.counterAxisAlignItems = "CENTER";
  root.itemSpacing = 24;

  root.paddingLeft = margins;
  root.paddingRight = margins;
  root.paddingTop = 0;
  root.paddingBottom = 0;

  root.x = 0; root.y = 0;
  root.resize(width, height);
  return root;
}

function buildSections(root, spec) {
  var gap = spec.grid && spec.grid.gap != null ? spec.grid.gap : 24;
  var innerWidth = root.width - (root.paddingLeft + root.paddingRight);

  for (var i=0;i<(spec.sections||[]).length;i++){
    var section = spec.sections[i];
    var s = figma.createFrame();
    s.name = section.name || section.type || "section";

    var p = parsePadding(section.padding || []);
    s.paddingTop=p.t; s.paddingRight=p.r; s.paddingBottom=p.b; s.paddingLeft=p.l;

    s.primaryAxisSizingMode = "AUTO";
    s.counterAxisSizingMode = "FIXED";
    s.counterAxisAlignItems = "MIN";
    s.itemSpacing = val(section.spacing, 0);

    s.layoutMode = "VERTICAL";
    s.resize(innerWidth, 10);
    root.appendChild(s);

    if (section.layout && String(section.layout).indexOf("grid-")===0){
      var n = parseInt(String(section.layout).split("-")[1] || "3", 10);
      s.layoutMode = "HORIZONTAL";
      s.itemSpacing = gap;

      var available = innerWidth - gap * (n - 1);
      var colW = Math.max(10, Math.floor(available / n));

      for (var j=0;j<n;j++){
        var col = figma.createFrame();
        col.name = s.name + "/col-" + (j+1);
        col.layoutMode = "VERTICAL";
        col.primaryAxisSizingMode = "AUTO";
        col.counterAxisSizingMode = "FIXED";
        col.resize(colW, 10);
        s.appendChild(col);
      }
    }
  }
}

// -------- Export helpers --------
function absBounds(n){
  var t = n.absoluteTransform; // [[a,b,tx],[c,d,ty]]
  var x = t[0][2], y = t[1][2];
  return { x:x, y:y, w:n.width, h:n.height };
}
function firstSolid(paints){
  try{
    if (!Array.isArray(paints)) return undefined;
    var p = null;
    for (var i=0;i<paints.length;i++){ if(paints[i].type==="SOLID"){ p=paints[i]; break; } }
    if (!p) return undefined;
    var r = Math.round(p.color.r*255);
    var g = Math.round(p.color.g*255);
    var b = Math.round(p.color.b*255);
    var a = (p.opacity != null ? p.opacity : 1);
    return "rgba("+r+", "+g+", "+b+", "+a+")";
  }catch(e){ return undefined; }
}
function extractAutoLayout(frame){
  if (!("layoutMode" in frame)) return undefined;
  return {
    layoutMode: frame.layoutMode || "NONE",
    itemSpacing: frame.itemSpacing != null ? frame.itemSpacing : 0,
    padding: {
      t: frame.paddingTop    != null ? frame.paddingTop    : 0,
      r: frame.paddingRight  != null ? frame.paddingRight  : 0,
      b: frame.paddingBottom != null ? frame.paddingBottom : 0,
      l: frame.paddingLeft   != null ? frame.paddingLeft   : 0
    }
  };
}
function extractStyles(n){
  var s = {};
  if ("fills" in n)   s.fill   = firstSolid(n.fills);
  if ("strokes" in n) s.stroke = firstSolid(n.strokes);
  if (n.type === "TEXT"){
    try{
      if (typeof n.fontName === "object" && n.fontName && "family" in n.fontName) s.fontFamily = n.fontName.family;
      if (typeof n.fontSize === "number") s.fontSize = n.fontSize;
      if (n.lineHeight && typeof n.lineHeight === "object" && "unit" in n.lineHeight){
        var lh = n.lineHeight;
        s.lineHeight = lh.unit === "PIXELS" ? (lh.value+"px") : String(lh.unit).toLowerCase();
      }
    }catch(e){}
  }
  if (!Object.keys(s).length) return undefined;
  return s;
}

function pushRecursive(node, acc, sectionName){
  var base = {
    id: node.id, name: node.name, type: node.type,
    absBounds: absBounds(node), section: sectionName
  };
  var al = extractAutoLayout(node); if (al) base.autoLayout = al;
  var st = extractStyles(node);     if (st) base.styles     = st;

  acc.push(base);
  if ("children" in node && Array.isArray(node.children)){
    for (var i=0;i<node.children.length;i++){
      pushRecursive(node.children[i], acc, sectionName);
    }
  }
}
function collectFromRoot(root){
  var out = [];
  out.push({ id: root.id, name: root.name, type: root.type, absBounds: absBounds(root), autoLayout: extractAutoLayout(root) });
  for (var i=0;i<(root.children||[]).length;i++){ var sec=root.children[i]; pushRecursive(sec, out, sec.name); }
  return out;
}
function exportSpecFrom(root, spec){
  return {
    target: { fileId: spec.target.fileId, pageName: spec.target.pageName, frameId: root.id, frameName: root.name },
    nodes: collectFromRoot(root),
    summary: { warnings: [], deviations: [] }
  };
}

// -------- Validator (deviations & warnings) --------
function findSectionSpec(spec, name){
  var secs = spec.sections || [];
  for (var i=0;i<secs.length;i++){
    var s = secs[i];
    if ((s.name && s.name===name) || (s.type && s.type===name)) return s;
  }
  return null;
}
function addDev(list, nodeId, field, expected, actual, section){
  var delta = actual - expected;
  list.push({ nodeId: nodeId, field: field, expected: expected, actual: actual, delta: delta, section: section });
}
function validateDeviations(root, spec, exportSpec){
  var tol = (spec.acceptance && typeof spec.acceptance.maxSpacingDeviation==="number") ? spec.acceptance.maxSpacingDeviation : 2;
  var kids = root.children || [];
  for (var i=0;i<kids.length;i++){
    var k = kids[i];
    var sSpec = findSectionSpec(spec, k.name);
    if (!sSpec) continue;

    // spacing
    if (typeof sSpec.spacing === "number"){
      var actualSpacing = k.itemSpacing != null ? k.itemSpacing : 0;
      if (Math.abs(actualSpacing - sSpec.spacing) > tol){
        addDev(exportSpec.summary.deviations, k.id, "itemSpacing", sSpec.spacing, actualSpacing, k.name);
      }
    }
    // padding
    var expP = parsePadding(sSpec.padding || []);
    var actP = {
      t: k.paddingTop    != null ? k.paddingTop    : 0,
      r: k.paddingRight  != null ? k.paddingRight  : 0,
      b: k.paddingBottom != null ? k.paddingBottom : 0,
      l: k.paddingLeft   != null ? k.paddingLeft   : 0
    };
    if (Math.abs(actP.t-expP.t) > tol) addDev(exportSpec.summary.deviations, k.id, "paddingTop",    expP.t, actP.t, k.name);
    if (Math.abs(actP.r-expP.r) > tol) addDev(exportSpec.summary.deviations, k.id, "paddingRight",  expP.r, actP.r, k.name);
    if (Math.abs(actP.b-expP.b) > tol) addDev(exportSpec.summary.deviations, k.id, "paddingBottom", expP.b, actP.b, k.name);
    if (Math.abs(actP.l-expP.l) > tol) addDev(exportSpec.summary.deviations, k.id, "paddingLeft",   expP.l, actP.l, k.name);

    // простое предупреждение по layout
    var expectedMode = (sSpec.layout && String(sSpec.layout).indexOf("grid-")===0) ? "HORIZONTAL" : "VERTICAL";
    if (k.layoutMode && k.layoutMode !== expectedMode){
      exportSpec.summary.warnings.push("Секция '"+k.name+"' layoutMode="+k.layoutMode+" ожидается "+expectedMode);
    }
  }
}

// ---------- UI messages ----------
figma.ui.onmessage = function (msg) {
  try{
    if (msg.type === "validate"){
      var spec = JSON.parse(msg.taskSpec);
      var err = checkTaskSpec(spec);
      if (err) figma.ui.postMessage({ type: "validate:error", error: err });
      else     figma.ui.postMessage({ type: "validate:ok" });
    }
    else if (msg.type === "build"){
      var spec = JSON.parse(msg.taskSpec);
      var err = checkTaskSpec(spec);
      if (err){ figma.ui.postMessage({ type: "validate:error", error: err }); return; }
      var page = findOrCreatePage(spec.target.pageName);
      figma.currentPage = page;
      var root = createRootFrame(spec, page);
      var kids = [].concat(root.children || []); for (var i=0;i<kids.length;i++){ kids[i].remove(); }
      buildSections(root, spec);
      figma.viewport.scrollAndZoomIntoView([root]);
      figma.ui.postMessage({ type: "build:ok", rootId: root.id, sections: (spec.sections||[]).length });
      figma.notify("Build v1: контейнеры и секции созданы");
    }
    else if (msg.type === "export"){
      var spec = JSON.parse(msg.taskSpec);
      var err = checkTaskSpec(spec);
      if (err){ figma.ui.postMessage({ type: "validate:error", error: err }); return; }
      var page=null, pages=figma.root.children;
      for (var i=0;i<pages.length;i++){ if(pages[i].type==="PAGE" && pages[i].name===spec.target.pageName){ page=pages[i]; break; } }
      if (!page){ figma.ui.postMessage({ type:"error", error:"Страница '"+spec.target.pageName+"' не найдена" }); return; }
      var root = page.findOne(function(n){ return n.type==="FRAME" && n.name === (spec.target.frameName || "Root"); });
      if (!root){ figma.ui.postMessage({ type:"error", error:"Фрейм '"+(spec.target.frameName||"Root")+"' не найден" }); return; }

      var exp = exportSpecFrom(root, spec);
      validateDeviations(root, spec, exp);
      figma.ui.postMessage({ type:"export:ok", exportSpec: exp, filename: "ExportSpec.json" });
    }
    else if (msg.type === "close"){
      figma.closePlugin();
    }
  }catch(e){
    figma.ui.postMessage({ type:"error", error: String(e) });
  }
};
