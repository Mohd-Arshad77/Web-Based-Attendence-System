function Login({ form, onChange }) {
  return (
    <>
      <label>User ID</label>
      <input
        value={form.userId}
        onChange={(event) => onChange("userId", event.target.value)}
        placeholder="EMP001"
      />

      <label>User Name</label>
      <input
        value={form.userName}
        onChange={(event) => onChange("userName", event.target.value)}
        placeholder="Enter your name"
      />
    </>
  );
}

export default Login;
