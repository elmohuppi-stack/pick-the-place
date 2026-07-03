"use client";

import { useState, useEffect } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Own password change
  const [showOwnPasswordForm, setShowOwnPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [ownNewPassword, setOwnNewPassword] = useState("");

  // Reset link (zuletzt erzeugter Link, damit er auch bei blockiertem
  // Clipboard-Zugriff manuell kopiert werden kann)
  const [resetLink, setResetLink] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setSessionId(data.id);
      })
      .catch(() => {});
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName,
          password: newPassword,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Benutzer angelegt!" });
        setNewEmail("");
        setNewName("");
        setNewPassword("");
        setShowAddForm(false);
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Benutzer "${email}" wirklich löschen?`)) return;
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Benutzer gelöscht" });
        fetchUsers();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    // Bevorzugt die Clipboard-API; fällt bei fehlendem Secure Context
    // (z. B. HTTP-Zugriff über LAN-IP) auf execCommand zurück.
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback unten versuchen
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  async function generateResetLink(id: string) {
    setMessage(null);
    setResetLink(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/reset-link`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
        return;
      }

      const data = await res.json();
      setResetLink(data.resetLink);
      const copied = await copyToClipboard(data.resetLink);
      setMessage({
        type: "success",
        text: copied
          ? "Reset-Link kopiert!"
          : "Reset-Link erstellt – bitte unten manuell kopieren.",
      });
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  async function changeOwnPassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword: ownNewPassword,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Passwort geändert!" });
        setShowOwnPasswordForm(false);
        setCurrentPassword("");
        setOwnNewPassword("");
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Fehler" });
      }
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Benutzer verwalten
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Admin-Benutzer hinzufügen, entfernen und Passwörter verwalten
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOwnPasswordForm(!showOwnPasswordForm)}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          >
            Eigenes PW ändern
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Zuletzt erzeugter Reset-Link (manuell kopierbar) */}
      {resetLink && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <input
            readOnly
            value={resetLink}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
          />
          <button
            onClick={async () => {
              const ok = await copyToClipboard(resetLink);
              setMessage({
                type: ok ? "success" : "error",
                text: ok ? "Reset-Link kopiert!" : "Kopieren nicht möglich",
              });
            }}
            className="px-2.5 py-1 text-xs rounded-lg btn btn-primary shrink-0"
          >
            Kopieren
          </button>
          <button
            onClick={() => setResetLink(null)}
            className="px-2 py-1 text-xs rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Ausblenden"
          >
            X
          </button>
        </div>
      )}

      {/* Own password form */}
      {showOwnPasswordForm && (
        <form
          onSubmit={changeOwnPassword}
          className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Eigenes Passwort ändern
          </h3>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Aktuelles Passwort
            </label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Neues Passwort
            </label>
            <PasswordInput
              value={ownNewPassword}
              onChange={(e) => setOwnNewPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 focus:border-transparent outline-none"
              required
              minLength={8}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm btn btn-primary"
            >
              Speichern
            </button>
            <button
              type="button"
              onClick={() => setShowOwnPasswordForm(false)}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Add user form */}
      {showAddForm && (
        <form
          onSubmit={addUser}
          className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/60 space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Neuen Benutzer anlegen
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Passwort
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-revenexx-500 focus:border-transparent outline-none"
                required
                minLength={8}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm btn btn-primary"
            >
              Anlegen
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewEmail("");
                setNewName("");
                setNewPassword("");
              }}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Users list */}
      <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Benutzer ({users.length})
          </h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-3 py-1.5 text-xs btn btn-primary"
          >
            + Hinzufügen
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">Lade...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Keine Benutzer gefunden
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-revenexx-400 to-revenexx-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {user.name}
                      {user.id === sessionId && (
                        <span className="ml-2 text-xs text-revenexx-500 font-normal">
                          (Du)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => generateResetLink(user.id)}
                    className="px-2.5 py-1 text-xs rounded-lg text-slate-500 hover:text-revenexx-600 hover:bg-revenexx-50 dark:hover:bg-revenexx-900/30 transition-colors"
                    title="Reset-Link kopieren"
                  >
                    Reset-Link
                  </button>

                  {user.id !== sessionId && (
                    <button
                      onClick={() => deleteUser(user.id, user.email)}
                      className="px-2.5 py-1 text-xs rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Benutzer löschen"
                    >
                      Löschen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
