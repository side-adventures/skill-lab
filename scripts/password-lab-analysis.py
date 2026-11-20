"""Password Lab analysis: which parts of a password are hard to remember.

Usage: python3 scripts/password-lab-analysis.py lab1.json [lab2.json ...]  (the Password Lab downloads)
Pure Python (no numpy). Reads the lab downloads, finds what went wrong in each answer, and reports error rates per
part plus a small model of what makes a whole password fail.
"""
import json
import math
import sys
from collections import Counter, defaultdict

# ---------- characters ----------

CHANGES = {'a': 'A4@', 'b': 'B8', 'e': 'E3', 'g': 'G9', 'i': '1', 'l': 'L1', 'o': '0', 's': 'S5$', 't': 'T7', 'z': 'Z2'}
SEPS = set('-_. ')


def options(letter):
    return CHANGES.get(letter, letter.upper())


def bases(ch):
    """Letters a typed character could stand for (its plain letter, or the letter a leet char replaces)."""
    out = set()
    if ch.isalpha():
        out.add(ch.lower())
    for letter, opts in CHANGES.items():
        if ch in opts:
            out.add(letter)
    return out


def same(typed, shown):
    """Equal for the check: exact, or O for 0 / I for 1 (as in the game)."""
    return typed == shown or (shown == '0' and typed == 'O') or (shown == '1' and typed == 'I')


# ---------- labelling the password ----------

def labels(rec, order=None):
    """One label per password character: word letter (plain or changed), separator, extra. `order` permutes words."""
    words = [w['word'] for w in rec['words']]
    order = order or list(range(len(words)))
    changed = {(c['word'], c['index']): c for c in rec['changes']}
    text, labs = '', []
    for pos, w in enumerate(order):
        if pos > 0 and rec['sep']:
            text += rec['sep']
            labs.append({'type': 'sep', 'sep': rec['sep']})
        for i, letter in enumerate(words[w]):
            c = changed.get((w, i))
            if c:
                text += c['to']
                labs.append({'type': 'change', 'word': w, 'from': letter, 'to': c['to'], 'kind': c['kind'],
                             'where': 'first' if c['first'] else 'last' if c['last'] else 'middle',
                             'run': (w, i - 1) in changed or (w, i + 1) in changed})
            else:
                text += letter
                labs.append({'type': 'letter', 'word': w, 'letter': letter})
    for k, e in enumerate(rec['extras']):
        text += e['char']
        labs.append({'type': 'extra', 'k': k, 'kind': e['kind'], 'char': e['char']})
    return text, labs


# ---------- aligning what was typed ----------

def sub_cost(t, lab, shown):
    if same(t, shown):
        return 0.0
    if lab['type'] in ('letter', 'change'):
        letter = lab['letter'] if lab['type'] == 'letter' else lab['from']
        if letter in bases(t):
            return 0.4  # same letter, other form (forgotten / added / other change)
    return 1.0


