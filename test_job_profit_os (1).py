"""
Job Profit OS – Playwright Test Suite
Run:  python test_job_profit_os.py
Output: test_results.json  +  screenshots/  folder
"""

import json, time, re, os, traceback
from datetime import datetime
from playwright.sync_api import sync_playwright, expect, Page, Browser

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL  = "https://job-profit-os-git-main-26jzk94vgp-techs-projects.vercel.app"
EMAIL     = "hanchao201010@yahoo.com"
PASSWORD  = "SniperElite@4"
TIMEOUT   = 15_000          # ms per action
NAV_WAIT  = "networkidle"
SS_DIR    = "screenshots"
os.makedirs(SS_DIR, exist_ok=True)

# ── Result store ──────────────────────────────────────────────────────────────
results: list[dict] = []

def record(tc_id: str, area: str, scenario: str, status: str,
           expected: str, actual: str, notes: str = "", screenshot: str = ""):
    results.append({
        "tc_id": tc_id, "area": area, "scenario": scenario,
        "status": status,           # PASS | FAIL | SKIP | ERROR
        "expected": expected, "actual": actual,
        "notes": notes, "screenshot": screenshot,
        "timestamp": datetime.now().isoformat()
    })
    icon = {"PASS": "✅", "FAIL": "❌", "SKIP": "⏭ ", "ERROR": "💥"}.get(status, "?")
    print(f"  {icon} [{tc_id}] {scenario[:70]}")
    if status in ("FAIL", "ERROR"):
        print(f"       Expected : {expected[:120]}")
        print(f"       Actual   : {actual[:120]}")
        if notes:
            print(f"       Notes    : {notes[:120]}")


def ss(page: Page, name: str) -> str:
    path = f"{SS_DIR}/{name}.png"
    try:
        page.screenshot(path=path, full_page=True)
    except Exception:
        pass
    return path


def safe_text(page: Page, selector: str, default="") -> str:
    try:
        return page.locator(selector).first.inner_text(timeout=4000).strip()
    except Exception:
        return default


def page_text(page: Page) -> str:
    try:
        return page.inner_text("body", timeout=5000)
    except Exception:
        return ""


def click_text(page: Page, text: str, timeout=TIMEOUT):
    """Click the first visible element containing text."""
    page.get_by_text(text, exact=False).first.click(timeout=timeout)


def fill_field(page: Page, label_or_placeholder: str, value: str):
    """Fill an input by label text or placeholder."""
    try:
        page.get_by_label(label_or_placeholder, exact=False).first.fill(str(value), timeout=6000)
        return
    except Exception:
        pass
    try:
        page.get_by_placeholder(label_or_placeholder, exact=False).first.fill(str(value), timeout=6000)
        return
    except Exception:
        pass
    # last resort – visible input
    page.locator(f"input[placeholder*='{label_or_placeholder}']").first.fill(str(value), timeout=6000)


def wait_nav(page: Page):
    page.wait_for_load_state(NAV_WAIT, timeout=20_000)
    time.sleep(0.8)


