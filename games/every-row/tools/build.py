#!/usr/bin/env python3
"""Build A Card from Every Row into one self-contained HTML file. No dependencies.

    python tools/build.py                    # dist/every-row.html (the artifact page) and dist/index.html (standalone)
    python tools/build.py --standalone DIR   # also DIR/index.html, for the world-bible site
    python tools/build.py --check            # validate only: module rules, missing files, and the writing rules
    python tools/build.py --file src/worlds/x.js   # validate one file and what it imports

The page is plain ES modules (src/), three.js (vendor/) and a few fonts (assets/fonts). Development needs no build:
python tools/serve.py and open the page. This script is the release bundler. It understands a strict subset of
module syntax (see "Rules for every source file" in ARCHITECTURE.md): each module becomes a function that returns
its exports, modules are emitted in dependency order, three.js is wrapped the same way, and the fonts are inlined.
"""
import base64
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")

BANNED = ["testament to", "tapestry", "bustling", "nestled", "whispers of", "symphony of", "vibrant",
          "hum of life", "in a world where", "delve", "realm", "beacon", "labyrinthine", "a dance of"]
# folders whose strings a player reads
PROSE_DIRS = ("worlds", "ui")

IMPORT_RE = re.compile(r"^import\s+(?P<what>[\s\S]*?)\s+from\s+['\"](?P<path>[^'\"]+)['\"]\s*;?[ \t]*$", re.M)
IMPORT_BARE_RE = re.compile(r"^import\s+['\"]([^'\"]+)['\"]\s*;?[ \t]*$", re.M)
EXPORT_DECL_RE = re.compile(r"^export\s+(?P<kind>async\s+function\*?|function\*?|class|const)\s+(?P<name>[A-Za-z_$][\w$]*)", re.M)
EXPORT_ANY_RE = re.compile(r"^export\b[^\n]*", re.M)
STR_RE = re.compile(r'"((?:[^"\\\n]|\\.){12,})"|\'((?:[^\'\\\n]|\\.){12,})\'|`((?:[^`\\]|\\.){12,})`')


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def rel(path):
    return os.path.relpath(path, ROOT).replace("\\", "/")


def more_declarators(src, i):
    """The names declared after the first in `const a = ..., b = ..., c = ...;` (i is just past the first name).
    A plain scan: brackets and quotes are followed, a comma at depth nought starts the next name, and the statement ends
    at a semicolon at depth nought or at a line that begins at column 0. It reads declarations, not JavaScript: anything
    cleverer than a list of initialisers wants an export statement of its own."""
    names, depth, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c in "\"'`":
            q = c
            i += 1
            while i < n and src[i] != q:
                i += 2 if src[i] == "\\" else 1
            i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            while i < n and src[i] != "\n":
                i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
            if depth < 0:
                break
        elif depth == 0:
            if c == ";":
                break
            if c == "\n" and i + 1 < n and src[i + 1] not in " \t\r\n,":
                break
            if c == ",":
                mo = re.match(r"\s*([A-Za-z_$][\w$]*)\s*=(?!=)", src[i + 1:])
                if mo:
                    names.append(mo.group(1))
        i += 1
    return names