def align(text, labs, typed):
    """Optimal string alignment (edits + swapped neighbours). Returns ops: (op, i_password, j_typed)."""
    n, m = len(text), len(typed)
    INF = float('inf')
    d = [[INF] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    d[0][0] = 0
    for i in range(n + 1):
        for j in range(m + 1):
            if i == 0 and j == 0:
                continue
            best, how = INF, None
            if i > 0 and d[i - 1][j] + 1 < best:
                best, how = d[i - 1][j] + 1, 'del'
            if j > 0 and d[i][j - 1] + 1 < best:
                best, how = d[i][j - 1] + 1, 'ins'
            if i > 0 and j > 0:
                c = d[i - 1][j - 1] + sub_cost(typed[j - 1], labs[i - 1], text[i - 1])
                if c < best:
                    best, how = c, 'sub'
            if i > 1 and j > 1 and same(typed[j - 1], text[i - 2]) and same(typed[j - 2], text[i - 1]) \
                    and not same(typed[j - 1], text[i - 1]):
                if d[i - 2][j - 2] + 1 < best:
                    best, how = d[i - 2][j - 2] + 1, 'swap'
            d[i][j], back[i][j] = best, how
    ops, i, j = [], n, m
    while i > 0 or j > 0:
        how = back[i][j]
        if how == 'del':
            ops.append(('del', i - 1, None)); i -= 1
        elif how == 'ins':
            ops.append(('ins', None, j - 1)); j -= 1
        elif how == 'sub':
            ops.append(('sub', i - 1, j - 1)); i -= 1; j -= 1
        else:
            ops.append(('swap', i - 1, j - 2)); ops.append(('swap', i - 2, j - 1)); i -= 2; j -= 2
    return list(reversed(ops))


# ---------- word order ----------

def norm_word(chunk):
    return [''.join(sorted(bases(c))[0] if bases(c) else c for c in chunk)]


def word_distance(a, b):
    """Edit distance between a typed chunk (leet / case allowed) and a plain word."""
    n, m = len(a), len(b)
    d = list(range(m + 1))
    for i in range(1, n + 1):
        prev, d[0] = d[0], i
        for j in range(1, m + 1):
            cur = d[j]
            ok = b[j - 1] in bases(a[i - 1]) or a[i - 1] == b[j - 1]
            d[j] = min(d[j] + 1, d[j - 1] + 1, prev + (0 if ok else 1))
            prev = cur
    return d[m]


def typed_order(rec):
    """If the typed words are the password's words in another order, that order; else None."""
    words = [w['word'] for w in rec['words']]
    if len(words) < 2:
        return None
    body = rec['typed'][:len(rec['typed']) - len(rec['extras'])] if rec['extras'] else rec['typed']
    chunks = [c for c in ''.join(' ' if ch in SEPS else ch for ch in body).split(' ') if c]
    if len(chunks) != len(words):
        return None
    order = []
    for c in chunks:
        dist = [(word_distance(c, w), k) for k, w in enumerate(words) if k not in order]
        best = min(dist)
        if best[0] > 1:
            return None
        order.append(best[1])
    return order if order != list(range(len(words))) else None


# ---------- one answer ----------

def analyse(rec):
    """Outcome for every part of one password."""
    order = typed_order(rec)
    text, labs = labels(rec, order)
    ops = align(text, labs, rec['typed'])
    out = {'labs': labs, 'order': order is not None, 'res': [None] * len(labs), 'added': 0, 'inserted': Counter()}
    for op, i, j in ops:
        if op == 'ins':
            # Attribute to the nearest password part (the one before, or the first).
            out['inserted']['any'] += 1
            continue
        lab = labs[i]
        if op == 'del':
            out['res'][i] = 'missing'
            continue
        t = rec['typed'][j]
        if op == 'swap':
            out['res'][i] = 'order'
        elif same(t, text[i]):
            out['res'][i] = 'ok'
        elif lab['type'] == 'change':
            if t == lab['from']:
                out['res'][i] = 'forgotten'
            elif lab['from'] in bases(t):
                out['res'][i] = 'other form'
            else:
                out['res'][i] = 'wrong'
        elif lab['type'] == 'letter':
            if lab['letter'] in bases(t):
                out['res'][i] = 'added change'
                out['added'] += 1
            else:
                out['res'][i] = 'wrong'
        else:
            out['res'][i] = 'wrong'
            out.setdefault('typed_instead', []).append((lab, t))
    # Extras: right characters in the wrong order count as one order error, not several wrong ones.
    ex = [k for k, lab in enumerate(labs) if lab['type'] == 'extra']
    if len(ex) >= 2:
        shown = ''.join(text[k] for k in ex)
        typed_tail = rec['typed'][-len(ex):] if len(rec['typed']) >= len(ex) else ''
        if sorted(typed_tail) == sorted(shown) and typed_tail != shown:
            for k in ex:
                out['res'][k] = 'ok' if typed_tail[k - ex[0]] == text[k] else 'order'
            out['extras_order'] = True
    return out


# ---------- small logistic regression (Newton, with a little ridge) ----------

def solve(a, b):
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(m[r][c]))
        m[c], m[p] = m[p], m[c]
        for r in range(n):
            if r != c and m[c][c] != 0:
                f = m[r][c] / m[c][c]
                m[r] = [x - f * y for x, y in zip(m[r], m[c])]
    return [m[i][n] / m[i][i] for i in range(n)]


