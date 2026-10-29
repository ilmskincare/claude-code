import sys, base64, re, os, markdown
S=sys.argv[1]; src="docs/16-user-manual.md"; shots=f"{S}/shots-web"
md=open(src).read()
def fig(name, caption):
    p=f"{shots}/{name}.jpg"
    if not os.path.exists(p): return ""
    b=base64.b64encode(open(p,"rb").read()).decode()
    return f'\n<figure><img src="data:image/jpeg;base64,{b}" alt="{caption}"><figcaption>{caption}</figcaption></figure>\n'
def gallery(items): return "".join(fig(n,c) for n,c in items)
# Where each screenshot goes: after the first paragraph following the given heading (exact heading text).
PLACE = {
 "### Signing in": [("login-client","The client sign-in tab: email link, no password"),("login-staff","The staff sign-in tab: username and password")],
 "## 2. What clients see: the public website": [("public-home","Home page"),("public-artists","Artists"),("public-artist-elle","An artist's public page"),("public-flash","Flash catalogue"),("public-play-gumball","Gumball machine"),("public-play-trio","Three machines"),("public-enquire","Enquiry form"),("public-guides","Client information library"),("public-guide-tattoo-aftercare","A guide, with the draft banner until approved"),("public-privacy","Privacy notice")],
 "## 3. The client's journey, start to finish": [("client-enquiries","Client portal: My enquiries (test data)"),("client-enquiry-detail","An enquiry thread with the quote card (test data)"),("client-bookings","My bookings (test data)"),("client-booking-detail","A booking with deposit instructions and guides (test data)"),("client-documents","My documents"),("client-rewards","Rewards"),("client-preferences","Preferences")],
 "### Overview": [("owner-overview","Owner: Overview (test data)")],
 "### Chat": [("studio-chat","Staff chat (test data)")],
 "### Reports": [("owner-reports","Reports (test data)")],
 "### Enquiries": [("owner-enquiries","Enquiries list (test data)"),("owner-enquiry-detail","An enquiry: summary, desk tools, thread and quotes (test data)")],
 "### Clients": [("owner-clients","Clients (test data)")],
 "### Planner": [("owner-calendar","Planner (test data)"),("owner-booking-detail","A booking: record deposit, move, cancel (test data)")],
 "### Ask the desk": [("owner-rates","Ask the desk (test data)")],
 "### Artists & models": [("owner-artists","Artists & models: add someone and the team table (test data)")],
 "### Stock": [("owner-stock","Stock (test data)"),("owner-stock-product","A product: lots, receive, issue or sell, movements (test data)"),("owner-stock-sales","Retail sales (test data)")],
 "### Apprentices": [("owner-academy","Apprentices (test data)"),("owner-apprentice-detail","An apprentice: hours to verify, photos, skills (test data)")],
 "### Flash": [("owner-flash","Flash: designs and sheets (test data)"),("owner-flash-new","Add a design"),("owner-flash-design","A design (test data)")],
 "### Gumball": [("owner-gumball","Gumball dashboard (test data)")],
 "### Promotions": [("owner-promotions","Promotions (test data)")],
 "### Documents": [("owner-documents","Documents: sign-off (test data)")],
 "### Marketing": [("owner-marketing","Email marketing (test data)")],
 "### Social": [("owner-social","Social posts (test data)")],
 "### Audit log": [("owner-audit","Audit log (test data)")],
 "### Settings": [("owner-settings","Settings")],
 "### Outbox": [("owner-mailbox","Notification outbox (test data)")],
 "## 6. The artist and piercer workspace": [("studio-today","Artist: Today (test data)"),("studio-enquiries","My enquiries (test data)"),("studio-enquiry-detail","An enquiry with the reply box and quote form (test data)"),("studio-diary","My diary (test data)"),("studio-hours","My hours (test data)"),("studio-earnings","My earnings (test data)"),("studio-portfolio","My portfolio (test data)"),("studio-flash","My flash (test data)"),("studio-profile","Profile & rates (test data)"),("studio-promotions","My promotions (test data)"),("studio-piercer-sales","Retail sales: the piercer's sale form (test data)"),("studio-stock","Studio stock (test data)")],
 "## 7. Apprentices and mentors": [("studio-apprentice-today","Apprentice: Today (test data)"),("studio-apprentice-training","My training: hours, photos, skills (test data)")],
}
lines=md.split("\n"); out=[]; i=0; pending=None; used=set()
while i < len(lines):
    line=lines[i]; out.append(line)
    if line.strip() in PLACE and line.strip() not in used:
        pending=PLACE[line.strip()]; used.add(line.strip())
    elif pending and line.strip()=="" and i>0 and lines[i-1].strip()!="" and not lines[i-1].startswith("#"):
        out.append(gallery(pending)); pending=None
    i+=1