class Bundle:
    def __init__(self):
        self.mods = {}      # abs path -> dict(src, deps, exports, body)
        self.order = []
        self.problems = []

    def warn(self, msg):
        self.problems.append(msg)

    def load(self, path, stack=()):
        path = os.path.normpath(path)
        if path in self.mods:
            if path in stack:
                self.warn("circular import: " + " -> ".join(rel(p) for p in stack + (path,)))
            return
        if not os.path.exists(path):
            self.warn(f"missing file: {rel(path)} (imported by {rel(stack[-1]) if stack else 'the entry'})")
            return
        src = read(path)
        m = {"src": src, "deps": [], "exports": [], "imports": [], "path": path}
        self.mods[path] = m
        # imports
        def do_import(mo):
            what, spec = mo.group("what").strip(), mo.group("path")
            if spec == "three":
                if re.fullmatch(r"\*\s+as\s+THREE", what):
                    return ""
                if what.startswith("{") and what.endswith("}"):
                    names = []
                    for part in what[1:-1].split(","):
                        part = part.strip()
                        if not part:
                            continue
                        if " as " in part:
                            a, b = [x.strip() for x in part.split(" as ")]
                            names.append(f"{a}: {b}")
                        else:
                            names.append(part)
                    return "const { " + ", ".join(names) + " } = THREE;"
                self.warn(f"{rel(path)}: import three as `import {{ A, B }} from 'three'` or `import * as THREE from 'three'`")
                return ""
            if not spec.startswith("."):
                self.warn(f"{rel(path)}: bare import '{spec}' is not allowed")
                return ""
            if not spec.endswith(".js"):
                self.warn(f"{rel(path)}: import '{spec}' must end in .js")
            dep = os.path.normpath(os.path.join(os.path.dirname(path), spec))
            m["deps"].append(dep)
            if not (what.startswith("{") and what.endswith("}")):
                self.warn(f"{rel(path)}: only named imports are allowed (`import {{ a, b }} from '{spec}'`), found `import {what} ...`")
                return ""
            names = []
            for part in what[1:-1].split(","):
                part = part.strip()
                if not part:
                    continue
                if " as " in part:
                    a, b = [x.strip() for x in part.split(" as ")]
                    names.append(f"{a}: {b}")
                    m["imports"].append((dep, a))
                else:
                    names.append(part)
                    m["imports"].append((dep, part))
            return "const { " + ", ".join(names) + " } = __req(" + json.dumps(rel(dep)) + ");"
        body = IMPORT_RE.sub(do_import, src)
        if IMPORT_BARE_RE.search(body):
            self.warn(f"{rel(path)}: side-effect imports (`import './x.js'`) are not allowed")
        if re.search(r"\bimport\s*\(", body):
            self.warn(f"{rel(path)}: dynamic import() is not allowed (src/dev.js is the only exception and is not bundled)")
        # exports
        for mo in EXPORT_ANY_RE.finditer(body):
            line = mo.group(0)
            if not EXPORT_DECL_RE.match(line):
                self.warn(f"{rel(path)}: unsupported export: `{line.strip()[:70]}` (use export function / class / const at column 0)")
        def do_export(mo):
            m["exports"].append(mo.group("name"))
            if mo.group("kind") == "const":
                for extra in more_declarators(body, mo.end()):
                    m["exports"].append(extra)
            return mo.group("kind") + " " + mo.group("name")
        body = EXPORT_DECL_RE.sub(do_export, body)
        if re.search(r"^\s*await\s", "\n".join(l for l in body.split("\n") if not l.startswith((" ", "\t"))), re.M):
            self.warn(f"{rel(path)}: top-level await is not allowed")
        m["body"] = body
        for dep in m["deps"]:
            self.load(dep, stack + (path,))
        self.order.append(path)

    def check_imports(self):
        """Every name a module imports must be one the other module exports: in the bundle a name that is not there is
        simply undefined, and nothing says so until the code that uses it runs."""
        for path, m in self.mods.items():
            for dep, name in m["imports"]:
                d = self.mods.get(dep)
                if d is not None and name not in d["exports"]:
                    self.warn(f"{rel(path)}: imports `{name}` from {rel(dep)}, which does not export it")

    def js(self):
        out = ["const __mods = {};", "const __req = (id) => { const m = __mods[id]; if (!m) throw new Error('module not loaded: ' + id); return m; };"]
        for path in self.order:
            m = self.mods[path]
            exports = ", ".join(m["exports"])
            out.append(f"// ---- {rel(path)}\n__mods[{json.dumps(rel(path))}] = (function () {{\n{m['body']}\nreturn {{ {exports} }};\n}})();")
        return "\n".join(out)


def three_iife():
    src = read(os.path.join(ROOT, "vendor", "three.module.min.js"))
    i = src.rindex("export{")
    j = src.index("}", i)
    names = src[i + 7:j].split(",")
    pairs = []
    for n in names:
        n = n.strip()
        if not n:
            continue
        if " as " in n:
            a, b = n.split(" as ")
            pairs.append(f"{b.strip()}:{a.strip()}")
        else:
            pairs.append(n)
    return "const THREE = (function () {\n" + src[:i] + "return {" + ",".join(pairs) + "};\n})();\n"


