// Demo data for looking at the app on a local server with empty storage (made-up scores).
// Adds a duo slot and a 4-person group slot, then saves and renders:
//   await fetch('tests/demo-data.js?' + Date.now()).then(r => r.text()).then(t => (0, eval)(t))
(() => {
  const ms = s => { const [m, x] = s.split(':'); return (+m * 60 + +x) * 1000; };
  const album = (id, title, year, rows, people) => ({ id, title, year, type: 'album', ranks: {}, ties: {}, off: [], listen: {}, history: {},
    tracks: rows.map((r, i) => ({ id: id + '_' + i, title: r[0], ms: ms(r[1]) })),
    scores: Object.fromEntries(people.map((p, k) => [p.id, Object.fromEntries(rows.map((r, i) => [id + '_' + i, r[2 + k]]))])) });
  const okc = [['Airbag', '4:44', 8.5, 8, 9, 7], ['Paranoid Android', '6:23', '10*', 9.5, 10, 8.5], ['Subterranean Homesick Alien', '4:27', 8, 7.5, 7, 8],
    ['Exit Music (For a Film)', '4:24', 9.5, 10, 9, 6.5], ['Let Down', '4:59', 10, 9, 9.5, 8], ['Karma Police', '4:21', 9.5, 10, 8.5, 9],
    ['Fitter Happier', '1:57', 5, 4, 3, 6], ['Electioneering', '3:50', 7, 7.5, 6, 8.5], ['Climbing Up the Walls', '4:45', 8.5, 7, 9, 5],
    ['No Surprises', '3:48', 9, 9.5, 8, 9], ['Lucky', '4:19', 9, 8.5, 9.5, 7.5], ['The Tourist', '5:24', 8, 9, 7.5, 6]];
  const kida = [['Everything in Its Right Place', '4:11', 9.5, 9, 8, 7], ['Kid A', '4:44', 7, 6.5, 8, 5], ['The National Anthem', '5:51', 9, 8, 7, 8.5],
    ['How to Disappear Completely', '5:56', '10**', 10, 9.5, 7], ['Treefingers', '3:42', 6, 5, 7, 4], ['Optimistic', '5:16', 8.5, 9, 7.5, 8],
    ['In Limbo', '3:31', 8, 7, 6.5, 7.5], ['Idioteque', '5:09', 9.5, 9.5, 9, 9], ['Morning Bell', '4:35', 8, 7.5, 8.5, 6], ['Motion Picture Soundtrack', '7:01', 9, 8.5, 9, 6.5]];
  const mkSlot = (name, people) => {
    const P = people.map(([n, c]) => ({ id: 'p_' + n.toLowerCase(), name: n, color: c }));
    return { id: 'demo_' + name.toLowerCase(), name, people: P, cmp: P.slice(0, 2).map(p => p.id), me: P[0].id, view: {},
      bands: [{ id: 'b_rh_' + name.toLowerCase(), name: 'Radiohead', best: {}, albums: [album('okc_' + name, 'OK Computer', 1997, okc, P), album('kida_' + name, 'Kid A', 2000, kida, P)] }] };
  };
  S.slots = S.slots.filter(s => !/^demo_/.test(s.id));
  S.slots.push(mkSlot('Duo', [['Breno', '#5aa9ff'], ['Lucas', '#ff5a5f']]));
  S.slots.push(mkSlot('Group', [['Breno', '#5aa9ff'], ['Lucas', '#ff5a5f'], ['Marina', '#6fdc9a'], ['Theo', '#ffd166']]));
  S.cur = { slot: 'demo_duo', band: 'b_rh_duo', album: 'okc_Duo', tab: 'rankings' };
  save(); renderAll();
  return 'demo slots: ' + S.slots.map(s => s.name).join(', ');
})()
