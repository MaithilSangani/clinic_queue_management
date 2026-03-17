export default function Card({ title, sub, action, children }) {
  return (
    <section className="card">
      <header className="card-head">
        <div className="card-head-text">
          <h2 className="card-title">{title}</h2>
          {sub ? <p className="card-sub">{sub}</p> : null}
        </div>
        {action ? <div className="card-action">{action}</div> : null}
      </header>
      <div className="card-body">{children}</div>
    </section>
  )
}