def fonts_css():
    css = read(os.path.join(ROOT, "assets", "fonts", "fonts.css"))
    def inline(mo):
        name = mo.group(1)
        with open(os.path.join(ROOT, "assets", "fonts", name), "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
        return f"url(data:font/woff2;base64,{b64})"
    css = re.sub(r"/\*[\s\S]*?\*/", "", css)
    return re.sub(r"url\(([^)]+\.woff2)\)", inline, css).strip()


def check_prose(bundle):
    for path, m in bundle.mods.items():
        r = rel(path)
        if not r.startswith(tuple("src/" + d + "/" for d in PROSE_DIRS)):
            continue
        for mo in STR_RE.finditer(m["src"]):
            s = mo.group(1) or mo.group(2) or mo.group(3)
            if " " not in s or s.strip().startswith(("#", "rgba", "http", "precision", "uniform")):
                continue
            if "px " in s or re.search(r"[=;{}<>$]|\|\||&&|\b(vec[234]|float|gl_|void)\b", s):
                continue
            if not re.search(r"[A-Za-z]{3,} [A-Za-z]{2,}", s):
                continue
            t = s.replace("\\'", "'")
            if "—" in t or ("–" in t and not re.search(r"\d–\d", t)):
                bundle.warn(f"{r}: dash in {t[:80]!r}")
            if "!" in t and not re.search(r"!=|!\w|!\(", t):
                bundle.warn(f"{r}: exclamation mark in {t[:80]!r}")
            low = t.lower()
            for b in BANNED:
                if b in low:
                    bundle.warn(f"{r}: banned phrase {b!r} in {t[:80]!r}")


SKELETON = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n')


def syntax_errors(b):
    """Modules that node cannot parse, as messages. Empty if node is not installed."""
    import shutil, subprocess
    node = shutil.which("node")
    if not node:
        return []
    out = []
    paths = [m["path"] for m in b.mods.values() if os.path.exists(m["path"])]
    # all at once first (quick); one by one only if something is wrong
    procs = []
    for i in range(0, len(paths), 40):
        chunk = paths[i:i + 40]
        script = "const fs=require('fs');const vm=require('vm');let bad=0;for(const p of process.argv.slice(1)){try{new vm.SourceTextModule(fs.readFileSync(p,'utf8'),{identifier:p});}catch(e){bad++;console.log(p+'\t'+String(e.message).split('\n')[0]);}}process.exit(bad?1:0);"
        procs.append(subprocess.run([node, "--experimental-vm-modules", "--no-warnings", "-e", script] + chunk, capture_output=True, text=True))
    for pr in procs:
        for line in pr.stdout.splitlines():
            if "	" in line:
                path, msg = line.split("	", 1)
                out.append(f"{rel(path)}: does not parse: {msg}")
        if pr.returncode not in (0, 1) and pr.stderr.strip():
            out.append("syntax check could not run: " + pr.stderr.strip().splitlines()[-1])
    return out


def main():
    args = sys.argv[1:]
    check_only = "--check" in args
    b = Bundle()
    if "--file" in args:      # check one file (and what it imports) that is not listed in worlds/index.js yet
        check_only = True
        b.load(os.path.abspath(args[args.index("--file") + 1]))
    else:
        b.load(os.path.join(SRC, "main.js"))
    b.check_imports()
    check_prose(b)
    problems = b.problems
    seen = set()
    for p in problems:
        if p not in seen:
            print("warning: " + p)
            seen.add(p)
    hard = [p for p in seen if not re.search(r"dash in|exclamation mark in|banned phrase", p)]
    # the bundler reads imports and exports, not JavaScript: let node say whether every module parses
    bad = syntax_errors(b)
    for e in bad:
        print("warning: " + e)
    hard += bad
    seen |= set(bad)
    print(f"{len(b.order)} modules, {sum(len(m['src']) for m in b.mods.values()) // 1024} kB of source, {len(seen)} warnings ({len(hard)} that break the build)")
    if check_only:
        sys.exit(1 if hard else 0)
    if hard:
        print("not building: fix the warnings that break the build")
        sys.exit(1)
    js = three_iife() + b.js()
    style = read(os.path.join(SRC, "ui", "style.css"))
    fragment = ('<title>Every Row</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n:root { color-scheme: dark; }\n' + style + "\n" + fonts_css() + "\n</style>\n"
                '<canvas id="view" tabindex="0"></canvas>\n<div id="ui"></div>\n<script>\n(function () {\n"use strict";\n' + js + "\n})();\n</script>\n")
    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, "every-row.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(fragment)
    page = SKELETON + fragment + "</body>\n</html>\n"
    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    if "--standalone" in args:
        d = args[args.index("--standalone") + 1]
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(page)
    print(f"wrote dist/every-row.html and dist/index.html ({len(fragment) // 1024} kB)")


if __name__ == "__main__":
    main()