missing=[h for h in PLACE if h not in used]
md2="\n".join(out)
body=md2.split("\n",1)[1]
# The Markdown has its own plain contents list between a line "Contents" and section 1; the PDF has a real one, so drop it.
body=re.sub(r"\n+Contents\n.*?(?=\n## 1\. )", "\n", body, count=1, flags=re.S)
html=markdown.markdown(body, extensions=["tables","toc","sane_lists","md_in_html"], extension_configs={"toc":{"toc_depth":"2-3"}})
logo=base64.b64encode(open("public/brand/rebellious-ink-logo.jpg","rb").read()).decode()
toc=re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', html)
toc_html="".join(f'<li><a href="#{i}">{t}</a></li>' for i,t in toc if not t.startswith("Contents"))
html=re.sub(r'<h2 ', '<h2 class="section" ', html)
doc=f"""<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Rebellious Ink Studio OS: user manual</title>
<style>
@page {{ size: A4; margin: 18mm 16mm 20mm 16mm; }}
:root {{ --ink:#070807; --acid:#e0202a; --acid-deep:#a3121a; --grey:#555; --line:#ddd6d3; }}
html,body {{ font-family: Helvetica, Arial, sans-serif; color:#111; font-size: 10.5pt; line-height: 1.45; }}
.cover {{ height: 240mm; display:flex; flex-direction:column; justify-content:center; align-items:flex-start; page-break-after: always; }}
.cover img {{ width: 38mm; height: 38mm; border-radius: 50%; }}
.cover .kicker {{ color: var(--acid-deep); letter-spacing:.3em; text-transform:uppercase; font-size: 9pt; margin-top: 10mm; }}
.cover h1 {{ font-size: 30pt; line-height: 1.1; margin: 4mm 0 2mm; }}
.cover h1 span {{ color: var(--acid-deep); }}
.cover p {{ color: var(--grey); max-width: 120mm; }}
.toc {{ page-break-after: always; }}
.toc h2 {{ border:0; margin-top:0; }}
.toc ol {{ list-style: none; padding:0; counter-reset: s; column-count: 2; column-gap: 10mm; }}
.toc li {{ counter-increment: s; padding: 1.6mm 0; border-bottom: 1px solid var(--line); break-inside: avoid; }}
.toc li::before {{ content: ""; }}
.toc a {{ color:#111; text-decoration:none; }}
h2.section {{ page-break-before: always; font-size: 18pt; margin: 0 0 4mm; padding-bottom: 2mm; border-bottom: 3px solid var(--acid); }}
h3 {{ font-size: 12.5pt; margin: 6mm 0 2mm; color: var(--ink); page-break-after: avoid; }}
h3::before {{ content: "■ "; color: var(--acid); font-size: 9pt; vertical-align: 2px; }}
h4 {{ font-size: 11pt; margin: 4mm 0 1.5mm; }}
p {{ margin: 0 0 2.5mm; }}
ul, ol {{ margin: 0 0 3mm; padding-left: 5mm; }}
li {{ margin-bottom: 1mm; }}
table {{ border-collapse: collapse; width: 100%; margin: 2mm 0 4mm; font-size: 9.2pt; page-break-inside: auto; }}
tr {{ page-break-inside: avoid; }}
th {{ text-align:left; background: #fbe9ea; color: var(--ink); padding: 1.8mm 2mm; border-bottom: 2px solid var(--acid); }}
td {{ padding: 1.6mm 2mm; border-bottom: 1px solid var(--line); vertical-align: top; }}
code {{ font-family: Menlo, Consolas, monospace; font-size: 8.8pt; background:#f3f5ee; padding: 0 1mm; }}
figure {{ margin: 3mm 0 5mm; page-break-inside: avoid; }}
figure img {{ width: 100%; max-height: 165mm; object-fit: contain; object-position: top; border: 1px solid var(--line); border-radius: 2mm; }}
figcaption {{ font-size: 8.5pt; color: var(--grey); margin-top: 1.2mm; }}
figcaption::before {{ content: "Screen: "; color: var(--acid-deep); font-weight: 700; }}
hr {{ display:none; }}
a {{ color: var(--acid-deep); }}
</style></head><body>
<section class="cover"><img src="data:image/jpeg;base64,{logo}" alt=""><p class="kicker">Rebellious Ink Studio OS</p><h1>User manual<br><span>Version 2</span></h1><p>26 October 2026. For the owner, the studio manager, the desk, artists, piercers and apprentices. Every page and button is named exactly as it appears on screen. Screens marked "test data" were captured on the practice site, which holds made-up clients and artists.</p></section>
<section class="toc"><h2>Contents</h2><ol>{toc_html}</ol></section>
{html}
</body></html>"""
open(f"{S}/manual.html","w").write(doc)
print("html MB", round(len(doc)/1048576,1), "sections", len(toc), "figures", doc.count("<figure>"), "headings not found:", missing)
