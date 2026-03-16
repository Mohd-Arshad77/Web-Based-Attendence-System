function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function History({ history }) {
  return (
    <section className="history-card">
      <div className="history-header">
        <div>
          <div className="eyebrow">Attendance History</div>
          <h2>Daily records for this employee</h2>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Latitude</th>
              <th>Longitude</th>
            </tr>
          </thead>
          <tbody>
            {history.length ? (
              history.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.date}</td>
                  <td>{formatDateTime(entry.checkInTime)}</td>
                  <td>{formatDateTime(entry.checkOutTime)}</td>
                  <td>{entry.latitude}</td>
                  <td>{entry.longitude}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No attendance history found for this user yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default History;
