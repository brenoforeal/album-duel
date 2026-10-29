// Test data only: adds Brand New "Daisy" with the stars from the tier lists to the first band of the current slot.
// Run on the app page:  await fetch('tests/demo-daisy.js?' + Date.now()).then(r => r.text()).then(t => (0, eval)(t))
(() => {
  const sl = slot(), b = sl.bands[0], [B, E] = sl.people;
  b.albums = b.albums.filter(a => a.title !== 'Daisy');
  const rows = [['Vices', 9, '9.75'], ['Bed', 10, 9.75], ['At the Bottom', '10*', 10], ['Gasoline', 9.5, 10], ['You Stole', 10, '10**'], ['Be Gone', 8, 8],
    ['Sink', 9.5, 10], ['Bought a Bride', 9.5, 10], ['Daisy', '10*', '10*'], ['In a Jar', 10, '10*'], ['Noro', '10*', '10**']];
  const al = mkAlbum('Daisy', 'Daisy', 2009, rows.map(r => [r[0], '']), B.id, rows.map(r => r[1] === '9.75' ? 9.75 : r[1]), E.id, rows.map(r => r[2] === '9.75' ? 9.75 : r[2]));
  b.albums.push(al); S.cur.band = b.id; S.cur.album = al.id; save(); renderAll();
  return 'Daisy added to ' + b.name;
})()