def logistic(xs, ys, ridge=1.0, iters=50):
    k = len(xs[0])
    w = [0.0] * k
    for _ in range(iters):
        g = [0.0] * k
        h = [[0.0] * k for _ in range(k)]
        for x, y in zip(xs, ys):
            z = sum(a * b for a, b in zip(w, x))
            p = 1 / (1 + math.exp(-z))
            for i in range(k):
                g[i] += (y - p) * x[i]
                for j in range(k):
                    h[i][j] += p * (1 - p) * x[i] * x[j]
        for i in range(1, k):
            g[i] -= ridge * w[i]
            h[i][i] += ridge
        step = solve(h, g)
        w = [a + b for a, b in zip(w, step)]
        if max(abs(s) for s in step) < 1e-8:
            break
    return w


# ---------- report ----------

def pct(a, b):
    return f'{100 * a / b:4.0f} %' if b else '   —'


def main(paths):
    # Each download holds every answer saved so far, so several downloads overlap: keep each answer once.
    seen, records = set(), []
    for p in paths:
        for r in json.load(open(p))['records']:
            key = (r['at'], r['text'])
            if key not in seen:
                seen.add(key)
                records.append(r)
    records.sort(key=lambda r: r['at'])
    used = [r for r in records if not r.get('skipped')]
    right = lambda r: bool(r['ok'] or r.get('typo'))
    misses = [r for r in used if not right(r)]

    print(f'Answers: {len(records)} · used {len(used)} (skipped {len(records) - len(used)}, '
          f'typos counted as right {sum(1 for r in records if r.get("typo"))}) · right {pct(len(used) - len(misses), len(used))}')
    by_parts = defaultdict(lambda: [0, 0])
    for r in used:
        by_parts[r['parts']][0] += 1
        by_parts[r['parts']][1] += right(r)
    versions = Counter(r.get('labVersion', 1) for r in used)
    print('Lab versions: ' + '  '.join(f'v{v}: {n}' for v, n in sorted(versions.items()))
          + '   (v1: space shown as ␣ · v2: space as a plain gap)')
    print('By parts:  ' + '  '.join(f'{k}: {v[1]}/{v[0]}' for k, v in sorted(by_parts.items())))

    # Part outcomes over all used answers (typos left out of the part counts: their errors are slips).
    stats = defaultdict(Counter)
    sep_swaps = Counter()
    order_words = [0, 0]
    extras_order = [0, 0]
    miss_causes = Counter()
    word_err = defaultdict(lambda: [0, 0])
    for r in used:
        if r.get('typo'):
            continue
        a = analyse(r)
        causes = set()
        if len(r['words']) >= 2:
            order_words[0] += 1
            if a['order']:
                order_words[1] += 1
                causes.add('word order')
        if len(r['extras']) >= 2:
            extras_order[0] += 1
            if a.get('extras_order'):
                extras_order[1] += 1
                causes.add('extras order')
        per_word = defaultdict(list)
        for lab, res in zip(a['labs'], a['res']):
            t = lab['type']
            if t == 'change':
                for key in (f'change · {lab["kind"]}', f'change · {lab["where"]} letter',
                            'change · next to another' if lab['run'] else 'change · on its own'):
                    stats[key][res] += 1
                if res != 'ok':
                    causes.add('change ' + res)
                per_word[lab['word']].append(res)
            elif t == 'letter':
                per_word[lab['word']].append(res)
                if res == 'added change':
                    causes.add('added a change')
            elif t == 'sep':
                stats[f'separator "{lab["sep"]}"'][res] += 1
                if res != 'ok':
                    causes.add('separator')
            elif t == 'extra':
                stats[f'extra · {lab["kind"]}'][res] += 1
                stats[f'extra · position {lab["k"] + 1}'][res] += 1
                if res not in ('ok', 'order'):
                    causes.add(f'extra {lab["kind"]} {res}')
        for lab, t in a.get('typed_instead', []):
            if lab['type'] == 'sep':
                sep_swaps[(lab['sep'], t)] += 1
        # A change forgotten and another letter of the same word changed instead: the change moved to the wrong letter.
        for w, res in per_word.items():
            if 'forgotten' in res and 'added change' in res:
                causes.add('change on the wrong letter')
                stats['change · moved to another letter of its word']['moved'] += 1
        # A word counts as misremembered when one of its plain letters is wrong or missing.
        for w, res in per_word.items():
            group = 'combined word' if len(r['words']) > 1 else r['group']
            letters = [x for x, lab in zip(a['res'], a['labs']) if lab['type'] == 'letter' and lab['word'] == w]
            bad = any(x in ('wrong', 'missing') for x in letters)
            word_err[group][0] += 1
            word_err[group][1] += bad
            if bad:
                causes.add('word misremembered')
        if a['inserted']['any']:
            causes.add('extra characters typed')
        if not right(r):
            for c in causes or {'(unclear)'}:
                miss_causes[c] += 1

    print(f'\nWhat went wrong in the {len(misses)} misses (one miss can have several causes):')
    for c, n in miss_causes.most_common():
        print(f'  {c:28} {n:3}  ({pct(n, len(misses))} of misses)')

    def table(title, prefix):
        print(f'\n{title}')
        for key in sorted(k for k in stats if k.startswith(prefix)):
            c = stats[key]
            n = sum(c.values())
            bad = n - c['ok']
            detail = ', '.join(f'{k} {v}' for k, v in c.most_common() if k != 'ok')
            print(f'  {key:30} {n:4}  wrong {pct(bad, n)}   {detail}')

    table('Changed letters (per letter):', 'change')
    table('Extra characters (per character):', 'extra')
    table('Separators:', 'separator')
    space = defaultdict(lambda: [0, 0])
    for r in used:
        if r['sep'] == ' ' and not r.get('typo'):
            a = analyse(r)
            for lab, res in zip(a['labs'], a['res']):
                if lab['type'] == 'sep':
                    v = r.get('labVersion', 1)
                    space[v][0] += 1
                    space[v][1] += res != 'ok'
    if space:
        print('  space by lab version: ' + '  '.join(f'v{v}: {b} of {n} wrong' for v, (n, b) in sorted(space.items())))
    if sep_swaps:
        print('  typed instead: ' + ', '.join(f'"{a}" → "{b}" {n}×' for (a, b), n in sep_swaps.most_common()))
    print('\nWords misremembered (a plain letter wrong or missing):')
    for g, (n, bad) in sorted(word_err.items()):
        print(f'  {g:30} {n:4}  wrong {pct(bad, n)}')
    print(f'\nOrder: words swapped in {order_words[1]} of {order_words[0]} multi-word passwords · '
          f'extras shuffled in {extras_order[1]} of {extras_order[0]} passwords with 2+ extras')

    # Model: chance of getting the whole password right, from its parts.
    feats = ['words', 'letters (per 4)', 'change upper', 'change digit', 'change symbol', 'extra digit',
             'extra symbol', 'no separator']

    def x(r):
        ch = Counter(c['kind'] for c in r['changes'])
        ex = Counter(e['kind'] for e in r['extras'])
        return [1.0, len(r['words']), sum(w['length'] for w in r['words']) / 4, ch['upper'], ch['digit'], ch['symbol'],
                ex['digit'], ex['symbol'], 1.0 if r['sep'] == '' else 0.0]

    xs = [x(r) for r in used]
    ys = [1.0 if right(r) else 0.0 for r in used]
    w = logistic(xs, ys)
    ref = -w[6]  # one extra digit
    print('\nModel (logistic, a little ridge): how much each part lowers the odds of getting it right')
    print(f'  {"part":18} {"weight":>7}   in "extra digits"')
    for f, v in zip(feats, w[1:]):
        print(f'  {f:18} {-v:7.2f}   {(-v / ref if ref > 0 else float("nan")):6.2f}')
    print(f'  (n = {len(used)}, {len(misses)} misses: rough; needs ~300 answers to settle)')


if __name__ == '__main__':
    main(sys.argv[1:])
