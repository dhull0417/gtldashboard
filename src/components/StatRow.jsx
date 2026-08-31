export default function StatRow({ title, tiles, note }) {
  return (
    <section className="stat-row">
      <h2 className="stat-row-title">{title}</h2>
      <div className="stat-row-scroll">
        {tiles.map((tile) => (
          <div className="stat-tile" key={tile.label}>
            <span className="stat-tile-label">{tile.label}</span>
            <span className="stat-tile-value">{tile.value}</span>
            {tile.sub && <span className="stat-tile-sub">{tile.sub}</span>}
          </div>
        ))}
      </div>
      {note && <p className="stat-row-note">{note}</p>}
    </section>
  );
}