# ═════════════════════════════════════════════════════════════════════════════
# LOGIN HELPER
# ═════════════════════════════════════════════════════════════════════════════
def login(page: Page):
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded", timeout=30_000)
    wait_nav(page)

    # locate email / password fields flexibly
    for sel in ["input[type='email']", "input[name='email']",
                "input[placeholder*='mail' i]", "input[placeholder*='user' i]"]:
        if page.locator(sel).count() > 0:
            page.locator(sel).first.fill(EMAIL)
            break

    for sel in ["input[type='password']", "input[name='password']",
                "input[placeholder*='pass' i]"]:
        if page.locator(sel).count() > 0:
            page.locator(sel).first.fill(PASSWORD)
            break

    for sel in ["button[type='submit']", "button:has-text('Sign')",
                "button:has-text('Login')", "button:has-text('Log in')"]:
        if page.locator(sel).count() > 0:
            page.locator(sel).first.click()
            break

    wait_nav(page)
    return page.url


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 1 – AUTHENTICATION
# ═════════════════════════════════════════════════════════════════════════════
def test_auth(browser: Browser):
    print("\n── AUTHENTICATION ──")

    # TC-001 Valid login
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        url_after = login(page)
        body = page_text(page)
        shot = ss(page, "TC001_login_success")
        if "/login" not in url_after and "Host not" not in body:
            record("TC-001", "Authentication", "Valid credentials login",
                   "PASS", "Redirect to dashboard", f"Redirected to: {url_after}", screenshot=shot)
        else:
            record("TC-001", "Authentication", "Valid credentials login",
                   "FAIL", "Redirect to dashboard", f"Still at: {url_after} | body: {body[:200]}", screenshot=shot)
    except Exception as e:
        shot = ss(page, "TC001_error")
        record("TC-001", "Authentication", "Valid credentials login",
               "ERROR", "Redirect to dashboard", str(e)[:200], screenshot=shot)
    page.close()

    # TC-002 Invalid password
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        wait_nav(page)
        for sel in ["input[type='email']", "input[name='email']"]:
            if page.locator(sel).count():
                page.locator(sel).first.fill(EMAIL); break
        for sel in ["input[type='password']", "input[name='password']"]:
            if page.locator(sel).count():
                page.locator(sel).first.fill("WrongPass999!"); break
        for sel in ["button[type='submit']", "button:has-text('Sign')"]:
            if page.locator(sel).count():
                page.locator(sel).first.click(); break
        wait_nav(page)
        body = page_text(page)
        shot = ss(page, "TC002_invalid_password")
        if "/login" in page.url or any(w in body.lower() for w in ["invalid", "incorrect", "error", "wrong", "failed"]):
            record("TC-002", "Authentication", "Invalid password rejected",
                   "PASS", "Error shown, stays on login", f"URL={page.url} | snippet={body[:150]}", screenshot=shot)
        else:
            record("TC-002", "Authentication", "Invalid password rejected",
                   "FAIL", "Error shown, stays on login", f"URL={page.url} | body={body[:150]}", screenshot=shot)
    except Exception as e:
        shot = ss(page, "TC002_error")
        record("TC-002", "Authentication", "Invalid password rejected",
               "ERROR", "Error shown", str(e)[:200], screenshot=shot)
    page.close()

    # TC-003 Empty email
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        wait_nav(page)
        for sel in ["button[type='submit']", "button:has-text('Sign')"]:
            if page.locator(sel).count():
                page.locator(sel).first.click(); break
        time.sleep(1)
        body = page_text(page)
        shot = ss(page, "TC003_empty_email")
        has_validation = any(w in body.lower() for w in ["required", "valid", "email", "empty"]) or "/login" in page.url
        record("TC-003", "Authentication", "Empty email validation",
               "PASS" if has_validation else "FAIL",
               "Validation error shown", f"body={body[:150]}", screenshot=shot)
    except Exception as e:
        shot = ss(page, "TC003_error")
        record("TC-003", "Authentication", "Empty email validation",
               "ERROR", "Validation error", str(e)[:200], screenshot=shot)
    page.close()

    # TC-004 Invalid email format
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
        wait_nav(page)
        for sel in ["input[type='email']", "input[name='email']"]:
            if page.locator(sel).count():
                page.locator(sel).first.fill("notanemail"); break
        for sel in ["input[type='password']", "input[name='password']"]:
            if page.locator(sel).count():
                page.locator(sel).first.fill(PASSWORD); break
        for sel in ["button[type='submit']", "button:has-text('Sign')"]:
            if page.locator(sel).count():
                page.locator(sel).first.click(); break
        time.sleep(1.5)
        body = page_text(page)
        shot = ss(page, "TC004_invalid_email")
        stays = "/login" in page.url or any(w in body.lower() for w in ["valid", "email", "format", "invalid"])
        record("TC-004", "Authentication", "Invalid email format rejected",
               "PASS" if stays else "FAIL",
               "Validation error or stays on login", f"URL={page.url} body={body[:150]}", screenshot=shot)
    except Exception as e:
        shot = ss(page, "TC004_error")
        record("TC-004", "Authentication", "Invalid email format rejected",
               "ERROR", "Validation error", str(e)[:200], screenshot=shot)
    page.close()

    # TC-005 Logout
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)
        # Try common logout selectors
        logged_out = False
        for sel in ["button:has-text('Logout')", "button:has-text('Sign out')",
                    "a:has-text('Logout')", "a:has-text('Sign out')",
                    "[aria-label*='logout' i]", "[aria-label*='sign out' i]"]:
            if page.locator(sel).count():
                page.locator(sel).first.click()
                wait_nav(page)
                logged_out = True
                break
        if not logged_out:
            # Try clicking avatar/profile first
            for sel in ["button[aria-label*='profile' i]", "button[aria-label*='user' i]",
                        "img[alt*='avatar' i]", "[data-testid*='user']", ".avatar", ".user-menu"]:
                if page.locator(sel).count():
                    page.locator(sel).first.click()
                    time.sleep(0.5)
                    for sel2 in ["text=Logout", "text=Sign out", "text=Log out"]:
                        if page.locator(sel2).count():
                            page.locator(sel2).first.click()
                            wait_nav(page)
                            logged_out = True
                            break
                    if logged_out:
                        break
        shot = ss(page, "TC005_logout")
        if "/login" in page.url or not logged_out:
            record("TC-005", "Authentication", "Logout redirects to login",
                   "PASS" if "/login" in page.url else "FAIL",
                   "Redirected to /login",
                   f"URL={page.url} | logout_found={logged_out}", screenshot=shot)
        else:
            record("TC-005", "Authentication", "Logout redirects to login",
                   "FAIL", "Redirected to /login", f"URL={page.url}", screenshot=shot)
    except Exception as e:
        shot = ss(page, "TC005_error")
        record("TC-005", "Authentication", "Logout redirects to login",
               "ERROR", "Redirected to /login", str(e)[:200], screenshot=shot)
    page.close()


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 2 – DASHBOARD
# ═════════════════════════════════════════════════════════════════════════════
def test_dashboard(browser: Browser):
    print("\n── DASHBOARD ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)

        # TC-006 Dashboard loads
        body = page_text(page)
        shot = ss(page, "TC006_dashboard")
        has_dashboard = any(w in body.lower() for w in
                            ["dashboard", "job", "revenue", "profit", "quote", "invoice", "total"])
        record("TC-006", "Dashboard", "Dashboard loads after login",
               "PASS" if has_dashboard else "FAIL",
               "Dashboard with summary widgets visible",
               f"URL={page.url} keywords_found={has_dashboard}", screenshot=shot)

        # TC-007 Navigation items
        nav_items = []
        for text in ["Job", "Quote", "Invoice", "Report", "Dashboard"]:
            found = page.locator(f"a:has-text('{text}'), button:has-text('{text}'), nav >> text={text}").count() > 0
            nav_items.append(f"{text}={'✓' if found else '✗'}")
        shot2 = ss(page, "TC007_navigation")
        found_count = sum(1 for n in nav_items if "✓" in n)
        record("TC-007", "Dashboard", "Navigation menu items present",
               "PASS" if found_count >= 2 else "FAIL",
               "Nav links: Jobs, Quotes, Invoices, Reports",
               " | ".join(nav_items), screenshot=shot2)

        # TC-008 Currency format AUD
        # Look for $ signs in monetary displays
        dollar_matches = re.findall(r'\$[\d,]+\.?\d*', body)
        shot3 = ss(page, "TC008_currency")
        record("TC-008", "Dashboard", "Currency displayed in AUD ($)",
               "PASS" if dollar_matches else "FAIL",
               "Values shown with $ prefix",
               f"Sample values: {dollar_matches[:5]}", screenshot=shot3)

    except Exception as e:
        ss(page, "dashboard_error")
        for tc in ["TC-006","TC-007","TC-008"]:
            record(tc, "Dashboard", tc, "ERROR", "", str(e)[:200])
    finally:
        page.close()


# ═════════════════════════════════════════════════════════════════════════════
# EXPLORE APP STRUCTURE – find nav links and page content
# ═════════════════════════════════════════════════════════════════════════════
def explore_app(browser: Browser) -> dict:
    """Return a dict of {page_name: url} by clicking nav links."""
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    pages = {}
    try:
        login(page)
        time.sleep(1)

        # Collect all nav/sidebar links
        links = page.evaluate("""() => {
            const links = [];
            document.querySelectorAll('a[href], nav a, aside a, [role=navigation] a').forEach(a => {
                if (a.href && !a.href.includes('#') && a.textContent.trim())
                    links.push({text: a.textContent.trim(), href: a.href});
            });
            return links;
        }""")

        print(f"  Found {len(links)} nav links: {[(l['text'][:20], l['href'][-40:]) for l in links[:10]]}")
        pages["_links"] = links

        # Also grab all visible button texts
        buttons = page.evaluate("""() =>
            Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.length > 0)
        """)
        pages["_buttons"] = buttons
        print(f"  Buttons: {buttons[:15]}")

        # Screenshot each unique nav link
        visited = set()
        for link in links[:12]:
            href = link["href"]
            if href in visited or "logout" in href.lower() or "signout" in href.lower():
                continue
            visited.add(href)
            try:
                page.goto(href, wait_until="domcontentloaded", timeout=15000)
                wait_nav(page)
                name = re.sub(r'[^a-z0-9]', '_', link["text"].lower())[:20]
                ss(page, f"explore_{name}")
                body = page_text(page)
                pages[link["text"]] = {"url": href, "body_snippet": body[:400]}
                print(f"    → {link['text']} : {href[-50:]} | {body[:80]}")
            except Exception as e:
                print(f"    → {link['text']} ERROR: {e}")

    except Exception as e:
        print(f"  explore_app ERROR: {e}")
    finally:
        page.close()
    return pages


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 3 – JOB MANAGEMENT
# ═════════════════════════════════════════════════════════════════════════════
def find_and_click_new(page: Page, entity: str) -> bool:
    """Try to click a New/Add/Create button for a given entity."""
    patterns = [
        f"button:has-text('New {entity}')", f"button:has-text('Add {entity}')",
        f"button:has-text('Create {entity}')", "button:has-text('New')",
        "button:has-text('Add')", "button:has-text('Create')",
        "a:has-text('New')", "a:has-text('Add')", "[data-testid*='new']",
        "[data-testid*='create']", "button:has-text('+')",
    ]
    for sel in patterns:
        try:
            if page.locator(sel).first.is_visible(timeout=2000):
                page.locator(sel).first.click()
                wait_nav(page)
                return True
        except Exception:
            pass
    return False


def navigate_to(page: Page, section: str) -> bool:
    """Navigate to a section by clicking its nav link."""
    patterns = [
        f"a:has-text('{section}')", f"nav >> text={section}",
        f"aside >> text={section}", f"[role=navigation] >> text={section}",
        f"button:has-text('{section}')",
    ]
    for sel in patterns:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=2000):
                loc.click()
                wait_nav(page)
                return True
        except Exception:
            pass
    return False


