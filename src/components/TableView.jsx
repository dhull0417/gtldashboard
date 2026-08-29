export default function TableView({ days }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>New users</th>
          <th>New groups</th>
          <th>New meetups</th>
        </tr>
      </thead>
      <tbody>
        {days.map((d) => (
          <tr key={d.date}>
            <td>{d.date}</td>
            <td>{d.users}</td>
            <td>{d.groups}</td>
            <td>{d.meetups}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
