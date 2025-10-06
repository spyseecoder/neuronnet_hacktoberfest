import React from 'react';

export default function UserRow({ idx, user, usn }) {
  const u = (user && typeof user === 'object') ? user : {};
  return (
    <tr>
      <td className="td-index">{idx}</td>
      <td className="td-name">{u.name || usn || '—'}</td>
      <td className="td-gh">{u.github ? <a className="link-btn github" href={u.github} target="_blank" rel="noreferrer">GitHub</a> : '-'}</td>
      <td className="td-holo">{u.holopin ? <a className="link-btn holopin" href={u.holopin} target="_blank" rel="noreferrer">Holopin</a> : '-'}</td>
      <td className="td-contrib">{u.repos ? Object.keys(u.repos).length : 0}</td>
    </tr>
  );
}
