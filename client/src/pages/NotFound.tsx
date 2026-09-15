import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="landing guide">
      <nav className="landing-nav">
        <Link className="brand" to="/">⛽ GazLog</Link>
      </nav>
      <h1>Nie ma takiej strony</h1>
      <p className="lead">Może szukasz <Link to="/guides">poradnika</Link> albo <Link to="/">aplikacji</Link>?</p>
    </div>
  )
}
