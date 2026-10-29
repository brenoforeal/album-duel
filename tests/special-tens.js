// Special 10s tests. Run on the app page (local http server):
//   await fetch('tests/special-tens.js?' + Date.now()).then(r => r.text()).then(t => (0, eval)(t))
(() => {
  const out = [];
  const norm = v => v instanceof Set ? [...v].sort() : v;
  const eq = (a, b) => { const x = JSON.stringify(norm(a)), y = JSON.stringify(norm(b)); if (x !== y) throw new Error(`got ${x}, want ${y}`); };
  const ui = { ...S.ui };
  // No saved data: add a throwaway 2-person slot (never saved) so slot-based tests have something to read
  const cur0 = { ...S.cur }, tmp = !slot() && { id: 'tmpTest', name: 'Test', people: [{ id: 'pB', name: 'A', color: '#5aa9ff' }, { id: 'pE', name: 'B', color: '#ff6fae' }], cmp: ['pB', 'pE'], bands: [{ id: 'tmpBand', name: 'Test band', best: {}, albums: [] }] };
  if (tmp) { S.slots.push(tmp); S.cur = { slot: tmp.id, band: 'tmpBand' }; }
  const T = (name, fn) => { try { fn(); out.push('PASS ' + name); } catch (e) { out.push('FAIL ' + name + ': ' + e.message); } finally { Object.assign(S.ui, ui); } };
  const starFixture = () => {
    const rows = [['noro', 'Noro', '10*', '10**'], ['daisy', 'Daisy', '10*', '10*'], ['stole', 'You Stole', 10, '10**'], ['jar', 'In a Jar', 10, '10*'],
      ['bottom', 'At the Bottom', '10*', 10], ['bed', 'Bed', 10, 9.75], ['gas', 'Gasoline', 9.5, 10]];
    return { id: 'fx', title: 'Daisy', tracks: rows.map(r => ({ id: r[0], title: r[1] })), ranks: {}, off: [],
      scores: { pB: Object.fromEntries(rows.map(r => [r[0], r[2]])), pE: Object.fromEntries(rows.map(r => [r[0], r[3]])) } };
  };

  // ---- Task 1: score value model ----
  T('starLevel', () => { eq([starLevel('10*'), starLevel('10**'), starLevel(10), starLevel('x'), starLevel('')], [1, 2, 0, 0, 0]); });
  T('scoreNum off', () => { S.ui.countStars = false; eq([scoreNum('10*'), scoreNum('10**'), scoreNum(9.5), scoreNum('x'), scoreNum('')], [10, 10, 9.5, null, null]); });
  T('scoreNum on', () => { S.ui.countStars = true; eq([scoreNum('10*'), scoreNum('10**'), scoreNum(10)], [10.25, 10.5, 10]); });
  T('old values unchanged', () => { S.ui.countStars = false; const al = starFixture(); eq([scRaw(al, 'pB', 'bed'), scRaw(al, 'pE', 'bed'), scRaw(al, 'pB', 'gas')], [10, 9.75, 9.5]); });
  T('left-out star ignored', () => { S.ui.countStars = false; S.ui.keepOff = false; const al = starFixture(); al.off = ['noro']; eq([sc(al, 'pB', 'noro'), scStars(al, 'pB', 'noro'), scRaw(al, 'pB', 'noro')], [null, 0, 10]); });
  T('rawAvg off vs on', () => { S.ui.countStars = false; S.ui.keepOff = false; const al = starFixture(); eq(+rawAvg(al, 'pE').toFixed(4), +((10 + 10 + 10 + 10 + 10 + 9.75 + 10) / 7).toFixed(4));
    S.ui.countStars = true; eq(+rawAvg(al, 'pE').toFixed(4), +((10.5 + 10.25 + 10.5 + 10.25 + 10 + 9.75 + 10) / 7).toFixed(4)); });
  T('history lv', () => { S.ui.countStars = false; const L = { scores: { noro: '10**', bed: 9 } }, t = { id: 'noro' }; eq([lv(L, t), lvStars(L, t), lv(L, { id: 'bed' })], [10, 2, 9]); });

  // ---- Task 2: entering stars ----
  T('parseScoreText', () => { eq(['10*', '10**', ' 9,5 ', 'x', '', '9*', '10***', '10.5', '11'].map(parseScoreText), ['10*', '10**', 9.5, 'x', '', undefined, undefined, undefined, undefined]); });
  T('parseScoreText round trip', () => { eq([parseScoreText('10*'), parseScoreText('10')], ['10*', 10]); });
  T('stepScore', () => { eq([stepScore('10', .25), stepScore('10*', .25), stepScore('10**', .25), stepScore('10**', -.25), stepScore('10*', -.25), stepScore('10', -.25), stepScore('', .25), stepScore('8', .25)], ['10*', '10**', '10**', '10*', '10', '9.75', '8', '8.25']); });
  T('paste lines', () => { eq(parseScoreLines('Noro: 10* 10**\nBed\t10\t9.75'), [['10*', '10**'], [10, 9.75]]); });
  T('notion stars', () => { eq(parseNotionBlocks('- **1. Noro (3:12) - 10****\n- **2. Bed - 10**\n- **3. Daisy - 10***\n4. Sink - 10*').map(b => b.score), ['10**', 10, '10*', '10*']); });
  T('fmtStored', () => { eq(['10*', '10**', 'x', '', 9.5].map(fmtStored), ['10*', '10**', 'x', '', '9.5']); });

  // ---- Task 3: display ----
  T('fmtSc', () => { eq([fmtSc(10, 1), fmtSc(10, 2), fmtSc(10.25, 1), fmtSc(9.5, 0)], ['10*', '10**', '10*', '9.5']); });
  T('ratePill star class', () => { S.ui.starCol = true; eq(/star2/.test(ratePill(10, fmtNum, 2)), true); S.ui.starCol = false; eq(/star2/.test(ratePill(10, fmtNum, 2)), false); eq(/10\*\*/.test(ratePill(10, fmtNum, 2)), true); });
  T('distribution bins on', () => { S.ui.countStars = true; const h = histogram([{ name: 'a', color: '#fff', values: [10, 10.25, 10.5, 9] }]); eq(/>10\*\*</.test(h) && />10\*</.test(h), true); });
  T('group distribution range above 10', () => { S.ui.countStars = true; const v = [10, 10.25, 10.5, 9]; const h = histogram([1, 2, 3].map(i => ({ id: 'g' + i, name: 'g' + i, color: '#fff', values: v }))); eq(/10\*–/.test(h), true); });
  T('rows carry stars', () => { S.ui.countStars = false; const al = starFixture(); const r = pairRows(al, { id: 'pB' }, { id: 'pE' })[0]; eq([r.a, r.b, r.sa, r.sb], [10, 10, 1, 2]); eq(groupRows(al, [{ id: 'pB' }, { id: 'pE' }])[0].sts, [1, 2]); });
  T('discord escapes stars', () => { eq(dcEscStars('Noro — 10* / 10**\n_(10 · 10*)_\n```\n10*  10**\n```'), 'Noro — 10\\* / 10\\*\\*\n_(10 · 10\\*)_\n```\n10*  10**\n```'); });

  // ---- Task 4: settings ----
  T('drop worst unaffected when off', () => { S.ui.countStars = false; S.ui.drop = 1; S.ui.dropMode = 'own'; const al = starFixture(); al.tracks = al.tracks.slice(0, 5); eq(overall(al, 'pE'), 10); eq(overall(al, 'pB'), 10); });
  T('drop worst by value when on', () => { S.ui.countStars = true; S.ui.drop = 1; S.ui.dropMode = 'own'; const al = starFixture(); al.tracks = al.tracks.slice(0, 5); eq(overall(al, 'pE'), (10.5 + 10.25 + 10.5 + 10.25) / 4); });
  T('settings actions', () => { const c = !!S.ui.countStars, k = S.ui.starCol !== false; ACT.countStars(); eq(!!S.ui.countStars, !c); ACT.starCol(); eq(S.ui.starCol !== false, !k); });
  T('star controls only with stars', () => { eq(/data-act="countStars"/.test(dropBar()), slotHasStars()); });

  // ---- Task 5: tiebreaking ----
  const titles = (al, ids) => ids.map(id => al.tracks.find(t => t.id === id).title);
  T('favSort with stars (off)', () => { S.ui.countStars = false; const al = starFixture(); al.tracks.reverse(), A = { id: 'pB' }, B = { id: 'pE' };
    const rows = pairRows(al, A, B).map(r => ({ ...r, al, m: (r.a + r.b) / 2, sd: Math.abs(r.b - r.a) }));
    const order = rows.sort(favSort([A, B], r => r.al)).slice(0, 5).map(r => r.t.title);
    eq(order[0], 'Noro'); eq(new Set(order.slice(1, 3)), new Set(['Daisy', 'You Stole'])); eq(new Set(order.slice(3, 5)), new Set(['In a Jar', 'At the Bottom'])); });
  T('leastSort stars last', () => { S.ui.countStars = false; const al = starFixture(); al.tracks.reverse(), A = { id: 'pB' }, B = { id: 'pE' };
    const rows = pairRows(al, A, B).filter(r => r.a === 10 && r.b === 10).map(r => ({ ...r, al, m: 10, sd: 0 }));
    eq(rows.sort(leastSort([A, B], r => r.al)).pop().t.title, 'Noro'); });
  T('group favSort stars', () => { S.ui.countStars = false; const al = starFixture(); al.tracks.reverse(), P = [{ id: 'pB' }, { id: 'pE' }, { id: 'pB' }];
    eq([...groupRows(al, P)].sort(favSort(P, () => al))[0].t.title, 'Noro'); });
  T('autoOrder stars', () => { S.ui.countStars = false; const al = starFixture(); eq(titles(al, autoOrder(al, 'pE').slice(0, 2)).sort(), ['Noro', 'You Stole']); eq(titles(al, autoOrder(al, 'pE').slice(2, 4)).sort(), ['Daisy', 'In a Jar']); });
  T('auto ties need same stars', () => { S.ui.countStars = false; S.ui.ties = true; const al = starFixture(); eq([isTied(al, 'pE', 'stole', 'noro'), isTied(al, 'pE', 'daisy', 'stole')], [true, false]); });
  T('tie key includes stars', () => { eq(tieKey({ a: 10, b: 10, sa: 1, sb: 0 }) === tieKey({ a: 10, b: 10, sa: 0, sb: 0 }), false); eq(tieKey({ vals: [10, 9], sts: [2, 0] }) === tieKey({ vals: [10, 9], sts: [2, 0] }), true); eq(tieKey({ v: 10, st: 1 }) === tieKey({ v: 10, st: 2 }), false); });
  T('gap unchanged when off', () => { S.ui.countStars = false; const al = starFixture(); const r = pairRows(al, { id: 'pB' }, { id: 'pE' }).find(r => r.t.title === 'At the Bottom'); eq(r.b - r.a, 0); });

  // ---- Task 6: tie toggle ----
  T('cutTies', () => { const r = k => ({ a: 10, b: 10, sa: k, sb: 0 }); const list = [r(1), r(1), r(0), r(0), r(0), r(0)];
    const x = cutTies(list, 3); eq([x.shown.length, x.extra.length], [3, 3]); eq(cutTies(list, 2).extra.length, 0); eq(cutTies(list.slice(0, 2), 5).shown.length, 2); });
  T('tieMore empty', () => { eq(tieMore([], () => '', '#10'), ''); const h = tieMore([{}, {}], () => '<li></li>', '#10'); eq(/<details class="tiemore">/.test(h) && /\+2 more tied at #10/.test(h) && !/<details[^>]*open/.test(h), true); });
  T('topBottomCard toggle', () => { S.ui.countStars = false; const al = starFixture(), p = { id: 'pE', name: 'E', color: '#fff' };
    const rows = al.tracks.map((t, i) => ({ al, t, v: sc(al, 'pE', t.id), st: scStars(al, 'pE', t.id), rel: i / 6 }));
    rows.push(...['a', 'b', 'c'].map((id, i) => ({ al, t: { id, title: 'Plain ' + id }, v: 10, st: 0, rel: .9 })));
    const h = topBottomCard(p, rows); eq([/\+4 more tied at #5/.test(h), /\+1 more tied at the last spot/.test(h)], [true, true]); });
  T('topTogetherCard toggle', () => { S.ui.countStars = false; const al = starFixture(), A = { id: 'pB', color: '#f00' }, B = { id: 'pE', color: '#00f' };
    const rows = pairRows(al, A, B).map(r => ({ ...r, al, m: (r.a + r.b) / 2, d: r.b - r.a, sd: Math.abs(r.b - r.a) }));
    eq(/more tied/.test(topTogetherCard([A, B], rows)), false); eq(/<li>/.test(topTogetherCard([A, B], rows)), true); });

  // ---- Task 7: All artists ----
  T('artistTopRows', () => { const P = vis().slice(0, 2); const x = artistTopRows(P); eq(Array.isArray(x.pairs) && P.every(p => Array.isArray(x.per[p.id])), true);
    eq(x.per[P[0].id].length, slot().bands.reduce((n, b) => n + bandRows(b, P[0].id).length, 0)); eq(x.pairs.every(r => r.al && r.sd != null && r.m != null), true); });
  T('static export table shows stars', () => { S.ui.countStars = false; const al = starFixture(); eq(/>10\*\*</.test(staticTable(al, [{ id: 'pB', name: 'B', color: '#fff' }, { id: 'pE', name: 'E', color: '#fff' }], false)), true); });

  // ---- Final review fixes ----
  T('cutTies finds ties past a non-tie', () => { const r = (a, b) => ({ a, b, sa: 0, sb: 0 }); const x = cutTies([r(9, 10), r(10, 9), r(9, 10)], 1); eq(x.extra.length, 1); eq(x.extra[0].a, 9); });
  T('paste reads escaped post text', () => { eq(parseScoreLines('Noro: 10\\* 8\nBed: 10\\*\\*'), [['10*', 8], ['10**']]); });
  T('chart range fits counted stars', () => { S.ui.countStars = true; eq(yRange([7, 10.5])[1] >= 10.5, true); S.ui.countStars = false; eq(yRange([7, 10])[1], 10); });
  T('paste preview shows stars', () => { const src = [...document.scripts].map(s => s.textContent).join('\n'); eq(/fmtNum\(map\[i\]\[p\.id\]\)/.test(src), false); });

  if (tmp) { S.slots = S.slots.filter(x => x !== tmp); S.cur = cur0; }
  const fails = out.filter(l => l.startsWith('FAIL'));
  return `${out.length - fails.length}/${out.length} pass\n` + (fails.length ? fails.join('\n') : 'all green');
})()