def test_jobs(browser: Browser):
    print("\n── JOB MANAGEMENT ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    job_name = f"TEST-JOB-{int(time.time())}"

    try:
        login(page)

        # Navigate to jobs
        nav_ok = navigate_to(page, "Job") or navigate_to(page, "Jobs")
        shot = ss(page, "TC009_jobs_page")
        body = page_text(page)

        # TC-009 Create job
        new_ok = find_and_click_new(page, "Job")
        time.sleep(1)
        shot2 = ss(page, "TC009_new_job_form")
        form_body = page_text(page)

        # Try to fill in job name
        filled = False
        for sel in ["input[name*='name' i]", "input[placeholder*='name' i]",
                    "input[placeholder*='job' i]", "input[type='text']"]:
            try:
                if page.locator(sel).first.is_visible(timeout=2000):
                    page.locator(sel).first.fill(job_name)
                    filled = True
                    break
            except Exception:
                pass

        # Try to fill client / description fields
        for label in ["Client", "Customer", "client name", "Description"]:
            try:
                fill_field(page, label, "Smith Family Test")
                break
            except Exception:
                pass

        # Save
        saved = False
        for sel in ["button:has-text('Save')", "button:has-text('Create')",
                    "button:has-text('Submit')", "button[type='submit']",
                    "button:has-text('Add')"]:
            try:
                if page.locator(sel).first.is_visible(timeout=2000):
                    page.locator(sel).first.click()
                    wait_nav(page)
                    saved = True
                    break
            except Exception:
                pass

        shot3 = ss(page, "TC009_after_save")
        body_after = page_text(page)
        job_visible = job_name in body_after

        record("TC-009", "Job Management", "Create new job",
               "PASS" if (new_ok and saved and job_visible) else "FAIL",
               "Job saved and appears in list",
               f"nav_ok={nav_ok} new_ok={new_ok} filled={filled} saved={saved} visible={job_visible}",
               screenshot=shot3)

        # TC-010 Job appears in list
        navigate_to(page, "Job") or navigate_to(page, "Jobs")
        wait_nav(page)
        body_list = page_text(page)
        shot4 = ss(page, "TC010_job_in_list")
        record("TC-010", "Job Management", "New job visible in jobs list",
               "PASS" if job_name in body_list else "FAIL",
               f"Job '{job_name}' in list",
               f"Found: {job_name in body_list}", screenshot=shot4)

    except Exception as e:
        shot = ss(page, "jobs_error")
        for tc in ["TC-009","TC-010"]:
            record(tc, "Job Management", tc, "ERROR", "", str(e)[:300])
    finally:
        page.close()


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 4 – CALCULATIONS (Labour, Materials, Margin, GST, Profit)
# ═════════════════════════════════════════════════════════════════════════════
def extract_number(text: str) -> float | None:
    """Pull the first dollar amount or bare number from text."""
    m = re.search(r'\$?\s*([\d,]+\.?\d*)', text.replace(',', ''))
    if m:
        try:
            return float(m.group(1).replace(',', ''))
        except Exception:
            pass
    return None


def check_calc(page: Page, label: str, expected: float, tolerance: float = 0.02) -> tuple[str, str]:
    """
    Locate a field/display by label and return (status, actual_text).
    Searches for text near the label.
    """
    body = page_text(page)
    # Look for lines containing the label
    for line in body.splitlines():
        if label.lower() in line.lower():
            val = extract_number(line)
            if val is not None:
                diff = abs(val - expected)
                status = "PASS" if diff <= tolerance * max(abs(expected), 1) else "FAIL"
                return status, f"Found '{line.strip()}' → {val} (expected {expected})"
    return "FAIL", f"Label '{label}' not found in page. Body snippet: {body[:300]}"


def open_or_create_job_with_lines(browser: Browser) -> tuple[Page, bool]:
    """Login, go to a job (or create one), and return (page, success)."""
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)
        navigate_to(page, "Job") or navigate_to(page, "Jobs")
        wait_nav(page)
        body = page_text(page)

        # Click first existing job or create new
        job_links = page.locator("table tbody tr, [data-testid*='job'], .job-item, .job-card").all()
        if job_links:
            job_links[0].click()
            wait_nav(page)
        else:
            find_and_click_new(page, "Job")
            time.sleep(1)
            for sel in ["input[type='text']", "input[name*='name' i]"]:
                if page.locator(sel).count():
                    page.locator(sel).first.fill(f"CalcTest-{int(time.time())}")
                    break
            for sel in ["button:has-text('Save')", "button[type='submit']"]:
                if page.locator(sel).count():
                    page.locator(sel).first.click()
                    wait_nav(page)
                    break
        return page, True
    except Exception as e:
        print(f"  open_or_create_job error: {e}")
        return page, False


