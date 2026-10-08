#!/usr/bin/env python3
"""Build docs/index.html (the stand-alone website, for GitHub Pages) from 3-3-30/index.html
(the Claude artifact). Same app; on the website docs/claude-shim.js provides sign-in and the
shared log through Firebase. Run after every change to 3-3-30/index.html:

    python3 3-3-30/build_web.py
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIREBASE = '10.14.1'

app = (ROOT / '3-3-30' / 'index.html').read_text(encoding='utf-8')
split = app.index('<div class="app" id="app">')
head, body = app[:split].strip(), app[split:].strip()

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#F3F1EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121417" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="3-3-30">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-180.png">
<style>:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{head}
</head>
<body>
<script src="https://www.gstatic.com/firebasejs/{FIREBASE}/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/{FIREBASE}/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/{FIREBASE}/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="claude-shim.js"></script>
{body}
</body>
</html>
'''
(ROOT / 'docs' / 'index.html').write_text(page, encoding='utf-8')
print('built docs/index.html')
