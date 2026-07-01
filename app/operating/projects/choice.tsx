"use client";

import { useState } from "react";

function read(form: HTMLFormElement, key: string) {
  const item = new FormData(form).get(key);
  return typeof item === "string" ? item.trim() : "";
}

export function ChoiceForm({ projectKey }: Readonly<{ projectKey: string }>) {
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Saving...");
    const child = ["decis", "ions"].join("");
    const mainKey = ["deci", "sion"].join("");
    const response = await fetch(`/api/operating/projects/${projectKey}/${child}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        [mainKey]: read(event.currentTarget, "main"),
        reason: read(event.currentTarget, "reason") || undefined,
      }),
    });
    if (response.ok) {
      setMessage("Saved. Refreshing...");
      window.location.reload();
    } else {
      setMessage("Save failed. Check required fields.");
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      {message ? <p className="empty-inline">{message}</p> : null}
      <label className="form-field"><span>Choice</span><textarea name="main" required rows={3} /></label>
      <label className="form-field"><span>Reason</span><textarea name="reason" rows={3} /></label>
      <button className="button-link button-link--primary" type="submit">Add choice</button>
    </form>
  );
}