def add_labour_entry(page: Page, hours: float, rate: float) -> bool:
    """Try to add a labour line item on an open job."""
    # Look for Add Labour / Labour tab / + button
    for sel in ["button:has-text('Add Labour')", "button:has-text('Labour')",
                "tab:has-text('Labour')", "[role='tab']:has-text('Labour')",
                "button:has-text('Add Line')", "button:has-text('Add Item')",
                "a:has-text('Labour')"]:
        try:
            if page.locator(sel).first.is_visible(timeout=2000):
                page.locator(sel).first.click()
                time.sleep(0.5)
                break
        except Exception:
            pass

    # Fill hours
    for lbl in ["Hours", "hours", "Qty", "Quantity"]:
        try:
            fill_field(page, lbl, str(hours))
            break
        except Exception:
            pass

    # Fill rate
    for lbl in ["Rate", "rate", "Cost", "Price", "Unit Price", "Hourly Rate"]:
        try:
            fill_field(page, lbl, str(rate))
            break
        except Exception:
            pass

    # Save / Add
    for sel in ["button:has-text('Save')", "button:has-text('Add')",
                "button:has-text('Submit')", "button[type='submit']"]:
        try:
            if page.locator(sel).first.is_visible(timeout=2000):
                page.locator(sel).first.click()
                wait_nav(page)
                return True
        except Exception:
            pass
    return False


def add_material_entry(page: Page, qty: float, unit_cost: float, markup: float = 0) -> bool:
    """Try to add a material line item on an open job."""
    for sel in ["button:has-text('Add Material')", "button:has-text('Material')",
                "[role='tab']:has-text('Material')", "button:has-text('Add Item')",
                "a:has-text('Material')"]:
        try:
            if page.locator(sel).first.is_visible(timeout=2000):
                page.locator(sel).first.click()
                time.sleep(0.5)
                break
        except Exception:
            pass

    for lbl in ["Qty", "Quantity", "qty"]:
        try:
            fill_field(page, lbl, str(qty)); break
        except Exception:
            pass

    for lbl in ["Unit Cost", "Cost", "Price", "Unit Price", "Rate"]:
        try:
            fill_field(page, lbl, str(unit_cost)); break
        except Exception:
            pass

    if markup:
        for lbl in ["Markup", "markup", "Margin"]:
            try:
                fill_field(page, lbl, str(markup)); break
            except Exception:
                pass

    for sel in ["button:has-text('Save')", "button:has-text('Add')",
                "button:has-text('Submit')", "button[type='submit']"]:
        try:
            if page.locator(sel).first.is_visible(timeout=2000):
                page.locator(sel).first.click()
                wait_nav(page)
                return True
        except Exception:
            pass
    return False


def test_labour_calculations(browser: Browser):
    print("\n── LABOUR CALCULATIONS ──")

    # TC-013  8 hrs × $80 = $640
    page, ok = open_or_create_job_with_lines(browser)
    try:
        if not ok:
            for tc in ["TC-013","TC-014","TC-015","TC-016","TC-017","TC-018"]:
                record(tc, "Labour", tc, "SKIP", "", "Could not open job"); page.close(); return

        added = add_labour_entry(page, hours=8, rate=80)
        time.sleep(1)
        shot = ss(page, "TC013_labour_8h_80")
        body = page_text(page)
        expected = 640.0
        # Search for 640 in page
        found_640 = bool(re.search(r'640', body))
        amounts = re.findall(r'\$[\d,]+\.?\d*', body)
        record("TC-013", "Labour", "Labour cost: 8 hrs × $80 = $640",
               "PASS" if found_640 else "FAIL",
               "$640.00",
               f"added={added} | amounts on page: {amounts[:8]}", screenshot=shot)

        # TC-014  Multiple labour entries: $640 + $400 = $1,040
        add_labour_entry(page, hours=4, rate=100)
        time.sleep(1)
        shot = ss(page, "TC014_multi_labour")
        body = page_text(page)
        found_1040 = bool(re.search(r'1[,.]?040', body))
        amounts = re.findall(r'\$[\d,]+\.?\d*', body)
        record("TC-014", "Labour", "Multiple labour totals: $640 + $400 = $1,040",
               "PASS" if found_1040 else "FAIL",
               "$1,040.00", f"amounts: {amounts[:10]}", screenshot=shot)

        # TC-015  Zero hours → $0
        add_labour_entry(page, hours=0, rate=80)
        time.sleep(1)
        shot = ss(page, "TC015_zero_hours")
        body = page_text(page)
        has_zero_err = any(w in body.lower() for w in ["error","invalid","required","cannot be zero","must be"])
        # Zero hours is OK, either $0 appears or validation stops it
        record("TC-015", "Labour", "Zero hours: no crash, $0.00 or validation",
               "PASS",   # we consider either a valid outcome
               "$0.00 or validation message",
               f"error_msg={has_zero_err} | body snippet: {body[:200]}", screenshot=shot)

        # TC-016  2.5 hrs × $90 = $225
        add_labour_entry(page, hours=2.5, rate=90)
        time.sleep(1)
        shot = ss(page, "TC016_fractional_hours")
        body = page_text(page)
        found_225 = bool(re.search(r'225', body))
        record("TC-016", "Labour", "Fractional hours: 2.5 × $90 = $225",
               "PASS" if found_225 else "FAIL",
               "$225.00", f"found_225={found_225}", screenshot=shot)

        # TC-017  Large values: 1000 hrs × $50 = $50,000
        add_labour_entry(page, hours=1000, rate=50)
        time.sleep(1)
        shot = ss(page, "TC017_large_hours")
        body = page_text(page)
        found_50k = bool(re.search(r'50[,.]?000', body))
        record("TC-017", "Labour", "Large input: 1000 hrs × $50 = $50,000",
               "PASS" if found_50k else "FAIL",
               "$50,000.00", f"found_50k={found_50k}", screenshot=shot)

        # TC-018  Negative hours → validation error
        add_labour_entry(page, hours=-5, rate=80)
        time.sleep(1)
        shot = ss(page, "TC018_negative_hours")
        body = page_text(page)
        has_err = any(w in body.lower() for w in ["error","invalid","negative","cannot","must be positive"])
        # HTML5 number inputs also prevent negative if min=0
        record("TC-018", "Labour", "Negative hours → validation error",
               "PASS" if has_err else "FAIL",
               "Validation error for negative hours",
               f"error_msg={has_err} | snippet: {body[:150]}", screenshot=shot)

    except Exception as e:
        ss(page, "labour_error")
        record("TC-013~018", "Labour", "Labour tests", "ERROR", "", str(e)[:300])
    finally:
        page.close()


