import React from 'react';
import badgeImg from './image.png';
import { Link } from 'react-router-dom';

export default function Intro() {
  return (
    <div className="container page intro">
      <header>
        <h1>Hacktoberfest 2025 - Get started</h1>
        <p>Welcome! Learn a few git commands and how to contribute to open source.</p>
      </header>

      <section className="card">
        <h2>Quick Git commands</h2>
        <div className="terminal-header">&gt; terminal</div>
        <div className="terminal" role="region" aria-label="Terminal commands">
          <div className="term-line"><span className="prompt">kevin$</span><span className="cmd">git clone &lt;repo-url&gt;</span></div>
          <div className="term-line"><span className="prompt">kevin$</span><span className="cmd">git checkout -b fix/my-issue</span></div>
          <div className="term-line"><span className="prompt">kevin$</span><span className="cmd">git add .</span></div>
          <div className="term-line"><span className="prompt">kevin$</span><span className="cmd">git commit -m "fix: ..."</span></div>
          <div className="term-line"><span className="prompt">kevin$</span><span className="cmd">git push origin fix/my-issue</span></div>

          <div className="term-comment"><span className="comment"># clone the repo, create a branch, add, commit and push your changes <br /># After making your changes and testing them, create a pull request on GitHub.</span></div>
        </div>
      </section>

      <section className="card">
        <h2>Resources</h2>
        <p>GitHub profile, Holopin and how to register for Hacktoberfest.</p>
        <div style={{marginTop:12}} className="card announcement">
          <div style={{display:'flex', flexDirection:'column',gap:12,alignItems:'center'}}>
            <img src={badgeImg} alt="Holopin badges preview" className="badge-preview" />
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
              <strong>Decorate your GitHub profile</strong>
              <div className="muted">After your accepted PRs you can showcase Holopin badges on your profile.</div>
            </div>
          </div>
          <h3>Rules</h3>
          <p>Follow these rules to qualify</p>
          <ul>
            <li>Contribute <strong>6 valid pull requests (PRs)</strong>. All 6 will be checked and verified.</li>
            <li>No cheating: <strong>fake PRs, trivial/spam changes, or automated mass PRs</strong> will be rejected and will disqualify the submitter.</li>
            <li>Only contribute to repositories that are actively accepting PRs and that mention <code>hacktoberfest2025</code> or <code>hacktoberfest</code> (check repo description/labels).</li>
            <li>A PR is only counted when it is reviewed/accepted by the repository maintainer - make quality contributions that solve real issues or add meaningful improvements.</li>
          </ul>

          <h4>Why this matters</h4>
          <ul>
            <li>Accepted PRs can earn Holopin badges which make your GitHub profile stand out.</li>
            <li>Six genuine open-source contributions are a strong resume point - recruiters notice them.</li>
            <li>We will verify PRs and accounts before issuing certificates; the top contributor prize will be awarded after verification.</li>
          </ul>
        </div>
      </section>

      <div className="actions">
        <Link to="/contributions" className="btn primary">Check contributions</Link>
        <Link to="/register" className="btn">Get started / Register</Link>
      </div>
    </div>
  );
}