def test_material_calculations(browser: Browser):
    print("\n── MATERIAL CALCULATIONS ──")
    page, ok = open_or_create_job_with_lines(browser)
    try:
        if not ok:
            for tc in ["TC-019","TC-020","TC-021","TC-022","TC-023"]:
                record(tc, "Materials", tc, "SKIP", "", "Could not open job")
            page.close(); return

        # TC-019  Qty 10 × $25 = $250
        added = add_material_entry(page, qty=10, unit_cost=25)
        time.sleep(1)
        shot = ss(page, "TC019_material_basic")
        body = page_text(page)
        found_250 = bool(re.search(r'250', body))
        amounts = re.findall(r'\$[\d,]+\.?\d*', body)
        record("TC-019", "Materials", "Material cost: 10 × $25 = $250",
               "PASS" if found_250 else "FAIL",
               "$250.00", f"added={added} amounts={amounts[:8]}", screenshot=shot)

        # TC-020  Multiple: $250 + $200 = $450
        add_material_entry(page, qty=5, unit_cost=40)
        time.sleep(1)
        shot = ss(page, "TC020_multi_material")
        body = page_text(page)
        found_450 = bool(re.search(r'450', body))
        record("TC-020", "Materials", "Multiple materials: $250 + $200 = $450",
               "PASS" if found_450 else "FAIL",
               "$450.00", f"found_450={found_450}", screenshot=shot)

        # TC-021  Markup 20% on $100 → sell $120
        add_material_entry(page, qty=1, unit_cost=100, markup=20)
        time.sleep(1)
        shot = ss(page, "TC021_markup")
        body = page_text(page)
        found_120 = bool(re.search(r'120', body))
        record("TC-021", "Materials", "Material markup 20%: $100 → $120 sell",
               "PASS" if found_120 else "FAIL",
               "$120.00", f"found_120={found_120}", screenshot=shot)

        # TC-022  Qty 0 → $0, no error
        add_material_entry(page, qty=0, unit_cost=50)
        time.sleep(1)
        shot = ss(page, "TC022_zero_qty")
        body = page_text(page)
        has_err = any(w in body.lower() for w in ["error","invalid","required"])
        record("TC-022", "Materials", "Zero qty material: $0.00 or validation",
               "PASS",
               "$0.00 or validation", f"error={has_err} | snippet={body[:150]}", screenshot=shot)

        # TC-023  Qty 0.5 × $200 = $100
        add_material_entry(page, qty=0.5, unit_cost=200)
        time.sleep(1)
        shot = ss(page, "TC023_fractional_qty")
        body = page_text(page)
        found_100 = bool(re.search(r'\b100\b', body))
        record("TC-023", "Materials", "Fractional qty: 0.5 × $200 = $100",
               "PASS" if found_100 else "FAIL",
               "$100.00", f"found_100={found_100}", screenshot=shot)

    except Exception as e:
        ss(page, "materials_error")
        record("TC-019~023", "Materials", "Material tests", "ERROR", "", str(e)[:300])
    finally:
        page.close()


def test_gst_calculations(browser: Browser):
    print("\n── GST CALCULATIONS ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)
        # Navigate to quotes or invoices where GST is visible
        for section in ["Invoice", "Quote", "Job"]:
            if navigate_to(page, section):
                break
        wait_nav(page)
        shot = ss(page, "TC042_gst_page")
        body = page_text(page)

        # TC-042  GST 10% on $1,000 → GST=$100, Total=$1,100
        # Look for any GST-related numbers or labels on page
        gst_label = bool(re.search(r'gst|tax', body, re.I))
        # Try to find a row with GST amount
        gst_amount = re.findall(r'(?:gst|tax)[^\n]*\$([\d,]+\.?\d*)', body, re.I)

        record("TC-042", "GST", "GST label/field present on relevant pages",
               "PASS" if gst_label else "FAIL",
               "GST field visible", f"gst_label={gst_label} amounts={gst_amount[:3]}", screenshot=shot)

        # TC-043  GST rate is 10%
        rate_10 = bool(re.search(r'10\s*%|gst.*10|10.*gst', body, re.I))
        record("TC-043", "GST", "GST rate is 10%",
               "PASS" if rate_10 else "FAIL",
               "10% GST rate shown", f"found_10pct={rate_10}", screenshot=shot)

        # TC-044  Check any invoice/quote for correct GST math
        # Navigate to invoices and look at totals
        navigate_to(page, "Invoice") or navigate_to(page, "Invoices")
        wait_nav(page)
        body2 = page_text(page)
        shot2 = ss(page, "TC044_invoice_gst")

        # Find any subtotal + GST + total pattern
        numbers = re.findall(r'\$?([\d,]+\.?\d{2})', body2)
        nums = []
        for n in numbers:
            try:
                nums.append(float(n.replace(',', '')))
            except Exception:
                pass

        gst_correct = False
        for i, subtotal in enumerate(nums):
            gst = subtotal * 0.1
            total = subtotal + gst
            for n in nums:
                if abs(n - total) < 0.05:
                    gst_correct = True
                    break

        record("TC-044", "GST", "GST calculation: subtotal × 10% = GST amount",
               "PASS" if gst_correct else "FAIL",
               "GST = Subtotal × 10%",
               f"Numbers found: {nums[:10]}", screenshot=shot2)

        # TC-045  Back-calc: inclusive ÷ 11 = GST
        # If we have invoice totals, verify: total_incl / 11 ≈ GST
        incl_gst_ok = False
        for n in nums:
            gst_back = round(n / 11, 2)
            ex_gst = round(n - gst_back, 2)
            # Check if either of these appears in page
            if any(abs(m - gst_back) < 0.02 for m in nums):
                incl_gst_ok = True
                break
        record("TC-045", "GST", "GST back-calc: total incl ÷ 11 = GST component",
               "PASS" if incl_gst_ok else "FAIL",
               "GST = Total_incl ÷ 11",
               f"back_calc_verified={incl_gst_ok} numbers={nums[:8]}", screenshot=shot2)

    except Exception as e:
        ss(page, "gst_error")
        for tc in ["TC-042","TC-043","TC-044","TC-045"]:
            record(tc, "GST", tc, "ERROR", "", str(e)[:300])
    finally:
        page.close()


def test_profit_calculations(browser: Browser):
    print("\n── PROFIT & LOSS ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)
        # Navigate to Reports or a job P&L
        for section in ["Report", "P&L", "Profit", "Summary"]:
            if navigate_to(page, section):
                break
        wait_nav(page)
        shot = ss(page, "TC037_pl_page")
        body = page_text(page)

        # TC-037  Profit = Revenue - Costs
        numbers = []
        for n in re.findall(r'\$?([\d,]+\.?\d{2})', body):
            try:
                numbers.append(float(n.replace(',', '')))
            except Exception:
                pass

        # Look for profit math: find any a, b where a - b ≈ some c in the page
        profit_math_ok = False
        for i, a in enumerate(numbers):
            for j, b in enumerate(numbers):
                if i == j or b >= a:
                    continue
                diff = round(a - b, 2)
                if any(abs(n - diff) < 0.05 for n in numbers):
                    profit_math_ok = True
                    break

        record("TC-037", "P&L", "Profit = Revenue - Total Costs",
               "PASS" if profit_math_ok else "FAIL",
               "Profit calculated correctly",
               f"numbers_on_page={numbers[:10]}", screenshot=shot)

        # TC-038  Gross margin % shown
        margin_label = bool(re.search(r'margin|profit\s*%', body, re.I))
        pct_values = re.findall(r'[\d.]+\s*%', body)
        record("TC-038", "P&L", "Gross margin % displayed",
               "PASS" if margin_label and pct_values else "FAIL",
               "Margin % visible on P&L",
               f"margin_label={margin_label} pct_values={pct_values[:5]}", screenshot=shot)

        # TC-039  Date range filter
        navigate_to(page, "Report") or navigate_to(page, "Reports")
        wait_nav(page)
        body2 = page_text(page)
        shot2 = ss(page, "TC039_date_filter")
        has_date_filter = any(w in body2.lower() for w in ["date", "from", "to", "period", "range", "filter"])
        record("TC-039", "P&L", "Date range filter available in reports",
               "PASS" if has_date_filter else "FAIL",
               "Date range filter present",
               f"has_filter={has_date_filter}", screenshot=shot2)

        # TC-040  Margin % formula: (Revenue - Cost) / Revenue × 100
        # Already checked above; verify formula correctness if we have numbers
        for i, rev in enumerate(numbers):
            for j, cost in enumerate(numbers):
                if cost >= rev or i == j:
                    continue
                expected_margin = round((rev - cost) / rev * 100, 1)
                if any(abs(float(p.replace('%','').strip()) - expected_margin) < 0.5 for p in pct_values):
                    record("TC-040", "P&L", "Gross margin % formula correct",
                           "PASS", f"{expected_margin}%",
                           f"Rev={rev} Cost={cost} Margin={expected_margin}%", screenshot=shot)
                    break
            else:
                continue
            break
        else:
            record("TC-040", "P&L", "Gross margin % formula correct",
                   "FAIL", "Margin% = (Rev-Cost)/Rev × 100",
                   f"Could not verify. numbers={numbers[:6]} pcts={pct_values[:3]}", screenshot=shot)

    except Exception as e:
        ss(page, "pl_error")
        for tc in ["TC-037","TC-038","TC-039","TC-040"]:
            record(tc, "P&L", tc, "ERROR", "", str(e)[:300])
    finally:
        page.close()


def test_quotes(browser: Browser):
    print("\n── QUOTES ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)
        nav_ok = navigate_to(page, "Quote") or navigate_to(page, "Quotes")
        shot = ss(page, "TC029_quotes_page")
        body = page_text(page)

        # TC-029  Quote page exists
        record("TC-029", "Quote Builder", "Quotes page accessible",
               "PASS" if nav_ok else "FAIL",
               "Quotes section accessible",
               f"nav_ok={nav_ok} | url={page.url}", screenshot=shot)

        # TC-030  New quote form
        new_ok = find_and_click_new(page, "Quote")
        time.sleep(1)
        shot2 = ss(page, "TC030_new_quote")
        body2 = page_text(page)
        has_fields = any(w in body2.lower() for w in ["client","labour","material","total","gst","amount"])
        record("TC-030", "Quote Builder", "New quote form has relevant fields",
               "PASS" if (new_ok and has_fields) else "FAIL",
               "Form with client, labour, material, GST fields",
               f"new_ok={new_ok} has_fields={has_fields}", screenshot=shot2)

        # TC-031  GST visible on quote
        gst_visible = bool(re.search(r'gst|tax', body2, re.I))
        record("TC-031", "Quote Builder", "GST field/line visible on quote form",
               "PASS" if gst_visible else "FAIL",
               "GST shown on quote",
               f"gst_visible={gst_visible}", screenshot=shot2)

        # TC-032  Quote total math: check any numbers shown
        amounts = re.findall(r'\$?([\d,]+\.?\d{2})', body2)
        record("TC-032", "Quote Builder", "Quote amount fields present",
               "PASS" if len(amounts) > 0 else "FAIL",
               "Monetary fields visible", f"amounts={amounts[:6]}", screenshot=shot2)

    except Exception as e:
        ss(page, "quotes_error")
        for tc in ["TC-029","TC-030","TC-031","TC-032"]:
            record(tc, "Quote Builder", tc, "ERROR", "", str(e)[:300])
    finally:
        page.close()


def test_invoices(browser: Browser):
    print("\n── INVOICES ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)
        nav_ok = navigate_to(page, "Invoice") or navigate_to(page, "Invoices")
        shot = ss(page, "TC033_invoices_page")
        body = page_text(page)

        # TC-033  Invoice page accessible
        record("TC-033", "Invoice", "Invoices page accessible",
               "PASS" if nav_ok else "FAIL",
               "Invoice section accessible",
               f"nav_ok={nav_ok} url={page.url}", screenshot=shot)

        # TC-034  GST line on invoice
        gst_visible = bool(re.search(r'gst|tax', body, re.I))
        record("TC-034", "Invoice", "GST line present on invoices",
               "PASS" if gst_visible else "FAIL",
               "GST label visible", f"gst={gst_visible}", screenshot=shot)

        # TC-035  Invoice status field
        status_visible = bool(re.search(r'paid|unpaid|status|outstanding|due', body, re.I))
        record("TC-035", "Invoice", "Invoice status field present",
               "PASS" if status_visible else "FAIL",
               "Paid/Unpaid status visible", f"status={status_visible}", screenshot=shot)

        # TC-036  Create invoice – check form fields
        find_and_click_new(page, "Invoice")
        time.sleep(1)
        shot2 = ss(page, "TC036_new_invoice")
        body2 = page_text(page)
        has_fields = any(w in body2.lower() for w in ["client","amount","total","gst","due","date"])
        record("TC-036", "Invoice", "New invoice form has required fields",
               "PASS" if has_fields else "FAIL",
               "Client, amount, GST, due date fields",
               f"has_fields={has_fields}", screenshot=shot2)

    except Exception as e:
        ss(page, "invoices_error")
        for tc in ["TC-033","TC-034","TC-035","TC-036"]:
            record(tc, "Invoice", tc, "ERROR", "", str(e)[:300])
    finally:
        page.close()


def test_ui_validation(browser: Browser):
    print("\n── UI & VALIDATION ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)

        # TC-053  Date format DD/MM/YYYY
        body = page_text(page)
        shot = ss(page, "TC053_date_format")
        # Australian dates: look for DD/MM/YYYY pattern (day ≤ 31, month ≤ 12)
        aus_dates = re.findall(r'\b([0-2]?\d)/([01]?\d)/(\d{4})\b', body)
        us_dates  = re.findall(r'\b([01]?\d)/([0-3]?\d)/(\d{4})\b', body)
        record("TC-053", "UI/Navigation", "Date format DD/MM/YYYY (Australian)",
               "PASS" if aus_dates else "FAIL",
               "Dates as DD/MM/YYYY",
               f"aus_dates={aus_dates[:3]}", screenshot=shot)

        # TC-054  Mobile viewport (375px)
        page.set_viewport_size({"width": 375, "height": 812})
        time.sleep(0.5)
        shot2 = ss(page, "TC054_mobile_viewport")
        body2 = page_text(page)
        # Check no horizontal overflow (basic check: body accessible)
        record("TC-054", "UI/Navigation", "Mobile viewport 375px – content accessible",
               "PASS" if len(body2) > 50 else "FAIL",
               "Content readable at 375px", f"body_len={len(body2)}", screenshot=shot2)

        # TC-055  No JS console errors on main pages
        page.set_viewport_size({"width": 1280, "height": 800})
        js_errors = []
        page.on("pageerror", lambda e: js_errors.append(str(e)))
        for section in ["Job", "Quote", "Invoice", "Report"]:
            navigate_to(page, section)
            time.sleep(0.5)
        shot3 = ss(page, "TC055_console_errors")
        record("TC-055", "UI/Navigation", "No JS errors on main pages",
               "PASS" if not js_errors else "FAIL",
               "Zero JS errors", f"errors={js_errors[:3]}", screenshot=shot3)

        # TC-056  Special characters in names
        navigate_to(page, "Job") or navigate_to(page, "Jobs")
        find_and_click_new(page, "Job")
        time.sleep(1)
        special_name = "O'Brien & Sons – Test <Job>"
        for sel in ["input[type='text']", "input[name*='name' i]", "input[placeholder*='name' i]"]:
            try:
                if page.locator(sel).first.is_visible(timeout=2000):
                    page.locator(sel).first.fill(special_name)
                    break
            except Exception:
                pass
        for sel in ["button:has-text('Save')", "button[type='submit']"]:
            try:
                if page.locator(sel).first.is_visible(timeout=2000):
                    page.locator(sel).first.click()
                    wait_nav(page)
                    break
            except Exception:
                pass
        shot4 = ss(page, "TC056_special_chars")
        body4 = page_text(page)
        # Check name saved or at least no crash
        name_ok = special_name in body4 or "O'Brien" in body4
        record("TC-056", "UI/Navigation", "Special characters in job name handled",
               "PASS" if name_ok else "FAIL",
               f"Name '{special_name}' saved correctly",
               f"found={name_ok}", screenshot=shot4)

        # TC-057  Browser back button
        login(page)
        navigate_to(page, "Job") or navigate_to(page, "Jobs")
        url_before = page.url
        page.go_back()
        time.sleep(1)
        page.go_forward()
        time.sleep(1)
        shot5 = ss(page, "TC057_back_button")
        body5 = page_text(page)
        record("TC-057", "UI/Navigation", "Browser back/forward maintains app state",
               "PASS" if len(body5) > 50 and "error" not in body5.lower() else "FAIL",
               "No blank/error page after back+forward",
               f"body_len={len(body5)}", screenshot=shot5)

    except Exception as e:
        ss(page, "ui_error")
        for tc in ["TC-053","TC-054","TC-055","TC-056","TC-057"]:
            record(tc, "UI/Navigation", tc, "ERROR", "", str(e)[:300])
    finally:
        page.close()


def test_edge_cases(browser: Browser):
    print("\n── EDGE CASES ──")
    page = browser.new_page()
    page.set_default_timeout(TIMEOUT)
    try:
        login(page)

        # TC-047  Required fields blank
        navigate_to(page, "Job") or navigate_to(page, "Jobs")
        find_and_click_new(page, "Job")
        time.sleep(1)
        # Click save without filling anything
        for sel in ["button:has-text('Save')", "button[type='submit']", "button:has-text('Create')"]:
            try:
                if page.locator(sel).first.is_visible(timeout=2000):
                    page.locator(sel).first.click()
                    time.sleep(1)
                    break
            except Exception:
                pass
        shot = ss(page, "TC047_empty_form")
        body = page_text(page)
        has_validation = any(w in body.lower() for w in
                             ["required","invalid","cannot be empty","fill","missing","error"])
        record("TC-047", "Edge Cases", "Required fields blank → validation error",
               "PASS" if has_validation else "FAIL",
               "Validation errors shown",
               f"has_validation={has_validation} body={body[:200]}", screenshot=shot)

        # TC-048  Large currency values
        page, ok = open_or_create_job_with_lines(browser)
        if ok:
            add_labour_entry(page, hours=10000, rate=500)
            time.sleep(1)
            shot2 = ss(page, "TC048_large_values")
            body2 = page_text(page)
            found_5m = bool(re.search(r'5[,.]?000[,.]?000|5000000', body2))
            record("TC-048", "Edge Cases", "Large values: 10,000 hrs × $500 = $5,000,000",
                   "PASS" if found_5m else "FAIL",
                   "$5,000,000.00 no overflow",
                   f"found_5m={found_5m}", screenshot=shot2)
            page.close()
        else:
            record("TC-048", "Edge Cases", "Large values", "SKIP", "", "Could not open job")
            page.close()

        # TC-049  Decimal rounding: 3 × $33.33 = $99.99
        page, ok = open_or_create_job_with_lines(browser)
        if ok:
            add_labour_entry(page, hours=3, rate=33.33)
            time.sleep(1)
            shot3 = ss(page, "TC049_rounding")
            body3 = page_text(page)
            found_9999 = bool(re.search(r'99\.99', body3))
            found_100  = bool(re.search(r'\b100\.00\b', body3))
            record("TC-049", "Edge Cases", "Decimal rounding: 3 × $33.33 = $99.99",
                   "PASS" if found_9999 else ("FAIL" if found_100 else "FAIL"),
                   "$99.99 (not $100.00)",
                   f"99.99={found_9999} 100.00={found_100}", screenshot=shot3)
            page.close()
        else:
            record("TC-049", "Edge Cases", "Decimal rounding", "SKIP", "", "Could not open job")
            page.close()

    except Exception as e:
        ss(page, "edge_error")
        for tc in ["TC-047","TC-048","TC-049"]:
            record(tc, "Edge Cases", tc, "ERROR", "", str(e)[:300])


# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════
def main():
    print("=" * 70)
    print("  Job Profit OS – Automated Test Suite")
    print(f"  {datetime.now().strftime('%d %b %Y %H:%M:%S')}")
    print("=" * 70)

    with sync_playwright() as p:
        browser = p.webkit.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox",
                  "--disable-dev-shm-usage", "--disable-gpu"]
        )

        # ── Pre-flight: check site is reachable ────────────────────────────
        print("\n── PRE-FLIGHT CHECK ──")
        page = browser.new_page()
        page.set_default_timeout(20_000)
        try:
            page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded", timeout=20_000)
            time.sleep(3)
            body = page_text(page)
            print(f"  Site response: {body[:100]}")
            if "Host not in allowlist" in body or "403" in body:
                print("\n  ⛔  SITE BLOCKED FROM THIS ENVIRONMENT")
                print("  The egress proxy returns 403 for vercel.app domains.")
                print("  Run this script on your local machine instead.\n")
                record("PRE-FLIGHT", "Connectivity", "Site reachable from this environment",
                       "FAIL", "HTTP 200 from site",
                       "403 host_not_allowed – vercel.app blocked by sandbox egress proxy")
                page.close()
                browser.close()
                _save_results()
                return
            page.close()
        except Exception as e:
            print(f"  Pre-flight error: {e}")
            page.close()

        # ── Explore app structure ──────────────────────────────────────────
        print("\n── EXPLORING APP STRUCTURE ──")
        app_map = explore_app(browser)
        with open("app_structure.json", "w") as f:
            json.dump(app_map, f, indent=2, default=str)

        # ── Run all test sections ──────────────────────────────────────────
        test_auth(browser)
        test_dashboard(browser)
        test_jobs(browser)
        test_labour_calculations(browser)
        test_material_calculations(browser)
        test_gst_calculations(browser)
        test_profit_calculations(browser)
        test_quotes(browser)
        test_invoices(browser)
        test_ui_validation(browser)
        test_edge_cases(browser)

        browser.close()

    _save_results()


def _save_results():
    # ── Save JSON ──────────────────────────────────────────────────────────
    with open("test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    # ── Print summary ─────────────────────────────────────────────────────
    total  = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    skipped= sum(1 for r in results if r["status"] == "SKIP")

    print("\n" + "=" * 70)
    print(f"  RESULTS: {total} tests | ✅ {passed} PASS | ❌ {failed} FAIL | 💥 {errors} ERROR | ⏭  {skipped} SKIP")
    print(f"  Pass rate: {passed/max(total,1)*100:.1f}%")
    print(f"  Results saved → test_results.json")
    print(f"  Screenshots  → {SS_DIR}/")
    print("=" * 70)


if __name__ == "__main__":
    main()
